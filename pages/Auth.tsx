
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole, EntityType } from '../types';
import Logo from '../components/Logo';
import { MOZ_GEOGRAPHY, WORLD_COUNTRIES, CATEGORIES } from '../constants';
import { getCountryPhoneInfo, CountryPhoneInfo, verifyEmailCredibility } from '../lib/geography_api';
import { Eye, EyeOff, Upload, ArrowRight, ArrowLeft } from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
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
    } else if (roleParam === 'strategic_partner') {
      setMode('signup');
      setRole(UserRole.STRATEGIC_PARTNER);
      setEntityType(EntityType.INSTITUTION);
    }
  }, [location.search]);
  const [phone, setPhone] = useState('');
  const [commPhone, setCommPhone] = useState(''); // Contacto Comercial Principal
  const [phoneWarning, setPhoneWarning] = useState<{ personal: string | null, comm: string | null }>({ personal: null, comm: null });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const pwdRules = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const pwdValid = Object.values(pwdRules).every(Boolean);
  const pwdStrength = Object.values(pwdRules).filter(Boolean).length;

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!fullName || !email || !password) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return false;
      }
      if (!pwdValid) {
        setError("A senha não cumpre todos os requisitos de segurança.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!country || !entityType || !role) {
        setError("Por favor, selecione as opções de perfil.");
        return false;
      }
      if (country === 'Moçambique' && (!posto || !localidade || !province || !district)) {
        setError("Para Moçambique: Província, Distrito, Posto e Localidade são obrigatórios.");
        return false;
      }
      if (country !== 'Moçambique' && !partnerLocation) {
        setError("Localização internacional é obrigatória.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Introduza o seu email acima primeiro.'); return; }
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`
    });
    setForgotLoading(false);
    setForgotSent(true);
    setError(null);
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handlePhoneInput = (rawVal: string, setter: React.Dispatch<React.SetStateAction<string>>, field: 'personal' | 'comm') => {
    let val = rawVal.replace(/\D/g, '');
    let warning = null;

    if (val.length > 0 && phoneMeta.validPrefixes && phoneMeta.validPrefixes.length > 0) {
      const isStartValid = phoneMeta.validPrefixes.some(prefix => 
        val.startsWith(prefix) || prefix.startsWith(val)
      );
      if (!isStartValid) {
        warning = `Operadora inválida (${country}). Iniciais válidas: ${phoneMeta.validPrefixes.join(', ')}.`;
        val = val.substring(0, val.length - 1);
      }
    }

    if (val.length > phoneMeta.maxLength) {
      warning = `O número atingiu o limite de ${phoneMeta.maxLength} dígitos para ${country}.`;
      val = val.substring(0, phoneMeta.maxLength);
    }

    setPhoneWarning(prev => ({ ...prev, [field]: warning }));
    setter(val);
  };

  // Documentos para Empresa/Cooperativa
  const [nuit, setNuit] = useState('');
  const [alvara, setAlvara] = useState('');
  const [estatuto, setEstatuto] = useState('');
  const [boletim, setBoletim] = useState('');

  // DOCUMENT FILES (Base64 for mock/preview)
  const [nuitFile, setNuitFile] = useState<string | null>(null);
  const [alvaraFile, setAlvaraFile] = useState<string | null>(null);
  const [estatutoFile, setEstatutoFile] = useState<string | null>(null);
  const [boletimFile, setBoletimFile] = useState<string | null>(null);

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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setCommPhone('');
    setEntityName('');
    setProvince('');
    setDistrict('');
    setPosto('');
    setLocalidade('');
    setPartnerLogo('');
    setPartnerLocation('');
    setSelectedCategories([]);
    setError(null);
  };

  useEffect(() => {
    resetForm();
    if (mode === 'signup') getCountryPhoneInfo(country).then(setPhoneMeta);
  }, [mode]);

  useEffect(() => {
     if (mode === 'signup') getCountryPhoneInfo(country).then(setPhoneMeta);
  }, [country]);

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // GUARD: Impede disparos acidentais antes do último passo
    if (mode === 'signup' && step < 3) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        
        // --- SINCRONIZAÇÃO PROATIVA ---
        // Se o login no Supabase funcionar, guardamos no Mock para o caso de a rede cair na próxima vez
        if (data.user) {
          const metadata = data.user.user_metadata || {};
          mockDb.saveUser({
            id: data.user.id,
            email: data.user.email || '',
            fullName: metadata.full_name || 'Utilizador',
            phone: metadata.phone || '',
            commercialPhone: metadata.commercial_phone || '',
            country: metadata.country || 'Moçambique',
            role: metadata.role || UserRole.BUYER,
            status: 'active',
            isApproved: true,
            linkedAccounts: []
          });
        }
        
        // Se o login no Supabase funcionar, ele segue o fluxo normal.
        // Se falhar (ex: rede), cai no catch abaixo que agora é mais rigoroso.
      } else {
        const emailCheck = await verifyEmailCredibility(email);
        if (!emailCheck.isValid) throw new Error(emailCheck.reason);

        if (country === 'Moçambique' && (!posto || !localidade)) {
          throw new Error("Posto Administrativo e Localidade são obrigatórios para a estrutura nacional.");
        }

        // Validação de Documentos Obrigatórios para Empresas/Cooperativas
        if (entityType === EntityType.COMPANY || entityType === EntityType.COOPERATIVE) {
          if (!nuit || !alvara) {
            throw new Error("O NUIT e o Alvará são obrigatórios para o registo de Empresas ou Cooperativas.");
          }
        }

        // --- REGRA DE OURO: ADMIN WHITELIST ---
        const isAdminEmail = ['jaimecebola001@gmail.com', 'brestondaniel@gmail.com'].includes(email.toLowerCase());
        const finalRole = isAdminEmail ? UserRole.ADMIN : role;

        const currentPath = window.location.origin + window.location.pathname;
        const redirectUrl = currentPath.endsWith('/') ? `${currentPath}#/auth` : `${currentPath}/#/auth`;

        // STEP 1: Criar conta de autenticação com dados mínimos (evita falha do trigger)
        const { data: signUpData, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              role: finalRole,
              country,
            }
          }
        });
        if (err) throw err;

        // STEP 2: Upsert manual do perfil completo na tabela profiles
        if (signUpData?.user?.id) {
          const profilePayload = {
            id: signUpData.user.id,
            email,
            full_name: fullName,
            phone: `${phoneMeta.prefix}${phone}`,
            commercial_phone: `${phoneMeta.prefix}${commPhone}`,
            country,
            province: province || null,
            district: district || null,
            posto_administrativo: posto || null,
            localidade_bairro: localidade || null,
            role: finalRole,
            entity_type: entityType,
            entity_name: entityType === EntityType.INDIVIDUAL ? fullName : (entityName || fullName),
            status: 'offline',
            isapproved: isAdminEmail,
            balance: 0,
            linked_accounts: [],
          };
          const { error: profileErr } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
          if (profileErr) console.warn('[AgroSuste] Profile upsert warning:', profileErr.message);
        }

        // Se o resgisto no Supabase funcionar, também guardamos no Mock para redundância
        mockDb.saveUser({
          id: `sb-${Date.now()}`, // ID temporário até o próximo login carregar o real
          email,
          fullName,
          phone: `${phoneMeta.prefix}${phone}`,
          commercialPhone: `${phoneMeta.prefix}${commPhone}`,
          country,
          role: finalRole,
          entityType,
          entityName: entityType === EntityType.INDIVIDUAL ? fullName : entityName,
          posto,
          localidade,
          status: 'active',
          isApproved: isAdminEmail,
          linkedAccounts: [],
          balance: 0
        });

        // Prevenir sessão automática de signup
        await supabase.auth.signOut();
        resetForm();
        if (finalRole === UserRole.STRATEGIC_PARTNER) {
          window.location.href = '/'; // Redirecionar para home e parceiros
          return;
        }
        setMode('login');
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

          // Não forçar login automático após registo em mock
          resetForm();
          if (finalRole === UserRole.STRATEGIC_PARTNER) {
            window.location.href = '/'; 
            return;
          }
          setMode('login');
          setShowSuccessMessage(true);
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
        <button 
          onClick={() => { 
            setShowSuccessMessage(false); 
            setMode('login'); 
            resetForm(); 
          }} 
          className="w-full bg-[#2E5C4E] text-white py-8 rounded-[2rem] font-semibold text-xs shadow-2xl transition-transform active:scale-95"
        >
          {t('auth_success_btn')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-12 px-4 bg-[#F5F5F0] min-h-[80vh] transition-all duration-500">
      <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-[16px] border border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1">
        
        {/* CABEÇALHO */}
        <div className="pt-10 pb-6 px-10 text-center relative border-b border-gray-50 bg-[#FFFFFF]">
          <Logo className="w-12 h-12 mx-auto mb-4 transition-transform duration-300 hover:scale-105" color="#2E7D32" />
          <h2 className="text-[28px] md:text-[32px] text-[#1C1C1C] mb-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            {mode === 'login' ? 'Entrar na plataforma' : 'Crie sua conta'}
          </h2>
          <p className="text-[#6D6D6D] text-[14px] font-inter">
            {mode === 'login' ? 'Bem-vindo de volta ao AgroConnect' : 'Preencha os dados abaixo para se juntar à nossa rede global'}
          </p>

          <button
            type="button"
            onClick={() => { 
              const nextMode = mode === 'login' ? 'signup' : 'login';
              setMode(nextMode); 
              resetForm();
              setStep(1); 
            }}
            className="absolute top-6 right-6 text-[#2E7D32] hover:text-[#1B5E20] text-[13px] font-medium font-inter transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-green-50"
          >
            {mode === 'login' ? 'Criar Conta' : 'Fazer Login'}
          </button>
        </div>

        {/* PROGRESS BAR (APENAS SIGNUP) */}
        {mode === 'signup' && (
          <div className="px-12 pt-8 pb-4">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-gray-100 -z-10 -translate-y-1/2" />
              <div 
                className="absolute left-0 top-1/2 h-[2px] bg-[#2E7D32] transition-all duration-500 ease-out -z-10 -translate-y-1/2" 
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} 
              />
              
              <div className="relative bg-white px-2 cursor-default group" onClick={() => step > 1 && setStep(1)}>
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${step >= 1 ? 'bg-[#1B5E20] text-white shadow-md scale-110' : 'bg-gray-100 text-[#6D6D6D] group-hover:bg-gray-200'}`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium transition-colors duration-300 ${step >= 1 ? 'text-[#1B5E20]' : 'text-gray-400'}`}>Básico</span>
              </div>
              <div className="relative bg-white px-2 cursor-default group" onClick={() => step > 2 && setStep(2)}>
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${step >= 2 ? 'bg-[#1B5E20] text-white shadow-md scale-110' : 'bg-gray-100 text-[#6D6D6D] group-hover:bg-gray-200'}`}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium transition-colors duration-300 ${step >= 2 ? 'text-[#1B5E20]' : 'text-gray-400'}`}>Perfil</span>
              </div>
              <div className="relative bg-white px-2 cursor-default">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${step >= 3 ? 'bg-[#1B5E20] text-white shadow-md scale-110' : 'bg-gray-100 text-[#6D6D6D]'}`}>
                  3
                </span>
                <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium transition-colors duration-300 ${step >= 3 ? 'text-[#1B5E20]' : 'text-gray-400'}`}>Final</span>
              </div>
            </div>
          </div>
        )}

        <form 
          onSubmit={(e) => e.preventDefault()} 
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className="p-10 relative overflow-hidden hidden-scroll"
        >
          {error && <div className="bg-red-50 text-red-600 text-[13px] p-4 rounded-xl border border-red-100 mb-6 font-inter text-center animate-in fade-in slide-in-from-top-2 shadow-sm font-medium">{error}</div>}

          {/* MODO LOGIN */}
          {mode === 'login' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <input type="email" required className="auth-input peer" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} />
                <label className="auth-floating-label">Email</label>
              </div>
              <div className="relative pt-1">
                <div className="flex justify-end w-full mb-1 absolute right-0 -top-4">
                   {forgotSent ? (<span className="text-green-600 text-[12px] font-medium">\u2705 Link enviado! Verifique o email.</span>) : (<button type="button" onClick={handleForgotPassword} disabled={forgotLoading} className="text-[#2E7D32] text-[12px] hover:text-[#1B5E20] transition-colors font-medium hover:underline disabled:opacity-50">{forgotLoading ? 'A enviar...' : 'Esqueceu a senha?'}</button>)}
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required className="auth-input peer pr-12" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} />
                  <label className="auth-floating-label">Senha</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2E7D32] transition-transform active:scale-95">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="pt-6">
                <button type="button" onClick={handleAuth} disabled={loading} className="btn-primary w-full shadow-[0_4px_14px_rgba(27,94,32,0.25)] text-[15px] group py-3">
                  {loading ? 'A processar...' : 'Entrar'}
                  {!loading && <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1 ml-2" />}
                </button>
              </div>
            </div>
          ) : (
            /* MODO SIGNUP EM PASSOS */
            <div className="space-y-6 relative">
              {step === 1 && (
                <div className="space-y-6 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="relative">
                    <input required className="auth-input peer" placeholder=" " value={fullName} onChange={e => setFullName(e.target.value)} />
                    <label className="auth-floating-label">{t('auth_full_name')}</label>
                  </div>
                  <div className="relative">
                    <input type="email" required className="auth-input peer" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} />
                    <label className="auth-floating-label">{t('auth_email')}</label>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required className={`auth-input peer pr-12 ${password && !pwdValid ? 'border-amber-300' : password && pwdValid ? 'border-green-400' : ''}`} placeholder=" " value={password} onChange={e => setPassword(e.target.value)} />
                    <label className="auth-floating-label">{t('auth_password')}</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2E7D32] transition-transform active:scale-95">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 animate-in fade-in duration-300">
                      <div className="flex gap-1 mb-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwdStrength ? (pwdStrength <= 2 ? 'bg-red-400' : pwdStrength <= 3 ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      {[
                        { ok: pwdRules.length, label: 'Mínimo 6 caracteres' },
                        { ok: pwdRules.upper, label: 'Uma letra maiúscula (A-Z)' },
                        { ok: pwdRules.lower, label: 'Uma letra minúscula (a-z)' },
                        { ok: pwdRules.number, label: 'Um número (0-9)' },
                        { ok: pwdRules.symbol, label: 'Um símbolo (!@#$...)' },
                      ].map(r => (
                        <div key={r.label} className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className="text-[13px]">{r.ok ? '✅' : '○'}</span> {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="relative md:col-span-1">
                    <select required className="auth-select peer" value={country} onChange={e => setCountry(e.target.value)}>
                      {WORLD_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <label className="auth-floating-label !top-[6px] !text-[10px] font-semibold">{t('auth_country')}</label>
                  </div>
                  <div className="relative md:col-span-1">
                    <select required className="auth-select peer" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                      <option value={UserRole.SELLER}>🚜 {t('auth_seller')}</option>
                      <option value={UserRole.BUYER}>🛒 {t('auth_buyer')}</option>
                      <option value={UserRole.TRANSPORTER}>🚛 {t('auth_transporter')}</option>
                      <option value={UserRole.EXTENSIONIST}>📋 {t('auth_extensionist')}</option>
                      <option value={UserRole.STRATEGIC_PARTNER}>🤝 Parceiro(a)</option>
                      <option value={UserRole.OTHER}>❓ {t('auth_other')}</option>
                    </select>
                    <label className="auth-floating-label !top-[6px] !text-[10px] font-semibold">{t('auth_role')}</label>
                  </div>
                  <div className="relative md:col-span-2">
                    <select required className="auth-select peer" value={entityType} onChange={e => setEntityType(e.target.value as EntityType)}>
                      <option value={EntityType.INDIVIDUAL}>👤 {t('auth_individual')}</option>
                      <option value={EntityType.ASSOCIATION}>🤝 {t('auth_association')}</option>
                      <option value={EntityType.COOPERATIVE}>🏢 {t('auth_cooperative')}</option>
                      <option value={EntityType.COMPANY}>🏗️ {t('auth_company')}</option>
                      <option value={EntityType.NGO_INTL}>🌍 {t('auth_ngo')}</option>
                      <option value={EntityType.OTHER}>❓ {t('auth_other')}</option>
                    </select>
                    <label className="auth-floating-label !top-[6px] !text-[10px] font-semibold">{t('auth_entity_type')}</label>
                  </div>

                  {country === 'Moçambique' ? (
                    <>
                      <div className="relative md:col-span-1">
                        <select
                          className="auth-select peer"
                          value={province}
                          onChange={e => { setProvince(e.target.value); setDistrict(''); }}
                        >
                          <option value="">Selecione...</option>
                          {Object.keys(MOZ_GEOGRAPHY).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <label className="auth-floating-label !top-[6px] !text-[10px] font-semibold">{t('auth_province')}</label>
                      </div>
                      <div className="relative md:col-span-1">
                        <select
                          className={`auth-select peer ${!province ? 'opacity-50 cursor-not-allowed' : ''}`}
                          value={district}
                          disabled={!province}
                          onChange={e => setDistrict(e.target.value)}
                        >
                          <option value="">{province ? 'Selecione...' : '← Selecione Província primeiro'}</option>
                          {(MOZ_GEOGRAPHY[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <label className="auth-floating-label !top-[6px] !text-[10px] font-semibold">{t('auth_district')}</label>
                      </div>
                      <div className="relative md:col-span-1">
                        <input className="auth-input peer" placeholder=" " value={posto} onChange={e => setPosto(e.target.value)} />
                        <label className="auth-floating-label">{t('auth_posto')}</label>
                      </div>
                      <div className="relative md:col-span-1">
                        <input className="auth-input peer" placeholder=" " value={localidade} onChange={e => setLocalidade(e.target.value)} />
                        <label className="auth-floating-label">{t('auth_localidade')}</label>
                      </div>
                    </>
                  ) : (
                    <div className="relative md:col-span-2">
                      <input className="auth-input peer" placeholder=" " value={partnerLocation} onChange={e => setPartnerLocation(e.target.value)} />
                      <label className="auth-floating-label">{t('auth_intl_location')}</label>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 w-full animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto hidden-scroll pr-2">
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                      <div className="flex gap-2 items-center">
                        <span className="bg-[#FAFAFA] border border-transparent px-4 rounded-[10px] flex items-center text-[14px] font-medium text-[#2E7D32] h-[48px]">{phoneMeta.prefix}</span>
                        <div className="relative flex-1">
                          <input className="auth-input peer" placeholder=" " value={phone} onChange={e => handlePhoneInput(e.target.value, setPhone, 'personal')} />
                          <label className="auth-floating-label">{t('auth_phone_personal')}</label>
                        </div>
                      </div>
                      {phoneWarning.personal && <span className="text-red-500 font-medium text-[11px] mt-2 block animate-in fade-in">{phoneWarning.personal}</span>}
                    </div>

                    <div className="relative">
                      <div className="flex gap-2 items-center">
                        <span className="bg-[#FAFAFA] border border-transparent px-4 rounded-[10px] flex items-center text-[14px] font-medium text-[#2E7D32] h-[48px]">{phoneMeta.prefix}</span>
                        <div className="relative flex-1">
                          <input className="auth-input peer" placeholder=" " value={commPhone} onChange={e => handlePhoneInput(e.target.value, setCommPhone, 'comm')} />
                          <label className="auth-floating-label">{t('auth_phone_comm')}</label>
                        </div>
                      </div>
                      {phoneWarning.comm && <span className="text-red-500 font-medium text-[11px] mt-2 block animate-in fade-in">{phoneWarning.comm}</span>}
                    </div>
                  </div>

                  {role === UserRole.SELLER && (
                    <div className="space-y-3 md:col-span-2 pt-2">
                       <label className="block text-[13px] font-semibold text-[#6D6D6D] uppercase tracking-wider">{t('auth_categories')}</label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {CATEGORIES.map(cat => (
                           <button
                             key={cat.id}
                             type="button"
                             onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                             className={`p-3 rounded-xl border flex items-center gap-2 text-[13px] font-medium transition-all active:scale-95 ${selectedCategories.includes(cat.id) ? 'border-[#2E7D32] bg-[#F1F8F4] text-[#1B5E20] shadow-[0_4px_14px_rgba(46,125,50,0.15)] -translate-y-1' : 'border-[#E0E0E0] bg-white text-[#6D6D6D] hover:bg-[#FAFAFA] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1'}`}
                           >
                             <span className="text-lg">{cat.icon}</span> {cat.name}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}

                  {(entityType === EntityType.COMPANY || entityType === EntityType.COOPERATIVE) && (
                    <div className="bg-[#FAFAFA] p-6 rounded-[12px] border border-gray-100 space-y-6 md:col-span-2">
                       <h4 className="text-[13px] font-semibold text-[#1C1C1C] flex items-center gap-2">📑 {t('auth_business_docs')} <span className="text-[10px] font-normal text-gray-400 font-inter">(Uploads recomendados)</span></h4>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* NUIT */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[#6D6D6D] uppercase flex justify-between">
                              {t('auth_nuit')} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input className="auth-input peer !bg-white" placeholder=" " value={nuit} onChange={e => setNuit(e.target.value)} />
                                <label className="auth-floating-label">Número</label>
                              </div>
                              <label className={`w-12 h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${nuitFile ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]' : 'bg-white border-gray-200 text-gray-400 hober:border-gray-300'}`}>
                                <Upload size={18} />
                                <input type="file" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setNuitFile(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </label>
                            </div>
                          </div>

                          {/* ALVARÁ */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[#6D6D6D] uppercase flex justify-between">
                              {t('auth_alvara')} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input className="auth-input peer !bg-white" placeholder=" " value={alvara} onChange={e => setAlvara(e.target.value)} />
                                <label className="auth-floating-label">Número</label>
                              </div>
                              <label className={`w-12 h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${alvaraFile ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]' : 'bg-white border-gray-200 text-gray-400 hober:border-gray-300'}`}>
                                <Upload size={18} />
                                <input type="file" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setAlvaraFile(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </label>
                            </div>
                          </div>

                          {/* ESTATUTO */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[#6D6D6D] uppercase flex justify-between">
                              {t('auth_estatuto')} <span className="text-gray-400 font-normal normal-case">(Opcional)</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input className="auth-input peer !bg-white" placeholder=" " value={estatuto} onChange={e => setEstatuto(e.target.value)} />
                                <label className="auth-floating-label">Referência</label>
                              </div>
                              <label className={`w-12 h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${estatutoFile ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]' : 'bg-white border-gray-200 text-gray-400 hober:border-gray-300'}`}>
                                <Upload size={18} />
                                <input type="file" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEstatutoFile(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </label>
                            </div>
                          </div>

                          {/* BOLETIM */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[#6D6D6D] uppercase flex justify-between">
                              {t('auth_boletim')} <span className="text-gray-400 font-normal normal-case">(Opcional)</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input className="auth-input peer !bg-white" placeholder=" " value={boletim} onChange={e => setBoletim(e.target.value)} />
                                <label className="auth-floating-label">Referência</label>
                              </div>
                              <label className={`w-12 h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${boletimFile ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]' : 'bg-white border-gray-200 text-gray-400 hober:border-gray-300'}`}>
                                <Upload size={18} />
                                <input type="file" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setBoletimFile(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </label>
                            </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {(role === UserRole.STRATEGIC_PARTNER || entityType === EntityType.NGO_INTL) && (
                    <div className="space-y-3 md:col-span-2">
                       <label className="block text-[13px] font-semibold text-[#6D6D6D] uppercase tracking-wider">{t('auth_logo_upload')}</label>
                       <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-[#FAFAFA] border-2 border-dashed border-gray-300 rounded-[12px] flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group hover:border-[#2E7D32] transition-colors cursor-pointer active:scale-95">
                             {partnerLogo ? (
                               <img src={partnerLogo} className="w-full h-full object-cover" />
                             ) : (
                               <Upload size={20} className="group-hover:text-[#2E7D32] transition-colors" />
                             )}
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setPartnerLogo(reader.result as string);
                                 reader.readAsDataURL(file);
                               }
                             }} />
                          </div>
                          <div className="relative flex-1">
                            <input className="auth-input peer" placeholder=" " value={partnerLogo} onChange={e => setPartnerLogo(e.target.value)} />
                            <label className="auth-floating-label">URL do Logótipo (Opcional)</label>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões do Signup */}
              <div className="flex items-center gap-4 border-t border-gray-50 pt-8 mt-10 bg-white z-10 w-full relative">
                {step > 1 && (
                  <button type="button" onClick={prevStep} className="btn-secondary w-full group py-3">
                    <ArrowLeft size={20} className="transition-transform duration-300 group-hover:-translate-x-1 mr-2" />
                    <span>Voltar</span>
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={step === 1 && (!fullName || !email || !pwdValid)}
                    className="btn-primary w-full shadow-[0_4px_14px_rgba(27,94,32,0.25)] group py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <span>Próximo</span>
                    <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1 ml-2" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAuth} disabled={loading} className="btn-primary w-full shadow-[0_4px_14px_rgba(27,94,32,0.25)] group py-3">
                    {loading ? 'A processar...' : 'Confirmar Cadastro'}
                    {!loading && <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1 ml-2" />}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        
        .hidden-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
        
        .auth-input { 
          width: 100%; 
          height: 48px;
          padding: 20px 16px 4px 16px; 
          border-radius: 10px; 
          border: 1px solid transparent; 
          background-color: #FAFAFA; 
          font-family: 'Inter', sans-serif;
          font-size: 14px; 
          font-weight: 500;
          color: #1C1C1C; 
          outline: none; 
          transition: all 0.3s ease;
        }
        .auth-select {
          width: 100%; 
          height: 48px;
          padding: 20px 16px 4px 12px; 
          border-radius: 10px; 
          border: 1px solid transparent; 
          background-color: #FAFAFA; 
          font-family: 'Inter', sans-serif;
          font-size: 14px; 
          font-weight: 600;
          color: #2E7D32; 
          outline: none; 
          transition: all 0.3s ease;
        }

        .auth-input:hover, .auth-select:hover { background-color: #F1F1F1; }
        
        .auth-input:focus, .auth-select:focus { 
          border-color: #2E7D32; 
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.08); 
          background-color: #FFFFFF;
        }
        
        .auth-floating-label { 
          position: absolute; 
          left: 16px; 
          top: 14px; 
          font-family: 'Inter', sans-serif;
          font-size: 14px; 
          color: #8E8E8E; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
          pointer-events: none; 
        }

        /* Magia do Floating Label Ativo */
        .auth-input:focus ~ .auth-floating-label, 
        .auth-input:not(:placeholder-shown) ~ .auth-floating-label {
          top: 6px; 
          font-size: 10px; 
          color: #2E7D32; 
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .btn-primary {
          background-color: #1B5E20;
          color: white;
          border-radius: 10px;
          padding: 12px 24px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-primary:active:not(:disabled) { transform: scale(0.97); }
        .btn-primary:hover:not(:disabled) { background-color: #0D3B12; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(27,94,32,0.3); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-secondary {
          background-color: transparent;
          color: #6D6D6D;
          border-radius: 10px;
          padding: 12px 24px;
          border: 1px solid #E0E0E0;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-secondary:active { transform: scale(0.97); }
        .btn-secondary:hover { background-color: #FAFAFA; color: #1C1C1C; border-color: #D1D5DB; }
      `}</style>
    </div>
  );
};

export default Auth;
