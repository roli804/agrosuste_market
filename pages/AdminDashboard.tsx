import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, UserRole, EntityType, Order, ActivityLog, LogType } from '../types';
import { MOZ_GEOGRAPHY, PLATFORM_COMMISSION_RATE, MOCK_USERS, CATEGORIES } from '../constants';
import { mockDb } from '../lib/mock_db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrendingUp, Users, ShoppingBag, PieChart, ShieldCheck, LayoutDashboard, UserCheck, Truck, Package, Folder, Star, Settings, FileText, CheckCircle, Ban, Store, MapPin, Eye, XCircle, ArrowRight, Plus, LogOut, Activity, BarChart2, DollarSign, Navigation2, RefreshCw, X, Info, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { DeliveryRequest, DeliveryStatus } from '../types';
import DeliveryStatusTimeline from '../components/DeliveryStatusTimeline';

interface AdminDashboardProps {
  products: any[];
  user: User | null;
  onAddProduct?: (p: any) => void;
}

type TabId = 'dashboard' | 'users' | 'suppliers' | 'buyers' | 'transporters' | 'partners' | 'products' | 'categories' | 'orders' | 'logistics' | 'ratings' | 'settings' | 'reports';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, user, onAddProduct }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [newUser, setNewUser] = useState({ email: '', fullName: '', phone: '', role: UserRole.BUYER, province: '', district: '', entityType: EntityType.INDIVIDUAL });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', unit: 'Kg', categoryId: '1', description: '', isDried: false, image: '' });
  const [categories, setCategories] = useState(() => { const s = localStorage.getItem('agro_suste_categories'); return s ? JSON.parse(s) : CATEGORIES; });
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦' });
  const [newPartner, setNewPartner] = useState({ entityName: '', email: '', phone: '', location: '' });
  const [filterProvince, setFilterProvince] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'general' | 'weekly' | 'monthly'>('general');

  const isAuthorized = user && [UserRole.ADMIN, UserRole.STRATEGIC_PARTNER].includes(user.role as UserRole);
  const isAdmin = user && user.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isAuthorized) return;
    fetchOperationalData();
    const ch1 = supabase.channel('admin-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchOperationalData).subscribe();
    const ch2 = supabase.channel('admin-products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchOperationalData).subscribe();
    return () => { ch1.unsubscribe(); ch2.unsubscribe(); };
  }, [isAuthorized]);

  const handleLogout = async () => {
    if (user?.id) await supabase.from('profiles').update({ status: 'offline' }).eq('id', user.id);
    localStorage.removeItem('mock_user');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const fetchOperationalData = async () => {
    setLoading(true);
    let supabaseUsers: User[] = [];
    try {
      const { data: allRows, error } = await supabase.rpc('get_all_profiles');
      if (!error && allRows?.length > 0) {
        supabaseUsers = allRows.map((u: any): User => ({
          id: u.id, email: u.email || '', fullName: u.full_name || 'Utilizador', phone: u.phone || '',
          commercialPhone: u.commercial_phone || u.phone || '', country: u.country || 'Moçambique',
          province: u.province, district: u.district, posto: u.posto_administrativo, localidade: u.localidade_bairro,
          role: (u.role as UserRole) || UserRole.BUYER, entityType: (u.entity_type as EntityType) || EntityType.INDIVIDUAL,
          entityName: u.entity_name, status: u.status || 'offline', isApproved: u.isapproved ?? false,
          balance: Number(u.balance) || 0, linkedAccounts: Array.isArray(u.linked_accounts) ? u.linked_accounts : [], logo: u.logo,
        }));
      }
    } catch (e: any) { console.error('[Admin]', e?.message); }
    const local = mockDb.getUsers();
    const merged = [...supabaseUsers];
    local.forEach(lu => { if (!merged.find(u => u.id === lu.id || (lu.email && u.email === lu.email))) merged.push(lu); });
    setUsers(merged.length > 0 ? merged : MOCK_USERS);
    setActivityLogs(mockDb.getLogs());
    setDeliveryRequests(mockDb.getDeliveryRequests());
    const saved = localStorage.getItem('agro_suste_orders');
    if (saved) { try { setOrders(JSON.parse(saved)); } catch {} }
    setLoading(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-MZ');
    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRO-SUSTE MOÇAMBIQUE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(t('admin_pdf_footer'), 105, 30, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`${t('admin_pdf_type')}: ${reportType.toUpperCase()}`, 14, 50);
    doc.text(`${t('admin_pdf_date')}: ${timestamp}`, 14, 56);
    doc.text(`${t('admin_pdf_prov_label')}: ${filterProvince || t('admin_pdf_all')}`, 14, 62);
    const salesVolume = filteredOrders.reduce((s, o) => s + o.total, 0);
    autoTable(doc, { startY: 70, head: [[t('admin_pdf_indicator'), t('admin_pdf_value')]], body: [[t('admin_stats_total'), filteredUsers.length.toString()], [t('admin_stats_sellers'), filteredUsers.filter(u => u.role === UserRole.SELLER).length.toString()], [t('admin_stats_buyers'), filteredUsers.filter(u => u.role === UserRole.BUYER).length.toString()], [`${t('admin_sales_volume')} (MZN)`, salesVolume.toLocaleString()], [`${t('admin_cumulative_commission')} (MZN)`, filteredOrders.reduce((s, o) => s + (o.commission || 0), 0).toLocaleString()]], theme: 'striped', headStyles: { fillColor: [27, 94, 32] } });
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 15, head: [[t('admin_pdf_name'), t('admin_pdf_role'), t('admin_pdf_province'), t('admin_pdf_district'), t('admin_pdf_status')]], body: users.map(u => [u.fullName, u.role, u.province || '', u.district || '', u.status.toUpperCase()]), theme: 'grid', headStyles: { fillColor: [67, 160, 71] }, styles: { fontSize: 8 } });
    doc.save(`Relatorio_AgroSuste_${reportType}_${Date.now()}.pdf`);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = { id: (categories.length + 1).toString(), name: newCategory.name, icon: newCategory.icon, is_active: true };
    const updated = [...categories, cat];
    setCategories(updated);
    localStorage.setItem('agro_suste_categories', JSON.stringify(updated));
    setNewCategory({ name: '', icon: '📦' });
    setShowAddModal(false);
  };

  const handleAddNewEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'products') {
      const prod = { id: `admin-prod-${Date.now()}`, producerId: user?.id || 'admin', producerName: user?.fullName || 'AgroSuste', categoryId: newProduct.categoryId, name: newProduct.name, description: newProduct.description || newProduct.name, price: Number(newProduct.price), unit: newProduct.unit, stock: Number(newProduct.stock), images: [newProduct.image || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80'], isDried: newProduct.isDried, isAdminProduct: true, createdAt: new Date().toISOString() };
      mockDb.saveProduct(prod);
      if (onAddProduct) onAddProduct(prod);
      mockDb.logActivity({ userId: user?.id || 'admin', userName: user?.fullName || 'Admin', userRole: UserRole.ADMIN, type: LogType.PRODUCT_ADD, description: `Publicou: ${prod.name}` });
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', unit: 'Kg', categoryId: '1', description: '', isDried: false, image: '' });
    } else if (activeTab === 'categories') {
      handleAddCategory(e);
    } else if (activeTab === 'partners') {
      const partner = { id: `admin-part-${Date.now()}`, email: newPartner.email, fullName: newPartner.entityName, phone: newPartner.phone, commercialPhone: newPartner.phone, role: UserRole.STRATEGIC_PARTNER, entityType: EntityType.NGO_INTL, entityName: newPartner.entityName, district: newPartner.location, province: newPartner.location, country: 'Moçambique', status: 'active', isApproved: true, balance: 0, linkedAccounts: [] };
      mockDb.saveUser(partner as any);
      setUsers(prev => [...prev, partner as any]);
      setShowAddModal(false);
      setNewPartner({ entityName: '', email: '', phone: '', location: '' });
    } else {
      let fixedRole = newUser.role;
      if (activeTab === 'suppliers') fixedRole = UserRole.SELLER;
      if (activeTab === 'buyers') fixedRole = UserRole.BUYER;
      if (activeTab === 'transporters') fixedRole = UserRole.TRANSPORTER;
      const u: User = { ...newUser, role: fixedRole, id: `admin-reg-${Date.now()}`, commercialPhone: newUser.phone, country: 'Moçambique', status: 'active', isApproved: true, balance: 0, linkedAccounts: [], entityName: newUser.fullName };
      mockDb.saveUser(u);
      setUsers(prev => [...prev, u]);
      setShowAddModal(false);
      setNewUser({ email: '', fullName: '', phone: '', role: UserRole.BUYER, province: '', district: '', entityType: EntityType.INDIVIDUAL });
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Eliminar ${userName}? Esta acção é irreversível.`)) {
      mockDb.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const stats = {
    total: users.length,
    sellers: users.filter(u => u.role === UserRole.SELLER).length,
    buyers: users.filter(u => u.role === UserRole.BUYER).length,
    transporters: users.filter(u => u.role === UserRole.TRANSPORTER).length,
    partners: users.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length,
  };

  const filteredUsers = users.filter(u => !filterProvince || u.province === filterProvince);
  const filteredOrders = orders.filter(o => {
    if (filterProvince && o.province !== filterProvince) return false;
    if (reportType === 'monthly') { const d = new Date(o.createdAt); if (d.getMonth() + 1 !== filterMonth || d.getFullYear() !== filterYear) return false; }
    return true;
  });
  const totalPlatformCommission = orders.reduce((s, o) => s + (o.total * PLATFORM_COMMISSION_RATE), 0);

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center gap-6">
        <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center text-5xl">🔒</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('hero_cta_auth')}</h2>
          <p className="text-gray-400 text-sm max-w-md">{t('admin_no_records')}</p>
        </div>
        <a href="#/auth" className="bg-[#1B5E20] text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-[#0D3B12] transition-all">{t('admin_login_manager')}</a>
      </div>
    );
  }

  const sidebarSections = [
    { label: null, items: [{ id: 'dashboard' as TabId, icon: <LayoutDashboard size={18} />, label: t('admin_dashboard') }] },
    { label: t('admin_profiles'), items: [
      { id: 'users' as TabId, icon: <Users size={18} />, label: t('admin_users') },
      { id: 'suppliers' as TabId, icon: <Store size={18} />, label: t('admin_suppliers') },
      { id: 'buyers' as TabId, icon: <ShoppingBag size={18} />, label: t('admin_buyers') },
      { id: 'transporters' as TabId, icon: <Truck size={18} />, label: t('admin_transporters') },
      { id: 'partners' as TabId, icon: <ShieldCheck size={18} />, label: t('admin_partners_nav') },
    ]},
    { label: t('admin_ops_title_nav'), items: [
      { id: 'products' as TabId, icon: <Package size={18} />, label: t('admin_products') },
      { id: 'categories' as TabId, icon: <Folder size={18} />, label: t('admin_categories') },
      { id: 'orders' as TabId, icon: <FileText size={18} />, label: t('admin_orders') },
      { id: 'logistics' as TabId, icon: <Navigation2 size={18} />, label: t('admin_logistics_nav') },
    ]},
    { label: t('admin_system'), items: [
      { id: 'reports' as TabId, icon: <PieChart size={18} />, label: t('admin_reports_finance') },
      { id: 'ratings' as TabId, icon: <Star size={18} />, label: t('admin_ratings') },
    ]},
  ];

  const roleColors: Record<string, string> = { [UserRole.SELLER]: 'bg-emerald-50 text-emerald-700', [UserRole.BUYER]: 'bg-blue-50 text-blue-700', [UserRole.TRANSPORTER]: 'bg-amber-50 text-amber-700', [UserRole.ADMIN]: 'bg-purple-50 text-purple-700', [UserRole.STRATEGIC_PARTNER]: 'bg-indigo-50 text-indigo-700', [UserRole.EXTENSIONIST]: 'bg-teal-50 text-teal-700' };
  const statusColors: Record<string, string> = { online: 'text-emerald-600 bg-emerald-50', offline: 'text-gray-500 bg-gray-100', blocked: 'text-red-600 bg-red-50', active: 'text-emerald-600 bg-emerald-50', inactive: 'text-gray-500 bg-gray-100' };

  const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input {...props} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium transition-all bg-white" />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F5F5F0] font-inter overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-[240px] bg-white border-r border-gray-100 hidden md:flex flex-col h-full shrink-0 shadow-sm">
        <div className="h-[72px] border-b border-gray-100 flex items-center px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(27,94,32,0.3)]">
              <Logo className="w-5 h-5" color="white" />
            </div>
            <div>
              <p className="font-bold text-[#1C1C1C] text-sm leading-none">AgroSuste</p>
              <p className="text-[9px] text-[#2E7D32] font-bold uppercase tracking-widest mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1" style={{ scrollbarWidth: 'none' }}>
          {sidebarSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-2' : ''}>
              {section.label && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">{section.label}</p>}
              {section.items.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${activeTab === item.id ? 'bg-[#1B5E20] text-white shadow-[0_4px_12px_rgba(27,94,32,0.25)]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1B5E20]'}`}>
                  <span className={activeTab === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm border border-red-100">
            <LogOut size={16} /> Sair da Conta
          </button>
          <div className="flex items-center gap-3 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-lg flex items-center justify-center text-white font-bold text-xs">{user?.fullName?.[0] || 'A'}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1C1C1C] truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-[9px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-[60px] flex items-center justify-between px-4 z-[100] shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7" color="#2E7D32" />
          <span className="font-bold text-sm text-[#1C1C1C]">AgroSuste <span className="text-[#2E7D32]">Admin</span></span>
        </div>
        <div className="flex gap-2">
          <NotificationBell userId={user?.id} />
          <button onClick={handleLogout} className="p-2 bg-red-50 rounded-lg text-red-500 border border-red-100"><LogOut size={18} /></button>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto h-full bg-[#F5F5F0] mt-[60px] md:mt-0" style={{ scrollbarWidth: 'none' }}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* PAGE HEADER */}
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1C1C] capitalize">{t(`admin_${activeTab}` as any) || activeTab.replace('_', ' ')}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{t('admin_subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchOperationalData} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-400 hover:text-[#2E7D32] hover:border-[#2E7D32]/30 transition-all shadow-sm" title="Actualizar">
                <RefreshCw size={16} />
              </button>
              <NotificationBell userId={user?.id} />
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#1B5E20] hover:bg-[#0D3B12] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(27,94,32,0.3)] transition-all active:scale-95">
                  <Plus size={16} /> {t('admin_add_new')}
                </button>
              )}
            </div>
          </header>

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-400">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                {[
                  { icon: <Users size={20} />, label: t('admin_total_users'), value: loading ? '...' : stats.total, gradient: 'from-[#1A3A5C] to-[#0F2340]', sub: `${stats.sellers} prod. · ${stats.buyers} comp.` },
                  { icon: <Package size={20} />, label: t('admin_active_products'), value: loading ? '...' : products.length, gradient: 'from-[#1B5E20] to-[#0D3B12]', sub: 'No catálogo activo' },
                  { icon: <FileText size={20} />, label: t('admin_orders_count'), value: loading ? '...' : orders.length, gradient: 'from-slate-600 to-slate-700', sub: `${orders.filter(o => o.status !== 'entregue').length} pendentes` },
                  { icon: <DollarSign size={20} />, label: 'Comissão Plataforma', value: loading ? '...' : `${totalPlatformCommission.toLocaleString()} MZN`, gradient: 'from-[#2D1B69] to-[#1A0F3D]', sub: `Taxa: ${(PLATFORM_COMMISSION_RATE * 100).toFixed(0)}%` },
                ].map(card => (
                  <div key={card.label} className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${card.gradient} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                    <div className="relative z-10">
                      <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">{card.icon}</div>
                      <h3 className="text-2xl font-bold leading-none mb-1">{card.value}</h3>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{card.label}</p>
                      {card.sub && <p className="text-white/50 text-[10px] mt-1">{card.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ACTIVITY FEED */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-[#1C1C1C] flex items-center gap-2"><Activity size={16} className="text-[#2E7D32]" /> {t('admin_recent_activity')}</h4>
                    <button onClick={fetchOperationalData} className="text-xs font-bold text-[#2E7D32] bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">{t('profile_update')}</button>
                  </div>
                  <div className="p-6 space-y-4">
                    {activityLogs.slice(0, 6).map(log => {
                      const colors: Record<string, string> = { [LogType.SIGNUP]: 'bg-blue-100 text-blue-600', [LogType.LOGIN]: 'bg-emerald-100 text-emerald-600', [LogType.PRODUCT_ADD]: 'bg-amber-100 text-amber-600', [LogType.SYSTEM]: 'bg-purple-100 text-purple-600' };
                      const color = colors[log.type] || 'bg-gray-100 text-gray-500';
                      return (
                        <div key={log.id} className="flex gap-3 items-start">
                          <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${color}`}><ArrowRight size={12} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#1C1C1C]"><span className="font-bold">{log.userName}</span>: {log.description}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString('pt-MZ')}</p>
                          </div>
                        </div>
                      );
                    })}
                    {activityLogs.length === 0 && !loading && <p className="text-gray-400 text-sm text-center py-6">{t('admin_no_activity')}</p>}
                  </div>
                </div>

                {/* QUICK STATS */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <h4 className="font-bold text-[#1C1C1C] flex items-center gap-2"><BarChart2 size={16} className="text-[#2E7D32]" /> Distribuição</h4>
                  {[
                    { label: 'Produtores', value: stats.sellers, total: stats.total, color: 'bg-emerald-600' },
                    { label: 'Compradores', value: stats.buyers, total: stats.total, color: 'bg-[#1A3A5C]' },
                    { label: 'Transportadores', value: stats.transporters, total: stats.total, color: 'bg-slate-500' },
                    { label: 'Parceiros', value: stats.partners, total: stats.total, color: 'bg-[#2D1B69]' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                        <p className="text-xs font-bold text-[#1C1C1C]">{item.value}</p>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS / SUPPLIERS / BUYERS / TRANSPORTERS */}
          {(['users', 'suppliers', 'buyers', 'transporters'] as TabId[]).includes(activeTab) && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {[t('admin_table_id'), t('admin_table_role'), t('admin_table_contact'), t('admin_table_status'), t('admin_table_actions')].map((h, i) => (
                        <th key={h} className={`py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.filter(u => {
                      if (activeTab === 'suppliers') return u.role === UserRole.SELLER;
                      if (activeTab === 'buyers') return u.role === UserRole.BUYER;
                      if (activeTab === 'transporters') return u.role === UserRole.TRANSPORTER;
                      return true;
                    }).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B5E20]/10 to-[#2E7D32]/20 text-[#2E7D32] flex items-center justify-center font-bold text-sm flex-shrink-0">{u.fullName[0]}</div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-[#1C1C1C] truncate">{u.fullName}</p>
                              <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${roleColors[u.role] || 'bg-gray-100 text-gray-500'}`}>{u.role}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-semibold text-[#1C1C1C]">{u.commercialPhone || u.phone || '—'}</p>
                          <p className="text-[10px] text-gray-400">{u.province || u.country}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusColors[u.status] || 'bg-gray-100 text-gray-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'online' ? 'bg-emerald-500 animate-pulse' : u.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'}`} />
                              {u.status}
                            </span>
                            {!u.isApproved && <span className="block text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">{t('admin_pending')}</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedUser(u)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100" title="Ver"><UserCheck size={15} /></button>
                            {isAdmin && u.id !== user?.id && (
                              <button onClick={() => handleDeleteUser(u.id, u.fullName)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors border border-red-100" title="Remover"><Ban size={15} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !loading && (
                      <tr><td colSpan={5} className="py-16 text-center text-gray-400 text-sm">{t('admin_no_users')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PARTNERS */}
          {activeTab === 'partners' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).map(u => (
                <div key={u.id} className="bg-[#0F1729] p-6 rounded-3xl border border-[#1E2A3B] shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-[#2A3B52] transition-all duration-300 group flex flex-col">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center p-2 bg-white/5">
                      {u.logo ? <img src={u.logo} alt={u.entityName} className="max-w-full max-h-full object-contain" /> : <ShieldCheck size={26} className="text-white/30" />}
                    </div>
                    <span className="text-[9px] bg-white/10 text-white/60 font-bold px-2.5 py-1 rounded-lg border border-white/10 tracking-widest uppercase">Verificado</span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1 leading-snug">{u.entityName || u.fullName}</h4>
                  <p className="text-xs text-white/40 mb-5">{u.district || u.province || 'Global'}</p>
                  <div className="mt-auto pt-4 border-t border-white/8 space-y-2.5">
                    <div className="flex justify-between text-xs"><span className="text-white/40">Contacto</span><span className="font-semibold text-white/80">{u.commercialPhone || '—'}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-white/40">Email</span><span className="font-semibold text-white/80 truncate ml-2">{u.email}</span></div>
                  </div>
                  <button onClick={() => setSelectedUser(u)} className="mt-5 w-full py-2.5 rounded-xl border border-white/20 text-white/70 font-bold text-xs hover:bg-white/10 hover:text-white hover:border-white/40 transition-all">{t('admin_partner_manage')}</button>
                </div>
              ))}
              {filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length === 0 && (
                <div className="col-span-3 bg-[#0F1729] rounded-3xl p-16 text-center border border-[#1E2A3B]">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck size={28} className="text-white/20" /></div>
                  <p className="text-white/40">Nenhum parceiro estratégico registado.</p>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {[t('admin_products'), t('admin_categories'), t('profile_price_mzn'), t('profile_active_stock'), t('admin_table_actions')].map((h, i) => (
                        <th key={h} className={`py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => {
                      const cat = categories.find((c: any) => c.id === p.categoryId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"><img src={p.images[0]} className="w-full h-full object-cover" /></div>
                              <div>
                                <p className="font-bold text-sm text-[#1C1C1C]">{p.name}</p>
                                <p className="text-[10px] text-gray-400">{p.producerName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6"><span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-semibold">{cat?.icon} {cat?.name || 'Geral'}</span></td>
                          <td className="py-4 px-6"><p className="font-bold text-sm text-[#1C1C1C]">{p.price.toLocaleString()} <span className="text-gray-400 font-normal">MZN</span></p></td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : p.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                              {p.stock} {p.unit}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button className="opacity-0 group-hover:opacity-100 p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all"><XCircle size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {products.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-gray-400 text-sm">Nenhum produto no catálogo.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {categories.map((c: any) => (
                <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#2E7D32]/20 transition-all group flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#1C1C1C]">{c.name}</p>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">Ativa</span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 bg-gray-50 text-gray-400 hover:text-[#2E7D32] rounded-xl transition-all"><Settings size={15} /></button>
                </div>
              ))}
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {['ID', t('admin_table_date'), t('admin_table_total'), t('profile_status'), t('admin_table_actions')].map((h, i) => (
                        <th key={h} className={`py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-sm text-[#1C1C1C]">{o.id}</td>
                        <td className="py-4 px-6 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('pt-MZ')}</td>
                        <td className="py-4 px-6"><p className="font-bold text-sm text-[#1C1C1C]">{o.total.toLocaleString()} <span className="text-gray-400 font-normal text-xs">MZN</span></p></td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${o.status === 'entregue' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${o.status === 'entregue' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{o.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right"><button className="p-2 text-gray-400 hover:text-[#2E7D32] hover:bg-emerald-50 rounded-xl transition-colors"><Eye size={15} /></button></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-gray-400 text-sm">{t('admin_no_orders')}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LOGISTICS */}
          {activeTab === 'logistics' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: t('admin_log_pickup_delivery'), value: deliveryRequests.length, gradient: 'from-[#1A3A5C] to-[#0F2340]', icon: <Layers size={20} /> },
                  { label: t('admin_log_transit'), value: deliveryRequests.filter(r => r.status === DeliveryStatus.EM_ROTA).length, gradient: 'from-slate-600 to-slate-700', icon: <Truck size={20} /> },
                  { label: t('admin_log_finished'), value: deliveryRequests.filter(r => r.status === DeliveryStatus.ENTREGUE).length, gradient: 'from-[#1B5E20] to-[#0D3B12]', icon: <CheckCircle size={20} /> },
                ].map(s => (
                  <div key={s.label} className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${s.gradient} shadow-lg`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative z-10">
                      <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">{s.icon}</div>
                      <h4 className="text-2xl font-bold">{s.value}</h4>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50"><h4 className="font-bold text-[#1C1C1C] flex items-center gap-2"><Navigation2 size={16} className="text-[#2E7D32]" /> {t('admin_log_global_routes')}</h4></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {[t('admin_guide'), t('admin_origin_destination'), t('admin_status'), t('admin_details')].map((h, i) => (
                          <th key={h} className={`py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {deliveryRequests.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-sm text-[#1C1C1C]">{r.id}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-red-500">📍</span><span className="text-gray-600 truncate max-w-[120px]">{r.pickup_address}</span>
                              <span className="text-gray-300">→</span>
                              <span className="text-emerald-500">🏁</span><span className="text-gray-600 truncate max-w-[120px]">{r.delivery_address}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${r.status === DeliveryStatus.ENTREGUE ? 'bg-emerald-50 text-emerald-700' : r.status === DeliveryStatus.CANCELADO ? 'bg-red-50 text-red-700' : r.status === DeliveryStatus.EM_ROTA ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.status === DeliveryStatus.ENTREGUE ? 'bg-emerald-500' : r.status === DeliveryStatus.EM_ROTA ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`} />{r.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => setSelectedDelivery(r)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"><Eye size={15} /></button>
                          </td>
                        </tr>
                      ))}
                      {deliveryRequests.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400 text-sm">Nenhuma rota registada.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{t('admin_filter_province')}</label>
                  <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] outline-none text-sm font-medium bg-white">
                    <option value="">{t('admin_pdf_all')}</option>
                    {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={generatePDF} className="flex items-center gap-2 bg-[#1B5E20] hover:bg-[#0D3B12] text-white px-5 py-3 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(27,94,32,0.3)] transition-all active:scale-95">
                    <FileText size={16} /> {t('admin_pdf_btn')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: t('admin_stats_total'), value: filteredUsers.length, icon: <Users size={20} />, gradient: 'from-blue-500 to-indigo-600' },
                  { label: t('admin_sales_volume'), value: `${filteredOrders.reduce((s, o) => s + o.total, 0).toLocaleString()} MZN`, icon: <TrendingUp size={20} />, gradient: 'from-emerald-500 to-teal-600' },
                  { label: t('admin_cumulative_commission'), value: `${filteredOrders.reduce((s, o) => s + (o.commission || 0), 0).toLocaleString()} MZN`, icon: <DollarSign size={20} />, gradient: 'from-purple-500 to-violet-600' },
                ].map(s => (
                  <div key={s.label} className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${s.gradient} shadow-lg`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative z-10">
                      <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">{s.icon}</div>
                      <h4 className="text-2xl font-bold">{s.value}</h4>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLACEHOLDER TABS */}
          {(['ratings', 'settings'] as TabId[]).includes(activeTab) && (
            <div className="min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-100 animate-in fade-in">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-2xl">🚧</div>
              <h3 className="font-bold text-[#1C1C1C]">{t('admin_dev_module')}</h3>
              <p className="text-sm text-gray-400 max-w-sm text-center mt-2">{t('admin_dev_module_desc')}</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: USER PROFILE */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-xl">{selectedUser.fullName[0]}</div>
                <div>
                  <h3 className="font-bold text-lg leading-none">{selectedUser.fullName}</h3>
                  <p className="text-white/70 text-xs mt-1">{selectedUser.role} · {selectedUser.status}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[['Email', selectedUser.email], ['Telefone', selectedUser.phone || '—'], ['Província', selectedUser.province || 'N/A'], ['Localidade', selectedUser.localidade || selectedUser.district || 'N/A']].map(([l, v]) => (
                  <div key={l} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-sm font-semibold text-[#1C1C1C] truncate">{v}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                {selectedUser.isApproved ? (
                  <div className="py-3 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle size={16} /> Conta Aprovada
                  </div>
                ) : (
                  <button id="btn-aprovar-registo" onClick={async () => {
                    const btn = document.getElementById('btn-aprovar-registo') as HTMLButtonElement;
                    if (btn) { btn.textContent = 'A aprovar...'; btn.disabled = true; }
                    const { error } = await supabase.rpc('approve_profile', { target_user_id: selectedUser.id });
                    if (error) { if (btn) { btn.textContent = '✕ Erro — tente novamente'; btn.disabled = false; } return; }
                    const updated = { ...selectedUser, isApproved: true, status: 'active' as const };
                    mockDb.saveUser(updated);
                    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
                    setSelectedUser(updated);
                  }} className="w-full py-3 bg-[#1B5E20] text-white font-bold rounded-2xl text-sm shadow-[0_4px_12px_rgba(27,94,32,0.3)] hover:bg-[#0D3B12] transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Aprovar Registo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ENTITY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('admin_manual_reg')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            {activeTab === 'products' && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Nome do Produto" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex: Batata Reno" />
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Categoria</label>
                    <select required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] outline-none text-sm font-medium bg-white" value={newProduct.categoryId} onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <InputField label={t('profile_price_mzn')} type="number" required value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                  <InputField label="Unidade" required value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} placeholder="Kg, Saco" />
                  <InputField label="Stock" type="number" required value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Imagem do Produto</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-300" />}
                    </div>
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewProduct({ ...newProduct, image: r.result as string }); r.readAsDataURL(f); } }} className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-[#1B5E20] text-white rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(27,94,32,0.3)] hover:bg-[#0D3B12] transition-all">{t('admin_prod_publish_btn')}</button>
              </form>
            )}

            {activeTab === 'categories' && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <InputField label={t('admin_cat_name')} required value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Ex: Hortícolas Frescos" />
                <InputField label={t('admin_cat_icon')} required value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="Ex: 🍎, 🥦" />
                <button type="submit" className="w-full py-3.5 bg-[#1B5E20] text-white rounded-xl font-bold text-sm">Criar Categoria</button>
              </form>
            )}

            {activeTab === 'partners' && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <InputField label="Nome da Organização" required value={newPartner.entityName} onChange={e => setNewPartner({ ...newPartner, entityName: e.target.value })} placeholder="Agência de Cooperação" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Email Corporativo" type="email" required value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} />
                  <InputField label="Contacto Oficial" required value={newPartner.phone} onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })} />
                </div>
                <InputField label="Localização / Sede" required value={newPartner.location} onChange={e => setNewPartner({ ...newPartner, location: e.target.value })} placeholder="Província de Operação" />
                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all">{t('admin_partner_reg_btn')}</button>
              </form>
            )}

            {(['users', 'suppliers', 'buyers', 'transporters', 'dashboard'] as TabId[]).includes(activeTab) && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <InputField label="Nome Completo" required value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Email" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                  <InputField label="Telefone" required value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Província" required value={newUser.province} onChange={e => setNewUser({ ...newUser, province: e.target.value })} />
                  <InputField label="Distrito" required value={newUser.district} onChange={e => setNewUser({ ...newUser, district: e.target.value })} />
                </div>
                {activeTab === 'users' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Papel</label>
                    <select required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] outline-none text-sm font-medium bg-white" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                      <option value={UserRole.SELLER}>Fornecedor/Vendedor</option>
                      <option value={UserRole.BUYER}>Comprador</option>
                      <option value={UserRole.TRANSPORTER}>Transportador</option>
                    </select>
                  </div>
                )}
                <button type="submit" className="w-full py-3.5 bg-[#1B5E20] text-white rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(27,94,32,0.3)] hover:bg-[#0D3B12] transition-all">{t('admin_user_add_btn')}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DELIVERY DETAILS */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Guia: {selectedDelivery.id}</h3>
                <p className="text-white/70 text-xs mt-0.5">{new Date(selectedDelivery.created_at).toLocaleString('pt-MZ')}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <DeliveryStatusTimeline status={selectedDelivery.status} />
              <div className="grid grid-cols-2 gap-6">
                {[{ label: 'Origem (Recolha)', address: selectedDelivery.pickup_address, name: selectedDelivery.pickup_name, phone: selectedDelivery.pickup_phone, color: 'red' }, { label: 'Destino (Entrega)', address: selectedDelivery.delivery_address, name: selectedDelivery.delivery_name, phone: selectedDelivery.delivery_phone, color: 'emerald' }].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">{s.label}</p>
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={14} className={`text-${s.color}-500 mt-0.5 flex-shrink-0`} />
                      <p className="font-bold text-sm text-[#1C1C1C]">{s.address}</p>
                    </div>
                    <p className="text-xs text-gray-500 pl-5">{s.name} · {s.phone}</p>
                  </div>
                ))}
              </div>
              {selectedDelivery.notes && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{selectedDelivery.notes}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { if (window.confirm(t('admin_cancel_delivery') + '?')) { mockDb.updateDeliveryStatus(selectedDelivery.id, DeliveryStatus.CANCELADO); setSelectedDelivery(null); fetchOperationalData(); } }} className="flex-1 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors border border-red-100">{t('admin_cancel_delivery')}</button>
                <button onClick={() => setSelectedDelivery(null)} className="flex-1 py-3 bg-[#1B5E20] text-white text-sm font-bold rounded-2xl shadow-[0_4px_12px_rgba(27,94,32,0.3)]">{t('profile_close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
