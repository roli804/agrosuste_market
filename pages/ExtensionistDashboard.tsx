import React, { useState, useEffect } from 'react';
import { User, AssistanceVisit, UserRole, LogType } from '../types';
import { mockDb } from '../lib/mock_db';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { ClipboardList, MapPin, Calendar, Users, PlusCircle, XCircle, CheckCircle, LogOut, TrendingUp, Activity, Award, ChevronRight, Clock, Leaf, BarChart2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ExtensionistDashboardProps {
  user: User;
  onLogout: () => void;
}

const ExtensionistDashboard: React.FC<ExtensionistDashboardProps> = ({ user, onLogout }) => {
  const { t } = useLanguage();
  const [visits, setVisits] = useState<AssistanceVisit[]>([]);
  const [producers, setProducers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'producers'>('overview');
  const [form, setForm] = useState({
    producerEntityId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Assistência técnica',
    notes: '',
    district: user.district || user.province || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const VISITS_KEY = `agrosuste_visits_${user.id}`;

  const loadData = () => {
    const stored = localStorage.getItem(VISITS_KEY);
    if (stored) setVisits(JSON.parse(stored));
    setProducers(mockDb.getUsers().filter(u => u.role === UserRole.SELLER));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const visit: AssistanceVisit = {
      id: `visit-${Date.now()}`,
      extensionistId: user.id,
      producerEntityId: form.producerEntityId,
      date: form.date,
      type: form.type,
      notes: form.notes,
      district: form.district,
      createdAt: new Date().toISOString(),
    };
    const updated = [visit, ...visits];
    setVisits(updated);
    localStorage.setItem(VISITS_KEY, JSON.stringify(updated));
    mockDb.logActivity({ userId: user.id, userName: user.fullName, userRole: UserRole.EXTENSIONIST, type: LogType.SYSTEM, description: `Visita técnica em ${form.district}: ${form.type}` });
    setSubmitting(false);
    setShowForm(false);
    setForm({ producerEntityId: '', date: new Date().toISOString().split('T')[0], type: 'Assistência técnica', notes: '', district: user.district || '' });
  };

  const visitTypes = [
    'Assistência técnica', 'Diagnóstico de pragas', 'Monitoramento de colheita',
    'Formação agrícola', 'Registo de produção', 'Visita de acompanhamento', 'Outro',
  ];

  const visitTypeColors: Record<string, string> = {
    'Assistência técnica': 'bg-blue-50 text-blue-700',
    'Diagnóstico de pragas': 'bg-red-50 text-red-700',
    'Monitoramento de colheita': 'bg-emerald-50 text-emerald-700',
    'Formação agrícola': 'bg-purple-50 text-purple-700',
    'Registo de produção': 'bg-amber-50 text-amber-700',
    'Visita de acompanhamento': 'bg-teal-50 text-teal-700',
    'Outro': 'bg-gray-100 text-gray-600',
  };

  const stats = {
    total: visits.length,
    thisMonth: visits.filter(v => v.date.startsWith(new Date().toISOString().slice(0, 7))).length,
    producers: producers.length,
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bom dia' : greetingHour < 18 ? 'Boa tarde' : 'Boa noite';

  const tabs = [
    { id: 'overview' as const, icon: <BarChart2 size={15} />, label: 'Resumo' },
    { id: 'visits' as const, icon: <ClipboardList size={15} />, label: 'Visitas' },
    { id: 'producers' as const, icon: <Users size={15} />, label: 'Produtores' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-inter">
      {/* STICKY HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" color="#2E7D32" />
            <div>
              <p className="font-bold text-[#1C1C1C] text-sm leading-none">AgroSuste</p>
              <p className="text-[9px] text-[#2E7D32] font-bold uppercase tracking-widest">Técnico Extensionista</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} />
            <div className="hidden sm:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <div className="w-7 h-7 bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white rounded-lg flex items-center justify-center font-bold text-xs">{user.fullName[0]}</div>
              <div>
                <p className="text-xs font-bold text-[#1C1C1C] leading-none">{user.fullName.split(' ')[0]}</p>
                <p className="text-[9px] text-gray-400">{user.province || 'Extensionista'}</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* WELCOME BANNER */}
        <div className="bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#388E3C] rounded-3xl p-7 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
          <div className="absolute bottom-0 left-32 w-48 h-48 bg-white/5 rounded-full translate-y-24" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Leaf size={16} className="text-white/60" />
                <p className="text-white/60 text-sm">{new Date().toLocaleDateString('pt-MZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <h1 className="text-2xl font-bold mb-1">{greeting}, {user.fullName.split(' ')[0]} 👋</h1>
              <p className="text-white/70 text-sm">Área de actuação: <span className="text-white font-semibold">{user.province || user.district || 'Não definida'}</span></p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 w-fit">
              <PlusCircle size={18} /> Registar Visita
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {[
            { icon: <ClipboardList size={20} />, label: 'Total de Visitas', value: stats.total, gradient: 'from-blue-500 to-indigo-600', trend: stats.total > 0 ? `+${stats.thisMonth} este mês` : null },
            { icon: <Calendar size={20} />, label: 'Visitas Este Mês', value: stats.thisMonth, gradient: 'from-emerald-500 to-teal-600', trend: stats.thisMonth > 0 ? 'Activo este mês' : 'Sem visitas' },
            { icon: <Users size={20} />, label: 'Produtores na Área', value: stats.producers, gradient: 'from-purple-500 to-violet-600', trend: stats.producers > 0 ? 'Na plataforma' : null },
          ].map(s => (
            <div key={s.label} className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${s.gradient} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
              <div className="relative z-10">
                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4">{s.icon}</div>
                <h3 className="text-3xl font-bold leading-none mb-1">{s.value}</h3>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
                {s.trend && <p className="text-white/50 text-[10px] mt-1">{s.trend}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 w-fit shadow-sm">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? 'bg-[#1B5E20] text-white shadow-[0_4px_12px_rgba(27,94,32,0.25)]' : 'text-gray-500 hover:text-[#1B5E20] hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-[#1C1C1C] mb-5 flex items-center gap-2"><Activity size={16} className="text-[#2E7D32]" /> Visitas Recentes</h4>
              {visits.slice(0, 4).length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><ClipboardList size={24} className="text-gray-300" /></div>
                  <p className="text-gray-400 text-sm">Nenhuma visita registada ainda.</p>
                  <button onClick={() => setShowForm(true)} className="mt-2 text-[#2E7D32] text-sm font-bold hover:underline">+ Registar primeira visita</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 4).map(v => (
                    <div key={v.id} className="flex gap-3 items-start p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="w-9 h-9 bg-[#1B5E20]/10 rounded-xl flex items-center justify-center text-[#2E7D32] flex-shrink-0 mt-0.5"><MapPin size={15} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1C1C1C] truncate">{v.type}</p>
                        <p className="text-xs text-gray-400">{v.district} · {new Date(v.date).toLocaleDateString('pt-MZ')}</p>
                        {v.notes && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">"{v.notes}"</p>}
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#2E7D32] mt-1 transition-colors flex-shrink-0" />
                    </div>
                  ))}
                  {visits.length > 4 && (
                    <button onClick={() => setActiveTab('visits')} className="w-full text-center text-xs font-bold text-[#2E7D32] py-2 hover:underline">Ver todas ({visits.length}) →</button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-[#1C1C1C] mb-5 flex items-center gap-2"><Award size={16} className="text-[#2E7D32]" /> O Meu Perfil</h4>
              <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-r from-[#1B5E20]/5 to-transparent rounded-2xl border border-[#1B5E20]/10">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.fullName[0]}
                </div>
                <div>
                  <p className="font-bold text-[#1C1C1C]">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{user.status === 'active' ? '● Ativo' : '○ Inativo'}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Província', value: user.province || 'N/A' },
                  { label: 'Distrito', value: user.district || 'N/A' },
                  { label: 'Total Visitas', value: `${stats.total} visitas registadas` },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{f.label}</span>
                    <span className="text-sm font-semibold text-[#1C1C1C]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VISITS TAB */}
        {activeTab === 'visits' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {visits.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><ClipboardList size={28} className="text-gray-300" /></div>
                  <p className="text-gray-400 font-medium mb-1">Nenhuma visita registada.</p>
                  <p className="text-gray-300 text-sm mb-4">As suas visitas técnicas aparecerão aqui.</p>
                  <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-[#1B5E20] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg">
                    <PlusCircle size={16} /> Registar primeira visita
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-7 py-4 border-b border-gray-50 flex justify-between items-center">
                    <p className="text-sm font-bold text-[#1C1C1C]">{visits.length} visita{visits.length !== 1 ? 's' : ''} registada{visits.length !== 1 ? 's' : ''}</p>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <PlusCircle size={14} /> Nova Visita
                    </button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        {['Data', 'Tipo de Visita', 'Distrito', 'Notas'].map(h => (
                          <th key={h} className="py-3.5 px-7 first:px-7 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {visits.map(v => (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-7">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#1B5E20]/8 rounded-lg flex items-center justify-center"><Calendar size={13} className="text-[#2E7D32]" /></div>
                              <div>
                                <p className="text-sm font-bold text-[#1C1C1C]">{new Date(v.date).toLocaleDateString('pt-MZ')}</p>
                                <p className="text-[10px] text-gray-400">{new Date(v.createdAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${visitTypeColors[v.type] || 'bg-gray-100 text-gray-600'}`}>{v.type}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin size={12} className="text-gray-400" />{v.district || '—'}
                            </div>
                          </td>
                          <td className="py-4 px-7 max-w-[200px]">
                            {v.notes ? <p className="text-sm text-gray-500 truncate italic">"{v.notes}"</p> : <span className="text-gray-300 text-sm">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}

        {/* PRODUCERS TAB */}
        {activeTab === 'producers' && (
          <div className="animate-in fade-in duration-300">
            {producers.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users size={28} className="text-gray-300" /></div>
                <p className="text-gray-400 font-medium">Nenhum produtor registado no sistema.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-4 px-1">{producers.length} produtor{producers.length !== 1 ? 'es' : ''} registado{producers.length !== 1 ? 's' : ''} na plataforma</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {producers.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#2E7D32]/20 transition-all duration-300 group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#1B5E20]/10 to-[#2E7D32]/20 text-[#2E7D32] rounded-2xl flex items-center justify-center font-bold text-lg">
                          {p.fullName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#1C1C1C] leading-none truncate">{p.fullName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.province || p.country}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="text-gray-300">@</span>{p.email}
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="text-gray-300">📱</span>{p.phone}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.status === 'active' ? '● Ativo' : '○ Inativo'}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-xs font-bold text-[#2E7D32] bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all">
                          Ver Perfil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* MODAL: REGISTAR VISITA */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Registar Visita Técnica</h3>
                <p className="text-white/70 text-xs mt-0.5">{new Date().toLocaleDateString('pt-MZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipo de Visita</label>
                <select required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm font-medium bg-white transition-all" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {visitTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Data</label>
                  <input type="date" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm transition-all" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Distrito</label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm transition-all" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="Ex: Nampula" />
                </div>
              </div>
              {producers.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Produtor Assistido <span className="text-gray-300 normal-case font-medium">(Opcional)</span></label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] outline-none text-sm font-medium bg-white" value={form.producerEntityId} onChange={e => setForm({ ...form, producerEntityId: e.target.value })}>
                    <option value="">Selecionar produtor...</option>
                    {producers.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Notas da Visita</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 outline-none text-sm resize-none transition-all" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações, recomendações técnicas, resultados..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(27,94,32,0.3)] disabled:opacity-70 transition-all flex items-center justify-center gap-2">
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A registar...</>
                    : <><CheckCircle size={16} /> Registar Visita</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtensionistDashboard;
