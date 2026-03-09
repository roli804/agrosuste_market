import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole, EntityType, Order, ActivityLog, LogType } from '../types';
import { MOZ_GEOGRAPHY, PLATFORM_COMMISSION_RATE } from '../constants';
import { mockDb } from '../lib/mock_db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrendingUp, Users, ShoppingBag, PieChart, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface AdminDashboardProps {
  products: any[];
  user: User | null; // Add user prop for authorization
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, user }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'reports' | 'entities' | 'logistics' | 'technical' | 'partners'>('reports');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Filtros de Relatório
  const [filterProvince, setFilterProvince] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'general' | 'weekly' | 'monthly'>('general');

  // Dashboard Access Guard
  const isAuthorized = user && [
    UserRole.ADMIN,
    UserRole.TRANSPORTER,
    UserRole.EXTENSIONIST,
    UserRole.STRATEGIC_PARTNER,
    UserRole.OTHER // Assuming NGOs or Managers use OTHER if not specified
  ].includes(user.role as UserRole);

  useEffect(() => {
    if (isAuthorized) {
      fetchOperationalData();
    }
  }, [user, isAuthorized]);

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
      [`${t('admin_sales_volume' as any)} (MZN)`, salesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      ['Comissão Total Gerada (MZN)', filteredOrders.reduce((sum, o) => sum + (o.commission || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      [t('admin_transactions' as any), filteredOrders.length.toString()]
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
      doc.text(`Página ${i} de ${pageCount} • ${t('admin_pdf_footer')} `, 105, 285, { align: 'center' });
    }

    doc.save(`Relatorio_AgroSuste_${reportType}_${new Date().getTime()}.pdf`);
  };

  const handleSendEmail = () => {
    const email = prompt(t('admin_email_prompt' as any) || 'Digite o endereço de email para onde deseja enviar o relatório:');
    if (email && email.includes('@')) {
      alert(`${t('admin_email_success' as any)} ${email} ! `);
    } else if (email) {
      alert(t('admin_invalid_email' as any));
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
    const { data: dbUsers, error } = await supabase.from('profiles').select('*');

    if (!error && dbUsers) {
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

    // 2. Merge with Local Mock Users
    const localUsers = mockDb.getUsers();
    // Prevent duplicates by ID or Email
    const mergedUsers = [...allUsers];
    localUsers.forEach(lu => {
      if (!mergedUsers.find(mu => mu.id === lu.id || mu.email === lu.email)) {
        mergedUsers.push(lu);
      }
    });
    setUsers(mergedUsers);

    // 3. Fetch Activity Logs
    setActivityLogs(mockDb.getLogs());

    // 4. Load Orders
    const savedOrders = localStorage.getItem('agro_suste_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }

    setLoading(false);
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

    // Aplicar filtro de mês/ano apenas na data de criação (se existisse no objeto user)
    // Neste contexto, os utilizadores são globais para a província. A filtragem temporal de criação seria aqui se u.createdAt existisse.
    // Vamos focar o filtro temporal nas Vendas (orders).

    return true;
  });

  const filteredOrders = orders.filter(o => {
    if (filterProvince && o.province !== filterProvince) return false;

    const orderDate = new Date(o.createdAt);
    if (reportType === 'monthly') {
      if (orderDate.getMonth() + 1 !== filterMonth || orderDate.getFullYear() !== filterYear) return false;
    }
    // Implementação de filtro semanal poderia vir aqui

    return true;
  });

  const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  // Comissão acumulada GLOBAL: recalculada dinamicamente de TODAS as compras (ignora campo stale)
  const totalPlatformCommission = orders.reduce((sum, o) => sum + (o.total * PLATFORM_COMMISSION_RATE), 0);

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center space-y-8">
        <div className="w-40 h-40 bg-rose-50 rounded-[4rem] flex items-center justify-center text-7xl text-rose-500 shadow-inner">🔒</div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{t('login_required' as any)}</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest max-w-md mx-auto">Apenas Gestores, Administradores, ONGs e Parceiros Estratégicos têm acesso a esta Sala de Operações.</p>
        </div>
        <a href="#/auth" className="bg-[#1B5E20] text-white px-12 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Iniciar Sessão como Gestor</a>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">

      {/* Header da Sala de Operações */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-gray-100 pb-12">
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">{t('admin_title')}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">{t('admin_subtitle')}</p>
        </div>

        <div className="flex bg-white p-2 rounded-3xl shadow-soft border border-gray-100 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'reports', label: t('admin_tab_reports') },
            { id: 'entities', label: t('admin_tab_entities') },
            { id: 'partners', label: t('admin_tab_partners') },
            { id: 'logistics', label: t('admin_tab_logistics') },
            { id: 'technical', label: t('admin_tab_technical') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1B5E20] text-white shadow-xl translate-y-[-2px]' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'reports' && (
        <div className="space-y-10">
          {/* Filtros Avançados */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-100 flex flex-wrap gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('admin_filter_province')}</label>
              <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20">
                <option value="">{t('admin_pdf_all')}</option>
                {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('admin_filter_month')}</label>
              <div className="flex gap-2">
                <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthName = new Date(0, i).toLocaleString('pt-PT', { month: 'long' }).toUpperCase();
                    return <option key={i + 1} value={i + 1}>{monthName}</option>
                  })}
                </select>
                <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('admin_filter_type')}</label>
              <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20">
                <option value="general">{t('admin_report_gen')}</option>
                <option value="weekly">{t('admin_report_week')}</option>
                <option value="monthly">{t('admin_report_month')}</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSendEmail} className="bg-white border-2 border-[#1B5E20] text-[#1B5E20] px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-green-50 transition-all">{t('admin_email_btn' as any)}</button>
              <button onClick={generatePDF} className="bg-[#1B5E20] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">{t('admin_filter_btn' as any)}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: t('admin_stats_total'), value: filteredUsers.length, color: 'text-[#1B5E20]', icon: '👥' },
              { label: t('admin_stats_partners'), value: filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length, color: 'text-emerald-600', icon: '🤝' },
              { label: t('admin_sales_volume' as any), value: `${salesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`, color: 'text-amber-600', icon: '💰' },
              { label: t('admin_cumulative_commission' as any), value: `${totalPlatformCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`, color: 'text-rose-600', icon: '📊' }
            ].map(stat => (
              <div key={stat.label} className="bg-white p-10 rounded-[3rem] shadow-soft border border-gray-50 flex flex-col items-center text-center">
                <span className="text-4xl mb-4">{stat.icon}</span>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">{stat.label}</p>
                <h4 className={`text - 4xl md: text - 5xl font - black ${stat.color} tracking - tight`}>{loading ? '...' : stat.value}</h4>
              </div>
            ))}
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-strong border border-gray-100">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">🕒 {t('admin_ops_title')}</h3>
              <button onClick={fetchOperationalData} className="text-[#43A047] font-black text-[9px] uppercase tracking-widest hover:underline">{t('admin_ops_update')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_table_user')}</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação / Evento</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_table_loc')}</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activityLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400">{log.userName[0]}</div>
                          <div><p className="font-black text-gray-900 text-xs uppercase">{log.userName}</p><p className="text-[9px] text-gray-400 font-bold opacity-60 uppercase">{log.userRole}</p></div>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="space-y-1">
                          <span className={`text - [8px] font - black px - 2 py - 1 rounded - md uppercase border ${log.type === LogType.SIGNUP ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            log.type === LogType.LOGIN ? 'bg-green-50 text-green-700 border-green-100' :
                              log.type === LogType.PURCHASE ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-gray-50 text-gray-700 border-gray-100'
                            } `}>{log.type}</span>
                          <p className="text-[10px] text-gray-600 font-medium leading-tight">{log.description}</p>
                        </div>
                      </td>
                      <td className="py-6 text-[10px] font-black text-gray-400 uppercase">SISTEMA</td>
                      <td className="py-6 text-[10px] font-black text-gray-600 uppercase tabular-nums">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {activityLogs.length === 0 && !loading && <tr><td colSpan={4} className="py-20 text-center opacity-20 font-black uppercase tracking-widest">{t('admin_no_records')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-strong border border-gray-100 mt-10">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-10">👥 Base de Utilizadores</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_table_user')}</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_table_role')}</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_table_loc')}</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_table_status')}</th>
                    <th className="pb-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#1B5E20]/5 rounded-2xl flex items-center justify-center font-black text-[#1B5E20]">{u.fullName[0]}</div>
                          <div><p className="font-black text-gray-900 text-sm uppercase">{u.fullName}</p><p className="text-[10px] text-gray-400 font-bold">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="py-6"><span className="text-[10px] font-black text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">{u.role}</span></td>
                      <td className="py-6"><div><p className="font-black text-xs text-gray-700">{u.district}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{u.posto || t('admin_pdf_all')}</p></div></td>
                      <td className="py-6"><span className={`text - [8px] font - black px - 4 py - 2 rounded - full uppercase border ${u.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'} `}>{t('admin_identity_status' as any)} {u.status}</span></td>
                      <td className="py-6 text-right"><button onClick={() => setSelectedUser(u)} className="text-[#1B5E20] font-black text-[9px] uppercase tracking-widest border-2 border-[#1B5E20]/10 px-6 py-2 rounded-xl hover:bg-[#1B5E20] hover:text-white transition-all">{t('admin_table_view')}</button></td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && <tr><td colSpan={5} className="py-20 text-center opacity-20 font-black uppercase tracking-widest">{t('admin_no_records')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'entities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredUsers.filter(u => u.role !== UserRole.STRATEGIC_PARTNER).map(u => (
            <div key={u.id} className="bg-white p-10 rounded-[3.5rem] shadow-strong border border-gray-50 space-y-8 group hover:border-[#43A047] transition-all">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl group-hover:bg-green-50 transition-all">
                  {u.role === UserRole.SELLER ? '🚜' : u.role === UserRole.TRANSPORTER ? '🚛' : '🏢'}
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('admin_card_entity')}</p>
                  <span className="text-[9px] font-black text-gray-900 uppercase tracking-wider">{u.entityType || t('admin_entity_individual' as any)}</span>
                </div>
              </div>
              <div>
                <h4 className="font-black text-xl text-gray-900 tracking-tight leading-none uppercase">{u.entityName || u.fullName}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{u.district} • {u.localidade || t('admin_pdf_all')}</p>
              </div>
              <div className="pt-8 border-t border-gray-50 space-y-4">
                <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('admin_card_comm')}</span><span className="font-black text-xs text-[#1B5E20]">{u.commercialPhone}</span></div>
                <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('admin_card_state')}</span><span className="bg-green-50 text-green-700 text-[8px] font-black px-3 py-1 rounded-full uppercase border border-green-100">{t('admin_card_op')}</span></div>
              </div>
              <button onClick={() => setSelectedUser(u)} className="w-full bg-[#1B5E20] text-white font-black py-5 rounded-2xl text-[9px] uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">{t('admin_card_report')}</button>
            </div>
          ))}
          {filteredUsers.filter(u => u.role !== UserRole.STRATEGIC_PARTNER).length === 0 && !loading && <div className="col-span-full py-32 text-center opacity-30 font-black uppercase tracking-widest">{t('shop_no_products')}</div>}
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).map(u => (
            <div key={u.id} className="bg-white p-10 rounded-[3.5rem] shadow-strong border border-gray-50 space-y-8 group hover:border-emerald-500 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center p-3 group-hover:bg-emerald-50 transition-all">
                  {u.logo ? <img src={u.logo} alt={u.entityName} className="max-w-full max-h-full object-contain" /> : <span className="text-4xl">🤝</span>}
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('admin_card_partner')}</p>
                  <span className="text-[9px] font-black text-gray-900 uppercase tracking-wider">{u.entityType || t('admin_entity_strategic' as any)}</span>
                </div>
              </div>
              <div>
                <h4 className="font-black text-xl text-gray-900 tracking-tight leading-none uppercase">{u.entityName || u.fullName}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{u.location || u.district || t('admin_pdf_all')}</p>
              </div>
              <div className="pt-8 border-t border-gray-50 space-y-4">
                <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('admin_card_official')}</span><span className="font-black text-xs text-emerald-600">{u.commercialPhone}</span></div>
                <div className="flex justify-between items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('admin_card_state')}</span><span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-3 py-1 rounded-full uppercase border border-emerald-100">{t('admin_card_active')}</span></div>
              </div>
              <button onClick={() => setSelectedUser(u)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl text-[9px] uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">{t('admin_card_agreement')}</button>
            </div>
          ))}
          {filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length === 0 && !loading && <div className="col-span-full py-32 text-center opacity-30 font-black uppercase tracking-widest">{t('partners_waiting')}</div>}
        </div>
      )}

      {/* MODAL DE FICHA DETALHADA */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B5E20] p-12 text-white flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">{selectedUser.fullName}</h3>
                <p className="text-[10px] font-bold opacity-50 uppercase mt-4 tracking-widest">{t('admin_modal_code')}: {selectedUser.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-4xl hover:scale-125 transition-all">✕</button>
            </div>
            <div className="p-16 grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-10">
                <h4 className="text-[11px] font-black text-[#43A047] uppercase tracking-[0.3em] border-b pb-4">{t('admin_modal_user_data')}</h4>
                <div className="space-y-6">
                  <div className="detail-field"><span className="detail-label">{t('admin_modal_phone')}</span><span className="detail-value">{selectedUser.phone}</span></div>
                  <div className="detail-field"><span className="detail-label">{t('admin_modal_comm')}</span><span className="detail-value text-[#1B5E20]">{selectedUser.commercialPhone}</span></div>
                  <div className="detail-field"><span className="detail-label">{t('admin_modal_role')}</span><span className="detail-value uppercase">{selectedUser.role}</span></div>
                </div>
              </div>
              <div className="space-y-10">
                <h4 className="text-[11px] font-black text-[#43A047] uppercase tracking-[0.3em] border-b pb-4">{t('admin_modal_ent_data')}</h4>
                <div className="space-y-6">
                  <div className="detail-field"><span className="detail-label">{t('admin_modal_legal')}</span><span className="detail-value uppercase">{selectedUser.entityType || 'Individual'}</span></div>
                  <div className="detail-field"><span className="detail-label">{t('admin_modal_prov_dist')}</span><span className="detail-value">{selectedUser.province} / {selectedUser.district}</span></div>
                  <div className="detail-field"><span className="detail-label">{t('admin_modal_posto_loc')}</span><span className="detail-value uppercase">{selectedUser.posto || t('admin_pdf_all')} • {selectedUser.localidade || t('admin_pdf_all')}</span></div>
                </div>
              </div>
            </div>
            <div className="p-12 bg-gray-50 flex gap-6">
              <button onClick={() => generateUserPDF(selectedUser)} className="flex-grow bg-[#1B5E20] text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl">{t('admin_modal_print')}</button>
              <button onClick={() => setSelectedUser(null)} className="px-12 bg-white text-gray-400 font-black py-6 rounded-3xl text-[10px] uppercase tracking-widest border border-gray-200">{t('admin_modal_close')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .detail-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .detail-label { font-size: 8px; font-weight: 900; color: #B0BEC5; text-transform: uppercase; letter-spacing: 0.2em; }
        .detail-value { font-size: 1.1rem; font-weight: 800; color: #1E293B; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
