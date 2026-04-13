import React, { useState, useEffect } from 'react';
import { User, AssistanceVisit, UserRole, LogType } from '../types';
import { mockDb } from '../lib/mock_db';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { ClipboardList, MapPin, Calendar, Users, PlusCircle, XCircle, CheckCircle, LogOut } from 'lucide-react';
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
    const all = mockDb.getUsers();
    setProducers(all.filter(u => u.role === UserRole.SELLER));
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
    mockDb.logActivity({
      userId: user.id,
      userName: user.fullName,
      userRole: UserRole.EXTENSIONIST,
      type: LogType.SYSTEM,
      description: `Visita técnica registada em ${form.district}: ${form.type}`,
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ producerEntityId: '', date: new Date().toISOString().split('T')[0], type: 'Assistência técnica', notes: '', district: user.district || '' });
  };

  const visitTypes = [
    'Assistência técnica', 'Diagnóstico de pragas', 'Monitoramento de colheita',
    'Formação agrícola', 'Registo de produção', 'Visita de acompanhamento', 'Outro',
  ];

  const stats = {
    total: visits.length,
    thisMonth: visits.filter(v => v.date.startsWith(new Date().toISOString().slice(0, 7))).length,
    producers: producers.length,
  };

  const tab = (id: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === id ? 'bg-[#2E7D32] text-white shadow-md' : 'bg-white text-[#6D6D6D] border border-[#E0E0E0] hover:border-[#2E7D32]/30 hover:text-[#2E7D32]'}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-inter">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" color="#2E7D32" />
            <div>
              <p className="font-poppins font-bold text-[#1C1C1C] text-sm leading-none">AgroSuste</p>
              <p className="text-[10px] text-[#2E7D32] font-semibold uppercase tracking-wide">Técnico Extensionista</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} />
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-bold text-[#1C1C1C] leading-none">{user.fullName.split(' ')[0]}</p>
              <p className="text-[10px] text-[#A0A0A0]">{user.province || 'Extensionista'}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white rounded-xl flex items-center justify-center font-bold text-sm">
              {user.fullName[0]}
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-[#1C1C1C]">Bom dia, {user.fullName.split(' ')[0]} 👋</h1>
            <p className="text-[#6D6D6D] text-sm mt-1">Área de Actuação: <strong>{user.province || user.district || 'Não definida'}</strong></p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#2E7D32] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(46,125,50,0.2)] transition-all hover:bg-[#1B5E20] active:scale-95">
            <PlusCircle size={18} /> Registar Visita
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <ClipboardList size={22} />, label: 'Total de Visitas', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: <Calendar size={22} />, label: 'Este Mês', value: stats.thisMonth, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: <Users size={22} />, label: 'Produtores na Área', value: stats.producers, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-[#E0E0E0]/50 hover:-translate-y-1 transition-transform">
              <div className={`p-3 ${s.bg} ${s.color} w-fit rounded-xl mb-3`}>{s.icon}</div>
              <h3 className="text-3xl font-bold text-[#1C1C1C]">{s.value}</h3>
              <p className="text-xs text-[#A0A0A0] font-semibold uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          {tab('overview', <ClipboardList size={16} />, 'Resumo')}
          {tab('visits', <CheckCircle size={16} />, 'Visitas Registadas')}
          {tab('producers', <Users size={16} />, 'Produtores')}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E0E0E0]/50">
              <h4 className="font-poppins font-bold text-[#1C1C1C] mb-4">Visitas Recentes</h4>
              {visits.slice(0, 4).length === 0 ? (
                <p className="text-sm text-[#A0A0A0] text-center py-6">Nenhuma visita registada ainda.</p>
              ) : visits.slice(0, 4).map(v => (
                <div key={v.id} className="flex gap-3 items-start mb-4 last:mb-0">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1C1C]">{v.type}</p>
                    <p className="text-xs text-[#A0A0A0]">{v.district} • {new Date(v.date).toLocaleDateString('pt-MZ')}</p>
                    {v.notes && <p className="text-xs text-[#6D6D6D] mt-1 line-clamp-1">{v.notes}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E0E0E0]/50">
              <h4 className="font-poppins font-bold text-[#1C1C1C] mb-4">Dados do Perfil</h4>
              <div className="space-y-3">
                {[
                  { label: 'Nome', value: user.fullName },
                  { label: 'Email', value: user.email },
                  { label: 'Província', value: user.province || 'N/A' },
                  { label: 'Distrito', value: user.district || 'N/A' },
                  { label: 'Estado', value: user.status === 'active' ? '✅ Ativo' : '⚠️ Inativo' },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center py-2 border-b border-[#F5F5F5] last:border-0">
                    <span className="text-xs font-bold text-[#A0A0A0] uppercase">{f.label}</span>
                    <span className="text-sm font-semibold text-[#1C1C1C]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0]/50 overflow-hidden">
            {visits.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-[#A0A0A0] font-medium">Nenhuma visita registada ainda.</p>
                <button onClick={() => setShowForm(true)} className="mt-4 text-[#2E7D32] text-sm font-semibold hover:underline">
                  + Registar primeira visita
                </button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E0E0E0]">
                    {['Data', 'Tipo', 'Distrito', 'Notas'].map(h => (
                      <th key={h} className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {visits.map(v => (
                    <tr key={v.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-4 px-6 text-sm font-medium text-[#1C1C1C]">{new Date(v.date).toLocaleDateString('pt-MZ')}</td>
                      <td className="py-4 px-6"><span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">{v.type}</span></td>
                      <td className="py-4 px-6 text-sm text-[#6D6D6D]">{v.district || '—'}</td>
                      <td className="py-4 px-6 text-sm text-[#6D6D6D] max-w-[200px] truncate">{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'producers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {producers.length === 0 ? (
              <div className="col-span-3 bg-white rounded-2xl p-12 text-center shadow-sm border border-[#E0E0E0]/50">
                <p className="text-[#A0A0A0]">Nenhum produtor registado no sistema.</p>
              </div>
            ) : producers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]/50 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#2E7D32]/10 text-[#2E7D32] rounded-xl flex items-center justify-center font-bold">
                    {p.fullName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1C1C1C] leading-none">{p.fullName}</p>
                    <p className="text-xs text-[#A0A0A0] mt-0.5">{p.province || p.country}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6D6D6D]">📧 {p.email}</p>
                  <p className="text-xs text-[#6D6D6D]">📱 {p.phone || '—'}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#2E7D32] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-poppins font-bold text-lg">Registar Visita Técnica</h3>
                <p className="text-xs opacity-80">{new Date().toLocaleDateString('pt-MZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <XCircle size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#6D6D6D] uppercase mb-1 block">Tipo de Visita</label>
                <select required className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm font-medium" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {visitTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] uppercase mb-1 block">Data</label>
                  <input type="date" required className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] uppercase mb-1 block">Distrito</label>
                  <input required className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="Ex: Nampula" />
                </div>
              </div>
              {producers.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[#6D6D6D] uppercase mb-1 block">Produtor Assistido (Opcional)</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm" value={form.producerEntityId} onChange={e => setForm({ ...form, producerEntityId: e.target.value })}>
                    <option value="">Selecionar produtor...</option>
                    {producers.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-[#6D6D6D] uppercase mb-1 block">Notas da Visita</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] focus:border-[#2E7D32] outline-none text-sm resize-none" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações, recomendações técnicas..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-[#E0E0E0] rounded-xl text-sm font-semibold text-[#6D6D6D] hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-70">
                  {submitting ? 'A registar...' : '✅ Registar Visita'}
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
