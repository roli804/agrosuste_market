
import React, { useState, useEffect } from 'react';
import { User, CartItem, PaymentMethod, Order, OrderStatus, DeliveryStatus, DeliveryRequest, UserRole } from '../types';
import { PLATFORM_COMMISSION_RATE, MOCK_USERS } from '../constants';
import { Link } from 'react-router-dom';
import { PaysGatorService } from '../lib/paysgator';
import { useLanguage } from '../LanguageContext';
import MapLocationPicker from '../components/MapLocationPicker';
import { mockDb } from '../lib/mock_db';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{lat?: number, lng?: number, address: string}>({ address: '' });

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const commission = total * PLATFORM_COMMISSION_RATE;
  const subtotal = total - commission; // Valor lÃ­quido para o vendedor (excluindo comissÃ£o)

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
    if (method === PaymentMethod.BANK_LOCAL) {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16 || !cardExpiry || !cardCvv || cardCvv.length < 3) {
        alert(t('checkout_err_card'));
        return;
      }
    } else {
      if (!phoneNumber || phoneNumber.length !== 9) {
        alert(t('checkout_err_phone_len'));
        return;
      }
      if (method === PaymentMethod.MPESA && !/^(84|85)/.test(phoneNumber)) {
        alert(t('checkout_err_mpesa'));
        return;
      }
      if (method === PaymentMethod.EMOLA && !/^(86|87)/.test(phoneNumber)) {
        alert(t('checkout_err_emola'));
        return;
      }
    }

    setErrorMessage('');
    setStep('waiting_pin');
    setElapsedTime(0);

    // O PaysGator exige um reference (externalTransactionId) de no MÃXIMO 15 CARACTERES.
    // Date.now() tem 13 dÃ­gitos. "AS-" + 13 dÃ­gitos = 16 dÃ­gitos (DÃ¡ erro 400).
    // SoluÃ§Ã£o: Usamos "AS-" + 9 dÃ­gitos aleatÃ³rios (12 caracteres total).
    const shortReference = `AS-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const response = await PaysGatorService.initiateTransaction({
      method: method === PaymentMethod.BANK_LOCAL ? 'bank_local' : (method === PaymentMethod.EMOLA ? 'emola' : 'mpesa'),
      amount: total,
      phoneNumber: phoneNumber,
      reference: shortReference
    });

    if (!response.success) {
      setErrorMessage(response.message);
      setStep('payment');
    }
  };

  const handleSimulatePayment = () => {
    setErrorMessage('');
    setStep('waiting_pin');
    setElapsedTime(0);
    // Simula um delay de rede antes do sucesso
    setTimeout(() => {
      // O utilizador pode entao clicar no botao de simular PIN que ja existe
    }, 500);
  };

  const handleSimulatePinSuccess = () => {
    const orderId = `ORD-${Date.now()}`;
    // Generate order and save to local storage
    const newOrder: Order = {
      id: orderId,
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

    // CREATE DELIVERY REQUEST IF NEEDED
    if (needsDelivery) {
      // Find producer info from first item
      const producerId = cart[0].producerId;
      const producer = mockDb.getUsers().find(u => u.id === producerId) || MOCK_USERS.find(u => u.id === producerId);
      
      const deliveryRequest: DeliveryRequest = {
        id: `DEL-${Date.now()}`,
        order_id: orderId,
        created_by: user?.id || 'visitor',
        pickup_name: producer?.fullName || 'Fornecedor',
        pickup_phone: producer?.phone || '',
        pickup_address: producer?.location || producer?.district || 'Armazém do Fornecedor',
        delivery_name: user?.fullName || 'Cliente',
        delivery_phone: phoneNumber || user?.phone || '',
        delivery_address: deliveryLocation.address,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
        status: DeliveryStatus.PENDENTE,
        created_at: new Date().toISOString()
      };
      mockDb.saveDeliveryRequest(deliveryRequest);
    }

    setStep('success');
    onComplete(subtotal);
    clearCart();
  };

  if (cart.length === 0 && step !== 'success') return (
    <div className="max-w-xl mx-auto text-center py-40 space-y-8">
      <div className="text-8xl opacity-10">🛒</div>
      <h2 className="text-3xl font-semibold text-gray-900">{t('checkout_empty_title')}</h2>
      <Link to="/shop" className="inline-block bg-[#2E5C4E] text-white px-10 py-5 rounded-2xl font-semibold text-[10px]   shadow-xl">{t('checkout_empty_btn')}</Link>
    </div>
  );

  return (
    <div className="theme-premium max-w-4xl mx-auto space-y-6 md:space-y-12 pb-24 px-4 md:px-0">

      {step === 'review' && (
        <div className="premium-card p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#1B5E20] p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="space-y-1 md:space-y-2">
              <h2 className="text-3xl md:text-4xl font-semibold mb-2 text-gray-900">{t('checkout_title')}</h2>
              <p className="text-[9px] md:text-[10px] font-bold opacity-50">{t('checkout_subtitle')}</p>
            </div>
            <p className="text-3xl md:text-4xl font-semibold">{total.toLocaleString()} <span className="text-sm md:text-lg opacity-40   font-bold">MZN</span></p>
          </div>
          <div className="p-6 md:p-12 space-y-6 md:space-y-8">
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 md:p-5 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-5">
                    <img src={item.images[0]} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold ">{item.quantity} x {item.price.toLocaleString()} MZN</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-semibold text-red-400 px-4 py-2 hover:bg-red-50 rounded-xl">{t('checkout_remove')}</button>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <p className="font-bold text-sm">Necessita de entrega?</p>
                    <p className="text-[10px] text-gray-400">Entrega rápida via transportador parceiro</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={needsDelivery} onChange={(e) => setNeedsDelivery(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
                </label>
              </div>

              {needsDelivery && (
                <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <MapLocationPicker 
                    label="Endereço de Entrega" 
                    onLocationSelect={(lat, lng, addr) => setDeliveryLocation({ lat, lng, address: addr })} 
                  />
                </div>
              )}
            </div>

            <button onClick={() => setStep('payment')} className="premium-btn w-full py-6 md:py-8 text-[12px] md:text-sm">{t('checkout_choose_payment')}</button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="premium-card p-0 overflow-hidden max-w-2xl mx-auto animate-in zoom-in-95">
          <div className="bg-[#1B5E20] p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-semibold  ">{t('checkout_payment_channels')}</h2>
            <p className="text-[9px] md:text-[10px] font-bold opacity-50  mt-2  leading-loose">{t('checkout_official_gateway')}</p>
          </div>
          <div className="p-8 md:p-12 space-y-8 md:space-y-10">
            {errorMessage && <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-[11px] font-semibold text-center">{errorMessage}</div>}

            <div className="grid grid-cols-3 gap-4">
              {[
                { id: PaymentMethod.MPESA, label: t('checkout_mpesa'), icon: '📱' },
                { id: PaymentMethod.EMOLA, label: t('checkout_emola'), icon: '📲' },
                { id: PaymentMethod.BANK_LOCAL, label: t('checkout_bank'), icon: '💳' }
              ].map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`p-4 md:p-6 border-4 rounded-2xl md:rounded-[2rem] flex flex-col items-center gap-2 md:gap-3 transition-all ${method === m.id ? 'border-[#5B8C51] bg-green-50' : 'border-gray-50'}`}>
                  <span className="text-2xl md:text-3xl">{m.icon}</span>
                  <span className="text-[9px] md:text-xs font-semibold text-gray-900">{m.label}</span>
                </button>
              ))}
            </div>

            {method === PaymentMethod.BANK_LOCAL ? (
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-6">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500   block mb-2">{t('checkout_card_num')}</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="premium-input text-base md:text-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500   block mb-2">{t('checkout_card_val')}</label>
                    <input 
                      type="text" 
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="premium-input text-base"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500   block mb-2">{t('checkout_card_cvv')}</label>
                    <input 
                      type="text" 
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="premium-input text-base"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-4">
                <label className="text-[10px] font-semibold text-gray-500 block mb-2">
                    {method === PaymentMethod.MPESA ? t('checkout_phone_mpesa') : t('checkout_phone_emola')}
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500 bg-white pr-2 border-r-2 border-gray-100 mr-2">+258</span>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    maxLength={9}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length > 9) return;
                        
                        // Strict validation: Don't allow typing if prefix is wrong
                        if (val.length >= 1 && val[0] !== '8') return;
                        if (val.length >= 2) {
                            if (method === PaymentMethod.MPESA && !['4', '5'].includes(val[1])) return;
                            if (method === PaymentMethod.EMOLA && !['6', '7'].includes(val[1])) return;
                        }
                        
                        setPhoneNumber(val);
                    }}
                    placeholder={method === PaymentMethod.MPESA ? t('checkout_phone_hint_mpesa') : t('checkout_phone_hint_emola')}
                    className="premium-input pl-20 md:pl-24 text-base md:text-lg"
                  />
                </div>
                {phoneNumber.length > 0 && (
                    <p className="text-[10px] font-bold text-gray-400">
                        {method === PaymentMethod.MPESA && !/^(84|85)/.test(phoneNumber) && <span className="text-amber-600">⚠️ Inicie com 84 ou 85</span>}
                        {method === PaymentMethod.EMOLA && !/^(86|87)/.test(phoneNumber) && <span className="text-amber-600">⚠️ Inicie com 86 ou 87</span>}
                        {phoneNumber.length === 9 && <span className="text-[#5B8C51]">✓ Número completo</span>}
                    </p>
                )}
              </div>
            )}

            <button 
              onClick={handleStartPayment} 
              disabled={method === PaymentMethod.BANK_LOCAL ? (!cardNumber || !cardExpiry || !cardCvv) : (!phoneNumber || phoneNumber.length !== 9)} 
              className={`premium-btn w-full py-6 md:py-8 ${
                (method === PaymentMethod.BANK_LOCAL ? (cardNumber && cardExpiry && cardCvv) : (phoneNumber && phoneNumber.length === 9)) 
                  ? '' 
                  : 'bg-[#F0F0F0] text-[#A0A0A0] shadow-none pointer-events-none'
              }`}
            >
              {(method === PaymentMethod.BANK_LOCAL ? (cardNumber && cardExpiry && cardCvv) : (phoneNumber && phoneNumber.length === 9)) 
                  ? `${t('checkout_pay_now')} ${total.toLocaleString()} MZN` 
                  : t('checkout_fill_data')}
            </button>

            <button 
              onClick={handleSimulatePayment}
              className="w-full mt-4 py-3 border-2 border-dashed border-[#2E7D32]/30 text-[#2E7D32] rounded-2xl font-bold text-[10px] hover:bg-green-50 transition-all uppercase tracking-widest"
            >
              🛠️ Simular Pagamento (Apenas Teste)
            </button>
          </div>
        </div>
      )}

      {step === 'waiting_pin' && (
        <div className="bg-white rounded-[2rem] md:rounded-[5rem] p-8 md:p-24 text-center shadow-strong border border-gray-100 max-w-2xl mx-auto space-y-8 md:space-y-12 animate-in zoom-in-90">
          <div className="relative inline-block">
            <div className="w-32 h-32 md:w-48 md:h-48 border-[12px] md:border-[20px] border-green-50 border-t-[#5B8C51] rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-6xl">📱</div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl md:text-4xl font-semibold text-gray-900  ">{t('checkout_waiting_pin_title')}</h3>
              <p className="text-[#5B8C51] font-semibold text-[8px] md:text-[10px]   animate-pulse">{t('checkout_waiting_pin_subtitle')}</p>
            </div>

            <div className="bg-gray-900 text-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] space-y-4 md:space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[9px] font-semibold opacity-50 ">{t('checkout_payment_channel')}</span>
                <span className="text-[9px] font-semibold text-gray-400">{method}</span>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] md:text-xs font-medium leading-relaxed opacity-80">
                  {t('checkout_pin_instructions').replace('{phone}', phoneNumber)}
                </p>
                <p className="text-2xl md:text-4xl font-semibold text-green-400">{total.toLocaleString()} MZN</p>
              </div>
              <div className="pt-4 text-[8px] font-semibold opacity-40 text-center">
                {t('checkout_elapsed_time').replace('{time}', elapsedTime.toString())}
              </div>
            </div>

            <div className="pt-10 border-t border-dashed border-gray-200">
              <p className="text-[9px] font-semibold text-gray-400 mb-6">
                {t('checkout_simulate_pin_desc')}
              </p>
              <button
                onClick={handleSimulatePinSuccess}
                className="w-full bg-white border-4 border-[#5B8C51] text-[#5B8C51] py-6 rounded-[2rem] font-semibold text-[11px]   hover:bg-green-50 transition-all shadow-lg active:scale-95"
              >
                {t('checkout_simulate_pin_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="bg-white rounded-[2.5rem] md:rounded-[5rem] p-10 md:p-24 text-center shadow-strong border border-gray-100 max-w-3xl mx-auto space-y-8 md:space-y-12 animate-in zoom-in-110 duration-700">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-green-50 text-[#5B8C51] rounded-2xl md:rounded-[4rem] flex items-center justify-center text-5xl md:text-8xl mx-auto border-2 border-green-100 shadow-inner">✓</div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-4xl md:text-6xl font-semibold text-[#2E5C4E]  leading-none">{t('checkout_success_title')}</h2>
            <p className="text-gray-500 font-medium text-base md:text-xl leading-relaxed max-w-md mx-auto">{t('checkout_success_desc')}</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/shop" className="w-full bg-[#5B8C51] text-white py-5 md:py-7 rounded-2xl md:rounded-3xl font-semibold text-[10px] md:text-[11px]   shadow-2xl hover:bg-[#2E5C4E] text-center">{t('checkout_buy_more')}</Link>
            <Link to="/profile" className="w-full bg-gray-50 text-gray-400 py-5 md:py-7 rounded-2xl md:rounded-3xl font-semibold text-[10px] md:text-[11px]   border border-gray-100 text-center">{t('checkout_view_profile')}</Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
