import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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
import { supabase, supabaseTableStates } from './lib/supabase';

import { LanguageProvider, useLanguage } from './LanguageContext';
import AIAgent from './components/AIAgent';
import { mockDb } from './lib/mock_db';

const mapUserFromSession = (sessionUser: any): User | null => {
  if (!sessionUser) return null;
  const metadata = sessionUser.user_metadata || {};
  const isAdmin = ['jaimecebola001@gmail.com', 'brestondaniel@gmail.com'].includes(sessionUser.email?.toLowerCase()) || metadata.role === UserRole.ADMIN;

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

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const mockUser = localStorage.getItem('mock_user');
      if (mockUser) return mapUserFromSession(JSON.parse(mockUser));
    } catch { /* ignore */ }
    return null;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const existing = mockDb.getProducts();
    // Merge MOCK_PRODUCTS: add any product that isn't already in the list by ID
    const merged = [...existing];
    MOCK_PRODUCTS.forEach(mp => {
      if (!merged.find(p => p.id === mp.id)) {
        merged.push(mp);
      }
    });
    return merged;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<User[]>(() => {
    const allUsers = mockDb.getUsers();
    const localPartners = allUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER);

    // Fallback para os estáticos APENAS se não houver manuais, ou merge?
    // User pediu para deixar 2 ou 3 apenas.
    const merged = [...localPartners];
    MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER).forEach(mp => {
      if (!merged.find(p => p.email === mp.email)) {
        merged.push(mp);
      }
    });
    return merged;
  });
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const handleDbChange = () => {
      // Refresh products with merge logic
      const existing = mockDb.getProducts();
      const mergedProducts = [...existing];
      MOCK_PRODUCTS.forEach(mp => {
        if (!mergedProducts.find(p => p.id === mp.id)) {
          mergedProducts.push(mp);
        }
      });
      setProducts(mergedProducts);

      // Refresh partners with merge logic
      const allUsers = mockDb.getUsers();
      const localPartners = allUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER);
      const mergedPartners = [...localPartners];
      MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER).forEach(mp => {
        if (!mergedPartners.find(p => p.email === mp.email)) {
          mergedPartners.push(mp);
        }
      });
      setPartners(mergedPartners);
    };

    window.addEventListener('mock-db-changed', handleDbChange);

    const fetchSession = async () => {
      try {
        // Since we explicitly signed out above, there is no session to fetch for automatic login
        // But we still need to fetch public data like partners

        // The mock local fallback block below is disabled for user sessions to ensure hard-resets on reload, 
        // but we still fetch the partners list below.

        // Fetch partners
        if (supabaseTableStates.profilesMissing) {
           setError(t('checkout_remove') === 'Remover' ? "Modo Offline: Usando base de dados local para demonstração." : "Offline Mode: Using local mock database for demo.");
           setPartners(mockDb.getUsers().filter(u => u.role === UserRole.STRATEGIC_PARTNER));
           setLoading(false);
           return;
        }

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
          // Fallback para mock local centralizado (mockDb)
          const allUsers = mockDb.getUsers();
          const partnersFromDb = allUsers.filter(u => u.role === UserRole.STRATEGIC_PARTNER);

          const merged = [...partnersFromDb];
          MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER).forEach(mp => {
            if (!merged.find(p => p.email === mp.email)) {
              merged.push(mp);
            }
          });
          setPartners(merged);
        }
      } catch (err: any) {
        // Silenciar erro ruidoso se for apenas a tabela em falta no Supabase (comum em dev/mock)
        if (err?.code === 'PGRST205' || err?.message?.includes('profiles')) {
          supabaseTableStates.profilesMissing = true;
          console.log("[AgroSuste] Servidor real sem tabela 'profiles'. Usando Mock local.");
        } else {
          console.error("Erro de Acesso:", err);
        }
        setError(t('checkout_remove') === 'Remover' ? "Modo Offline: Usando base de dados local para demonstração." : "Offline Mode: Using local mock database for demo.");
        setPartners(mockDb.getUsers().filter(u => u.role === UserRole.STRATEGIC_PARTNER));
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUserFromSession(session?.user));
    });

    // --- REAL-TIME SYNC PARA PARCEIROS ---
    let partnersChannel: any = null;
    if (!supabaseTableStates.profilesMissing) {
      partnersChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `role=eq.${UserRole.STRATEGIC_PARTNER}` }, () => {
          fetchSession(); // Re-fetch completo para garantir consistência
        })
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (partnersChannel) partnersChannel.unsubscribe();
      window.removeEventListener('mock-db-changed', handleDbChange);
    };
  }, []);

  useEffect(() => {
    // Sincronizar produtos com o MockDb para persistência central
    products.forEach(p => {
      const existing = mockDb.getProducts();
      if (!existing.find(ep => ep.id === p.id)) {
        mockDb.saveProduct(p);
      }
    });
  }, [products]);

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

  const RoleBasedHome = () => {
    const isPublicView = location.search.includes('view=public');
    if (!user || isPublicView) return <Home addToCart={addToCart} products={products} partners={partners} />;

    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.STRATEGIC_PARTNER:
        return <AdminDashboard products={products} user={user} onAddProduct={(p) => setProducts([p, ...products])} />;
      case UserRole.SELLER:
      case UserRole.TRANSPORTER:
      case UserRole.EXTENSIONIST:
      case UserRole.BUYER: // COMPRADOR agora entra direto no Dashboard/Profile
        return <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateAccounts={updateLinkedAccounts} />;
      default:
        return <Home addToCart={addToCart} products={products} partners={partners} />;
    }
  };

  const isAdminView = user && [UserRole.ADMIN, UserRole.STRATEGIC_PARTNER].includes(user.role) && location.pathname === '/' && !location.search.includes('view=public');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] selection:bg-green-100 italic-text-fix">
      {!isAdminView && (
        <nav className="bg-white text-[#263238] sticky top-0 z-[100] border-b border-[#E0E0E0]">
          <div className="mx-auto px-[20px] md:px-[80px] h-[72px] flex justify-between items-center w-full">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo className="w-8 h-8 group-hover:rotate-[15deg] transition-transform duration-500" color="#2E7D32" />
              <span className="font-poppins font-bold text-lg tracking-tight leading-none text-[#263238]">AgroSuste</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-[16px] font-inter text-[#263238] hover:text-[#2E7D32] transition-colors hover:border-b-2 hover:border-[#2E7D32] border-b-2 border-transparent pb-1">{t('nav_home')}</Link>
              <Link to="/shop" className="text-[16px] font-inter text-[#263238] hover:text-[#2E7D32] transition-colors hover:border-b-2 hover:border-[#2E7D32] border-b-2 border-transparent pb-1">{t('nav_shop')}</Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 mr-2">
                {[{ code: 'pt', label: 'PT' }, { code: 'en', label: 'IN' }].map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${language === l.code ? 'bg-white text-[#2E7D32] shadow-sm font-bold' : 'text-gray-400 hover:text-[#2E7D32]'}`}>
                    {l.label}
                  </button>
                ))}
              </div>

              {/* MOBILE LANGUAGE SWITCHER */}
              <div className="flex md:hidden items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                {[{ code: 'pt', label: 'PT' }, { code: 'en', label: 'IN' }].map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${language === l.code ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-400'}`}>
                    {l.label}
                  </button>
                ))}
              </div>

              <Link to="/checkout" className="text-xl relative transition-all mr-2">
                🛒
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#2E7D32] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}
              </Link>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-3 bg-[#FCFCFC] pl-3 pr-2 py-1.5 rounded-[12px] border border-[#E0E0E0] hover:border-[#2E7D32]/30 hover:shadow-sm transition-all group">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[13px] font-bold font-inter leading-none text-[#1C1C1C] mb-1 group-hover:text-[#2E7D32]">{user.fullName.split(' ')[0]}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        user.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' :
                        user.role === UserRole.SELLER ? 'bg-green-100 text-green-700' :
                        user.role === UserRole.TRANSPORTER ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === UserRole.ADMIN ? t('role_admin') :
                         user.role === UserRole.SELLER ? t('role_producer') :
                         user.role === UserRole.TRANSPORTER ? t('role_logistic') :
                         user.role === UserRole.STRATEGIC_PARTNER ? t('role_partner') :
                         t('role_buyer')}
                      </span>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white rounded-[9px] flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                      {user.fullName[0]}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="bg-white border border-[#E0E0E0] text-[#6D6D6D] hover:text-red-600 hover:border-red-100 hover:bg-red-50 px-[16px] py-[10px] rounded-[10px] text-[13px] font-bold transition-all">
                    {t('nav_logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth" className="bg-transparent border border-[#E0E0E0] text-[#263238] hover:bg-gray-50 px-[16px] py-[8px] rounded-[8px] font-inter text-[14px] transition-all">
                    {t('nav_login')}
                  </Link>
                  <Link to="/auth?mode=register" className="bg-[#2E7D32] text-white hover:bg-[#1B5E20] px-[18px] py-[10px] border border-transparent rounded-[8px] font-inter font-semibold text-[14px] transition-all hidden sm:block">
                    {t('nav_consultant')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className={isAdminView ? "flex-grow bg-[#F5F5F0]" : "flex-grow container mx-auto px-4 md:px-6 py-6 md:py-10"}>

          <Routes>
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/shop" element={<Shop addToCart={addToCart} products={products} />} />
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
            <Route path="/checkout" element={<Checkout cart={cart} user={user} removeFromCart={(id) => setCart(c => c.filter(x => x.id !== id))} clearCart={() => setCart([])} onComplete={() => setCart([])} />} />
            <Route path="/profile" element={user ? <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateAccounts={updateLinkedAccounts} /> : <Navigate to="/auth" />} />
            <Route path="/relatorios-publicos" element={<PublicReport />} />
          </Routes>

          {!isAdminView && (
            <footer className="mt-20 pt-[60px] pb-6 px-[20px] md:px-[80px] bg-[#F1F8F4] border-t border-[#E0E0E0]">
            {/* Logo + Tagline section centered */}
            <div className="max-w-[1400px] mx-auto flex flex-col items-center text-center mb-12">
              <div className="flex items-center gap-2 mb-3">
                <Logo className="w-8 h-8" color="#2E7D32" />
                <span className="font-poppins font-bold text-xl text-[#263238]">AgroSuste</span>
              </div>
              <p className="text-[14px] text-[#757575] leading-relaxed font-inter max-w-sm mb-5">
                {t('footer_tagline')}
              </p>
              <div className="flex gap-3 mb-10">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#757575] hover:text-[#2E7D32] hover:bg-black/10 transition-colors cursor-pointer text-sm">in</div>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#757575] hover:text-[#2E7D32] hover:bg-black/10 transition-colors cursor-pointer text-sm">X</div>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#757575] hover:text-[#2E7D32] hover:bg-black/10 transition-colors cursor-pointer text-sm">f</div>
              </div>

              {/* 3 Menu columns centered */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20 w-full max-w-3xl text-left md:text-center">
                <div>
                  <h4 className="font-poppins font-semibold text-[#263238] text-[15px] mb-4">{t('nav_solutions')}</h4>
                  <div className="flex flex-col gap-3 text-[14px] font-inter text-[#757575]">
                    <Link to="/shop" className="hover:text-[#2E7D32] transition-colors">{t('shop_market_title')}</Link>
                    <Link to="#" className="hover:text-[#2E7D32] transition-colors">{t('nav_finance')}</Link>
                  </div>
                </div>

                <div>
                  <h4 className="font-poppins font-semibold text-[#263238] text-[15px] mb-4">{t('shop_categories')}</h4>
                  <div className="flex flex-col gap-3 text-[14px] font-inter text-[#757575]">
                    <Link to="#" className="hover:text-[#2E7D32] transition-colors">Europa</Link>
                    <Link to="#" className="hover:text-[#2E7D32] transition-colors">Ásia</Link>
                    <Link to="#" className="hover:text-[#2E7D32] transition-colors">África</Link>
                  </div>
                </div>

                <div>
                  <h4 className="font-poppins font-semibold text-[#263238] text-[15px] mb-4">{t('nav_home')}</h4>
                  <div className="flex flex-col gap-3 text-[14px] font-inter text-[#757575]">
                    <Link to="/" className="hover:text-[#2E7D32] transition-colors">{t('nav_home')}</Link>
                    <Link to="/shop" className="hover:text-[#2E7D32] transition-colors">{t('nav_shop')}</Link>
                    <Link to="/auth" className="hover:text-[#2E7D32] transition-colors">{t('nav_login')}</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-[1400px] mx-auto border-t border-[#E0E0E0] pt-6 flex flex-col items-center justify-center text-[13px] font-inter text-[#9E9E9E]">
              <p>© 2025 AgroSuste. Todos os direitos reservados</p>
            </div>
          </footer>
        )}
      </main>
      <AIAgent />

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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </HashRouter>
  );
};

export default App;
