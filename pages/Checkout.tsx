
import React, { useState, useEffect } from 'react';
import { User, CartItem, PaymentMethod, Order, OrderStatus, DeliveryStatus, DeliveryRequest, UserRole } from '../types';
import { PLATFORM_COMMISSION_RATE, MOCK_USERS } from '../constants';
import { Link } from 'react-router-dom';
import { PaysGatorService } from '../lib/paysgator';
import { useLanguage } from '../LanguageContext';
import MapLocationPicker from '../components/MapLocationPicker';
import { mockDb } from '../lib/mock_db';
import { ShoppingBag, Truck, CreditCard, Smartphone, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface CheckoutProps {
  cart: CartItem[];
  user: User | null;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  onComplete: (total: number) => void;
}

/* ── Reusable Order Summary Panel ─────────────────────────── */
const OrderSummary: React.FC<{
  cart: CartItem[];
  total: number;
  commission: number;
  cta?: React.ReactNode;
}> = ({ cart, total, commission, cta }) => (
  <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
    <div className="px-5 py-4 border-b border-[#F0F0F0]">
      <h3 className="font-poppins font-bold text-[#1C1C1C] text-[15px]">Resumo do Pedido</h3>
    </div>
    <div className="p-5 space-y-3">
      {cart.map(item => (
        <div key={item.id} className="flex items-center gap-3 text-[13px]">
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-[#F0F0F0]"
            onError={e => { e.currentTarget.style.opacity = '0'; }}
          />
          <span className="flex-grow text-[#3D3D3D] font-medium line-clamp-1">{item.name}</span>
          <span className="font-semibold text-[#1C1C1C] flex-shrink-0">{(item.price * item.quantity).toLocaleString()} MZN</span>
        </div>
      ))}

      <div className="border-t border-[#F5F5F5] pt-3 space-y-2 text-[13px]">
        <div className="flex justify-between text-[#6D6D6D]">
          <span>Subtotal</span>
          <span>{total.toLocaleString()} MZN</span>
        </div>
        <div className="flex justify-between text-[#6D6D6D]">
          <span>Comissão plataforma (5%)</span>
          <span>{commission.toLocaleString()} MZN</span>
        </div>
        <div className="flex justify-between font-poppins font-bold text-[16px] text-[#1C1C1C] border-t border-[#EBEBEB] pt-2.5 mt-1">
          <span>Total</span>
          <span className="text-[#2E7D32]">{total.toLocaleString()} MZN</span>
        </div>
      </div>

      {cta && <div className="pt-2">{cta}</div>}
    </div>
    <div className="px-5 pb-4">
      <div className="flex items-center gap-2 text-[11px] text-[#9A9A9A]">
        <ShieldCheck size={13} className="text-[#2E7D32] flex-shrink-0" />
        Pagamento seguro e encriptado pela plataforma AgroSuste
      </div>
    </div>
  </div>
);

/* ── Step indicator ───────────────────────────────────────── */
const Steps: React.FC<{ current: 'review' | 'payment' | 'waiting_pin' | 'success' }> = ({ current }) => {
  const steps = [
    { id: 'review', label: 'Revisão' },
    { id: 'payment', label: 'Pagamento' },
    { id: 'waiting_pin', label: 'Confirmação' },
  ];
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all ${i < idx || current === 'success' ? 'bg-[#2E7D32] text-white' : i === idx ? 'bg-[#1C1C1C] text-white' : 'bg-[#F0F0F0] text-[#A0A0A0]'}`}>
              {i < idx || current === 'success' ? '✓' : i + 1}
            </div>
            <span className={`text-[12px] font-semibold hidden sm:block ${i === idx ? 'text-[#1C1C1C]' : 'text-[#A0A0A0]'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-grow h-0.5 mx-3 rounded-full transition-all ${i < idx || current === 'success' ? 'bg-[#2E7D32]' : 'bg-[#E8E8E8]'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

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
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat?: number; lng?: number; address: string }>({ address: '' });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const commission = total * PLATFORM_COMMISSION_RATE;
  const subtotal = total - commission;

  useEffect(() => {
    if (step !== 'waiting_pin') return;
    const id = window.setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [step]);

  const handleStartPayment = async () => {
    if (method === PaymentMethod.BANK_LOCAL) {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16 || !cardExpiry || !cardCvv || cardCvv.length < 3) {
        alert(t('checkout_err_card')); return;
      }
    } else {
      if (!phoneNumber || phoneNumber.length !== 9) { alert(t('checkout_err_phone_len')); return; }
      if (method === PaymentMethod.MPESA && !/^(84|85)/.test(phoneNumber)) { alert(t('checkout_err_mpesa')); return; }
      if (method === PaymentMethod.EMOLA && !/^(86|87)/.test(phoneNumber)) { alert(t('checkout_err_emola')); return; }
    }
    setErrorMessage('');
    setStep('waiting_pin');
    setElapsedTime(0);
    const shortReference = `AS-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const response = await PaysGatorService.initiateTransaction({
      method: method === PaymentMethod.BANK_LOCAL ? 'bank_local' : method === PaymentMethod.EMOLA ? 'emola' : 'mpesa',
      amount: total,
      phoneNumber,
      reference: shortReference,
    });
    // Só reverter se ainda estiver em waiting_pin — evita sobrescrever 'success' se o utilizador já confirmou
    if (!response.success) { setErrorMessage(response.message); setStep(s => s === 'waiting_pin' ? 'payment' : s); }
  };

  const handleSimulatePayment = () => {
    setErrorMessage('');
    setStep('waiting_pin');
    setElapsedTime(0);
  };

  const handleSimulatePinSuccess = () => {
    const orderId = `ORD-${Date.now()}`;
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
      createdAt: new Date().toISOString(),
    };
    const existing: Order[] = JSON.parse(localStorage.getItem('agro_suste_orders') || '[]');
    existing.push(newOrder);
    localStorage.setItem('agro_suste_orders', JSON.stringify(existing));

    if (needsDelivery) {
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
        created_at: new Date().toISOString(),
      };
      mockDb.saveDeliveryRequest(deliveryRequest);
    }
    setStep('success');
    onComplete(subtotal);
    clearCart();
  };

  /* ── Empty cart ─────────────────────────────────────────── */
  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFAF8] text-center px-6">
        <div className="w-24 h-24 bg-[#F0F0F0] rounded-3xl flex items-center justify-center mb-6">
          <ShoppingBag size={36} className="text-[#C0C0C0]" />
        </div>
        <h2 className="font-poppins font-bold text-2xl text-[#1C1C1C] mb-2">{t('checkout_empty_title')}</h2>
        <p className="text-[#9A9A9A] text-[14px] mb-8">O teu carrinho está vazio. Descobre os nossos produtos frescos.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-[#2E7D32] text-white px-8 py-3.5 rounded-2xl font-poppins font-bold text-[14px] hover:bg-[#1B5E20] transition-all shadow-[0_4px_16px_rgba(46,125,50,0.28)]">
          {t('checkout_empty_btn')} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1100px] mx-auto px-5 xl:px-8 py-10">

        {/* Page header */}
        <div className="flex items-center gap-4 mb-6">
          {step !== 'success' && (
            <button
              onClick={() => step === 'payment' ? setStep('review') : window.history.back()}
              className="w-9 h-9 bg-white border border-[#E8E8E8] rounded-xl flex items-center justify-center text-[#6D6D6D] hover:border-[#2E7D32] hover:text-[#2E7D32] transition-all"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="font-poppins font-bold text-[#1C1C1C] text-[22px] leading-none">Checkout</h1>
            <p className="text-[#9A9A9A] text-[12px] mt-0.5">Finalizar encomenda com segurança</p>
          </div>
        </div>

        {step !== 'success' && <Steps current={step} />}

        {/* ── STEP 1: REVIEW ──────────────────────────────── */}
        {step === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

            {/* Left column */}
            <div className="space-y-4">

              {/* Cart items */}
              <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
                  <h2 className="font-poppins font-bold text-[#1C1C1C] text-[15px] flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#2E7D32]" />
                    Itens do Pedido <span className="text-[#9A9A9A] font-medium text-[13px]">({cart.length})</span>
                  </h2>
                </div>

                <div className="divide-y divide-[#F5F5F5]">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-[#F0F0F0]"
                        onError={e => { e.currentTarget.style.opacity = '0'; }}
                      />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-[#1C1C1C] text-[14px] leading-snug line-clamp-1">{item.name}</h3>
                        <p className="text-[#9A9A9A] text-[12px] font-medium mt-0.5">{item.quantity} × {item.price.toLocaleString()} MZN</p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="font-poppins font-bold text-[#1C1C1C] text-[15px]">
                          {(item.price * item.quantity).toLocaleString()} MZN
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-lg border border-[#F0F0F0] hover:bg-red-50 hover:border-red-100 flex items-center justify-center text-[#C0C0C0] hover:text-red-500 transition-all"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-[#E8F5E9] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck size={20} className="text-[#2E7D32]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1C1C1C] text-[14px]">Necessita de entrega?</p>
                      <p className="text-[#9A9A9A] text-[12px]">Entrega rápida via transportador parceiro</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={needsDelivery}
                      onChange={e => setNeedsDelivery(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#E0E0E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32] after:shadow-sm" />
                  </label>
                </div>

                {needsDelivery && (
                  <div className="mt-5 pt-5 border-t border-[#F0F0F0]">
                    <MapLocationPicker
                      label="Endereço de Entrega"
                      onLocationSelect={(lat, lng, addr) => setDeliveryLocation({ lat, lng, address: addr })}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Right column — sticky summary */}
            <div className="lg:sticky lg:top-[90px] h-fit">
              <OrderSummary
                cart={cart}
                total={total}
                commission={commission}
                cta={
                  <button
                    onClick={() => setStep('payment')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-poppins font-bold text-[14px] text-white transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#2E7D32,#1B5E20)', boxShadow: '0 4px 16px rgba(46,125,50,0.28)' }}
                  >
                    Método de Pagamento <ArrowRight size={16} />
                  </button>
                }
              />
              <Link to="/shop" className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-[#9A9A9A] font-medium hover:text-[#2E7D32] transition-colors">
                <ArrowLeft size={13} /> Continuar a comprar
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP 2: PAYMENT ─────────────────────────────── */}
        {step === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

            {/* Left column */}
            <div className="space-y-5">

              {errorMessage && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-3.5 rounded-xl text-[13px] font-semibold flex items-center gap-2">
                  <span className="flex-shrink-0">⚠️</span> {errorMessage}
                </div>
              )}

              {/* Payment method selector */}
              <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0F0F0]">
                  <h2 className="font-poppins font-bold text-[#1C1C1C] text-[15px] flex items-center gap-2">
                    <CreditCard size={16} className="text-[#2E7D32]" />
                    Método de Pagamento
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: PaymentMethod.MPESA, label: 'M-PESA', icon: <Smartphone size={22} className="text-[#E03D38]" />, color: '#E03D38' },
                      { id: PaymentMethod.EMOLA, label: 'e-Mola', icon: <Smartphone size={22} className="text-[#F57F17]" />, color: '#F57F17' },
                      { id: PaymentMethod.BANK_LOCAL, label: 'Cartão', icon: <CreditCard size={22} className="text-[#1565C0]" />, color: '#1565C0' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl border-2 transition-all duration-200 ${method === m.id ? 'border-[#2E7D32] bg-[#F3FAF3]' : 'border-[#EBEBEB] hover:border-[#C8E6C9]'}`}
                      >
                        {m.icon}
                        <span className="text-[12px] font-bold text-[#1C1C1C]">{m.label}</span>
                        {method === m.id && <span className="w-2 h-2 bg-[#2E7D32] rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input section */}
              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                {method === PaymentMethod.BANK_LOCAL ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#9A9A9A] uppercase tracking-[0.12em] mb-2">{t('checkout_card_num')}</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full h-12 rounded-xl bg-[#FAFAFA] border border-[#E8E8E8] px-4 text-[14px] font-semibold text-[#1C1C1C] outline-none focus:border-[#2E7D32] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#9A9A9A] uppercase tracking-[0.12em] mb-2">{t('checkout_card_val')}</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full h-12 rounded-xl bg-[#FAFAFA] border border-[#E8E8E8] px-4 text-[14px] font-semibold text-[#1C1C1C] outline-none focus:border-[#2E7D32] focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#9A9A9A] uppercase tracking-[0.12em] mb-2">{t('checkout_card_cvv')}</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          maxLength={4}
                          className="w-full h-12 rounded-xl bg-[#FAFAFA] border border-[#E8E8E8] px-4 text-[14px] font-semibold text-[#1C1C1C] outline-none focus:border-[#2E7D32] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-[#9A9A9A] uppercase tracking-[0.12em] mb-2">
                      {method === PaymentMethod.MPESA ? t('checkout_phone_mpesa') : t('checkout_phone_emola')}
                    </label>
                    <div className="flex gap-2">
                      <div className="h-12 bg-[#F3FAF3] border border-[#C8E6C9] rounded-xl px-4 flex items-center font-bold text-[#2E7D32] text-[14px] flex-shrink-0">
                        +258
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        maxLength={9}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length > 9) return;
                          if (val.length >= 1 && val[0] !== '8') return;
                          if (val.length >= 2) {
                            if (method === PaymentMethod.MPESA && !['4', '5'].includes(val[1])) return;
                            if (method === PaymentMethod.EMOLA && !['6', '7'].includes(val[1])) return;
                          }
                          setPhoneNumber(val);
                        }}
                        placeholder={method === PaymentMethod.MPESA ? t('checkout_phone_hint_mpesa') : t('checkout_phone_hint_emola')}
                        className="flex-grow h-12 rounded-xl bg-[#FAFAFA] border border-[#E8E8E8] px-4 text-[14px] font-semibold text-[#1C1C1C] outline-none focus:border-[#2E7D32] focus:bg-white transition-all"
                      />
                    </div>
                    {phoneNumber.length > 0 && (
                      <p className="text-[11px] font-medium mt-2">
                        {method === PaymentMethod.MPESA && !/^(84|85)/.test(phoneNumber)
                          ? <span className="text-amber-600">⚠ Inicie com 84 ou 85 para M-PESA</span>
                          : method === PaymentMethod.EMOLA && !/^(86|87)/.test(phoneNumber)
                          ? <span className="text-amber-600">⚠ Inicie com 86 ou 87 para e-Mola</span>
                          : phoneNumber.length === 9
                          ? <span className="text-[#2E7D32]">✓ Número válido</span>
                          : null}
                      </p>
                    )}
                  </div>
                )}

                {/* Simulate test button */}
                <button
                  onClick={handleSimulatePayment}
                  className="w-full mt-5 py-2.5 border border-dashed border-[#C8E6C9] text-[#2E7D32] rounded-xl font-bold text-[11px] hover:bg-[#F3FAF3] transition-all uppercase tracking-widest"
                >
                  🛠️ Simular Pagamento (Apenas Teste)
                </button>
              </div>

            </div>

            {/* Right — sticky summary with pay CTA */}
            <div className="lg:sticky lg:top-[90px] h-fit">
              <OrderSummary
                cart={cart}
                total={total}
                commission={commission}
                cta={
                  <button
                    onClick={handleStartPayment}
                    disabled={
                      method === PaymentMethod.BANK_LOCAL
                        ? !cardNumber || !cardExpiry || !cardCvv
                        : !phoneNumber || phoneNumber.length !== 9
                    }
                    className="w-full py-3.5 rounded-xl font-poppins font-bold text-[14px] text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#2E7D32,#1B5E20)', boxShadow: '0 4px 16px rgba(46,125,50,0.28)' }}
                  >
                    Pagar {total.toLocaleString()} MZN
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: WAITING PIN ──────────────────────────── */}
        {step === 'waiting_pin' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-3xl border border-[#EBEBEB] p-10 text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="w-24 h-24 border-4 border-[#E8F5E9] border-t-[#2E7D32] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">📱</div>
              </div>

              <h3 className="font-poppins font-bold text-[#1C1C1C] text-2xl mb-2">{t('checkout_waiting_pin_title')}</h3>
              <p className="text-[#2E7D32] font-semibold text-[12px] animate-pulse mb-8">{t('checkout_waiting_pin_subtitle')}</p>

              <div className="bg-[#1C1C1C] text-white rounded-2xl p-6 text-left space-y-4 mb-8">
                <div className="flex justify-between text-[12px] pb-3 border-b border-white/10">
                  <span className="text-white/50 font-medium">Canal de Pagamento</span>
                  <span className="font-bold uppercase">{method}</span>
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed">
                  {t('checkout_pin_instructions').replace('{phone}', phoneNumber)}
                </p>
                <p className="font-poppins font-bold text-[#6ED973] text-2xl">{total.toLocaleString()} MZN</p>
                <p className="text-[11px] text-white/30 text-center">
                  {t('checkout_elapsed_time').replace('{time}', elapsedTime.toString())}
                </p>
              </div>

              <div className="pt-6 border-t border-[#F0F0F0]">
                <p className="text-[12px] text-[#9A9A9A] mb-4">{t('checkout_simulate_pin_desc')}</p>
                <button
                  onClick={handleSimulatePinSuccess}
                  className="w-full py-4 border-2 border-[#2E7D32] text-[#2E7D32] rounded-2xl font-poppins font-bold text-[14px] hover:bg-[#F3FAF3] transition-all active:scale-[0.98]"
                >
                  {t('checkout_simulate_pin_btn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: SUCCESS ──────────────────────────────── */}
        {step === 'success' && (
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-white rounded-3xl border border-[#EBEBEB] p-12">
              <div className="w-20 h-20 bg-[#E8F5E9] rounded-3xl flex items-center justify-center mx-auto mb-7">
                <CheckCircle2 size={40} className="text-[#2E7D32]" strokeWidth={1.5} />
              </div>
              <h2 className="font-poppins font-bold text-[#1C1C1C] text-[28px] leading-tight mb-3">
                {t('checkout_success_title')}
              </h2>
              <p className="text-[#6D6D6D] text-[14px] leading-relaxed mb-8 max-w-sm mx-auto">
                {t('checkout_success_desc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/shop"
                  className="flex-1 py-3.5 rounded-xl font-poppins font-bold text-[14px] text-white text-center transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#2E7D32,#1B5E20)' }}
                >
                  {t('checkout_buy_more')}
                </Link>
                <Link
                  to="/profile"
                  className="flex-1 py-3.5 rounded-xl font-poppins font-bold text-[14px] text-[#6D6D6D] bg-[#F5F5F0] hover:bg-[#EBEBEB] text-center transition-all"
                >
                  {t('checkout_view_profile')}
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Checkout;
