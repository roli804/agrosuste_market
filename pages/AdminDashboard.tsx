import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole, EntityType, Order, ActivityLog, LogType } from '../types';
import { MOZ_GEOGRAPHY, PLATFORM_COMMISSION_RATE, MOCK_USERS } from '../constants';
import { mockDb } from '../lib/mock_db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrendingUp, Users, ShoppingBag, PieChart, ShieldCheck, LayoutDashboard, UserCheck, Truck, Package, Folder, Star, Settings, FileText, CheckCircle, Ban, Store } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import Logo from '../components/Logo';
interface AdminDashboardProps {
  products: any[];
  user: User | null;
  onAddProduct?: (p: any) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, user }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'suppliers' | 'buyers' | 'transporters' | 'products' | 'categories' | 'orders' | 'logistics' | 'ratings' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
    isDried: false
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
    if (isAuthorized) {
      fetchOperationalData();
    }
  }, [user, isAuthorized]);

  const handleLogout = async () => {
    localStorage.removeItem('mock_user');
    await supabase.auth.signOut();
    window.location.href = '/';
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
    doc.text('AGRO-SUSTE MOÃ‡AMBIQUE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('RELATÓRIO OFICIAL DE OPERAÇÕES • NÚCLEO CENTRAL', 105, 30, { align: 'center' });

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
      doc.text(`PÃ¡gina ${i} de ${pageCount} â€¢ ${t('admin_pdf_footer')} `, 105, 285, { align: 'center' });
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

    // 1. Fetch Users from Supabase
    let allUsers: User[] = [];
    try {
      const { data: dbUsers, error } = await supabase.from('profiles').select('*');
      if (!error && dbUsers && dbUsers.length > 0) {
        allUsers = dbUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name || 'Utilizador Oficial',
          phone: u.phone,
          commercialPhone: u.commercial_phone || u.phone,
          country: u.country || 'Moçambique',
          role: u.role as UserRole,
          entityType: u.entity_type as EntityType,
          entityName: u.entity_name,
          province: u.province,
          district: u.district,
          posto: u.posto_administrativo,
          localidade: u.localidade_bairro,
          status: u.status || 'active',
          isApproved: u.isApproved || false,
          balance: u.balance || 0,
          linkedAccounts: u.linked_accounts || []
        }));
      }
    } catch (e) {
      console.error("Erro ao procurar perfis no Supabase:", e);
    }

    // 2. Merge with Local Mock Users
    const localUsers = mockDb.getUsers();
    const finalMockUsers = localUsers.length > 0 ? localUsers : MOCK_USERS;

    const mergedUsers = [...allUsers];
    finalMockUsers.forEach(lu => {
      if (!mergedUsers.find(mu => mu.id === lu.id || (lu.email && mu.email === lu.email))) {
        mergedUsers.push(lu);
      }
    });

    setUsers(mergedUsers);
    setActivityLogs(mockDb.getLogs());

    const savedOrders = localStorage.getItem('agro_suste_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }

    setLoading(false);
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
        description: newProduct.description,
        price: Number(newProduct.price),
        unit: newProduct.unit,
        stock: Number(newProduct.stock),
        images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80'],
        isDried: newProduct.isDried
      };
      if (onAddProduct) onAddProduct(prodToSave);
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', unit: 'Kg', categoryId: '1', description: '', isDried: false });
    } else if (activeTab === 'partners') {
      const id = `admin-part-${Date.now()}`;
      const partner = {
        id, email: newPartner.email, fullName: newPartner.entityName, phone: newPartner.phone, commercialPhone: newPartner.phone,
        role: UserRole.STRATEGIC_PARTNER, entityType: EntityType.INSTITUTION, entityName: newPartner.entityName,
        district: newPartner.location, province: newPartner.location, country: 'Moçambique', status: 'active', isApproved: true, balance: 0, linkedAccounts: []
      };
      mockDb.saveUser(partner as any);
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
      setUsers(prev => [...prev, userToSave]);
      setShowAddModal(false);
      setNewUser({ email: '', fullName: '', phone: '', role: UserRole.BUYER, province: '', district: '', entityType: EntityType.INDIVIDUAL });
    }
    alert('Entidade registada com sucesso!');
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
        <a href="#/auth" className="bg-[#2E5C4E] text-white px-12 py-6 rounded-3xl font-semibold text-[10px]   shadow-2xl hover:scale-105 transition-all">Iniciar SessÃƒÂ£o como Gestor</a>
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
            <span className="font-poppins font-bold text-lg text-[#1C1C1C] tracking-tight">AgroSuste <span className="text-[#2E7D32]">Admin</span></span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hidden-scroll py-6 space-y-2">
          {renderSidebarItem('dashboard', <LayoutDashboard size={20} />, 'Dashboard')}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Gestao de Perfis</p></div>
          {renderSidebarItem('users', <Users size={20} />, 'Utilizadores')}
          {renderSidebarItem('suppliers', <Store size={20} />, 'Fornecedores')}
          {renderSidebarItem('buyers', <ShoppingBag size={20} />, 'Compradores')}
          {renderSidebarItem('transporters', <Truck size={20} />, 'Transportadores')}
          {renderSidebarItem('partners', <ShieldCheck size={20} />, 'Parceiros Estrategicos')}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Operacoes</p></div>
          {renderSidebarItem('products', <Package size={20} />, 'Produtos')}
          {renderSidebarItem('categories', <Folder size={20} />, 'Categorias')}
          {renderSidebarItem('orders', <FileText size={20} />, 'Pedidos')}
          {renderSidebarItem('logistics', <TrendingUp size={20} />, 'Logi­stica')}
          {renderSidebarItem('ratings', <Star size={20} />, 'Avaliacoes')}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Sistema</p></div>
          {renderSidebarItem('reports', <PieChart size={20} />, 'Relatorios Financeiros')}
        </div>
        <div className="p-6 border-t border-[#E0E0E0] space-y-4">
          <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 py-3 bg-gray-50 border border-gray-100 text-[#6D6D6D] hover:bg-gray-100 hover:text-[#1C1C1C] transition-colors rounded-xl font-bold text-[13px]">
            ← Voltar ao Ínicio
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto hidden-scroll p-8 lg:p-12 h-full bg-[#F5F5F0]">

        {/* HEADER TOP */}
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-[#E0E0E0]/60">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-[#1C1C1C] capitalize">
              {activeTab.replace('_', ' ')}
            </h1>
            <p className="text-sm text-[#6D6D6D] mt-1">Visao geral e gestao operacional do marketplace.</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-[0_8px_20px_rgba(46,125,50,0.2)] transition-all active:scale-95 flex items-center gap-2">
              + Novo Registo
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
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">Total Utilizadores</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : stats.total}</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Package size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">Produtos Ativos</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : products.length}</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FileText size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">Pedidos Realizados</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : orders.length}</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><ShieldCheck size={24} /></div>
                  <span className="text-[10px] font-bold text-[#6D6D6D] uppercase">Fornecedores Verificados</span>
                </div>
                <h3 className="text-3xl font-bold text-[#1C1C1C]">{loading ? '...' : stats.sellers}</h3>
              </div>
            </div>

            {/* Actividade Recente Preview */}
            <div className="bg-white rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-[#E0E0E0]/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-[#E0E0E0]/50 flex justify-between items-center">
                <h4 className="font-poppins font-bold text-[#1C1C1C] text-lg">Actividade Recente</h4>
                <button className="text-sm font-semibold text-[#2E7D32] hover:underline" onClick={fetchOperationalData}>Atualizar</button>
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
                {activityLogs.length === 0 && !loading && <span className="text-[#A0A0A0] text-sm py-4 block">Nenhuma atividade recente.</span>}
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
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Identificacao</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Tipo/Papel</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Contato</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]/50">
                  {users
                    .filter(u => activeTab === 'users' ? true : u.role.toLowerCase() === activeTab.slice(0, -1) || u.role.toLowerCase() === activeTab)
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
                          {u.status === 'active' ? (
                            <div className="flex items-center gap-1.5 align-middle">
                              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                              <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md">Ativo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 align-middle">
                              <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                              <span className="text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-md">Bloqueado</span>
                            </div>
                          )}
                          {!u.isApproved && (
                            <span className="text-[10px] font-bold text-[#F59E0B] block mt-1">Pendente</span>
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
                    <tr><td colSpan={5} className="py-12 text-center text-[#A0A0A0] text-sm">Nenhum registo encontrado.</td></tr>
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
                <div className="absolute top-4 right-4"><span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-1 rounded-md">Verificado</span></div>
                <div className="w-16 h-16 rounded-xl border border-[#E0E0E0] flex items-center justify-center p-2 mb-4 bg-gray-50 flex-shrink-0">
                  {u.logo ? <img src={u.logo} alt={u.entityName} className="max-w-full max-h-full object-contain" /> : <ShieldCheck size={32} className="text-[#A0A0A0]" />}
                </div>
                <h4 className="font-poppins font-bold text-[#1C1C1C] text-lg mb-1">{u.entityName || u.fullName}</h4>
                <p className="text-xs text-[#6D6D6D] mb-4">Parceiro Estrategico &bull; {u.location || u.district || 'Global'}</p>
                <div className="mt-auto pt-4 border-t border-[#E0E0E0]/50 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-[#A0A0A0]">Telefone</span><span className="font-medium text-[#1C1C1C]">{u.commercialPhone}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#A0A0A0]">Email</span><span className="font-medium text-[#1C1C1C] truncate ml-2">{u.email}</span></div>
                </div>
                <button onClick={() => setSelectedUser(u)} className="mt-6 w-full py-2.5 rounded-xl border-2 border-[#2E5C4E] text-[#2E5C4E] font-bold text-xs hover:bg-[#2E5C4E] hover:text-white transition-colors">
                  Gerir Parceria
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
                <button onClick={generatePDF} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95">Exportar Relatorio PDF</button>
              </div>
            </div>
            {/* Old legacy tables were removed but PDF keeps working since logical states exist */}
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0E0E0] shadow-sm">
              <PieChart size={48} className="mx-auto text-[#A0A0A0] mb-4 opacity-50" />
              <h3 className="font-poppins text-xl font-bold text-[#1C1C1C] mb-2">Relatorios Detalhados</h3>
              <p className="text-sm text-[#6D6D6D]">Exporte os relatorios PDF oficiais para analisar lucros, comissoes de parceiros e transacoes do marketplace.</p>
            </div>
          </div>
        )}

        {['products', 'categories', 'orders', 'logistics', 'ratings', 'settings'].includes(activeTab) && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-[20px] border border-[#E0E0E0]/50 border-dashed animate-in fade-in">
            <span className="text-4xl mb-4 opacity-30 px-4 py-2 bg-gray-100 rounded-2xl filter grayscale">🚧</span>
            <h3 className="text-lg font-bold text-[#1C1C1C]">Modulo em Desenvolvimento</h3>
            <p className="text-sm text-[#A0A0A0] max-w-sm text-center mt-2">Esta seccao operativa faz parte da proxima fase de implantacao do AgroSuste.</p>
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
              {/* Simulated action buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#E0E0E0]">
                <button className="flex-1 py-3 bg-[#10B981] text-white text-sm font-bold rounded-xl hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 shadow-sm"><CheckCircle size={16} /> Aprovar Registo</button>
                {!isAdmin && (
                  <button className="flex-1 py-3 bg-white border border-[#E0E0E0] text-[#1C1C1C] text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Imprimir Ficha</button>
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
              <h3 className="text-lg font-poppins font-bold text-[#1C1C1C]">Novo Registo Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#A0A0A0] hover:text-[#1C1C1C] transition-colors p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>
              {/* CONDITIONAL FORMS FOR PRODUCTS */}
              {activeTab === 'products' && (
                <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                  <div>
                     <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Nome do Produto / Colheita</label>
                     <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ex: Batata Reno" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Preço (MZN)</label>
                       <input type="number" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Unidade de Medida</label>
                       <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} placeholder="Ex: Kg, Saco, Ton" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Quantidade em Stock</label>
                       <input type="number" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Grão Seco / Armazenável?</label>
                       <select className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newProduct.isDried ? 'true':'false'} onChange={e => setNewProduct({...newProduct, isDried: e.target.value === 'true'})}>
                         <option value="false">Não Fresco/Perecível</option>
                         <option value="true">Sim, Armazenável</option>
                       </select>
                     </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Descrição Adicional</label>
                    <textarea rows={2} className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium resize-none transition-all" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Detalhes de Origem/Qualidade..." />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="submit" className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(46,125,50,0.2)] transition-all">Publicar Produto no Catálogo</button>
                  </div>
                </form>
              )}

              {/* CONDITIONAL FORMS FOR STRATEGIC PARTNERS */}
              {activeTab === 'partners' && (
                <form onSubmit={handleAddNewEntity} className="p-6 space-y-4">
                   <div>
                     <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Nome da Instituição/Organização</label>
                     <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newPartner.entityName} onChange={e => setNewPartner({...newPartner, entityName: e.target.value})} placeholder="Agência de Cooperação Internacional" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Email Corporativo</label>
                       <input type="email" required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Contacto Oficial</label>
                       <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} />
                     </div>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Sede/Localização Geográfica</label>
                     <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium transition-all" value={newPartner.location} onChange={e => setNewPartner({...newPartner, location: e.target.value})} placeholder="Província/Distrito de Operação" />
                   </div>
                   <div className="pt-4 flex gap-3">
                     <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(37,99,235,0.2)] transition-all">Registar Parceiro Institucional</button>
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
                    <button type="submit" className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(46,125,50,0.2)] transition-all">Concluir Adição de Perfil Oficial</button>
                  </div>
                </form>
              )}
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
      {/* ADD ARROW ICON COMPONENT SINCE LUCIDE IMPORT WASN'T MODIFIED YET */}
    </div>
  );
};

// Polyfill arrow component if missed
const ArrowRight = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default AdminDashboard;
