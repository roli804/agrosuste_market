
import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, PaymentAccount, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';
import { getVerificationRequirements, VerificationRequirements } from '../lib/geography_api';
import { useLanguage } from '../LanguageContext';
import { LogType } from '../types';
import { mockDb } from '../lib/mock_db';
import { WORLD_LANGUAGES } from '../constants';

interface ProfileProps {
  user: User | null;
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateAccounts: (accounts: PaymentAccount[]) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, products, onAddProduct, onUpdateAccounts }) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'finance' | 'orders'>('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.country) {
      getVerificationRequirements(user.country).then(setRequirements);
    }
  }, [user?.country]);

  if (!user) return null;

  const isSeller = user.role === UserRole.SELLER;
  const isAdmin = user.role === UserRole.ADMIN;
  const isTransporter = user.role === UserRole.TRANSPORTER;
  
  // Admin sees all products, others see only their own
  const myProducts = isAdmin ? products : products.filter(p => p.producerId === user.id);

  const handleWithdrawal = () => {
    if ((user.balance || 0) <= 0) {
      alert(t('profile_balance_zero'));
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      alert(t('profile_withdrawal_success'));
    }, 2500);
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    const formData = new FormData(e.currentTarget);

    setTimeout(() => {
      const newProd: Product = {
        id: Date.now().toString(),
        producerId: user.id,
        producerName: user.fullName,
        categoryId: formData.get('category') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        unit: formData.get('unit') as string,
        stock: Number(formData.get('stock')),
        images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'],
        isDried: true
      };
      onAddProduct(newProd);

      // Registar Log de Atividade
      mockDb.logActivity({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        type: LogType.PRODUCT_ADD,
        description: `Adicionou novo produto: ${newProd.name} (${newProd.unit})`,
        details: { productId: newProd.id, price: newProd.price }
      });

      setProcessing(false);
      setShowAddProduct(false);
    }, 2000);
  };

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    const formData = new FormData(e.currentTarget);

    setTimeout(() => {
      const newAcc: PaymentAccount = {
        id: Date.now().toString(),
        type: formData.get('accType') as any,
        method: formData.get('method') as any,
        provider: formData.get('provider') as string,
        accountNumber: formData.get('number') as string,
        holderName: formData.get('holder') as string,
        isVerified: true,
        linkedAt: new Date().toISOString()
      };
      onUpdateAccounts([...user.linkedAccounts, newAcc]);
      setProcessing(false);
      setShowAddAccount(false);
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">

      {/* Header Operacional */}
      <div className="bg-white rounded-[3rem] shadow-soft p-10 border border-gray-100 flex flex-col md:flex-row items-center gap-10">
        <div className="w-40 h-40 bg-[#2E5C4E]/5 rounded-[4rem] flex items-center justify-center text-7xl shadow-inner border-2 border-[#2E5C4E]/10 overflow-hidden relative">
          {isSeller ? '🚜' : isTransporter ? '🚛' : '👤'}
        </div>
        <div className="flex-grow text-center md:text-left space-y-4">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
            <h1 className="text-4xl font-semibold text-gray-900">{user.fullName}</h1>
            <span className="bg-[#5B8C51] text-white text-[8px] font-semibold px-4 py-2 rounded-full   shadow-lg">{t('profile_account_validated')}</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="badge-profile"><span className="badge-label">{t('profile_operation')}</span><span className="badge-value">{user.country}</span></div>
            <div className="badge-profile"><span className="badge-label">{t('profile_function')}</span><span className="badge-value ">{user.role}</span></div>
            <div className="badge-profile"><span className="badge-label">{t('profile_reputation')}</span><span className="badge-value text-[#5B8C51]">A+ {t('profile_official')}</span></div>
          </div>
        </div>
      </div>

      {/* Tabs Funcionais */}
      <div className="flex bg-white p-2 rounded-3xl shadow-soft border border-gray-50 overflow-x-auto gap-2 no-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>{t('profile_tab_general')}</button>
        <button onClick={() => setActiveTab('orders')} className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}>{t('profile_tab_orders')}</button>
        {(isSeller || isAdmin) && <button onClick={() => setActiveTab('inventory')} className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}>{t('profile_tab_inventory')}</button>}
        <button onClick={() => setActiveTab('finance')} className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}>{t('profile_tab_finance')}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">

          {activeTab === 'overview' && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-soft border border-gray-100 space-y-10">
              <h2 className="text-2xl font-semibold text-gray-900">{t('profile_tab_general')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="field-card"><span className="field-label">{t('profile_contact')}</span><span className="field-value">{user.phone}</span></div>
                <div className="field-card"><span className="field-label">{t('profile_email')}</span><span className="field-value lowercase">{user.email}</span></div>
                <div className="field-card"><span className="field-label">{t('profile_status')}</span><span className="field-value text-green-600">{t('profile_active')}</span></div>
                <div className="field-card"><span className="field-label">{t('profile_location')}</span><span className="field-value">{user.province || t('admin_modal_not_def')}</span></div>
              </div>

              <div className="pt-10 border-t border-gray-100">
                <h3 className="text-[10px] font-semibold text-gray-400   mb-6">⚙️ {t('profile_interface_settings')}</h3>
                <div className="field-card">
                  <span className="field-label">{t('profile_language_label')}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {WORLD_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-semibold   transition-all ${language === lang.code ? 'bg-[#2E5C4E] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-gray-100 text-center space-y-6">
              <div className="text-6xl opacity-20">📄</div>
              <p className="text-gray-400 font-semibold text-xs">{t('profile_no_orders')}</p>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-2xl font-semibold text-gray-900">{t('profile_tab_finance')}</h2>
                <button onClick={() => setShowAddAccount(true)} className="bg-[#2E5C4E] text-white text-[10px] font-semibold px-8 py-4 rounded-2xl   shadow-xl">{t('profile_link_btn')}</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {user.linkedAccounts.map(acc => (
                  <div key={acc.id} className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-100 flex justify-between items-center hover:border-[#5B8C51] transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl">
                        {acc.method === PaymentMethod.MPESA ? '📱' : '🏦'}
                      </div>
                      <div><h4 className="font-semibold text-gray-900 text-sm">{acc.holderName}</h4><p className="text-[10px] text-gray-400 font-bold mt-1">{acc.accountNumber}</p></div>
                    </div>
                    <span className="bg-green-50 text-green-700 text-[8px] font-semibold px-4 py-2 rounded-full  border border-green-100">{t('profile_active_status')}</span>
                  </div>
                ))}
                {user.linkedAccounts.length === 0 && (
                  <div className="bg-gray-50/50 p-16 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
                    <p className="text-gray-300 font-semibold text-[10px]">{t('profile_no_accounts')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && isSeller && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-2xl font-semibold text-gray-900">{t('profile_tab_inventory')}</h2>
                <button onClick={() => setShowAddProduct(true)} className="bg-[#5B8C51] text-white text-[10px] font-semibold px-8 py-4 rounded-2xl   shadow-xl">{t('profile_add_harvest')}</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myProducts.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-gray-100 flex gap-6 group hover:border-green-100">
                    <img src={p.images[0]} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
                    <div className="flex flex-col justify-center flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm ">{p.name}</h4>
                          <p className="text-[#2E5C4E] font-semibold text-xl mt-1">{p.price.toLocaleString()} MZN</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all">
                            <span className="text-[10px]">✏️</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Deseja realmente apagar este produto do mercado?')) {
                                // setProducts(products.filter(x => x.id !== p.id));
                              }
                            }}
                            className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all"
                          >
                            <span className="text-[10px]">🗑️</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] font-semibold text-gray-400 mt-2">{t('profile_stock')}: {p.stock} {p.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Financeira */}
        <div className="space-y-8">
          <div className="bg-[#2E5C4E] p-12 rounded-[4rem] text-white shadow-strong relative overflow-hidden">
            <p className="text-[10px] font-semibold opacity-60 mb-4">{t('profile_available_balance')}</p>
            <h3 className="text-6xl font-semibold  mb-12">{(user.balance || 0).toLocaleString()} <span className="text-xl opacity-40">MZN</span></h3>
            <button
              onClick={handleWithdrawal}
              disabled={processing}
              className={`w-full py-6 rounded-2xl text-[10px] font-semibold   shadow-2xl transition-all ${processing ? 'bg-white/20 text-white animate-pulse' : 'bg-white text-[#2E5C4E] hover:scale-105 active:scale-95'}`}
            >
              {processing ? t('profile_validating') : t('profile_withdrawal_btn')}
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-soft border border-gray-100 space-y-8">
            <h4 className="text-[10px] font-semibold text-gray-400">{t('profile_status_label')}</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[9px] font-semibold text-gray-800  leading-none">{t('profile_online')}</p></div>
              <div className="flex items-center gap-4"><div className="w-2 h-2 bg-gray-200 rounded-full"></div><p className="text-[9px] font-semibold text-gray-400  leading-none">{t('profile_validated')}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADICIONAR PRODUTO */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#2E5C4E] p-12 text-white text-center">
              <h3 className="text-4xl font-semibold   leading-none">{t('profile_new_harvest')}</h3>
              <p className="text-[9px] font-bold opacity-60 mt-4">{t('profile_new_harvest_desc')}</p>
            </div>
            <form onSubmit={handleAddProduct} className="p-12 space-y-6">
              <div className="space-y-2">
                <label className="modal-label">{t('profile_prod_name')}</label>
                <input name="name" required className="modal-input" placeholder={t('profile_ex_product')} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="modal-label">{t('profile_price')}</label>
                  <input name="price" type="number" required className="modal-input" placeholder={t('profile_ex_price')} />
                </div>
                <div className="space-y-2">
                  <label className="modal-label">{t('profile_unit')}</label>
                  <input name="unit" required className="modal-input" placeholder={t('profile_ex_unit')} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="modal-label">{t('profile_available_stock')}</label>
                <input name="stock" type="number" required className="modal-input" placeholder={t('profile_ex_stock')} />
              </div>
              <div className="space-y-2">
                <label className="modal-label">{t('profile_category')}</label>
                <select name="category" className="modal-input">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-grow bg-gray-50 text-gray-400 font-semibold py-6 rounded-3xl text-[10px] hover:text-[#5B8C51]">{t('profile_cancel')}</button>
                <button type="submit" disabled={processing} className="flex-grow bg-[#5B8C51] text-white font-semibold py-6 rounded-3xl text-[10px]   shadow-2xl">
                  {processing ? t('profile_publishing') : t('profile_publish_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VINCULAR CONTA */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#2E5C4E] p-12 text-white text-center">
              <h3 className="text-4xl font-semibold   leading-none">{t('profile_link_account_title')}</h3>
              <p className="text-[9px] font-bold opacity-60 mt-4">{t('profile_link_account_desc')}</p>
            </div>
            <form onSubmit={handleAddAccount} className="p-12 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="modal-label">{t('profile_service')}</label>
                  <select name="method" className="modal-input">
                    <option value={PaymentMethod.MPESA}>{t('checkout_mpesa')}</option>
                    <option value={PaymentMethod.EMOLA}>{t('checkout_emola')}</option>
                    <option value={PaymentMethod.BANK_LOCAL}>{t('profile_bank_local')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="modal-label">{t('profile_provider')}</label>
                  <select name="provider" className="modal-input">
                    <option value="Vodacom">Vodacom</option>
                    <option value="Movitel">Movitel</option>
                    <option value="BIM">Millennium BIM</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="modal-label">{t('profile_number')}</label>
                <input name="number" required className="modal-input" placeholder={t('profile_ex_phone')} />
              </div>
              <div className="space-y-2">
                <label className="modal-label">{t('profile_holder')}</label>
                <input name="holder" required className="modal-input" placeholder={t('profile_name_as_id')} />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowAddAccount(false)} className="flex-grow bg-gray-50 text-gray-400 font-semibold py-6 rounded-3xl text-[10px] hover:text-[#5B8C51]">{t('profile_cancel')}</button>
                <button type="submit" disabled={processing} className="flex-grow bg-[#5B8C51] text-white font-semibold py-6 rounded-3xl text-[10px]   shadow-2xl">
                  {processing ? t('profile_validating') : t('profile_link_now')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tab-btn { padding: 1.25rem 2.5rem; border-radius: 1.5rem; font-size: 10px; font-weight: 900; text-transform: none; letter-spacing: 0.2em; color: #9CA3AF; transition: all 0.3s; white-space: nowrap; }
        .tab-btn.active { background-color: #2E5C4E; color: white; box-shadow: 0 10px 25px -5px rgba(27, 94, 32, 0.3); }
        .badge-profile { background-color: #F9FAFB; padding: 1rem 1.5rem; border-radius: 1.25rem; border: 1px solid #F1F5F9; display: flex; flex-direction: column; }
        .badge-label { font-size: 8px; font-weight: 900; color: #94A3B8; text-transform: none; letter-spacing: 0.15em; margin-bottom: 0.25rem; }
        .badge-value { font-weight: 800; color: #1E293B; font-size: 0.7rem; }
        .field-card { background-color: #F9FAFB; padding: 1.75rem; border-radius: 1.75rem; border: 1px solid #F1F5F9; }
        .field-label { font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: none; letter-spacing: 0.2em; display: block; margin-bottom: 0.5rem; }
        .field-value { font-weight: 800; color: #2E5C4E; font-size: 1rem; }
        .modal-label { font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: none; letter-spacing: 0.2em; margin-left: 0.5rem; }
        .modal-input { width: 100%; padding: 1.25rem 1.5rem; border-radius: 1.5rem; border: 2.5px solid #F3F4F6; background-color: #F9FAFB; font-size: 0.85rem; font-weight: 800; color: #2E5C4E; outline: none; transition: all 0.2s; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Profile;
