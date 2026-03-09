
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole, EntityType } from '../types';
import Logo from '../components/Logo';
import { MOZ_GEOGRAPHY, WORLD_COUNTRIES, CATEGORIES } from '../constants';
import { getCountryPhoneInfo, CountryPhoneInfo, verifyEmailCredibility } from '../lib/geography_api';
import { Eye, EyeOff } from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Upload } from 'lucide-react';
import { mockDb } from '../lib/mock_db';
import { LogType } from '../types';

type AuthMode = 'login' | 'signup';

const Auth: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // --- FORM STATE (CONFORME DOCUMENTO ESTRUTURAL) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Moçambique');
  const [entityType, setEntityType] = useState<EntityType>(EntityType.INDIVIDUAL);
  const [entityName, setEntityName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [posto, setPosto] = useState(''); // Obrigatório
  const [localidade, setLocalidade] = useState(''); // Obrigatório
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'seller') {
      setMode('signup');
      setRole(UserRole.SELLER);
      setEntityType(EntityType.INDIVIDUAL);
    }
  }, [location.search]);
  const [phone, setPhone] = useState('');
  const [commPhone, setCommPhone] = useState(''); // Contacto Comercial Principal
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Documentos para Empresa/Cooperativa
  const [nuit, setNuit] = useState('');
  const [alvara, setAlvara] = useState('');
  const [estatuto, setEstatuto] = useState('');
  const [boletim, setBoletim] = useState('');

  // Campos para Parceiros/ONGs
  const [partnerLogo, setPartnerLogo] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('');

  const [phoneMeta, setPhoneMeta] = useState<CountryPhoneInfo>({
    prefix: '+258',
    minLength: 9,
    maxLength: 9,
    example: '841234567',
    validPrefixes: ['82', '83', '84', '85', '86', '87']
  });

  useEffect(() => {
    if (mode === 'signup') getCountryPhoneInfo(country).then(setPhoneMeta);
  }, [country, mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const emailCheck = await verifyEmailCredibility(email);
        if (!emailCheck.isValid) throw new Error(emailCheck.reason);

        if (country === 'Moçambique' && (!posto || !localidade)) {
          throw new Error("Posto Administrativo e Localidade são obrigatórios para a estrutura nacional.");
        }

        const currentPath = window.location.origin + window.location.pathname;
        const redirectUrl = currentPath.endsWith('/') ? `${currentPath}#/auth` : `${currentPath}/#/auth`;

        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              phone: `${phoneMeta.prefix}${phone}`,
              commercial_phone: `${phoneMeta.prefix}${commPhone}`,
              role,
              entity_type: entityType,
              entity_name: entityType === EntityType.INDIVIDUAL ? fullName : entityName,
              province,
              district,
              posto_administrativo: posto,
              localidade_bairro: localidade,
              country,
              status: 'active',
              balance: 0,
              isApproved: false,
              linked_accounts: [],
              categories: selectedCategories,
              documents: (entityType === EntityType.COMPANY || entityType === EntityType.COOPERATIVE) ? {
                nuit,
                alvara,
                estatuto,
                boletim
              } : undefined,
              logo: (role === UserRole.STRATEGIC_PARTNER || entityType === EntityType.NGO_INTL) ? partnerLogo : undefined,
              location: (role === UserRole.STRATEGIC_PARTNER || entityType === EntityType.NGO_INTL) ? partnerLocation : undefined
            }
          }
        });
        if (err) throw err;
        setShowSuccessMessage(true);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message.includes('rede') || err.message.includes('network')) {
        console.warn('Conexão com o Supabase falhou. Utilizando Mock Session para testes locais.');

        // Simular um login/registo com sucesso criando um utilizador mock
        const mockSessionUser = {
          id: `local-mock-${Date.now()}`,
          email: email,
          user_metadata: {
            full_name: fullName || email.split('@')[0],
            phone: phone ? `${phoneMeta.prefix}${phone}` : '',
            commercial_phone: commPhone ? `${phoneMeta.prefix}${commPhone}` : '',
            role: role,
            entity_type: entityType,
            entity_name: entityType === EntityType.INDIVIDUAL ? (fullName || email) : entityName,
            province: province,
            district: district,
            posto_administrativo: posto,
            localidade_bairro: localidade,
            country: country,
            status: 'active',
            balance: 0
          }
        };

        localStorage.setItem('mock_user', JSON.stringify(mockSessionUser));

        // Persistir na base de dados mock para que outros componentes (como Dashboard) vejam
        mockDb.saveUser({
          id: mockSessionUser.id,
          email: mockSessionUser.email,
          fullName: mockSessionUser.user_metadata.full_name,
          phone: mockSessionUser.user_metadata.phone,
          commercialPhone: mockSessionUser.user_metadata.commercial_phone,
          country: mockSessionUser.user_metadata.country,
          province: mockSessionUser.user_metadata.province,
          district: mockSessionUser.user_metadata.district,
          role: mockSessionUser.user_metadata.role,
          entityType: mockSessionUser.user_metadata.entity_type,
          entityName: mockSessionUser.user_metadata.entity_name,
          posto: mockSessionUser.user_metadata.posto_administrativo,
          localidade: mockSessionUser.user_metadata.localidade_bairro,
          status: 'active',
          isApproved: false,
          linkedAccounts: [],
          balance: 0
        });

        // Registar Log de Atividade
        mockDb.logActivity({
          userId: mockSessionUser.id,
          userName: mockSessionUser.user_metadata.full_name,
          userRole: mockSessionUser.user_metadata.role,
          type: mode === 'signup' ? LogType.SIGNUP : LogType.LOGIN,
          description: mode === 'signup'
            ? `Utilizador ${mockSessionUser.user_metadata.full_name} registou-se via Mock Mode.`
            : `Utilizador ${mockSessionUser.user_metadata.full_name} iniciou sessão via Mock Mode.`
        });

        // Recarregar a página para o App.tsx absorver a nova "sessão" mock
        window.location.href = '/';
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="max-w-xl mx-auto my-32 p-16 bg-white rounded-[5rem] shadow-strong text-center space-y-10 border-4 border-amber-50 animate-in zoom-in">
        <div className="w-40 h-40 bg-amber-50 text-amber-600 rounded-[4rem] flex items-center justify-center text-7xl mx-auto">📬</div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">{t('auth_success_title')}</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">{t('auth_success_desc')}</p>
        </div>
        <button onClick={() => setShowSuccessMessage(false)} className="w-full bg-[#1B5E20] text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl">{t('auth_success_btn')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 pb-24">
      <div className="bg-white rounded-[4rem] shadow-strong overflow-hidden border border-gray-100">
        <div className="bg-[#1B5E20] p-12 text-white text-center flex flex-col items-center relative">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            {t('nav_auth')}
          </button>
          <Logo className="w-20 h-20 mb-4" color="white" />
          <h2 className="text-4xl font-black tracking-tighter uppercase">{mode === 'login' ? t('auth_login_title') : t('auth_signup_title')}</h2>
          <p className="text-[10px] font-black opacity-40 mt-4 uppercase tracking-[0.4em]">{t('auth_tagline')}</p>
        </div>

        <form onSubmit={handleAuth} className="p-12 space-y-10">
          {error && <div className="bg-red-50 text-red-600 text-[10px] font-black p-6 rounded-3xl border border-red-100 uppercase tracking-widest animate-bounce">⚠️ {error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {mode === 'signup' && (
              <>
                <div className="md:col-span-2 space-y-2">
                  <label className="auth-label">{t('auth_full_name')}</label>
                  <input required className="auth-input" placeholder="Ex: Jaime Cebola" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="auth-label">{t('auth_country')}</label>
                  <select required className="auth-input" value={country} onChange={e => setCountry(e.target.value)}>
                    {WORLD_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="auth-label">{t('auth_entity_type')}</label>
                  <select required className="auth-input" value={entityType} onChange={e => setEntityType(e.target.value as EntityType)}>
                    <option value={EntityType.INDIVIDUAL}>👤 {t('auth_individual')}</option>
                    <option value={EntityType.ASSOCIATION}>🤝 {t('auth_association')}</option>
                    <option value={EntityType.COOPERATIVE}>🏢 {t('auth_cooperative')}</option>
                    <option value={EntityType.COMPANY}>🏗️ {t('auth_company')}</option>
                    <option value={EntityType.NGO_INTL}>🌍 {t('auth_ngo')}</option>
                    <option value={EntityType.OTHER}>❓ {t('auth_other')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="auth-label">{t('auth_role')}</label>
                  <select required className="auth-input" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                    <option value={UserRole.SELLER}>🚜 {t('auth_seller')}</option>
                    <option value={UserRole.BUYER}>🛒 {t('auth_buyer')}</option>
                    <option value={UserRole.TRANSPORTER}>🚛 {t('auth_transporter')}</option>
                    <option value={UserRole.EXTENSIONIST}>📋 {t('auth_extensionist')}</option>
                    <option value={UserRole.STRATEGIC_PARTNER}>🤝 {t('auth_strategic_partner')}</option>
                    <option value={UserRole.OTHER}>❓ {t('auth_other')}</option>
                  </select>
                </div>

                {country === 'Moçambique' ? (
                  <>
                    <div className="space-y-2">
                      <label className="auth-label">{t('auth_province')}</label>
                      <select required className="auth-input" value={province} onChange={e => setProvince(e.target.value)}>
                        <option value="">{t('auth_select_province')}</option>
                        {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="auth-label">{t('auth_district')}</label>
                      <select required className="auth-input" value={district} onChange={e => setDistrict(e.target.value)}>
                        <option value="">{t('auth_select_district')}</option>
                        {(MOZ_GEOGRAPHY[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="auth-label">{t('auth_posto')}</label>
                      <input required className="auth-input" placeholder="Ex: Posto Sede" value={posto} onChange={e => setPosto(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="auth-label">{t('auth_localidade')}</label>
                      <input required className="auth-input" placeholder="Ex: Bairro 25 de Setembro" value={localidade} onChange={e => setLocalidade(e.target.value)} />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 space-y-2">
                    <label className="auth-label">{t('auth_intl_location')}</label>
                    <input required className="auth-input" placeholder={t('auth_intl_location_placeholder')} value={partnerLocation} onChange={e => setPartnerLocation(e.target.value)} />
                  </div>
                )}

                {(entityType === EntityType.COMPANY || entityType === EntityType.COOPERATIVE) && (
                  <div className="md:col-span-2 bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 space-y-6">
                    <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">{t('auth_business_docs')}</h4>
                    <p className="text-[9px] text-amber-600 font-medium leading-relaxed">{t('auth_business_docs_desc')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required className="auth-input text-xs" placeholder={t('auth_nuit')} value={nuit} onChange={e => setNuit(e.target.value)} />
                      <input required className="auth-input text-xs" placeholder={t('auth_alvara')} value={alvara} onChange={e => setAlvara(e.target.value)} />
                      <input required className="auth-input text-xs" placeholder={t('auth_estatuto')} value={estatuto} onChange={e => setEstatuto(e.target.value)} />
                      <input required className="auth-input text-xs" placeholder={t('auth_boletim')} value={boletim} onChange={e => setBoletim(e.target.value)} />
                    </div>
                  </div>
                )}

                {(role === UserRole.STRATEGIC_PARTNER || entityType === EntityType.NGO_INTL) && (
                  <div className="md:col-span-2 space-y-4">
                    <label className="auth-label">{t('auth_logo_upload')}</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-[#43A047] hover:text-[#43A047] transition-all cursor-pointer relative overflow-hidden group">
                        {partnerLogo ? (
                          <img src={partnerLogo} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload size={24} />
                            <span className="text-[8px] font-black uppercase mt-2">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setPartnerLogo(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <input required className="auth-input" placeholder={t('auth_logo_url_placeholder')} value={partnerLogo} onChange={e => setPartnerLogo(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {role === UserRole.SELLER && (
                  <div className="md:col-span-2 space-y-4">
                    <label className="auth-label">{t('auth_categories')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategories(prev =>
                              prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                            );
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase flex items-center gap-2 ${selectedCategories.includes(cat.id)
                            ? 'border-[#43A047] bg-green-50 text-[#1B5E20]'
                            : 'border-gray-100 bg-white text-gray-400'
                            }`}
                        >
                          <span>{cat.icon}</span>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="auth-label">{t('auth_phone_personal')}</label>
                  <div className="flex gap-2">
                    <span className="bg-gray-100 p-4 rounded-2xl font-black text-xs text-gray-400">{phoneMeta.prefix}</span>
                    <input required className="auth-input" placeholder={phoneMeta.example} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="auth-label">{t('auth_phone_comm')}</label>
                  <div className="flex gap-2">
                    <span className="bg-gray-100 p-4 rounded-2xl font-black text-xs text-gray-400">{phoneMeta.prefix}</span>
                    <input required className="auth-input" placeholder="84 000 0000" value={commPhone} onChange={e => setCommPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="auth-label">{t('auth_email')}</label>
              <input type="email" required className="auth-input" placeholder="exemplo@agro.co.mz" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2 relative">
              <label className="auth-label">{t('auth_password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="auth-input pr-14"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#43A047] transition-all"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 space-y-6">
            <button type="submit" disabled={loading} className="w-full bg-[#43A047] hover:bg-[#1B5E20] text-white font-black py-8 rounded-[2.5rem] shadow-strong transition-all text-xs uppercase tracking-[0.3em]">
              {loading ? 'A PROCESSAR...' : mode === 'login' ? t('auth_login_btn') : t('auth_signup_btn')}
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] font-black text-gray-400 hover:text-[#43A047] uppercase tracking-widest">
              {mode === 'login' ? t('auth_no_account') : t('auth_has_account')}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .auth-label { display: block; font-size: 9px; font-weight: 900; color: #B0BEC5; text-transform: uppercase; letter-spacing: 0.2em; margin-left: 0.5rem; }
        .auth-input { width: 100%; padding: 1.25rem; border-radius: 1.75rem; border: 3px solid #F5F5F5; background-color: #FAFAFA; font-size: 0.9rem; font-weight: 800; color: #1B5E20; outline: none; }
        .auth-input:focus { border-color: #43A047; background-color: white; }
      `}</style>
    </div>
  );
};

export default Auth;
