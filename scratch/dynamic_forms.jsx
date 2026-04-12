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
