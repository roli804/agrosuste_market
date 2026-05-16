import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole, Product, PaymentAccount, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';
import { getVerificationRequirements, VerificationRequirements } from '../lib/geography_api';
import { useLanguage } from '../LanguageContext';
import { LogType } from '../types';
import { mockDb } from '../lib/mock_db';
import { WORLD_LANGUAGES } from '../constants';
import { Package, Truck, ShoppingBag, ArrowRight, CheckCircle, Clock, MapPin, Phone, Info, TrendingUp, Plus, X, Star, Wallet, BarChart2, Navigation, ChevronRight, Box, Layers, Upload, Pencil, ImagePlus } from 'lucide-react';
import { DeliveryStatus, DeliveryRequest } from '../types';
import DeliveryStatusTimeline from '../components/DeliveryStatusTimeline';
import MapLocationPicker from '../components/MapLocationPicker';

interface ProfileProps {
  user: User | null;
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct?: (p: Product) => void;
  onUpdateAccounts: (accounts: PaymentAccount[]) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, products, onAddProduct, onUpdateProduct, onUpdateAccounts }) => {
  const { t } = useLanguage();
  const isHybrid = user?.entityType === 'Cooperativa' || user?.entityType === 'Empresa' || user?.role === UserRole.SELLER;
  const [hybridView, setHybridView] = useState<'seller' | 'buyer'>(user?.role === UserRole.SELLER ? 'seller' : 'buyer');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'routes' | 'finance'>('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showManualDeliveryForm, setShowManualDeliveryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addImages, setAddImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStock, setEditStock] = useState('');
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);

  const refreshLogistics = () => setDeliveryRequests(mockDb.getDeliveryRequests());

  useEffect(() => {
    refreshLogistics();
    window.addEventListener('mock-db-changed', refreshLogistics);
    return () => window.removeEventListener('mock-db-changed', refreshLogistics);
  }, []);

  useEffect(() => {
    if (user?.country) getVerificationRequirements(user.country).then(setRequirements);
  }, [user?.country]);

  if (!user) return null;

  const currentRole = (isHybrid && hybridView === 'buyer') ? UserRole.BUYER : user.role;
  const isTransporter = user.role === UserRole.TRANSPORTER;
  const myProducts = products.filter(p => p.producerId === user.id);
  const myOrders = JSON.parse(localStorage.getItem('agro_suste_orders') || '[]');
  const availableDeliveries = deliveryRequests.filter(r => r.status === DeliveryStatus.PENDENTE);
  const myActiveDeliveries = deliveryRequests.filter(r => r.assigned_driver_id === user.id && r.status !== DeliveryStatus.ENTREGUE);

  // Comprime para max 800px JPEG 0.78 (~80-120KB) e chama setter quando termina.
  // NÃO é async para evitar que o event handler perca o FileList antes de capturar os ficheiros.
  const readImageFiles = (files: FileList | null, setter: React.Dispatch<React.SetStateAction<string[]>>, append = false) => {
    if (!files || files.length === 0) return;
    // Capturar ficheiros imediatamente (antes de qualquer I/O)
    const fileArray = Array.from(files).slice(0, 5);

    const processFile = (file: File): Promise<string> => new Promise(resolve => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // Fallback sem compressão se o canvas falhar
        const reader = new FileReader();
        reader.onload = e => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });

    Promise.all(fileArray.map(processFile)).then(urls => {
      const validUrls = urls.filter(Boolean);
      if (validUrls.length === 0) return;
      setter(prev => append ? [...prev, ...validUrls].slice(0, 5) : validUrls);
    });
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    const formData = new FormData(e.currentTarget);
    const rawImages = addImages.length > 0 ? addImages : ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'];
    const finalImages = await persistImages(rawImages);
    const newProd: Product = {
      id: Date.now().toString(),
      producerId: user.id,
      producerName: user.fullName,
      categoryId: formData.get('category') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      price: Number(formData.get('price')),
      unit: formData.get('unit') as string,
      stock: Number(formData.get('stock')),
      images: finalImages,
      isDried: true
    };
    onAddProduct(newProd);
    await saveProductToSupabase(newProd);
    mockDb.logActivity({ userId: user.id, userName: user.fullName, userRole: user.role, type: LogType.PRODUCT_ADD, description: `Adicionou: ${newProd.name}` });
    setProcessing(false);
    setShowAddProduct(false);
    setAddImages([]);
  };

  // Faz upload de imagens base64 para Supabase Storage e devolve URLs públicas permanentes.
  // Se o Storage não estiver configurado (dev local), devolve as base64 originais como fallback.
  const persistImages = async (images: string[]): Promise<string[]> => {
    return Promise.all(images.map(async (img) => {
      if (!img.startsWith('data:')) return img; // já é URL — não precisa upload
      try {
        const res = await fetch(img);
        const blob = await res.blob();
        const path = `products/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
        const { data, error } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg' });
        if (!error && data) {
          return supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl;
        }
      } catch {}
      return img; // fallback base64 se Storage falhar
    }));
  };

  const saveProductToSupabase = async (product: Product) => {
    try {
      await supabase.from('products').upsert({
        id: product.id,
        producer_id: product.producerId,
        producer_name: product.producerName,
        category_id: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        images: product.images,
        is_dried: product.isDried,
      }, { onConflict: 'id' });
    } catch {}
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditDesc(p.description || '');
    setEditPrice(String(p.price));
    setEditUnit(p.unit);
    setEditCategory(p.categoryId);
    setEditStock(String(p.stock));
    setEditImages(p.images || []);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProcessing(true);
    const rawImages = editImages.length > 0 ? editImages : editingProduct.images;
    const finalImages = await persistImages(rawImages);
    const updated: Product = {
      ...editingProduct,
      name: editName,
      description: editDesc,
      price: Number(editPrice),
      unit: editUnit,
      categoryId: editCategory,
      stock: Number(editStock),
      images: finalImages,
    };
    onUpdateProduct?.(updated);
    await saveProductToSupabase(updated);
    mockDb.logActivity({ userId: user.id, userName: user.fullName, userRole: user.role, type: LogType.PRODUCT_ADD, description: `Editou produto: ${updated.name}` });
    setProcessing(false);
    setEditingProduct(null);
  };

  const handleUpdateDeliveryStatus = (id: string, status: DeliveryStatus) => {
    setProcessing(true);
    setTimeout(() => { mockDb.updateDeliveryStatus(id, status, status === DeliveryStatus.ACEITE ? user.id : undefined); setProcessing(false); }, 800);
  };

  const handleCreateManualDelivery = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mockDb.saveDeliveryRequest({ id: `DEL-${Date.now()}`, created_by: user.id, pickup_name: fd.get('p_name') as string, pickup_phone: fd.get('p_phone') as string, pickup_address: fd.get('p_addr') as string, delivery_name: fd.get('d_name') as string, delivery_phone: fd.get('d_phone') as string, delivery_address: fd.get('d_addr') as string, status: DeliveryStatus.PENDENTE, notes: fd.get('notes') as string, created_at: new Date().toISOString() });
    setShowManualDeliveryForm(false);
  };

  const roleLabel = user.role === UserRole.SELLER ? 'Produtor / Vendedor' : user.role === UserRole.TRANSPORTER ? 'Gestor de Logística' : 'Comprador';
  const roleColor = user.role === UserRole.SELLER ? 'from-[#1B5E20] to-[#0D3B12]' : user.role === UserRole.TRANSPORTER ? 'from-[#1A3A5C] to-[#0F2340]' : 'from-slate-600 to-slate-700';

  const renderHybridToggle = () => {
    if (!isHybrid || user.role === UserRole.ADMIN || user.role === UserRole.STRATEGIC_PARTNER) return null;
    return (
      <div className="inline-flex bg-white/10 backdrop-blur-sm p-1 rounded-2xl border border-white/20 mb-6">
        {(['seller', 'buyer'] as const).map(v => (
          <button key={v} onClick={() => { setHybridView(v); setActiveTab('dashboard'); }}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${hybridView === v ? 'bg-white text-[#1B5E20] shadow-md' : 'text-white/80 hover:text-white'}`}>
            {v === 'seller' ? '🚜 Vendedor' : '🛒 Comprador'}
          </button>
        ))}
      </div>
    );
  };

  const StatCard = ({ icon, label, value, sub, gradient }: { icon: React.ReactNode, label: string, value: string | number, sub?: string, gradient: string }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${gradient} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      <div className="relative z-10">
        <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4">{icon}</div>
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-bold leading-none">{value}</h3>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );

  const renderSellerDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
        <StatCard icon={<Wallet size={20} />} label={t('profile_monthly_revenue')} value={`${(user.balance || 0).toLocaleString()} MZN`} gradient="from-emerald-600 to-teal-700" />
        <StatCard icon={<Box size={20} />} label={t('profile_active_stock')} value={myProducts.length} sub={`${t('admin_products')} activos`} gradient="from-slate-600 to-slate-700" />
        <StatCard icon={<ShoppingBag size={20} />} label={t('admin_orders')} value="2" sub={t('profile_pending')} gradient="from-blue-500 to-indigo-600" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-7 py-5 flex justify-between items-center border-b border-gray-50">
          <div>
            <h4 className="font-bold text-[#1C1C1C] text-base">{t('profile_my_inventory')}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{myProducts.length} {myProducts.length === 1 ? 'produto publicado' : 'produtos publicados'}</p>
          </div>
          <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 bg-[#1B5E20] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(27,94,32,0.3)] hover:bg-[#0D3B12] transition-all active:scale-95">
            <Plus size={16} /> {t('profile_new_product')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="py-3.5 px-7 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produto</th>
                <th className="py-3.5 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoria</th>
                <th className="py-3.5 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço</th>
                <th className="py-3.5 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="py-3.5 px-7 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myProducts.map(p => {
                const cat = CATEGORIES.find(c => c.id === p.categoryId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-7">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={p.images[0]} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1C1C1C] text-sm">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.producerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-semibold">{cat?.icon} {cat?.name || 'Geral'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#1C1C1C] text-sm">{p.price.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">MZN / {p.unit}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : p.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-4 px-7 text-right">
                      <button onClick={() => openEditProduct(p)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-[#2E7D32] border border-[#2E7D32]/30 hover:border-[#2E7D32] px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Pencil size={12} /> Editar</button>
                    </td>
                  </tr>
                );
              })}
              {myProducts.length === 0 && (
                <tr><td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center"><Package size={28} className="text-gray-300" /></div>
                    <p className="text-gray-400 text-sm font-medium">Nenhum produto publicado ainda.</p>
                    <button onClick={() => setShowAddProduct(true)} className="text-[#2E7D32] text-sm font-bold hover:underline">+ Publicar primeiro produto</button>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBuyerDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10"><BarChart2 size={200} /></div>
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium mb-1">Bem-vindo(a) de volta,</p>
          <h3 className="text-2xl font-bold mb-3">{user.fullName.split(' ')[0]} 👋</h3>
          <p className="text-white/70 text-sm mb-5">Que produtos frescos procura hoje?</p>
          <button className="bg-white text-[#1B5E20] font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2" onClick={() => window.location.hash = '#/shop'}>
            Explorar Marketplace <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-[#1C1C1C]">{t('profile_recent_orders')}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{myOrders.length} encomenda{myOrders.length !== 1 ? 's' : ''} no histórico</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {myOrders.map((o: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-[#2E7D32]/20 hover:bg-gray-50/50 transition-all group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${o.status === 'entregue' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {o.status === 'entregue' ? <CheckCircle size={20} /> : <Clock size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[#1C1C1C] truncate">{o.id}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase flex-shrink-0 ${o.status === 'entregue' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{o.items?.length || 0} itens · {(o.total || 0).toLocaleString()} MZN · {new Date(o.createdAt).toLocaleDateString('pt-MZ')}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#2E7D32] transition-colors flex-shrink-0" />
            </div>
          ))}
          {myOrders.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><ShoppingBag size={28} className="text-gray-300" /></div>
              <p className="text-gray-400 text-sm">Nenhuma encomenda encontrada.</p>
              <button className="mt-2 text-[#2E7D32] text-sm font-bold hover:underline" onClick={() => window.location.hash = '#/shop'}>Ir às compras →</button>
            </div>
          )}
        </div>
      </div>

      {myOrders.length > 0 && deliveryRequests.some(r => myOrders.some((o: any) => o.id === r.order_id)) && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <h4 className="font-bold text-[#1C1C1C] mb-6 flex items-center gap-2"><Truck size={18} className="text-[#2E7D32]" /> {t('profile_delivery_status')}</h4>
          <div className="space-y-6">
            {deliveryRequests.filter(r => myOrders.some((o: any) => o.id === r.order_id)).map(r => (
              <div key={r.id} className="border border-gray-100 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm text-[#2E7D32] bg-emerald-50 px-3 py-1 rounded-lg">Guia: {r.id}</span>
                  <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <DeliveryStatusTimeline status={r.status} />
                <div className="flex items-center gap-3 mt-4 bg-gray-50 p-3 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm"><Truck size={16} className="text-[#2E7D32]" /></div>
                  <div>
                    <p className="text-xs font-bold text-[#1C1C1C]">Destino: <span className="font-medium text-gray-500">{r.delivery_address}</span></p>
                    {r.status === DeliveryStatus.EM_ROTA && <p className="text-[10px] text-[#2E7D32] font-bold mt-0.5">🚛 O motorista está a caminho!</p>}
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard icon={<Navigation size={20} />} label={t('profile_available_freights')} value={availableDeliveries.length} sub="Rotas disponíveis na sua área" gradient="from-[#1B5E20] to-[#2E7D32]" />
        <StatCard icon={<Truck size={20} />} label={t('trans_active_deliveries')} value={myActiveDeliveries.length} sub={t('trans_en_route')} gradient="from-blue-600 to-indigo-700" />
      </div>

      <div className="flex justify-between items-center">
        <h4 className="font-bold text-[#1C1C1C] text-lg flex items-center gap-2"><Layers size={18} className="text-[#2E7D32]" /> {t('profile_freight_market')}</h4>
        <button onClick={() => setShowManualDeliveryForm(true)} className="flex items-center gap-2 bg-[#1B5E20] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(27,94,32,0.3)] hover:bg-[#0D3B12] transition-all active:scale-95">
          <Plus size={16} /> {t('profile_manual_guide')}
        </button>
      </div>

      {myActiveDeliveries.map(req => (
        <div key={req.id} className="bg-white rounded-3xl border-2 border-amber-200 shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -translate-y-12 translate-x-12" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                {req.status === DeliveryStatus.ACEITE ? 'Aguardando Início' : 'Em Rota Activa'}
              </span>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">{req.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recolha</p>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><MapPin size={12} className="text-red-500" /></div>
                  <div>
                    <p className="font-bold text-sm text-[#1C1C1C]">{req.pickup_address}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{req.pickup_name} · {req.pickup_phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrega</p>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><MapPin size={12} className="text-emerald-500" /></div>
                  <div>
                    <p className="font-bold text-sm text-[#1C1C1C]">{req.delivery_address}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{req.delivery_name} · {req.delivery_phone}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {req.status === DeliveryStatus.ACEITE
                ? <button onClick={() => handleUpdateDeliveryStatus(req.id, DeliveryStatus.EM_ROTA)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><Navigation size={16} /> Iniciar Rota</button>
                : <button onClick={() => handleUpdateDeliveryStatus(req.id, DeliveryStatus.ENTREGUE)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_12px_rgba(5,150,105,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle size={16} /> Confirmar Entrega</button>
              }
            </div>
          </div>
        </div>
      ))}

      {availableDeliveries.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Rotas Disponíveis ({availableDeliveries.length})</p>
          {availableDeliveries.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#2E7D32]/30 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center"><MapPin size={10} className="text-red-500" /></div>
                      <span className="font-semibold text-[#1C1C1C]">{req.pickup_address}</span>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-gray-200 min-w-8" />
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center"><MapPin size={10} className="text-emerald-500" /></div>
                      <span className="font-semibold text-[#1C1C1C]">{req.delivery_address}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">{req.id} · Publicado {new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleUpdateDeliveryStatus(req.id, DeliveryStatus.ACEITE)} className="opacity-0 group-hover:opacity-100 bg-[#1B5E20] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-[0_4px_12px_rgba(27,94,32,0.25)] transition-all active:scale-95 flex-shrink-0 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Aceitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableDeliveries.length === 0 && myActiveDeliveries.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Truck size={28} className="text-gray-300" /></div>
          <p className="text-gray-400 font-medium text-sm">Sem pedidos para a sua zona de operação.</p>
          <button onClick={() => setShowManualDeliveryForm(true)} className="mt-4 text-[#2E7D32] text-sm font-bold hover:underline">+ Criar pedido manual</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* HERO HEADER */}
      <div className={`bg-gradient-to-br ${roleColor} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-48 translate-x-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-32 -translate-x-32" />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-xl flex-shrink-0">
              {user.fullName[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{user.fullName}</h1>
                <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">{roleLabel}</span>
              </div>
              <p className="text-white/70 text-sm">{user.email} · {user.province || user.country}</p>
            </div>
          </div>
          {renderHybridToggle()}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {currentRole === UserRole.SELLER && renderSellerDashboard()}
        {(currentRole === UserRole.BUYER || currentRole === UserRole.ADMIN) && renderBuyerDashboard()}
        {currentRole === UserRole.TRANSPORTER && renderTransporterDashboard()}
      </div>

      {/* MODAL: ADD PRODUCT */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{t('profile_publish_harvest')}</h3>
                <p className="text-white/70 text-xs mt-0.5">{t('profile_publish_harvest_desc')}</p>
              </div>
              <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Imagem Principal */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Imagem Principal</label>
                {addImages[0] ? (
                  <div className="relative rounded-xl overflow-hidden h-32">
                    <img src={addImages[0]} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setAddImages(prev => prev.slice(1))} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-lg hover:bg-black/80"><X size={14} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#2E7D32] hover:bg-emerald-50/30 transition-all">
                    <Upload size={20} className="text-gray-300 mb-2" />
                    <span className="text-xs text-gray-400 font-medium">Clique para carregar imagem</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => readImageFiles(e.target.files, setAddImages)} />
                  </label>
                )}
              </div>
              {/* Galeria */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Galeria (até 4 adicionais)</label>
                <div className="flex gap-2 flex-wrap">
                  {addImages.slice(1).map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setAddImages(prev => [prev[0], ...prev.slice(1).filter((_, j) => j !== i)])} className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded"><X size={10} /></button>
                    </div>
                  ))}
                  {addImages.slice(1).length < 4 && (
                    <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#2E7D32] transition-colors">
                      <ImagePlus size={16} className="text-gray-300" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => readImageFiles(e.target.files, setAddImages, true)} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Nome do Produto</label>
                <input name="name" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium transition-all" placeholder="Ex: Milho Branco de Cuamba" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Descrição</label>
                <textarea name="description" rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium transition-all resize-none" placeholder="Descreva o produto, variedade, origem..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('profile_price_mzn')}</label>
                  <input name="price" type="number" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('profile_unit_ex')}</label>
                  <input name="unit" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium transition-all" placeholder="Kg, Saco, Ton" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Categoria</label>
                <select name="category" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] outline-none text-sm font-medium transition-all bg-white">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Stock Disponível</label>
                <input name="stock" type="number" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium transition-all" placeholder="0" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddProduct(false); setAddImages([]); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">{t('comm_cancel')}</button>
                <button type="submit" disabled={processing} className="flex-1 py-3 rounded-xl bg-[#1B5E20] text-white font-bold text-sm shadow-[0_4px_12px_rgba(27,94,32,0.3)] hover:bg-[#0D3B12] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {processing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A publicar...</> : <><Plus size={16} /> {t('profile_publish_now')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1A3A5C] to-[#0F2340] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Editar Produto</h3>
                <p className="text-white/70 text-xs mt-0.5 truncate max-w-[240px]">{editingProduct.name}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Imagem Principal */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Imagem Principal</label>
                {editImages[0] ? (
                  <div className="relative rounded-xl overflow-hidden h-32">
                    <img src={editImages[0]} className="w-full h-full object-cover" />
                    <label className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-black/80 flex items-center gap-1">
                      <Upload size={12} /> Trocar
                      <input type="file" accept="image/*" className="hidden" onChange={e => readImageFiles(e.target.files, setEditImages)} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1A3A5C] hover:bg-blue-50/20 transition-all">
                    <Upload size={20} className="text-gray-300 mb-2" />
                    <span className="text-xs text-gray-400 font-medium">Carregar imagem</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => readImageFiles(e.target.files, setEditImages)} />
                  </label>
                )}
              </div>
              {/* Galeria */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Galeria</label>
                <div className="flex gap-2 flex-wrap">
                  {editImages.slice(1).map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditImages(prev => [prev[0], ...prev.slice(1).filter((_, j) => j !== i)])} className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded"><X size={10} /></button>
                    </div>
                  ))}
                  {editImages.slice(1).length < 4 && (
                    <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#1A3A5C] transition-colors">
                      <ImagePlus size={16} className="text-gray-300" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => readImageFiles(e.target.files, setEditImages, true)} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Nome do Produto</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 outline-none text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Descrição</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 outline-none text-sm font-medium transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Preço (MZN)</label>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 outline-none text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Unidade</label>
                  <input value={editUnit} onChange={e => setEditUnit(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 outline-none text-sm font-medium transition-all" placeholder="Kg, Saco, Ton" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Categoria</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A3A5C] outline-none text-sm font-medium transition-all bg-white">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Stock</label>
                <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 outline-none text-sm font-medium transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={processing} className="flex-1 py-3 rounded-xl bg-[#1A3A5C] text-white font-bold text-sm shadow-lg hover:bg-[#0F2340] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {processing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A guardar...</> : <><Pencil size={14} /> Guardar Alterações</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL DELIVERY */}
      {showManualDeliveryForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{t('profile_create_transport')}</h3>
                <p className="text-white/70 text-xs mt-0.5">{t('profile_create_transport_desc')}</p>
              </div>
              <button onClick={() => setShowManualDeliveryForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateManualDelivery} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2"><div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center"><MapPin size={10} /></div> Recolha (Origem)</h5>
                  <input name="p_name" required placeholder="Nome do contacto" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-medium" />
                  <input name="p_phone" required placeholder="Telefone" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none text-sm font-medium" />
                  <textarea name="p_addr" required placeholder="Endereço de recolha" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none text-sm font-medium resize-none h-20" />
                </div>
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2"><div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center"><MapPin size={10} /></div> Entrega (Destino)</h5>
                  <input name="d_name" required placeholder="Nome do destinatário" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none text-sm font-medium" />
                  <input name="d_phone" required placeholder="Telefone do destinatário" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none text-sm font-medium" />
                  <textarea name="d_addr" required placeholder="Endereço de entrega" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none text-sm font-medium resize-none h-20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Observações da Carga</label>
                <textarea name="notes" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 outline-none text-sm resize-none h-20" placeholder="Frágil, refrigeração necessária, peso estimado..." />
              </div>
              <MapLocationPicker label="Coordenadas (Opcional)" onLocationSelect={() => {}} />
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-[0.98]">
                <Truck size={18} /> Publicar Pedido Logístico
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
