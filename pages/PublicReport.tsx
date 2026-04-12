import React, { useState, useEffect } from 'react';
import { User, UserRole, Order } from '../types';
import { useLanguage } from '../LanguageContext';
import { MOZ_GEOGRAPHY } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { mockDb } from '../lib/mock_db';
import { Download, Search, Filter, Eye, List, FileText, ChevronRight } from 'lucide-react';

const PublicReport: React.FC = () => {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [filterProvince, setFilterProvince] = useState('');
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        let allUsers: User[] = [];
        const { data: profilesData } = await supabase.from('profiles').select('id, role, province, country, status');
        if (profilesData) {
            allUsers = profilesData as any[];
        }

        const localUsers = mockDb.getUsers();
        const mergedUsers = [...allUsers];
        localUsers.forEach(lu => {
            if (!mergedUsers.find(mu => mu.id === lu.id)) {
                mergedUsers.push(lu);
            }
        });
        setUsers(mergedUsers);

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

        doc.setFillColor(31, 41, 55); // Dark Gray
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('AGRO-SUSTE MOÇAMBIQUE - RELATÓRIO OFICIAL', 105, 18, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Data de Emissão: ${timestamp}`, 14, 45);
        doc.text(`Âmbito: ${filterProvince || 'Nacional'}`, 14, 50);
        doc.text(`Período de Referência: ${filterMonth}/${filterYear}`, 14, 55);

        const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalCommission = filteredOrders.reduce((sum, order) => sum + (order.total * 0.05));
        
        const statsData = [
            ['Total de Utilizadores Registados', filteredUsers.length.toString()],
            ['Productores em Atividade', filteredUsers.filter(u => u.role === UserRole.SELLER).length.toString()],
            ['Parceiros Estratégicos', filteredUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER).length.toString()],
            ['Volume de Negócios (MZN)', salesVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })],
            ['Impacto Económico Direto (MZN)', (salesVolume * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })],
            ['Transações Validadas', filteredOrders.length.toString()]
        ];

        (doc as any).autoTable = autoTable;
        autoTable(doc, {
            startY: 65,
            head: [['Indicador Operacional', 'Métrica']],
            body: statsData,
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55] },
            styles: { fontSize: 9 }
        });

        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('Documento gerado automaticamente pelo portal de transparência AgroSuste Moçambique.', 105, 285, { align: 'center' });

        doc.save(`Relatorio_Impacto_AgroSuste.pdf`);
    };

    const salesVolume = filteredOrders.reduce((sum, order) => sum + order.total, 0);

    // Mock das linhas da tabela baseadas nos dados filtrados
    const reportRows = [
        { name: 'Impacto Socioeconómico Regional', type: 'Consolidado', date: `${filterMonth}/${filterYear}`, status: 'Finalizado' },
        { name: 'Censo de Produtores Locais', type: 'Estatístico', date: `${filterMonth}/${filterYear}`, status: 'Atualizado' },
        { name: 'Fluxo de Mercados e Logística', type: 'Operacional', date: `${filterMonth}/${filterYear}`, status: 'Finalizado' },
        { name: 'Volume de Escoamento Agrícola', type: 'Comercial', date: `${filterMonth}/${filterYear}`, status: 'Pendente' }
    ].filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-inter pb-20">
            <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                
                {/* Header Simples e Corporativo */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Relatórios Públicos</h1>
                        <p className="text-sm text-[#6B7280] mt-1">Painel centralizado de transparência e métricas de impacto da Rede AgroSuste.</p>
                    </div>
                    <button 
                        onClick={generatePDF}
                        className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Download size={16} /> Exportar Report (PDF)
                    </button>
                </div>

                {/* Filtros Estilo Admin Panel */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col lg:flex-row gap-4">
                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Procurar relatório..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        
                        <select 
                            value={filterProvince} 
                            onChange={e => setFilterProvince(e.target.value)}
                            className="px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat"
                        >
                            <option value="">Moçambique (Nacional)</option>
                            {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        <select 
                            value={filterMonth} 
                            onChange={e => setFilterMonth(Number(e.target.value))}
                            className="px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('pt-PT', { month: 'long' })}
                                </option>
                            ))}
                        </select>

                        <select 
                            value={filterYear} 
                            onChange={e => setFilterYear(Number(e.target.value))}
                            className="px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    
                    <button 
                        onClick={fetchData}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-bold border border-[#D1D5DB] transition-colors flex items-center justify-center gap-2"
                    >
                        <Filter size={16} /> Aplicar Filtros
                    </button>
                </div>

                {/* KPI Summary (Compact) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Utilizadores na Rede', value: filteredUsers.length, color: 'text-blue-600' },
                        { label: 'Marketplace (MZN)', value: salesVolume.toLocaleString(), color: 'text-green-600' },
                        { label: 'Produtores em Atividade', value: filteredUsers.filter(u => u.role === UserRole.SELLER).length, color: 'text-gray-900' },
                        { label: 'Transações Validadas', value: filteredOrders.length, color: 'text-gray-900' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <h4 className={`text-2xl font-bold ${stat.color}`}>{loading ? '...' : stat.value}</h4>
                        </div>
                    ))}
                </div>

                {/* Tabela Principal */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-[#E5E7EB] flex items-center gap-2">
                        <List size={18} className="text-gray-400" />
                        <h3 className="font-semibold text-gray-900">Histórico de Relatórios Gerados</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nome do Relatório</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Data Referência</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reportRows.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <FileText size={18} className="text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-900">{row.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.type}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                                                row.status === 'Finalizado' ? 'bg-green-50 text-green-700' : 
                                                row.status === 'Atualizado' ? 'bg-blue-50 text-blue-700' : 
                                                'bg-yellow-50 text-yellow-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-all font-medium text-xs flex items-center gap-1">
                                                    <Eye size={14} /> Ver
                                                </button>
                                                <button onClick={generatePDF} className="text-gray-400 hover:text-green-600 p-1.5 rounded-lg hover:bg-green-50 transition-all font-medium text-xs flex items-center gap-1">
                                                    <Download size={14} /> Baixar
                                                </button>
                                                <button className="text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs">
                                                    Detalhes
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reportRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                            <p className="text-sm">Nenhum relatório encontrado para os filtros selecionados.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex justify-between items-center text-xs text-gray-500">
                        <p>Mostrando {reportRows.length} resultados filtrados</p>
                        <div className="flex items-center gap-2">
                            <span>Relatórios consolidados pelo sistema central AgroSuste.</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicReport;
