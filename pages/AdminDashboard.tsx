import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, UserRole, EntityType, Order, ActivityLog, LogType } from '../types';
import { MOZ_GEOGRAPHY, PLATFORM_COMMISSION_RATE, MOCK_USERS, CATEGORIES } from '../constants';
import { mockDb } from '../lib/mock_db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrendingUp, Users, ShoppingBag, PieChart, ShieldCheck, LayoutDashboard, UserCheck, Truck, Package, Folder, Star, Settings, FileText, CheckCircle, Ban, Store, MapPin, Eye, XCircle, ArrowRight } from 'lucide-react';
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, user }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'suppliers' | 'buyers' | 'transporters' | 'products' | 'categories' | 'orders' | 'logistics' | 'ratings' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: UserRole.BUYER,
    province: '',
    district: '',
    entityType: EntityType.INDIVIDUAL
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    unit: 'Kg',
    categoryId: '1',
    description: '',
    isDried: false,
    image: ''
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('agro_suste_categories');
    return saved ? JSON.parse(saved) : CATEGORIES;
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📦'
  });

  const [newPartner, setNewPartner] = useState({
    entityName: '',
    email: '',
    phone: '',
    location: ''
  });

  // Filtros de Relatorio
  const [filterProvince, setFilterProvince] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'general' | 'weekly' | 'monthly'>('general');

  // Dashboard Access Guard
  const isAuthorized = user && [
    UserRole.ADMIN,
    UserRole.STRATEGIC_PARTNER
  ].includes(user.role as UserRole);

  const isAdmin = user && user.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isAuthorized) return;

    fetchOperationalData();

    // Realtime: reflecte automaticamente qualquer mudanca na tabela profiles
    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchOperationalData();
      })
      .subscribe();

    // Realtime: reflecte mudancas em products
    const productsChannel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchOperationalData();
      })
      .subscribe();

    return () => {
      profilesChannel.unsubscribe();
      productsChannel.unsubscribe();
    };
  }, [isAuthorized]);

  const handleLogout = async () => {
    if (user?.id) {
      await supabase.from('profiles').update({ status: 'offline' }).eq('id', user.id);
    }
    localStorage.removeItem('mock_user');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleBackHome = async () => {
    await handleLogout();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-MZ');

    // Header
    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRO-SUSTE MOÇAMBIQUE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(t('admin_pdf_footer'), 105, 30, { align: 'center' });

    // Report Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`${t('admin_pdf_type')}: ${reportType.toUpperCase()}`, 14, 50);
    doc.text(`${t('admin_pdf_date')}: ${timestamp}`, 14, 56);
    doc.text(`${t('admin_pdf_prov_label')}: ${filterProvince || t('admin_pdf_all')}`, 14, 62);

    // Stats Table
    const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const statsData = [
      [t('admin_stats_total'), filteredUsers.length.toString()],
      [t('admin_stats_sellers'), filteredUsers.filter(u => u.role === UserRole.SELLER).length.toString()],
      [t('admin_stats_buyers'), filteredUsers.filter(u => u.role === UserRole.BUYER).length.toString()],
      [t('admin_stats_transporters'), filteredUsers.filter(u => u.role === UserRole.TRANSPORTER).length.toString()],
      [t('admin_stats_partners'), filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length.toString()],
      [`${t('admin_sales_volume')} (MZN)`, salesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      [`${t('admin_cumulative_commission')} (MZN)`, filteredOrders.reduce((sum, o) => sum + (o.commission || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      [t('admin_transactions'), filteredOrders.length.toString()]
    ];

    (doc as any).autoTable = autoTable;
    autoTable(doc, {
      startY: 70,
      head: [[t('admin_pdf_indicator'), t('admin_pdf_value')]],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [27, 94, 32] },
    });

    // Users Table
    const tableData = users.map(u => [
      u.fullName,
      u.role,
      u.province,
      u.district,
      u.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [[t('admin_pdf_name'), t('admin_pdf_role'), t('admin_pdf_province'), t('admin_pdf_district'), t('admin_pdf_status')]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [67, 160, 71] },
      styles: { fontSize: 8 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${t('admin_reports_finance')} - Page ${i} of ${pageCount} • AgroSuste`, 105, 285, { align: 'center' });
    }

    doc.save(`Relatorio_AgroSuste_${reportType}_${new Date().getTime()}.pdf`);
  };

  const handleSendEmail = () => {
    const email = prompt(t('admin_email_prompt') || 'Digite o endereço de email para onde deseja enviar o relatório:');
    if (email && email.includes('@')) {
      alert(`${t('admin_email_success')} ${email} ! `);
    } else if (email) {
      alert(t('admin_invalid_email'));
    }
  };

  const generateUserPDF = (user: User) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(t('admin_pdf_user_title'), 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`ID: ${user.id} `, 105, 30, { align: 'center' });

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('admin_pdf_user_data'), 14, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const details = [
      [t('admin_pdf_full_name'), user.fullName],
      [t('admin_pdf_email'), user.email],
      [t('admin_pdf_phone'), user.phone],
      [t('admin_pdf_phone_comm'), user.commercialPhone],
      [t('admin_pdf_role_sys'), user.role],
      [t('admin_pdf_entity_type'), user.entityType || 'Individual'],
      [t('admin_pdf_entity_name'), user.entityName || 'N/A'],
      [t('admin_pdf_country'), user.country],
      [t('admin_pdf_province'), user.province],
      [t('admin_pdf_district'), user.district],
      [t('admin_pdf_posto'), user.posto || 'Sede'],
      [t('admin_pdf_localidade'), user.localidade || 'Centro'],
      [t('admin_pdf_status_acc'), user.status.toUpperCase()],
      [t('admin_pdf_balance'), `${user.balance.toLocaleString()} MZN`]
    ];

    autoTable(doc, {
      startY: 60,
      body: details,
      theme: 'plain',
      styles: { cellPadding: 2, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    // Verification Seal
    doc.setDrawColor(27, 94, 32);
    doc.setLineWidth(0.5);
    doc.circle(170, 250, 20);
    doc.setFontSize(6);
    doc.text(t('admin_pdf_verified'), 170, 248, { align: 'center' });
    doc.text('AGRO-SUSTE', 170, 252, { align: 'center' });

    doc.save(`Ficha_${user.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  const fetchOperationalData = async () => {
    setLoading(true);
    let supabaseUsers: User[] = [];

    try {
      // Usa RPC com SECURITY DEFINER — contorna RLS completamente
      // Devolve TODOS os perfis sem restrições de políticas
      const { data: allRows, error: rpcError } = await supabase.rpc('get_all_profiles');

      if (rpcError) throw rpcError;

      if (allRows && allRows.length > 0) {
        supabaseUsers = allRows.map((u: any): User => ({
          id: u.id,
          email: u.email || '',
          fullName: u.full_name || 'Utilizador',
          phone: u.phone || '',
          commercialPhone: u.commercial_phone || u.phone || '',
          country: u.country || 'Moçambique',
          province: u.province,
          district: u.district,
          posto: u.posto_administrativo,
          localidade: u.localidade_bairro,
          role: (u.role as UserRole) || UserRole.BUYER,
          entityType: (u.entity_type as EntityType) || EntityType.INDIVIDUAL,
          entityName: u.entity_name,
          status: (u.status as 'active' | 'inactive' | 'blocked' | 'online' | 'offline') || 'offline',
          isApproved: u.isapproved ?? false,
          balance: Number(u.balance) || 0,
          linkedAccounts: Array.isArray(u.linked_accounts) ? u.linked_accounts : [],
          logo: u.logo,
        }));
      }
    } catch (e: any) {
      console.error('[AdminDashboard] Erro ao buscar profiles:', e?.message);
    }

    // Merge com mockDb local (sem duplicar)
    const localUsers = mockDb.getUsers();
    const merged = [...supabaseUsers];
    localUsers.forEach(lu => {
      if (!merged.find(u => u.id === lu.id || (lu.email && u.email === lu.email))) {
        merged.push(lu);
      }
    });

    setUsers(merged.length > 0 ? merged : MOCK_USERS);
    setActivityLogs(mockDb.getLogs());

    const savedOrders = localStorage.getItem('agro_suste_orders');
    if (savedOrders) {
      try { setOrders(JSON.parse(savedOrders)); } catch {}
    }

    setLoading(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (categories.length + 1).toString();
    const cat = { id, name: newCategory.name, icon: newCategory.icon, is_active: true };
    const updated = [...categories, cat];
    setCategories(updated);
    localStorage.setItem('agro_suste_categories', JSON.stringify(updated));
    setNewCategory({ name: '', icon: '📦' });
    setShowAddModal(false);
    alert('Categoria adicionada com sucesso!');
  };

  const handleDeleteProduct = (prodId: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este produto?')) {
      // In a real app, this would delete from DB. In mock, we rely on the parent state.
      // But we can simulate a refresh by having the parent handle the delete if we had a prop.
      // For now, let's at least log it and alert.
      alert('Funcionalidade de eliminar produto em processamento...');
    }
  };

  const handleAddNewEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'products') {
      const id = `admin-prod-${Date.now()}`;
      const prodToSave = {
        id,
        producerId: user?.id || 'admin',
        producerName: user?.fullName || 'AgroSuste',
        categoryId: newProduct.categoryId,
        name: newProduct.name,
        description: newProduct.description || newProduct.name,
        price: Number(newProduct.price),
        unit: newProduct.unit,
        stock: Number(newProduct.stock),
        images: [newProduct.image || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80'],
        isDried: newProduct.isDried,
        isAdminProduct: true,
        createdAt: new Date().toISOString()
      };
      // 1. Persistir no mockDb (localStorage) — isto aciona o listener no App.tsx
      mockDb.saveProduct(prodToSave);
      // 2. Propagar para o estado global via callback
      if (onAddProduct) onAddProduct(prodToSave);
      // 3. Registar actividade
      mockDb.logActivity({
        userId: user?.id || 'admin',
        userName: user?.fullName || 'Admin',
        userRole: UserRole.ADMIN,
        type: LogType.PRODUCT_ADD,
        description: `Admin publicou produto: ${prodToSave.name} (${prodToSave.unit}) — ${prodToSave.price} MZN`
      });
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', unit: 'Kg', categoryId: '1', description: '', isDried: false, image: '' });
      alert(`✅ Produto "${prodToSave.name}" publicado com sucesso no catálogo!`);
      return;
    } else if (activeTab === 'categories') {
        handleAddCategory(e);
        return;
    } else if (activeTab === 'partners') {
      const id = `admin-part-${Date.now()}`;
      const partner = {
        id, email: newPartner.email, fullName: newPartner.entityName, phone: newPartner.phone, commercialPhone: newPartner.phone,
        role: UserRole.STRATEGIC_PARTNER, entityType: EntityType.INSTITUTION, entityName: newPartner.entityName,
        district: newPartner.location, province: newPartner.location, country: 'Moçambique', status: 'active', isApproved: true, balance: 0, linkedAccounts: []
      };
      mockDb.saveUser(partner as any);
      mockDb.logActivity({
        userId: user?.id || 'admin',
        userName: user?.fullName || 'Admin',
        userRole: UserRole.ADMIN,
        type: LogType.OTHER,
        description: `Admin registou novo parceiro: ${partner.entityName}`
      });
      setUsers(prev => [...prev, partner as any]);
      setShowAddModal(false);
      setNewPartner({ entityName: '', email: '', phone: '', location: '' });
    } else {
      const id = `admin-reg-${Date.now()}`;
      let fixedRole = newUser.role;
      if (activeTab === 'suppliers') fixedRole = UserRole.SELLER;
      if (activeTab === 'buyers') fixedRole = UserRole.BUYER;
      if (activeTab === 'transporters') fixedRole = UserRole.TRANSPORTER;
      const userToSave: User = {
        ...newUser,
        role: fixedRole,
        id, commercialPhone: newUser.phone, country: 'Moçambique', status: 'active', isApproved: true, balance: 0, linkedAccounts: [], entityName: newUser.fullName
      };
      mockDb.saveUser(userToSave);
      mockDb.logActivity({
        userId: user?.id || 'admin',
        userName: user?.fullName || 'Admin',
        userRole: UserRole.ADMIN,
        type: LogType.SIGNUP,
        description: `Admin registou manualmente o utilizador: ${userToSave.fullName} (${fixedRole})`
      });
      setUsers(prev => [...prev, userToSave]);
      setShowAddModal(false);
      setNewUser({ email: '', fullName: '', phone: '', role: UserRole.BUYER, province: '', district: '', entityType: EntityType.INDIVIDUAL });
    }
    alert('✅ Entidade registada com sucesso!');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Tem a certeza que deseja eliminar o utilizador ${userName}? Esta acção é irreversível.`)) {
      mockDb.deleteUser(userId);
      mockDb.logActivity({
        userId: user?.id || 'admin',
        userName: user?.fullName || 'Admin',
        userRole: UserRole.ADMIN,
        type: LogType.OTHER,
        description: `Administrador eliminou o utilizador ${userName}.`
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const stats = {
    total: users.length,
    sellers: users.filter(u => u.role === UserRole.SELLER).length,
    buyers: users.filter(u => u.role === UserRole.BUYER).length,
    transporters: users.filter(u => u.role === UserRole.TRANSPORTER).length,
    extensionists: users.filter(u => u.role === UserRole.EXTENSIONIST).length,
    partners: users.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length,
  };

  const filteredUsers = users.filter(u => {
    if (filterProvince && u.province !== filterProvince) return false;
    return true;
  });

  const filteredOrders = orders.filter(o => {
    if (filterProvince && o.province !== filterProvince) return false;

    const orderDate = new Date(o.createdAt);
    if (reportType === 'monthly') {
      if (orderDate.getMonth() + 1 !== filterMonth || orderDate.getFullYear() !== filterYear) return false;
    }
    // ImplementaÃƒÂ§ÃƒÂ£o de filtro semanal poderia vir aqui

    return true;
  });

  const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  // ComissÃƒÂ£o acumulada GLOBAL: recalculada dinamicamente de TODAS as compras (ignora campo stale)
  const totalPlatformCommission = orders.reduce((sum, o) => sum + (o.total * PLATFORM_COMMISSION_RATE), 0);

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center space-y-8">
        <div className="w-40 h-40 bg-rose-50 rounded-[4rem] flex items-center justify-center text-7xl text-rose-500 shadow-inner">Ã°Å¸â€â€™</div>
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold text-gray-900  ">{t('hero_cta_auth')}</h2>
          <p className="text-gray-400 font-bold  text-[10px]  max-w-md mx-auto">{t('admin_no_records')}</p>
        </div>
        <a href="#/auth" className="bg-[#2E5C4E] text-white px-12 py-6 rounded-3xl font-semibold text-[10px]   shadow-2xl hover:scale-105 transition-all">{t('admin_login_manager')}</a>
      </div>
    );
  }


  const renderSidebarItem = (id: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-6 py-4 transition-all border-l-4 ${activeTab === id ? 'bg-[#F5F5F0] border-[#2E7D32] text-[#2E7D32]' : 'border-transparent text-[#6D6D6D] hover:bg-gray-50'}`}
    >
      <div className={`transition-transform duration-300 ${activeTab === id ? 'scale-110' : ''}`}>{icon}</div>
      <span className="font-semibold text-[13px]">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F5F5F0] font-inter overflow-hidden">
      {/* SIDEBAR FIXED */}
      <aside className="w-[260px] bg-white border-r border-[#E0E0E0] hidden md:flex flex-col h-full shrink-0 shadow-sm z-10">
        <div className="h-[80px] border-b border-[#E0E0E0] flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" color="#2E7D32" />
            <span className="font-poppins font-bold text-lg text-[#1C1C1C] tracking-tight">AgroSuste <span className="text-[#2E7D32]">{language === 'pt' ? 'Admin' : 'Admin'}</span></span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hidden-scroll py-6 space-y-2">
          {renderSidebarItem('dashboard', <LayoutDashboard size={20} />, t('admin_dashboard'))}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_profiles')}</p></div>
          {renderSidebarItem('users', <Users size={20} />, t('admin_users'))}
          {renderSidebarItem('suppliers', <Store size={20} />, t('admin_suppliers'))}
          {renderSidebarItem('buyers', <ShoppingBag size={20} />, t('admin_buyers'))}
          {renderSidebarItem('transporters', <Truck size={20} />, t('admin_transporters'))}
          {renderSidebarItem('partners', <ShieldCheck size={20} />, t('admin_partners_nav'))}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_ops_title_nav')}</p></div>
          {renderSidebarItem('products', <Package size={20} />, t('admin_products'))}
          {renderSidebarItem('categories', <Folder size={20} />, t('admin_categories'))}
          {renderSidebarItem('orders', <FileText size={20} />, t('admin_orders'))}
          {renderSidebarItem('logistics', <TrendingUp size={20} />, t('admin_logistics_nav'))}
          {renderSidebarItem('ratings', <Star size={20} />, t('admin_ratings'))}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_system')}</p></div>
          {renderSidebarItem('reports', <PieChart size={20} />, t('admin_reports_finance'))}
        </div>
        <div className="p-6 border-t border-[#E0E0E0] space-y-4">
          <button onClick={handleBackHome} className="w-full flex justify-center items-center gap-2 py-3 bg-gray-50 border border-gray-100 text-[#6D6D6D] hover:bg-gray-100 hover:text-[#1C1C1C] transition-colors rounded-xl font-bold text-[13px]">
            {t('admin_back_home')}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2E7D32]/10 rounded-full flex items-center justify-center text-[#2E7D32] font-bold text-sm">
              {user?.fullName?.[0] || 'A'}
            </div>
            <div>
              <p className="text-xs font-bold text-[#1C1C1C]">{user?.fullName || 'Administrador'}</p>
              <p className="text-[10px] text-[#A0A0A0]">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#E0E0E0] h-[70px] flex items-center justify-between px-6 z-[100] shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7" color="#2E7D32" />
          <span className="font-bold text-sm text-[#1C1C1C]">AgroSuste <span className="text-[#2E7D32]">{t('role_admin')}</span></span>
        </div>
        <div className="flex gap-2">
           <button
             onClick={handleBackHome}
             className="flex items-center gap-2 px-3 py-2 bg-[#2E7D32]/5 text-[#2E7D32] rounded-xl font-bold text-[11px] transition-all active:scale-95"
           >
             <LayoutDashboard size={18} />
             <span>{t('admin_back_home')}</span>
           </button>
           <NotificationBell userId={user?.id} />
           <button onClick={handleLogout} className="p-2 bg-red-50 rounded-lg text-red-600"><XCircle size={20} /></button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto hidden-scroll p-8 lg:p-12 h-full bg-[#F5F5F0] mt-[70px] md:mt-0">

        {/* HEADER TOP */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 pb-6 border-b border-[#E0E0E0]/60 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-poppins font-bold text-[#1C1C1C] capitalize">
              {t(`admin_${activeTab}` as any) || activeTab.replace('_', ' ')}
            </h1>
            <p className="text-sm text-[#6D6D6D] mt-1">{t('admin_subtitle')}</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-[0_8px_20px_rgba(46,125,50,0.2)] transition-all active:scale-95 flex items-center gap-2 w-full md:w-auto justify-center">
              {t('admin_add_new')}
            </button>
          )}
        </header>

        {/* DASHBOARD TAB OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('admin_total_users')}</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : stats.total}</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Package size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('admin_active_products')}</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : products.length}</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FileText size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('admin_orders_count')}</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : orders.length}</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><ShieldCheck size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">{t('admin_verified_suppliers')}</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : stats.sellers}</h3>
              </div>
            </div>

            {/* Actividade Recente Preview */}
            <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-[#E0E0E0]/50 flex justify-between items-center">
                <h4 className="font-poppins font-bold text-[#1C1C1C] text-lg">{t('admin_recent_activity')}</h4>
                <button className="text-sm font-semibold text-[#2E7D32] hover:underline" onClick={fetchOperationalData}>{t('profile_update')}</button>
              </div>
              <div className="p-8">
                {activityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex gap-4 items-start mb-6 last:mb-0">
                    <div className={`p-2 rounded-full mt-1 ${log.type === LogType.SIGNUP ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      <ArrowRight size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-[#1C1C1C]"><span className="font-bold">{log.userName}</span>: {log.description}</p>
                      <span className="text-xs text-[#A0A0A0] font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {activityLogs.length === 0 && !loading && <span className="text-[#A0A0A0] text-sm py-4 block">{t('admin_no_activity')}</span>}
              </div>
            </div>
          </div>
        )}

        {/* USERS / SUPPLIERS / BUYERS / TRANSPORTERS TAB */}
        {['users', 'suppliers', 'buyers', 'transporters'].includes(activeTab) && (
          <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E0E0E0]">
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_table_id')}</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_table_role')}</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_table_contact')}</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_table_status')}</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">{t('admin_table_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]/50">
                  {users
                    .filter(u => {
                      if (activeTab === 'users') return true;
                      if (activeTab === 'suppliers') return u.role === UserRole.SELLER;
                      if (activeTab === 'buyers') return u.role === UserRole.BUYER;
                      if (activeTab === 'transporters') return u.role === UserRole.TRANSPORTER;
                      return true;
                    })
                    .map(u => (
                      <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-sm">
                              {u.fullName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#1C1C1C]">{u.fullName}</p>
                              <p className="text-xs text-[#A0A0A0]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-3 py-1 rounded-md bg-gray-100 text-[#4B5563] text-xs font-semibold capitalize">{u.role}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-medium text-[#1C1C1C]">{u.commercialPhone || u.phone}</p>
                          <p className="text-[10px] text-[#A0A0A0] uppercase">{u.province || 'Moz'}</p>
                        </td>
                        <td className="py-4 px-6">
                          {u.status === 'online' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                              <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md">Online</span>
                            </div>
                          ) : u.status === 'blocked' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                              <span className="text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-md">{t('admin_blocked')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                              <span className="text-xs font-bold text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-md">Offline</span>
                            </div>
                          )}
                          {!u.isApproved && (
                            <span className="text-[10px] font-bold text-[#F59E0B] block mt-1">{t('admin_pending')}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedUser(u)} className="p-2 text-[#4B5563] hover:text-[#2E7D32] bg-white border border-[#E0E0E0] rounded-lg shadow-sm hover:border-[#2E7D32] transition-colors" title="Ver Perfil">
                              <UserCheck size={16} />
                            </button>
                            {isAdmin && u.id !== user?.id && (
                              <button onClick={() => handleDeleteUser(u.id, u.fullName)} className="p-2 text-[#4B5563] hover:text-[#EF4444] bg-white border border-[#E0E0E0] rounded-lg shadow-sm hover:border-[#EF4444] transition-colors" title="Remover">
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {users.length === 0 && !loading && (
                    <tr><td colSpan={5} className="py-12 text-center text-[#A0A0A0] text-sm">{t('admin_no_users')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PARTNERS TAB - EXISTING LOGIC BUT CLEANER UI */}
        {activeTab === 'partners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).map(u => (
              <div key={u.id} className="bg-white p-8 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:border-[#2E7D32] transition-colors relative flex flex-col group">
                <div className="absolute top-4 right-4"><span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-1 rounded-md">{t('admin_pdf_verified')}</span></div>
                <div className="w-16 h-16 rounded-xl border border-[#E0E0E0] flex items-center justify-center p-2 mb-4 bg-gray-50 flex-shrink-0">
                  {u.logo ? <img src={u.logo} alt={u.entityName} className="max-w-full max-h-full object-contain" /> : <ShieldCheck size={32} className="text-[#A0A0A0]" />}
                </div>
                <h4 className="font-poppins font-bold text-[#1C1C1C] text-lg mb-1">{u.entityName || u.fullName}</h4>
                <p className="text-xs text-[#6D6D6D] mb-4">{t('role_partner')} &bull; {u.location || u.district || 'Global'}</p>
                <div className="mt-auto pt-4 border-t border-[#E0E0E0]/50 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-[#A0A0A0]">{t('admin_card_phone')}</span><span className="font-medium text-[#1C1C1C]">{u.commercialPhone}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#A0A0A0]">{t('profile_email')}</span><span className="font-medium text-[#1C1C1C] truncate ml-2">{u.email}</span></div>
                </div>
                <button onClick={() => setSelectedUser(u)} className="mt-6 w-full py-2.5 rounded-xl border-2 border-[#2E5C4E] text-[#2E5C4E] font-bold text-xs hover:bg-[#2E5C4E] hover:text-white transition-colors">
                  {t('admin_partner_manage')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS TAB - EXISTING LOGIC PRESERVED */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 flex flex-wrap gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_filter_province')}</label>
                <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="w-full form-select bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold text-[#1C1C1C] outline-none hover:bg-gray-100 transition-colors">
                  <option value="">{t('admin_pdf_all')}</option>
                  {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* Outros filtros minguados para manter layout focado, mas mantendo a lÃ³gica de state intacta para uso futuro */}
              <div className="flex gap-4">
                <button onClick={generatePDF} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95">{t('admin_pdf_btn')}</button>
              </div>
            </div>
            {/* Old legacy tables were removed but PDF keeps working since logical states exist */}
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0E0E0] shadow-sm">
              <PieChart size={48} className="mx-auto text-[#A0A0A0] mb-4 opacity-50" />
              <h3 className="font-poppins text-xl font-bold text-[#1C1C1C] mb-2">{t('admin_tab_reports')}</h3>
              <p className="text-sm text-[#6D6D6D]">{t('admin_dev_module_desc')}</p>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden animate-in fade-in">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#F9FAFB] border-b border-[#E0E0E0]">
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_products')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_categories')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('profile_price_mzn')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('profile_active_stock')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">{t('admin_table_actions')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E0E0E0]/50">
                   {products.map(p => (
                     <tr key={p.id} className="hover:bg-[#F9FAFB]">
                       <td className="py-4 px-6">
                         <div className="flex items-center gap-3">
                           <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                           <span className="font-bold text-sm text-[#1C1C1C]">{p.name}</span>
                         </div>
                       </td>
                       <td className="py-4 px-6">
                         <span className="text-xs font-semibold text-[#4B5563]">{t(categories.find((c:any) => c.id === p.categoryId)?.name || 'Geral')}</span>
                       </td>
                       <td className="py-4 px-6 font-bold text-sm">{p.price.toLocaleString()} MZN</td>
                       <td className="py-4 px-6">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                           {p.stock} {p.unit}
                         </span>
                       </td>
                       <td className="py-4 px-6 text-right">
                         <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><XCircle size={18} /></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden animate-in fade-in">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#F9FAFB] border-b border-[#E0E0E0]">
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Ícone</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_categories')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('profile_status')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">{t('admin_table_actions')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E0E0E0]/50">
                   {categories.map((c: any) => (
                     <tr key={c.id} className="hover:bg-[#F9FAFB]">
                       <td className="py-4 px-6 text-2xl">{c.icon}</td>
                       <td className="py-4 px-6 font-bold text-sm text-[#1C1C1C]">{t(c.name)}</td>
                       <td className="py-4 px-6">
                         <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold">Ativa</span>
                       </td>
                       <td className="py-4 px-6 text-right">
                         <button className="text-gray-400 hover:text-[#2E7D32] transition-colors"><Settings size={18} /></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden animate-in fade-in">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#F9FAFB] border-b border-[#E0E0E0]">
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">ID</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_table_date')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_table_total')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('profile_status')}</th>
                     <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">{t('admin_table_actions')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E0E0E0]/50">
                   {orders.map(o => (
                     <tr key={o.id} className="hover:bg-[#F9FAFB]">
                       <td className="py-4 px-6 font-bold text-sm text-[#1C1C1C]">{o.id}</td>
                       <td className="py-4 px-6 text-xs text-[#6D6D6D]">{new Date(o.createdAt).toLocaleDateString()}</td>
                       <td className="py-4 px-6 font-bold text-sm">{o.total.toLocaleString()} MZN</td>
                       <td className="py-4 px-6">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.status === 'entregue' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                           {o.status}
                         </span>
                       </td>
                       <td className="py-4 px-6 text-right">
                         <button className="text-gray-400 hover:text-[#2E7D32] transition-colors"><Eye size={18} /></button>
                       </td>
                     </tr>
                   ))}
                   {orders.length === 0 && (
                     <tr><td colSpan={5} className="py-12 text-center text-[#A0A0A0] text-sm italic">{t('admin_no_orders')}</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* LOGISTICS TAB */}
        {activeTab === 'logistics' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('admin_log_pickup_delivery')}</p>
                 <h4 className="text-2xl font-bold">{deliveryRequests.length}</h4>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('admin_log_transit')}</p>
                 <h4 className="text-2xl font-bold text-blue-600">{deliveryRequests.filter(r => r.status === DeliveryStatus.EM_ROTA).length}</h4>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('admin_log_finished')}</p>
                 <h4 className="text-2xl font-bold text-green-600">{deliveryRequests.filter(r => r.status === DeliveryStatus.ENTREGUE).length}</h4>
               </div>
            </div>

            <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden">
               <div className="px-8 py-6 border-b border-[#E0E0E0]/50"><h4 className="font-poppins font-bold text-[#1C1C1C]">{t('admin_log_global_routes')}</h4></div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-[#F9FAFB] border-b border-[#E0E0E0]">
                       <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_guide')}</th>
                       <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_origin_destination')}</th>
                       <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{t('admin_status')}</th>
                       <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">{t('admin_details')}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#E0E0E0]/50">
                     {deliveryRequests.map(r => (
                       <tr key={r.id} className="hover:bg-[#F9FAFB]">
                         <td className="py-4 px-6 font-bold text-sm">{r.id}</td>
                         <td className="py-4 px-6">
                           <div className="flex flex-col gap-1">
                             <span className="text-xs text-gray-600"><span className="font-bold">📍 {t('admin_log_from')}:</span> {r.pickup_address}</span>
                             <span className="text-xs text-gray-600"><span className="font-bold">🏁 {t('admin_log_to')}:</span> {r.delivery_address}</span>
                           </div>
                         </td>
                         <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              r.status === DeliveryStatus.ENTREGUE ? 'bg-green-50 text-green-700' :
                              r.status === DeliveryStatus.CANCELADO ? 'bg-red-50 text-red-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>{r.status}</span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <button onClick={() => setSelectedDelivery(r)} className="p-2 text-[#2E7D32] hover:bg-green-50 rounded-lg transition-colors"><Eye size={16} /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {['ratings', 'settings'].includes(activeTab) && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-[20px] border border-[#E0E0E0]/50 border-dashed animate-in fade-in">
            <span className="text-4xl mb-4 opacity-30 px-4 py-2 bg-gray-100 rounded-2xl filter grayscale">🚧</span>
            <h3 className="text-lg font-bold text-[#1C1C1C]">{t('admin_dev_module')}</h3>
            <p className="text-sm text-[#A0A0A0] max-w-sm text-center mt-2">{t('admin_dev_module_desc')}</p>
          </div>
        )}

      </main>

      {/* EXISTING MODALS */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white border-b border-[#E0E0E0] p-6 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center font-bold text-xl">{selectedUser.fullName[0]}</div>
                <div>
                  <h3 className="text-xl font-poppins font-bold text-[#1C1C1C] leading-none">{selectedUser.fullName}</h3>
                  <p className="text-xs font-medium text-[#A0A0A0] mt-1">{selectedUser.role} &bull; {selectedUser.status}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-[#A0A0A0] hover:text-[#1C1C1C] transition-colors p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-[#E0E0E0]/50"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">Email</p><p className="text-sm font-semibold text-[#1C1C1C]">{selectedUser.email}</p></div>
                <div className="p-4 bg-gray-50 rounded-xl border border-[#E0E0E0]/50"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">Telefone Principal</p><p className="text-sm font-semibold text-[#1C1C1C]">{selectedUser.phone}</p></div>
                <div className="p-4 bg-gray-50 rounded-xl border border-[#E0E0E0]/50"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">ProvÃ­ncia</p><p className="text-sm font-semibold text-[#1C1C1C]">{selectedUser.province || 'N/A'}</p></div>
                <div className="p-4 bg-gray-50 rounded-xl border border-[#E0E0E0]/50"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">Localidade/Distrito</p><p className="text-sm font-semibold text-[#1C1C1C]">{selectedUser.localidade || selectedUser.district || 'N/A'}</p></div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#E0E0E0]">
                {selectedUser.isApproved ? (
                  <div className="flex-1 py-3 bg-[#10B981]/10 text-[#10B981] text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Já Aprovado ✔
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const btn = document.getElementById('btn-aprovar-registo');
                      if (btn) { btn.textContent = 'A aprovar...'; (btn as HTMLButtonElement).disabled = true; }
                      const { error: approveErr } = await supabase.rpc('approve_profile', { target_user_id: selectedUser.id });
                      if (approveErr) {
                        if (btn) { btn.textContent = '✕ Erro — tente novamente'; (btn as HTMLButtonElement).disabled = false; }
                        return;
                      }
                      const updated = { ...selectedUser, isApproved: true, status: 'active' as const };
                      mockDb.saveUser(updated);
                      mockDb.logActivity({
                        userId: user?.id || 'admin',
                        userName: user?.fullName || 'Admin',
                        userRole: UserRole.ADMIN,
                        type: LogType.SYSTEM,
                        description: `Registo aprovado: ${selectedUser.fullName} (${selectedUser.role})`
                      });
                      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
                      setSelectedUser(updated);
                    }}
                    id="btn-aprovar-registo"
                    className="flex-1 py-3 text-white text-sm font-bold rounded-xl bg-[#10B981] hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle size={16} /> Aprovar Registo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR ENTIDADE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-white border-b border-[#E0E0E0] p-6 flex justify-between items-center">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C1C]">{t('admin_manual_reg')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#A0A0A0] hover:text-[#1C1C1C] transition-colors p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>
            {/* CONDITIONAL FORMS FOR PRODUCTS */}
            {activeTab === 'products' && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Nome do Produto</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex: Batata Reno" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Categoria</label>
                    <select required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newProduct.categoryId} onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.icon} {t(c.name)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">{t('profile_price_mzn')}</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">{t('profile_unit')}</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} placeholder="Ex: Kg, Saco, Ton" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">{t('profile_active_stock')}</label>
                    <input type="number" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">{t('admin_prod_dried')}</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newProduct.isDried ? 'true' : 'false'} onChange={e => setNewProduct({ ...newProduct, isDried: e.target.value === 'true' })}>
                      <option value="false">{t('admin_prod_dried_no')}</option>
                      <option value="true">{t('admin_prod_dried_yes')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-2 block">{t('admin_prod_upload_img')}</label>
                  <div className="flex gap-4 items-center mb-4">
                    <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <Package size={24} className="text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#E8F5E9] file:text-[#2E7D32] hover:file:bg-[#C8E6C9] cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(46,125,50,0.2)] transition-all">{t('admin_prod_publish_btn')}</button>
                </div>
              </form>
            )}

            {/* CONDITIONAL FORM FOR CATEGORIES */}
            {activeTab === 'categories' && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">{t('admin_cat_name')}</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] outline-none text-sm font-medium" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Ex: Hortícolas Frescos" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">{t('admin_cat_icon')}</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] outline-none text-sm font-medium" value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="Ex: 🍎, 🥦, 🌾" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-[#2E7D32] text-white py-3.5 rounded-xl font-bold text-sm">Criar Categoria</button>
                </div>
              </form>
            )}

            {/* CONDITIONAL FORMS FOR STRATEGIC PARTNERS */}
            {activeTab === 'partners' && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Nome da Instituição/Organização</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newPartner.entityName} onChange={e => setNewPartner({ ...newPartner, entityName: e.target.value })} placeholder="Agência de Cooperação Internacional" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Email Corporativo</label>
                    <input type="email" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Contacto Oficial</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newPartner.phone} onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Sede/Localização Geográfica</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newPartner.location} onChange={e => setNewPartner({ ...newPartner, location: e.target.value })} placeholder="Província/Distrito de Operação" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(37,99,235,0.2)] transition-all">{t('admin_partner_reg_btn')}</button>
                </div>
              </form>
            )}

            {/* DEFAULT FOR USERS (BUYERS, SELLERS, TRANSPORTERS) */}
            {(activeTab === 'users' || activeTab === 'suppliers' || activeTab === 'buyers' || activeTab === 'transporters' || activeTab === 'dashboard') && (
              <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Nome Completo</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Email</label>
                    <input type="email" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Telefone Primário</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Província</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newUser.province} onChange={e => setNewUser({ ...newUser, province: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Distrito</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newUser.district} onChange={e => setNewUser({ ...newUser, district: e.target.value })} />
                  </div>
                </div>
                {activeTab === 'users' && (
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Tipo de Perfil Específico</label>
                    <select required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                      <option value={UserRole.SELLER}>Fornecedor/Vendedor</option>
                      <option value={UserRole.BUYER}>Comprador</option>
                      <option value={UserRole.TRANSPORTER}>Transportador</option>
                    </select>
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(46,125,50,0.2)] transition-all">{t('admin_user_add_btn')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DELIVERY DETAILS */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#2E7D32] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-poppins font-bold">Guia de Transporte: {selectedDelivery.id}</h3>
                <p className="text-xs opacity-80">Criado em {new Date(selectedDelivery.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="p-2 hover:bg-white/10 rounded-lg">✕</button>
            </div>
            <div className="p-8 space-y-8">
              <DeliveryStatusTimeline status={selectedDelivery.status} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[#A0A0A0] uppercase border-b pb-2">Origem (Recolha)</h5>
                  <div className="space-y-2">
                    <p className="font-bold flex items-center gap-2"><MapPin size={14} className="text-red-500" /> {selectedDelivery.pickup_address}</p>
                    <p className="text-xs text-[#6D6D6D]">{selectedDelivery.pickup_name} &bull; {selectedDelivery.pickup_phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[#A0A0A0] uppercase border-b pb-2">Destino (Entrega)</h5>
                  <div className="space-y-2">
                    <p className="font-bold flex items-center gap-2"><MapPin size={14} className="text-green-500" /> {selectedDelivery.delivery_address}</p>
                    <p className="text-xs text-[#6D6D6D]">{selectedDelivery.delivery_name} &bull; {selectedDelivery.delivery_phone}</p>
                  </div>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                  <Info size={16} className="text-yellow-700 shrink-0" />
                  <p className="text-xs text-yellow-800">{selectedDelivery.notes}</p>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => {
                    if(window.confirm(t('admin_cancel_delivery') + '?')) {
                      mockDb.updateDeliveryStatus(selectedDelivery.id, DeliveryStatus.CANCELADO);
                      setSelectedDelivery(null);
                      fetchOperationalData();
                    }
                  }}
                  className="flex-1 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                  {t('admin_cancel_delivery')}
                </button>
                <button onClick={() => setSelectedDelivery(null)} className="flex-1 py-3 bg-[#2E7D32] text-white text-sm font-bold rounded-xl shadow-md">
                  {t('profile_close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARROW ICON FIX */}
      <svg className="hidden">
        <defs>
          <symbol id="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </symbol>
        </defs>
      </svg>
    </div>
  );
};

export default AdminDashboard;
