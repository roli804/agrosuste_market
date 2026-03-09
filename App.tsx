import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { User, Product, CartItem, UserRole, PaymentAccount } from './types';
import { CATEGORIES, MOCK_PRODUCTS, MOCK_USERS, WORLD_LANGUAGES } from './constants';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import PublicReport from './pages/PublicReport';
import Logo from './components/Logo';
import { supabase } from './lib/supabase';

import { LanguageProvider, useLanguage } from './LanguageContext';
import AIAgent from './components/AIAgent';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('agro_suste_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<User[]>(() => {
    const saved = localStorage.getItem('agro_suste_partners');
    return saved ? JSON.parse(saved) : MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER);
  });
  const [error, setError] = useState<string | null>(null);

  const mapUserFromSession = (sessionUser: any): User | null => {
    if (!sessionUser) return null;
    const metadata = sessionUser.user_metadata || {};
    // Verificação de Administrador via Email Principal ou Metadata
    const isAdmin = sessionUser.email === 'jaimecebola001@gmail.com' || metadata.role === UserRole.ADMIN;

    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      fullName: metadata.full_name || 'Utilizador',
      phone: metadata.phone || '',
      commercialPhone: metadata.commercial_phone || metadata.phone || '',
      country: metadata.country || 'Moçambique',
      province: metadata.province,
      district: metadata.district,
      posto: metadata.posto_administrativo,
      localidade: metadata.localidade_bairro,
      entityType: metadata.entity_type,
      entityName: metadata.entity_name,
      role: isAdmin ? UserRole.ADMIN : (metadata.role as UserRole || UserRole.BUYER),
      isApproved: true,
      balance: metadata.balance || 0,
      status: (metadata.status as 'active' | 'inactive' | 'blocked') || 'active',
      linkedAccounts: metadata.linked_accounts || []
    };
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setUser(mapUserFromSession(session.user));
        } else {
          // Fallback para mock local se não houver sessão Supabase ativa
          const mockUser = localStorage.getItem('mock_user');
          if (mockUser) {
            setUser(mapUserFromSession(JSON.parse(mockUser)));
          }
        }

        // Fetch partners
        const { data: profiles, error: partnersError } = await supabase.from('profiles').select('*').eq('role', UserRole.STRATEGIC_PARTNER);
        if (partnersError) throw partnersError;
        if (profiles && profiles.length > 0) {
          setPartners(profiles.map(p => ({
            id: p.id,
            fullName: p.full_name,
            entityName: p.entity_name,
            logo: p.logo,
            role: p.role as UserRole,
            isApproved: p.isApproved,
            status: p.status,
            linkedAccounts: p.linked_accounts || [],
            email: p.email,
            phone: p.phone,
            commercialPhone: p.commercial_phone,
            country: p.country
          })));
        } else {
          setPartners(MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER));
        }
      } catch (err: any) {
        console.error("Erro de Acesso:", err);
        // Se der Failed to fetch, carrega o mock na mesma se existir
        const mockUser = localStorage.getItem('mock_user');
        if (mockUser) {
          setUser(mapUserFromSession(JSON.parse(mockUser)));
        } else {
          setError("Não foi possível conectar ao servidor real. As funcionalidades poderão estar limitadas a testes locais.");
        }
        setPartners(MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER));
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUserFromSession(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('agro_suste_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('agro_suste_partners', JSON.stringify(partners));
  }, [partners]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateLinkedAccounts = (accounts: PaymentAccount[]) => {
    if (user) setUser({ ...user, linkedAccounts: accounts });
  };

  // REDIRECIONAMENTO INTELIGENTE: ACESSO IMEDIATO CONFORME O PAPEL (ROLE)
  const RoleBasedHome = () => {
    if (!user) return <Home addToCart={addToCart} products={products} partners={partners} />;

    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.STRATEGIC_PARTNER:
        return <AdminDashboard products={products} user={user} />;
      case UserRole.SELLER:
      case UserRole.TRANSPORTER:
      case UserRole.EXTENSIONIST:
        return <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateAccounts={updateLinkedAccounts} />;
      default:
        return <Home addToCart={addToCart} products={products} partners={partners} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B5E20]">
      <div className="flex flex-col items-center gap-6">
        <Logo className="w-20 h-20 animate-pulse" color="white" />
        <p className="text-white font-black text-[10px] uppercase tracking-[0.4em]">{t('app_loading' as any)}</p>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <nav className="bg-[#1B5E20] text-white shadow-xl sticky top-0 z-50 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-4 group">
              <Logo className="w-12 h-12" color="white" />
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter leading-none">Agro-Suste</span>
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{t('app_tagline' as any)}</span>
              </div>
            </Link>

            <div className="flex items-center gap-4 lg:gap-8">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                  {WORLD_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="text-black">{lang.code.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {user && (
                <div className="hidden lg:flex items-center gap-8 mr-8">
                  <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">{t('nav_home' as any)}</Link>
                  <Link to="/shop" className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">{t('nav_shop' as any)}</Link>
                  <Link to="/relatorios-publicos" className="text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-white transition-all">{t('nav_transparency' as any)}</Link>
                </div>
              )}

              <Link to="/checkout" className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 relative transition-all">
                <span className="text-xl">🛒</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#43A047] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1B5E20]">
                    {cart.length}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-4 bg-white/5 pl-5 pr-2 py-2 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                    <div className="flex flex-col items-end mr-1">
                      <span className="text-[10px] font-black uppercase tracking-tight leading-none mb-1 text-white group-hover:text-green-300">{user.fullName.split(' ')[0]}</span>
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">{user.role}</span>
                    </div>
                    <div className="w-10 h-10 bg-[#43A047] rounded-2xl flex items-center justify-center font-black text-sm shadow-strong">
                      {user.fullName[0]}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/10 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">
                    {t('nav_logout' as any)}
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="bg-white text-[#1B5E20] px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-gray-100 transition-all">
                  {t('nav_auth' as any)}
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          {error && (
            <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="text-xl">⚠️</span>
              <div className="flex-grow">
                <p className="text-xs font-black uppercase tracking-widest">{t('app_connection_error' as any) || 'Erro de Conexão'}</p>
                <p className="text-[10px] font-medium opacity-70">{error.includes('servidor real') ? t('app_connection_failed' as any) : t('app_connection_failed_dns' as any)}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-amber-200/50 hover:bg-amber-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {t('app_try_again' as any) || 'Tentar Novamente'}
              </button>
            </div>
          )}
          <Routes>
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/shop" element={<Shop addToCart={addToCart} products={products} />} />
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
            <Route path="/checkout" element={<Checkout cart={cart} user={user} removeFromCart={(id) => setCart(c => c.filter(x => x.id !== id))} clearCart={() => setCart([])} onComplete={() => setCart([])} />} />
            <Route path="/profile" element={user ? <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateAccounts={updateLinkedAccounts} /> : <Navigate to="/auth" />} />
            <Route path="/relatorios-publicos" element={<PublicReport />} />
          </Routes>

          <footer className="mt-20 border-t border-gray-100 py-12 text-center">
            <Logo className="w-10 h-10 mx-auto mb-6 grayscale opacity-20" color="black" />
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">{t('app_footer_rights' as any)}</p>
          </footer>
        </main>
        <AIAgent />
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
