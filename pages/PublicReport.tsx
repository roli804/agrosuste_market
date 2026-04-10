import React, { useState, useEffect } from 'react';
import { User, UserRole, Order } from '../types';
import { useLanguage } from '../LanguageContext';
import { MOZ_GEOGRAPHY, WORLD_COUNTRIES } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { mockDb } from '../lib/mock_db';

const PublicReport: React.FC = () => {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterProvince, setFilterProvince] = useState('');
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Dados de utilizadores públicos (contagens anonimizadas)
        let allUsers: User[] = [];
        const { data: profilesData } = await supabase.from('profiles').select('id, role, province, country, status');
        if (profilesData) {
            allUsers = profilesData as any[];
        }

        // Merge com Local Mock Users para refletir o número correto
        const localUsers = mockDb.getUsers();
        const mergedUsers = [...allUsers];
        localUsers.forEach(lu => {
            if (!mergedUsers.find(mu => mu.id === lu.id)) {
                mergedUsers.push(lu);
            }
        });
        setUsers(mergedUsers);

        // Dados de ordens de vendas (local storage para demo)
        const savedOrders = localStorage.getItem('agro_suste_orders');
        if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
        }
        setLoading(false);
    };

    const filteredUsers = users.filter(u => {
        if (filterProvince && u.province !== filterProvince) return false;
        return true;
    });

    const filteredOrders = orders.filter(o => {
        if (filterProvince && o.province !== filterProvince) return false;

        const orderDate = new Date(o.createdAt);
        if (orderDate.getMonth() + 1 !== filterMonth || orderDate.getFullYear() !== filterYear) return false;

        return true;
    });

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
        doc.text(t('public_pdf_desc' as any).toUpperCase(), 105, 30, { align: 'center' });

        // Report Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`${t('admin_pdf_date')}: ${timestamp}`, 14, 50);
        doc.text(`${t('public_prov_region')}: ${filterProvince || t('public_national')}`, 14, 56);
        doc.text(`${t('public_analysis_period')}: ${t('admin_filter_month')} ${filterMonth}/${filterYear}`, 14, 62);

        // Stats Table
        const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalCommission = filteredOrders.reduce((sum, order) => sum + (order.commission || (order.total * 0.05)), 0);
        const statsData = [
            [t('public_users'), filteredUsers.length.toString()],
            [t('public_active_producers'), filteredUsers.filter(u => u.role === UserRole.SELLER).length.toString()],
            [t('public_inst_partners'), filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length.toString()],
            [`${t('public_vol_mzn')} (MZN)`, salesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
            [`${t('public_platform_commission')} (MZN)`, totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
            [t('public_saved_operations'), filteredOrders.length.toString()]
        ];

        (doc as any).autoTable = autoTable;
        autoTable(doc, {
            startY: 70,
            head: [['Indicador de Impacto', 'Valor']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] },
            styles: { fontSize: 11, cellPadding: 4 }
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(t('admin_pdf_footer'), 105, 285, { align: 'center' });

        doc.save(`Relatorio_Impacto_AgroSuste_${filterYear}_${filterMonth}.pdf`);
    };

    const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    // Comissão global acumulada: recalculada de TODAS as compras (ignora campo stale)
    const totalAllTimeCommission = orders.reduce((sum, o) => sum + (o.total * 0.05), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-12 pb-24 px-4 md:px-0">
            {/* Header Público */}
            <div className="bg-[#2E5C4E] text-white p-8 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-strong flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <svg width="200" height="200" md:width="300" md:height="300" viewBox="0 0 100 100">
                        <path d="M50 85C50 85 32 78 20 60C8 42 10 25 10 25C10 25 28 22 42 35C56 48 60 65 60 65" stroke="white" strokeWidth="4" fill="none" />
                    </svg>
                </div>

                <div className="space-y-4 relative z-10 w-full md:w-2/3">
                    <h1 className="text-3xl md:text-6xl font-semibold  leading-tight md:leading-none">{t('public_transparency_title' as any)}</h1>
                    <p className="text-xs md:text-base font-medium opacity-80 max-w-xl leading-relaxed">
                        {t('public_transparency_desc' as any)}
                    </p>
                </div>
                <div className="relative z-10 w-full md:w-auto text-center md:text-right">
                    <button
                        onClick={generatePDF}
                        className="w-full md:w-auto bg-white text-[#2E5C4E] hover:bg-green-50 px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-semibold   shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                        💾 {t('public_download_pdf' as any)}
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-soft border border-gray-100 flex flex-wrap gap-4 md:gap-6 items-end justify-center md:justify-start">
                <div className="space-y-2">
                    <label className="text-[9px] font-semibold text-gray-400   ml-2">{t('public_prov_region' as any)}</label>
                    <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-2 ring-[#5B8C51]/30 transition-all w-full md:w-auto">
                        <option value="">{t('public_all_provinces' as any)}</option>
                        {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-semibold text-gray-400   ml-2">{t('public_analysis_period' as any)}</label>
                    <div className="flex gap-2">
                        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-2 ring-[#5B8C51]/30 transition-all">
                            {Array.from({ length: 12 }, (_, i) => {
                                const monthName = new Date(0, i).toLocaleString('pt-PT', { month: 'long' }).toUpperCase();
                                return <option key={i + 1} value={i + 1}>{monthName}</option>
                            })}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-2 ring-[#5B8C51]/30 transition-all">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Estatísticas Públicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('public_users' as any), value: filteredUsers.length, color: 'text-gray-900', icon: '🌍' },
                    { label: t('public_vol_mzn' as any), value: salesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: 'text-[#5B8C51]', icon: '📈' },
                    { label: t('public_prod_market' as any), value: filteredUsers.filter(u => u.role === UserRole.SELLER).length, color: 'text-amber-600', icon: '🌾' },
                    { label: t('public_inst_partners' as any), value: filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length, color: 'text-blue-600', icon: '🏛️' }
                ].map(stat => (
                    <div key={stat.label} className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-soft border border-gray-50 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                        <span className="text-4xl md:text-5xl mb-4 md:mb-6 opacity-80 group-hover:scale-110 transition-transform">{stat.icon}</span>
                        <h4 className={`text-2xl md:text-4xl lg:text-5xl font-semibold ${stat.color}`}>{loading ? '...' : stat.value}</h4>
                        <p className="text-[9px] md:text-[10px] font-semibold text-gray-400   mt-2 md:mt-4">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabela Resumo */}
            <div className="bg-white p-6 md:p-14 rounded-2xl md:rounded-[4rem] shadow-strong border border-gray-100 overflow-hidden">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900   mb-6 md:mb-8">{t('public_strategic_info' as any)} ({filterProvince || t('public_national' as any)})</h3>
                <p className="text-gray-500 font-medium mb-8 md:mb-10 text-xs md:text-sm leading-relaxed max-w-3xl">
                    {t('public_privacy_notice' as any)}
                    <br />
                    {t('public_impact_notice' as any)}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-gray-50 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100">
                        <h4 className="text-[9px] md:text-[10px] font-semibold text-gray-400   mb-4 md:mb-6">{t('public_interventions_record' as any)}</h4>
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <span className="font-bold text-sm text-gray-700">{t('public_buyers_registered' as any)}</span>
                                <span className="font-semibold text-gray-900">{filteredUsers.filter(u => u.role === UserRole.BUYER).length}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <span className="font-bold text-sm text-gray-700">{t('public_transporters' as any)}</span>
                                <span className="font-semibold text-gray-900">{filteredUsers.filter(u => u.role === UserRole.TRANSPORTER).length}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <span className="font-bold text-sm text-gray-700">{t('public_extensionists' as any)}</span>
                                <span className="font-semibold text-gray-900">{filteredUsers.filter(u => u.role === UserRole.EXTENSIONIST).length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50/50 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-[#5B8C51]/20">
                        <h4 className="text-[9px] md:text-[10px] font-semibold text-[#2E5C4E]   mb-4 md:mb-6">{t('public_transaction_metrics' as any)}</h4>
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex justify-between items-center py-2 md:py-3 border-b border-[#5B8C51]/10">
                                <span className="font-bold text-xs md:text-sm text-[#2E5C4E]">{t('public_saved_operations' as any)}</span>
                                <span className="font-semibold text-sm md:text-base text-[#2E5C4E]">{orders.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 md:py-3 border-b border-[#5B8C51]/10">
                                <span className="font-bold text-xs md:text-sm text-[#2E5C4E]">{t('public_platform_comm_generated' as any)} <span className="font-normal opacity-60 text-[9px] md:text-[10px]">({t('public_total_historical' as any)})</span></span>
                                <span className="font-semibold text-xs md:text-base text-[#5B8C51]">{totalAllTimeCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN</span>
                            </div>
                        </div>

                        <div className="mt-6 md:mt-8 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-green-100 flex gap-3 md:gap-4 items-center">
                        <span className="text-2xl md:text-3xl">🌱</span>
                            <p className="text-[10px] md:text-xs font-bold text-gray-600 leading-tight">
                                {t('public_each_transaction' as any)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default PublicReport;
