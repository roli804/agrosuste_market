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
            <span className="text-2xl">🌱</span>
            <span className="font-poppins font-bold text-lg text-[#1C1C1C] tracking-tight">AgroSuste <span className="text-[#2E7D32]">Admin</span></span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hidden-scroll py-6 space-y-2">
          {renderSidebarItem('dashboard', <LayoutDashboard size={20} />, 'Dashboard')}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Gestão de Perfis</p></div>
          {renderSidebarItem('users', <Users size={20} />, 'Utilizadores')}
          {renderSidebarItem('suppliers', <Store size={20} />, 'Fornecedores')}
          {renderSidebarItem('buyers', <ShoppingBag size={20} />, 'Compradores')}
          {renderSidebarItem('transporters', <Truck size={20} />, 'Transportadores')}
          {renderSidebarItem('partners', <ShieldCheck size={20} />, 'Parceiros Estratégicos')}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Operações</p></div>
          {renderSidebarItem('products', <Package size={20} />, 'Produtos')}
          {renderSidebarItem('categories', <Folder size={20} />, 'Categorias')}
          {renderSidebarItem('orders', <FileText size={20} />, 'Pedidos')}
          {renderSidebarItem('logistics', <TrendingUp size={20} />, 'Logística')}
          {renderSidebarItem('ratings', <Star size={20} />, 'Avaliações')}
          <div className="pt-4 pb-2 px-6"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Sistema</p></div>
          {renderSidebarItem('reports', <PieChart size={20} />, 'Relatórios Financeiros')}
        </div>
        <div className="p-6 border-t border-[#E0E0E0]">
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
             <p className="text-sm text-[#6D6D6D] mt-1">Visão geral e gestão operacional do marketplace.</p>
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
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Identificação</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Tipo/Papel</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Contato</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider text-right">Ações</th>
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
                 <p className="text-xs text-[#6D6D6D] mb-4">Parceiro Estratégico &bull; {u.location || u.district || 'Global'}</p>
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
                {/* Outros filtros minguados para manter layout focado, mas mantendo a lógica de state intacta para uso futuro */}
                <div className="flex gap-4">
                   <button onClick={generatePDF} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95">Exportar Relatório PDF</button>
                </div>
            </div>
            {/* Old legacy tables were removed but PDF keeps working since logical states exist */}
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E0E0E0] shadow-sm">
                <PieChart size={48} className="mx-auto text-[#A0A0A0] mb-4 opacity-50" />
                <h3 className="font-poppins text-xl font-bold text-[#1C1C1C] mb-2">Relatórios Detalhados</h3>
                <p className="text-sm text-[#6D6D6D]">Exporte os relatórios PDF oficiais para analisar lucros, comissões de parceiros e transações do marketplace.</p>
            </div>
          </div>
        )}

        {['products', 'categories', 'orders', 'logistics', 'ratings', 'settings'].includes(activeTab) && (
           <div className="min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-[20px] border border-[#E0E0E0]/50 border-dashed animate-in fade-in">
              <span className="text-4xl mb-4 opacity-30 px-4 py-2 bg-gray-100 rounded-2xl filter grayscale">🚧</span>
              <h3 className="text-lg font-bold text-[#1C1C1C]">Módulo em Desenvolvimento</h3>
              <p className="text-sm text-[#A0A0A0] max-w-sm text-center mt-2">Esta secção operativa faz parte da próxima fase de implantação SaaS do AgroConnect.</p>
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
                   <div className="p-4 bg-gray-50 rounded-xl border border-[#E0E0E0]/50"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">Província</p><p className="text-sm font-semibold text-[#1C1C1C]">{selectedUser.province || 'N/A'}</p></div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-[#E0E0E0]/50"><p className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">Localidade/Distrito</p><p className="text-sm font-semibold text-[#1C1C1C]">{selectedUser.localidade || selectedUser.district || 'N/A'}</p></div>
                </div>
                {/* Simulated action buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#E0E0E0]">
                   <button className="flex-1 py-3 bg-[#10B981] text-white text-sm font-bold rounded-xl hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 shadow-sm"><CheckCircle size={16}/> Aprovar Registo</button>
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
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
               <div>
                  <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Nome Completo</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Tipo de Perfil</label>
                    <select required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                      <option value={UserRole.SELLER}>Fornecedor/Vendedor</option>
                      <option value={UserRole.BUYER}>Comprador</option>
                      <option value={UserRole.TRANSPORTER}>Transportador</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-[#6D6D6D] ml-1 mb-1 block">Telefone</label>
                    <input required className="w-full px-4 py-3 rounded-xl bg-white border border-[#E0E0E0] focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none text-sm font-medium transition-all" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                 </div>
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="submit" className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(46,125,50,0.2)] transition-all">Registar Utilizador</button>
               </div>
            </form>
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
const ArrowRight = ({ size=20, className="" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default AdminDashboard;
