
import React, { useState, useEffect } from 'react';
import { User, CartItem, PaymentMethod, Order, OrderStatus } from '../types';
import { PLATFORM_COMMISSION_RATE } from '../constants';
import { Link } from 'react-router-dom';
import { PaysuitService } from '../lib/paysuit';
import { useLanguage } from '../LanguageContext';

interface CheckoutProps {
  cart: CartItem[];
  user: User | null;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  onComplete: (total: number) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cart, user, removeFromCart, clearCart, onComplete }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'review' | 'payment' | 'waiting_pin' | 'success'>('review');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.MPESA);
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const commission = total * PLATFORM_COMMISSION_RATE;
  const subtotal = total - commission; // Valor líquido para o vendedor (excluindo comissão)

  const linkedAccount = user?.linkedAccounts.find(acc =>
    acc.method === method || (method === PaymentMethod.MPESA && acc.provider === 'M-Pesa')
  );

  useEffect(() => {
    let interval: number;
    if (step === 'waiting_pin') {
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleStartPayment = async () => {
    if (!linkedAccount) {
      alert(t('checkout_no_account'));
      return;
    }

    setErrorMessage('');
    setStep('waiting_pin');
    setElapsedTime(0);

    const response = await PaysuitService.initiateTransaction({
      method: method === PaymentMethod.BANK_LOCAL ? 'bank_local' : (method === PaymentMethod.EMOLA ? 'emola' : 'mpesa'),
      amount: total,
      phoneNumber: linkedAccount.accountNumber,
      reference: `AS-${Date.now()}`
    });

    if (!response.success) {
      setErrorMessage(response.message);
      setStep('payment');
    }
  };

  const handleSimulatePinSuccess = () => {
    // Generate order and save to local storage
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      buyerId: user?.id,
      buyerName: user?.fullName || 'Visitante',
      buyerPhone: user?.phone || '',
      items: [...cart],
      subtotal,
      commission,
      total,
      status: OrderStatus.PAID,
      paymentMethod: method,
      province: user?.province,
      district: user?.district,
      createdAt: new Date().toISOString()
    };

    const existingOrdersJson = localStorage.getItem('agro_suste_orders');
    const existingOrders: Order[] = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
    existingOrders.push(newOrder);
    localStorage.setItem('agro_suste_orders', JSON.stringify(existingOrders));

    setStep('success');
    onComplete(subtotal);
    clearCart();
  };

  if (cart.length === 0 && step !== 'success') return (
    <div className="max-w-xl mx-auto text-center py-40 space-y-8">
      <div className="text-8xl opacity-10">🛒</div>
      <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{t('checkout_empty_title')}</h2>
      <Link to="/shop" className="inline-block bg-[#1B5E20] text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">{t('checkout_empty_btn')}</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">

      {step === 'review' && (
        <div className="bg-white rounded-[4rem] shadow-strong border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#1B5E20] p-12 text-white flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter">{t('checkout_review_title')}</h2>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">{t('checkout_review_subtitle')}</p>
            </div>
            <p className="text-4xl font-black">{total.toLocaleString()} <span className="text-lg opacity-40">MZN</span></p>
          </div>
          <div className="p-12 space-y-8">
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-5">
                    <img src={item.images[0]} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                    <div>
                      <p className="font-black text-gray-900 text-sm">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.quantity} x {item.price.toLocaleString()} MZN</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-black text-red-400 px-4 py-2 hover:bg-red-50 rounded-xl">{t('checkout_remove')}</button>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('payment')} className="w-full bg-[#1B5E20] text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">{t('checkout_choose_payment')}</button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="bg-white rounded-[4rem] shadow-strong border border-gray-100 overflow-hidden max-w-2xl mx-auto animate-in zoom-in-95">
          <div className="bg-[#1B5E20] p-12 text-white text-center">
            <h2 className="text-3xl font-black tracking-tight uppercase">{t('checkout_paysuit_title')}</h2>
            <p className="text-[9px] font-bold opacity-50 uppercase mt-2 tracking-widest">{t('checkout_paysuit_subtitle')}</p>
          </div>
          <div className="p-12 space-y-10">
            {errorMessage && <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-[11px] font-black text-center">{errorMessage}</div>}

            <div className="grid grid-cols-2 gap-6">
              {[
                { id: PaymentMethod.MPESA, label: t('checkout_mpesa' as any) || 'M-Pesa', icon: '📱' },
                { id: PaymentMethod.EMOLA, label: t('checkout_emola' as any) || 'e-Mola', icon: '📲' },
                { id: PaymentMethod.BANK_LOCAL, label: t('checkout_bank' as any) || 'Banco', icon: '🏦' }
              ].map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`p-10 border-4 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${method === m.id ? 'border-[#43A047] bg-green-50' : 'border-gray-50'}`}>
                  <span className="text-4xl">{m.icon}</span>
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{m.label}</span>
                </button>
              ))}
            </div>

            {!linkedAccount ? (
              <div className="bg-amber-50 p-8 rounded-3xl text-center space-y-4 border border-amber-100">
                <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">{t('checkout_no_account').replace('{method}', method.toUpperCase())}</p>
                <Link to="/profile" className="inline-block bg-amber-600 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase">{t('checkout_configure_profile')}</Link>
              </div>
            ) : (
              <div className="bg-green-50 p-8 rounded-3xl text-center border-2 border-green-100">
                <p className="text-[10px] text-green-700 font-black uppercase tracking-widest leading-relaxed">
                  {t('checkout_pin_sent')} <br />
                  <strong className="text-lg text-[#1B5E20]">{linkedAccount.accountNumber}</strong>
                </p>
              </div>
            )}

            <button onClick={handleStartPayment} disabled={!linkedAccount} className={`w-full py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${linkedAccount ? 'bg-[#43A047] text-white hover:bg-[#1B5E20]' : 'bg-gray-100 text-gray-300'}`}>
              {linkedAccount ? `${t('checkout_pay_now')} ${total.toLocaleString()} MZN` : t('checkout_link_required')}
            </button>
          </div>
        </div>
      )}

      {step === 'waiting_pin' && (
        <div className="bg-white rounded-[5rem] p-16 md:p-24 text-center shadow-strong border border-gray-100 max-w-2xl mx-auto space-y-12 animate-in zoom-in-90">
          <div className="relative inline-block">
            <div className="w-48 h-48 border-[20px] border-green-50 border-t-[#43A047] rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center text-6xl">📱</div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{t('checkout_waiting_pin_title')}</h3>
              <p className="text-[#43A047] font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">{t('checkout_waiting_pin_subtitle')}</p>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[9px] font-black opacity-50 uppercase">{t('checkout_payment_channel')}</span>
                <span className="text-[9px] font-black uppercase tracking-widest">{method.toUpperCase()}</span>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-medium leading-relaxed opacity-80">
                  {t('checkout_pin_instructions').replace('{phone}', linkedAccount?.accountNumber || '')}
                </p>
                <p className="text-4xl font-black text-green-400">{total.toLocaleString()} MZN</p>
              </div>
              <div className="pt-4 text-[8px] font-black opacity-40 uppercase tracking-[0.3em]">
                {t('checkout_elapsed_time').replace('{time}', elapsedTime.toString())}
              </div>
            </div>

            <div className="pt-10 border-t border-dashed border-gray-200">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-6 tracking-widest">
                {t('checkout_simulate_pin_desc')}
              </p>
              <button
                onClick={handleSimulatePinSuccess}
                className="w-full bg-white border-4 border-[#43A047] text-[#43A047] py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-green-50 transition-all shadow-lg active:scale-95"
              >
                {t('checkout_simulate_pin_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="bg-white rounded-[5rem] p-24 text-center shadow-strong border border-gray-100 max-w-3xl mx-auto space-y-12 animate-in zoom-in-110 duration-700">
          <div className="w-48 h-48 bg-green-50 text-[#43A047] rounded-[4rem] flex items-center justify-center text-8xl mx-auto border-2 border-green-100 shadow-inner">✓</div>
          <div className="space-y-6">
            <h2 className="text-6xl font-black text-[#1B5E20] tracking-tighter leading-none">{t('checkout_success_title')}</h2>
            <p className="text-gray-500 font-medium text-xl leading-relaxed max-w-md mx-auto">{t('checkout_success_desc')}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/shop" className="flex-grow bg-[#43A047] text-white py-7 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-[#1B5E20]">{t('checkout_buy_more')}</Link>
            <Link to="/profile" className="flex-grow bg-gray-50 text-gray-400 py-7 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] border border-gray-100">{t('checkout_view_profile')}</Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
