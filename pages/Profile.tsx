import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, PaymentAccount, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';
import { getVerificationRequirements, VerificationRequirements } from '../lib/geography_api';
import { useLanguage } from '../LanguageContext';
import { LogType } from '../types';
import { mockDb } from '../lib/mock_db';
import { WORLD_LANGUAGES } from '../constants';
import { Package, Truck, ShoppingBag, ArrowRight, CheckCircle, Clock, MapPin, Phone, Info } from 'lucide-react';
import { DeliveryStatus, DeliveryRequest } from '../types';
import DeliveryStatusTimeline from '../components/DeliveryStatusTimeline';
import MapLocationPicker from '../components/MapLocationPicker';

interface ProfileProps {
  user: User | null;
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateAccounts: (accounts: PaymentAccount[]) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, products, onAddProduct, onUpdateAccounts }) => {
  const { t, language, setLanguage } = useLanguage();
  
  // MODO HÍBRIDO: Permite alternar a visão ativa se tiver mais que uma função (ou se for ADMIN para testar/ver)
  const isHybrid = user?.entityType === 'Cooperativa' || user?.entityType === 'Empresa' || user?.role === UserRole.SELLER; // Vamos assumir que Vendedores compram também.
  const [hybridView, setHybridView] = useState<'seller' | 'buyer'>(user?.role === UserRole.SELLER ? 'seller' : 'buyer');

  // TAB MESTRE PARA CONTEXTO
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'routes' | 'finance'>('dashboard');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [showManualDeliveryForm, setShowManualDeliveryForm] = useState(false);
  
  const refreshLogistics = () => {
    setDeliveryRequests(mockDb.getDeliveryRequests());
  };

  useEffect(() => {
    refreshLogistics();
    window.addEventListener('mock-db-changed', refreshLogistics);
    return () => window.removeEventListener('mock-db-changed', refreshLogistics);
  }, []);

  useEffect(() => {
    if (user?.country) {
      getVerificationRequirements(user.country).then(setRequirements);
    }
  }, [user?.country]);

  if (!user) return null;

  const currentRole = (isHybrid && hybridView === 'buyer') ? UserRole.BUYER : user.role;
  const isTransporter = user.role === UserRole.TRANSPORTER;
  
  const myProducts = products.filter(p => p.producerId === user.id);

  // MOCKS PARA TRANSPORTADOR E COMPRADOR (Simulação Visual de Timelines)
  const myOrders = JSON.parse(localStorage.getItem('agro_suste_orders') || '[]');

  const availableDeliveries = deliveryRequests.filter(r => r.status === DeliveryStatus.PENDENTE);
  const myActiveDeliveries = deliveryRequests.filter(r => r.assigned_driver_id === user.id && r.status !== DeliveryStatus.ENTREGUE);
  const myCompletedDeliveries = deliveryRequests.filter(r => r.assigned_driver_id === user.id && r.status === DeliveryStatus.ENTREGUE);

  const handleWithdrawal = () => {
    if ((user.balance || 0) <= 0) {
      alert(t('profile_balance_zero'));
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      alert(t('profile_withdrawal_success'));
    }, 2500);
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    const formData = new FormData(e.currentTarget);
    setTimeout(() => {
      const newProd: Product = {
        id: Date.now().toString(),
        producerId: user.id,
        producerName: user.fullName,
        categoryId: formData.get('category') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        unit: formData.get('unit') as string,
        stock: Number(formData.get('stock')),
        images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'],
        isDried: true
      };
      onAddProduct(newProd);
      mockDb.logActivity({
        userId: user.id, userName: user.fullName, userRole: user.role, type: LogType.PRODUCT_ADD,
        description: `Adicionou novo produto: ${newProd.name} (${newProd.unit})`
      });
      setProcessing(false);
      setShowAddProduct(false);
    }, 1500);
  };

  const handleUpdateDeliveryStatus = (id: string, status: DeliveryStatus) => {
    setProcessing(true);
    setTimeout(() => {
        mockDb.updateDeliveryStatus(id, status, status === DeliveryStatus.ACEITE ? user.id : undefined);
        setProcessing(false);
    }, 1000);
  };

  const handleCreateManualDelivery = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReq: DeliveryRequest = {
        id: `DEL-MANUAL-${Date.now()}`,
        created_by: user.id,
        pickup_name: formData.get('p_name') as string,
        pickup_phone: formData.get('p_phone') as string,
        pickup_address: formData.get('p_addr') as string,
        delivery_name: formData.get('d_name') as string,
        delivery_phone: formData.get('d_phone') as string,
        delivery_address: formData.get('d_addr') as string,
        status: DeliveryStatus.PENDENTE,
        notes: formData.get('notes') as string,
        created_at: new Date().toISOString()
    };
    mockDb.saveDeliveryRequest(newReq);
    setShowManualDeliveryForm(false);
  };

  // --- RENDERS POR PAPEL ---

  const renderHybridToggle = () => {
    if (!isHybrid) return null;
    // Admins e Strategic Partners não devem vender/comprar via dashboard pessoal se não forem explicitamente sellers
    if (user.role === UserRole.ADMIN || user.role === UserRole.STRATEGIC_PARTNER) return null;
    return (
      <div className="flex bg-[#FAFAFA] p-1.5 rounded-xl border border-[#E0E0E0] mb-8 w-fit mx-auto md:mx-0 shadow-sm animate-in zoom-in-95 duration-300">
        <button onClick={() => { setHybridView('seller'); setActiveTab('dashboard'); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${hybridView === 'seller' ? 'bg-white text-[#1B5E20] shadow-sm' : 'text-[#6D6D6D]'}`}>{t('profile_seller_mode')}</button>
        <button onClick={() => { setHybridView('buyer'); setActiveTab('dashboard'); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${hybridView === 'buyer' ? 'bg-white text-[#1B5E20] shadow-sm' : 'text-[#6D6D6D]'}`}>{t('profile_buyer_mode')}</button>
      </div>
    );
  };

  const renderSellerDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card hover:-translate-y-2 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('profile_monthly_revenue')}</span>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg"><Package size={18}/></div>
          </div>
          <h3 className="text-3xl font-bold text-[#1C1C1C]">{(user.balance || 0).toLocaleString()} <span className="text-sm text-[#A0A0A0]">MZN</span></h3>
        </div>
        <div className="premium-card hover:-translate-y-2 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('profile_active_stock')}</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg"><Package size={18}/></div>
          </div>
          <h3 className="text-3xl font-bold text-[#1C1C1C]">{myProducts.length} <span className="text-sm text-[#A0A0A0]">{t('admin_products')}</span></h3>
        </div>
        <div className="premium-card hover:-translate-y-2 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('admin_orders')}</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><ShoppingBag size={18}/></div>
          </div>
          <h3 className="text-3xl font-bold text-[#1C1C1C]">2 <span className="text-sm text-[#A0A0A0]">{t('profile_pending')}</span></h3>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden">
         <div className="px-8 py-6 border-b border-[#F0F0F0] flex justify-between items-center bg-[#FCFCFC]">
           <h4 className="font-poppins font-bold text-[#1C1C1C]">{t('profile_my_inventory')}</h4>
           <button onClick={() => setShowAddProduct(true)} className="text-sm font-bold text-[#1B5E20] hover:underline flex items-center gap-1">{t('profile_new_product')}</button>
         </div>
         <div className="p-2">
           <table className="w-full premium-table">
             <thead>
               <tr>
                 <th>Produto</th>
                 <th>Preço Inicial</th>
                 <th>Stock</th>
                 <th className="text-right">Ações</th>
               </tr>
             </thead>
             <tbody>
               {myProducts.map(p => (
                 <tr key={p.id}>
                   <td>
                     <div className="flex items-center gap-3">
                       <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                       <span className="font-bold text-[#1C1C1C] text-sm">{p.name}</span>
                     </div>
                   </td>
                   <td className="font-semibold text-[#1C1C1C]">{p.price.toLocaleString()} MZN</td>
                   <td><span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{p.stock} {p.unit}</span></td>
                   <td className="text-right"><button className="text-xs font-bold text-[#A0A0A0] hover:text-[#1B5E20] transition-colors px-3 py-1.5 border border-transparent hover:border-[#E0E0E0] rounded-md">Editar</button></td>
                 </tr>
               ))}
               {myProducts.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-[#A0A0A0] text-sm">Nenhum produto publicado.</td></tr>}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );

  const renderBuyerDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="premium-card p-8 bg-gradient-to-r from-[#FAFAFA] to-[#FFFFFF] border-[#E0E0E0]">
        <h3 className="font-poppins font-bold text-xl text-[#1C1C1C] mb-2">Bem-vindo(a) de volta!</h3>
        <p className="text-sm text-[#6D6D6D] mb-6">Que produtos frescos procura hoje?</p>
        <button className="premium-btn text-sm" onClick={() => window.location.hash = '#/shop'}>Explorar Marketplace →</button>
      </div>

      <div className="premium-card p-0 overflow-hidden">
        <div className="px-8 py-6 border-b border-[#F0F0F0] bg-[#FCFCFC]"><h4 className="font-poppins font-bold text-[#1C1C1C]">{t('profile_recent_orders')}</h4></div>
        <div className="p-8 space-y-6">
          {myOrders.map((o: any, idx: number) => (
             <div key={idx} className="flex gap-6 items-start">
                <div className="flex flex-col items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${o.status === 'entregue' ? 'bg-[#1B5E20]' : 'bg-amber-500 shadow-lg shadow-amber-500/20'}`}>
                     {o.status === 'entregue' ? <CheckCircle size={16}/> : <Clock size={16}/>}
                   </div>
                   {idx !== myOrders.length -1 && <div className="w-[2px] h-16 bg-[#E0E0E0] mt-2"></div>}
                </div>
                <div className="bg-[#FAFAFA] p-5 rounded-2xl border border-[#E0E0E0]/50 flex-grow hover:border-[#1B5E20]/30 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-bold text-[#1C1C1C]">{o.id}</span>
                     <span className="text-[10px] font-bold text-[#A0A0A0]">{new Date(o.createdAt).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs text-[#6D6D6D] mb-3">{o.items.length} itens • <span className="font-semibold text-[#1C1C1C]">{o.total.toLocaleString()} MZN</span></p>
                   <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded inline-block ${o.status === 'entregue' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                </div>
             </div>
          ))}
          {myOrders.length === 0 && <div className="text-center py-10 text-[#A0A0A0] text-sm italic">Nenhuma encomenda encontrada.</div>}
        </div>
      </div>

      {/* TIMELINES DE ENTREGA PARA O COMPRADOR */}
      {myOrders.length > 0 && deliveryRequests.some(r => myOrders.some((o: any) => o.id === r.order_id)) && (
        <div className="premium-card">
          <h4 className="font-poppins font-bold text-[#1C1C1C] mb-6">{t('profile_delivery_status')}</h4>
          <div className="space-y-8">
            {deliveryRequests.filter(r => myOrders.some((o: any) => o.id === r.order_id)).map(r => (
              <div key={r.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm text-[#2E7D32]">Guia de Entrega: {r.id}</span>
                  <span className="text-[10px] font-bold text-[#A0A0A0]">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <DeliveryStatusTimeline status={r.status} />
                <div className="flex items-start gap-4 mt-4 bg-gray-50 p-4 rounded-xl">
                  <div className="p-2 bg-white rounded-lg"><Truck size={16} className="text-[#2E7D32]" /></div>
                  <div>
                    <p className="text-xs font-bold text-[#1C1C1C]">Destino: <span className="font-medium text-[#6D6D6D]">{r.delivery_address}</span></p>
                    {r.status === DeliveryStatus.EM_ROTA && <p className="text-[10px] text-[#2E7D32] font-bold mt-1">🚛 O motorista está a caminho!</p>}
                    {r.status === DeliveryStatus.ACEITE && <p className="text-[10px] text-blue-600 font-bold mt-1">✅ Motorista atribuído. Aguardando início da rota.</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTransporterDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="premium-card bg-[#1B5E20] text-white overflow-hidden relative group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all" onClick={() => setShowManualDeliveryForm(true)}>
            <h4 className="font-poppins font-bold text-2xl relative z-10">{availableDeliveries.length} {t('profile_available_freights')}</h4>
            <p className="text-sm opacity-80 mt-1 relative z-10">{t('trans_zone_op')}</p>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform"><Truck size={140} /></div>
         </div>
         <div className="premium-card">
            <h4 className="font-poppins font-bold text-gray-400 text-xs uppercase tracking-wider mb-2">{t('trans_active_deliveries')}</h4>
            <div className="text-4xl font-bold text-[#1C1C1C]">{myActiveDeliveries.length} <span className="text-sm font-medium text-[#A0A0A0]">{t('trans_en_route')}</span></div>
         </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
            <h4 className="font-poppins font-bold text-[#1C1C1C]">{t('profile_freight_market')}</h4>
            <button onClick={() => setShowManualDeliveryForm(true)} className="text-[10px] font-bold uppercase tracking-widest text-[#2E7D32] hover:underline">{t('profile_manual_guide')}</button>
        </div>

        {/* ACTIVE DELIVERIES FIRST */}
        {myActiveDeliveries.map(req => (
          <div key={req.id} className="premium-card p-6 border-l-4 border-amber-400 flex flex-col md:flex-row justify-between items-center gap-6 shadow-md">
            <div className="flex-grow w-full">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">MOÇAMBIQUE • LOGÍSTICA</span>
                 <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded flex items-center gap-1"><span className="animate-pulse w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span> {req.status === DeliveryStatus.ACEITE ? 'Aguardando Início' : 'Em Rota'}</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold text-[#A0A0A0] uppercase">Recolha (Origem)</p>
                     <p className="font-bold flex items-center gap-2 text-sm"><MapPin size={14} className="text-red-500" /> {req.pickup_address}</p>
                     <p className="text-[11px] text-[#6D6D6D] flex items-center gap-1"><Phone size={10} /> {req.pickup_phone} ({req.pickup_name})</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold text-[#A0A0A0] uppercase">Entrega (Destino)</p>
                     <p className="font-bold flex items-center gap-2 text-sm"><MapPin size={14} className="text-green-500" /> {req.delivery_address}</p>
                     <p className="text-[11px] text-[#6D6D6D] flex items-center gap-1"><Phone size={10} /> {req.delivery_phone} ({req.delivery_name})</p>
                  </div>
               </div>
            </div>
            <div className="flex flex-col w-full md:w-auto gap-2">
               {req.status === DeliveryStatus.ACEITE ? (
                 <button onClick={() => handleUpdateDeliveryStatus(req.id, DeliveryStatus.EM_ROTA)} className="premium-btn bg-amber-500 hover:bg-amber-600 shadow-amber-200">Iniciar Rota</button>
               ) : (
                 <button onClick={() => handleUpdateDeliveryStatus(req.id, DeliveryStatus.ENTREGUE)} className="premium-btn bg-green-600 hover:bg-green-700">Confirmar Entrega</button>
               )}
            </div>
          </div>
        ))}

        {/* AVAILABLE DELIVERIES */}
        {availableDeliveries.map(req => (
          <div key={req.id} className="premium-card p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-[#1B5E20]/40 transition-colors">
            <div className="flex-grow w-full">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-bold bg-[#F0F0F0] px-2 py-1 rounded text-[#6D6D6D]">{req.id}</span>
               </div>
               <div className="flex items-center gap-4 text-sm font-bold text-[#1C1C1C]">
                  <div className="flex flex-col"><span className="text-xl">📍</span><span className="text-[10px] font-medium text-[#A0A0A0]">Recolha</span>{req.pickup_address}</div>
                  <div className="w-16 border-t-2 border-dashed border-[#E0E0E0] mt-3"></div>
                  <div className="flex flex-col"><span className="text-xl">🏁</span><span className="text-[10px] font-medium text-[#A0A0A0]">Entrega</span>{req.delivery_address}</div>
               </div>
            </div>
            <div className="flex flex-col md:items-end w-full md:w-auto gap-3 border-t md:border-t-0 md:border-l border-[#E0E0E0] pt-4 md:pt-0 md:pl-6">
               <button onClick={() => handleUpdateDeliveryStatus(req.id, DeliveryStatus.ACEITE)} className="premium-btn w-full mt-2">Aceitar Rota</button>
            </div>
          </div>
        ))}

        {availableDeliveries.length === 0 && myActiveDeliveries.length === 0 && (
            <div className="text-center py-10 opacity-30 grayscale"><Truck size={40} className="mx-auto mb-2" /><p className="text-sm font-bold">Sem pedidos para a sua zona.</p></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="theme-premium max-w-6xl mx-auto py-10 px-4 md:px-0">
      
      {/* Header Profile Info Premium */}
      <div className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white flex items-center justify-center text-4xl shadow-lg border-4 border-white">
          {user.fullName[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-4xl font-poppins font-bold text-[#1C1C1C] mb-1">{user.fullName}</h1>
          <p className="text-sm text-[#6D6D6D] font-medium">{user.email} • {user.role === UserRole.TRANSPORTER ? 'Gestão Logística' : isHybrid ? 'Conta Global (Híbrida)' : 'Perfil Pessoal'}</p>
        </div>
      </div>

      {renderHybridToggle()}

      {/* Main Dashboard Render Logic */}
      {currentRole === UserRole.SELLER && renderSellerDashboard()}
      {(currentRole === UserRole.BUYER || currentRole === UserRole.ADMIN) && renderBuyerDashboard()}
      {currentRole === UserRole.TRANSPORTER && renderTransporterDashboard()}

      {/* MODAL: MANUAL DELIVERY FORM */}
      {showManualDeliveryForm && (
        <div className="fixed inset-0 bg-[#1C1C1C]/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-[#E0E0E0] flex justify-between items-start">
              <div>
                <h3 className="font-poppins font-bold text-2xl text-[#1C1C1C]">{t('profile_create_transport')}</h3>
                <p className="text-xs text-[#A0A0A0] mt-1">{t('profile_create_transport_desc')}</p>
              </div>
              <button onClick={() => setShowManualDeliveryForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreateManualDelivery} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ORIGEM */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[#1B5E20] uppercase tracking-widest border-b border-green-100 pb-2">Recolha (Origem)</h5>
                  <div className="space-y-4">
                    <input name="p_name" required placeholder="Nome do Contacto" className="premium-input" />
                    <input name="p_phone" required placeholder="Telefone" className="premium-input" />
                    <textarea name="p_addr" required placeholder="Endereço legível (Referência)" className="premium-input h-20 pt-3 resize-none"></textarea>
                  </div>
                </div>

                {/* DESTINO */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[#B45309] uppercase tracking-widest border-b border-amber-100 pb-2">Entrega (Destino)</h5>
                  <div className="space-y-4">
                    <input name="d_name" required placeholder="Nome do Destinatário" className="premium-input" />
                    <input name="d_phone" required placeholder="Telefone do Destinatário" className="premium-input" />
                    <textarea name="d_addr" required placeholder="Endereço de Entrega (Referência)" className="premium-input h-20 pt-3 resize-none"></textarea>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-bold text-[#6D6D6D] uppercase">Observações da Carga</label>
                <textarea name="notes" className="premium-input h-24 pt-3 resize-none" placeholder="Ex: Frágil, Necessita de frio, Peso estimado..."></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <MapLocationPicker label="Definir Coordenadas (Opcional)" onLocationSelect={() => {}} />
              </div>

              <button type="submit" className="premium-btn w-full py-5 text-base flex justify-center items-center gap-2">
                <Package size={20} /> Publicar Pedido Logístico
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT FLOATING */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-lg p-0 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-[#E0E0E0]">
              <h3 className="font-poppins font-bold text-2xl text-[#1C1C1C]">{t('profile_publish_harvest')}</h3>
              <p className="text-xs text-[#A0A0A0] mt-1">{t('profile_publish_harvest_desc')}</p>
            </div>
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div className="relative premium-floating-label">
                <input name="name" id="p_name" required className="premium-input peer placeholder-transparent" placeholder="Ex: Milho Branco" />
                <label htmlFor="p_name" className="peer-focus:text-[#1B5E20] peer-placeholder-shown:top-4 peer-focus:-top-2">Nome do Produto</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative premium-floating-label">
                  <input name="price" id="p_price" type="number" required className="premium-input peer placeholder-transparent" placeholder="Preço" />
                  <label htmlFor="p_price" className="peer-focus:text-[#1B5E20] peer-placeholder-shown:top-4 peer-focus:-top-2">{t('profile_price_mzn')}</label>
                </div>
                <div className="relative premium-floating-label">
                  <input name="unit" id="p_unit" required className="premium-input peer placeholder-transparent" placeholder="Unidade" />
                  <label htmlFor="p_unit" className="peer-focus:text-[#1B5E20] peer-placeholder-shown:top-4 peer-focus:-top-2">{t('profile_unit_ex')}</label>
                </div>
              </div>
              <div className="relative premium-floating-label">
                 <select name="category" id="p_cat" required className="premium-input peer">
                   {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <label htmlFor="p_cat" className="top-[-10px] text-[10px] text-[#1B5E20]">Categoria</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-3 text-sm font-bold text-[#6D6D6D] bg-[#F0F0F0] rounded-xl hover:bg-[#E0E0E0] transition-colors">{t('comm_cancel')}</button>
                <button type="submit" disabled={processing} className="premium-btn flex-1 flex justify-center items-center">
                  {processing ? t('comm_loading') : t('profile_publish_now')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
