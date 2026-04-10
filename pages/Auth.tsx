
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
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        
        // Se o login no Supabase funcionar, ele segue o fluxo normal.
        // Se falhar (ex: rede), cai no catch abaixo que agora é mais rigoroso.
      } else {
        const emailCheck = await verifyEmailCredibility(email);
        if (!emailCheck.isValid) throw new Error(emailCheck.reason);

        if (country === 'Moçambique' && (!posto || !localidade)) {
          throw new Error("Posto Administrativo e Localidade são obrigatórios para a estrutura nacional.");
        }

        // --- REGRA DE OURO: ADMIN WHITELIST ---
        const isAdminEmail = ['jaimecebola001@gmail.com', 'brestondaniel@gmail.com'].includes(email.toLowerCase());
        const finalRole = isAdminEmail ? UserRole.ADMIN : role;

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
              role: finalRole,
              entity_type: entityType,
              entity_name: entityType === EntityType.INDIVIDUAL ? fullName : entityName,
              province,
              district,
              posto_administrativo: posto,
              localidade_bairro: localidade,
              country,
              status: 'active',
              balance: 0,
              isApproved: isAdminEmail, // Admin já nasce aprovado
              linked_accounts: [],
              categories: selectedCategories,
              documents: (entityType === EntityType.COMPANY || entityType === EntityType.COOPERATIVE) ? {
                nuit,
                alvara,
                estatuto,
                boletim
              } : undefined,
              logo: (finalRole === UserRole.STRATEGIC_PARTNER || entityType === EntityType.NGO_INTL) ? partnerLogo : undefined,
              location: (finalRole === UserRole.STRATEGIC_PARTNER || entityType === EntityType.NGO_INTL) ? partnerLocation : undefined
            }
          }
        });
        if (err) throw err;
        setShowSuccessMessage(true);
      }
    } catch (err: any) {
      // --- TRATAMENTO RIGOROSO DE FALLBACK (MOCK MODE) ---
      if (err.message === 'Failed to fetch' || err.message.includes('rede') || err.message.includes('network')) {
        console.warn('Utilizando BD Local (Mock) por falha de ligação ao servidor.');

        const usersInDb = mockDb.getUsers();
        const existingUser = usersInDb.find(u => u.email === email);

        if (mode === 'login') {
          if (!existingUser) {
            setError("Utilizador não encontrado. Por favor, registe-se primeiro.");
            setLoading(false);
            return;
          }
          // Simulação simples de senha (para testes locais, aceitamos a senha se o user existir)
          const mockSessionUser = {
            id: existingUser.id,
            email: existingUser.email,
            user_metadata: {
              full_name: existingUser.fullName,
              phone: existingUser.phone,
              commercial_phone: existingUser.commercialPhone,
              role: existingUser.role,
              entity_type: existingUser.entityType,
              entity_name: existingUser.entityName,
              province: existingUser.province,
              district: existingUser.district,
              posto_administrativo: existingUser.posto,
              localidade_bairro: existingUser.localidade,
              country: existingUser.country,
              status: existingUser.status,
              balance: existingUser.balance
            }
          };
          localStorage.setItem('mock_user', JSON.stringify(mockSessionUser));
          mockDb.logActivity({
            userId: existingUser.id,
            userName: existingUser.fullName,
            userRole: existingUser.role as any,
            type: LogType.LOGIN,
            description: `Utilizador ${existingUser.fullName} iniciou sessão.`
          });
          window.location.href = '/';
          return;
        } else {
          // MODO SIGNUP
          const isAdminEmail = ['jaimecebola001@gmail.com', 'brestondaniel@gmail.com'].includes(email.toLowerCase());
          const finalRole = isAdminEmail ? UserRole.ADMIN : role;

          const newMockUser = {
            id: `local-user-${Date.now()}`,
            email: email,
            fullName: fullName,
            phone: `${phoneMeta.prefix}${phone}`,
            commercialPhone: `${phoneMeta.prefix}${commPhone}`,
            country: country,
            province: province,
            district: district,
            role: finalRole,
            entityType: entityType,
            entityName: entityType === EntityType.INDIVIDUAL ? fullName : entityName,
            posto: posto,
            localidade: localidade,
            status: 'active',
            isApproved: isAdminEmail,
            linkedAccounts: [],
            balance: 0
          };

          mockDb.saveUser(newMockUser);
          mockDb.logActivity({
            userId: newMockUser.id,
            userName: newMockUser.fullName,
            userRole: newMockUser.role as any,
            type: LogType.SIGNUP,
            description: `Novo utilizador ${newMockUser.fullName} (${newMockUser.role}) registado.`
          });

          localStorage.setItem('mock_user', JSON.stringify({
            id: newMockUser.id,
            email: newMockUser.email,
            user_metadata: {
              full_name: newMockUser.fullName,
              role: newMockUser.role,
              entity_name: newMockUser.entityName
            }
          }));

          window.location.href = '/';
          return;
        }
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="max-w-xl mx-auto my-32 p-16 bg-white rounded-[5rem] shadow-strong text-center space-y-10 border-4 border-amber-50 animate-in zoom-in">
        <div className="w-40 h-40 bg-amber-50 text-amber-600 rounded-[4rem] flex items-center justify-center text-7xl mx-auto">📨</div>
        <div className="space-y-4">
          <h2 className="text-5xl font-semibold text-gray-900  ">{t('auth_success_title')}</h2>
          <p className="text-gray-500 font-bold text-[10px]">{t('auth_success_desc')}</p>
        </div>
        <button onClick={() => setShowSuccessMessage(false)} className="w-full bg-[#2E5C4E] text-white py-8 rounded-[2rem] font-semibold text-xs   shadow-2xl">{t('auth_success_btn')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 pb-24">
      <div className="bg-white rounded-[4rem] shadow-strong overflow-hidden border border-gray-100">
        <div className="bg-[#2E5C4E] p-12 text-white text-center flex flex-col items-center relative">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-semibold   transition-all"
          >
            {t('nav_auth')}
          </button>
          <Logo className="w-20 h-20 mb-4" color="white" />
          <h2 className="text-4xl font-semibold  ">{mode === 'login' ? t('auth_login_title') : t('auth_signup_title')}</h2>
          <p className="text-[10px] font-semibold opacity-40 mt-4">{t('auth_tagline')}</p>
        </div>

        <form onSubmit={handleAuth} className="p-12 space-y-10">
          {error && <div className="bg-red-50 text-red-600 text-[10px] font-semibold p-6 rounded-3xl border border-red-100   animate-bounce">⚠️ {error}</div>}

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

                 {/* Documentação Empresarial */}
                {(entityType === EntityType.COMPANY || entityType === EntityType.COOPERATIVE) && (
                  <div className="md:col-span-2 bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 space-y-6">
                    <h4 className="text-[10px] font-semibold text-amber-800">{t('auth_business_docs')}</h4>
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
                      <div className="w-24 h-24 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-[#5B8C51] hover:text-[#5B8C51] transition-all cursor-pointer relative overflow-hidden group">
                        {partnerLogo ? (
                          <img src={partnerLogo} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload size={24} />
                            <span className="text-[8px] font-semibold  mt-2">Upload</span>
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
                          className={`p-4 rounded-2xl border-2 transition-all text-[10px] font-semibold  flex items-center gap-2 ${selectedCategories.includes(cat.id)
                            ? 'border-[#5B8C51] bg-green-50 text-[#2E5C4E]'
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
                    <span className="bg-gray-100 p-4 rounded-2xl font-semibold text-xs text-gray-400">{phoneMeta.prefix}</span>
                    <input required className="auth-input" placeholder={phoneMeta.example} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="auth-label">{t('auth_phone_comm')}</label>
                  <div className="flex gap-2">
                    <span className="bg-gray-100 p-4 rounded-2xl font-semibold text-xs text-gray-400">{phoneMeta.prefix}</span>
                    <input required className="auth-input" placeholder={t('profile_ex_phone')} value={commPhone} onChange={e => setCommPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="auth-label">{t('auth_email')}</label>
              <input type="email" required className="auth-input" placeholder={t('auth_email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2 relative">
              <label className="auth-label">{t('auth_password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="auth-input pr-14"
                  placeholder={t('auth_pass_placeholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5B8C51] transition-all"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 space-y-6">
            <button type="submit" disabled={loading} className="w-full bg-[#5B8C51] hover:bg-[#2E5C4E] text-white font-semibold py-8 rounded-[2.5rem] shadow-strong transition-all text-xs">
              {loading ? t('auth_processing') : mode === 'login' ? t('auth_login_btn') : t('auth_signup_btn')}
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] font-semibold text-gray-400 hover:text-[#5B8C51]">
              {mode === 'login' ? t('auth_no_account') : t('auth_has_account')}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .auth-label { display: block; font-size: 9px; font-weight: 900; color: #B0BEC5; text-transform: none; letter-spacing: 0.2em; margin-left: 0.5rem; }
        .auth-input { width: 100%; padding: 1.25rem; border-radius: 1.75rem; border: 3px solid #F5F5F5; background-color: #FAFAFA; font-size: 0.9rem; font-weight: 800; color: #2E5C4E; outline: none; }
        .auth-input:focus { border-color: #5B8C51; background-color: white; }
      `}</style>
    </div>
  );
};

export default Auth;
