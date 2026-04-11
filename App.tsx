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
import { mockDb } from './lib/mock_db';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
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
  const [loading, setLoading] = useState(true);
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

  const mapUserFromSession = (sessionUser: any): User | null => {
    if (!sessionUser) return null;
    const metadata = sessionUser.user_metadata || {};
    // Verificação de Administrador via Email Principal ou Metadata
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
        console.error("Erro de Acesso:", err);
        // Se der Failed to fetch, carrega o mock na mesma se existir
        const mockUser = localStorage.getItem('mock_user');
        if (mockUser) {
          setUser(mapUserFromSession(JSON.parse(mockUser)));
        } else {
          setError("Não foi possível conectar ao servidor real. As funcionalidades poderão estar limitadas a testes locais.");
        }
        setPartners(mockDb.getUsers().filter(u => u.role === UserRole.STRATEGIC_PARTNER));
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUserFromSession(session?.user));
    });
    return () => {
      subscription.unsubscribe();
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
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] selection:bg-green-100 italic-text-fix">
        <nav className="bg-white text-[#263238] sticky top-0 z-[100] border-b border-[#E0E0E0]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-[70px] flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 md:gap-4 group">
              <Logo className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-[15deg] transition-transform duration-500" color="#2E7D32" />
              <div className="flex flex-col">
                <span className="font-poppins font-bold text-lg md:text-xl tracking-tight leading-none text-[#263238]">Agro-Suste</span>
                <span className="text-[7px] md:text-[9px] font-medium opacity-60 uppercase tracking-widest">{t('app_tagline' as any)}</span>
              </div>
            </Link>

            <div className="flex items-center gap-4 lg:gap-8">
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                {[
                  { code: 'pt', label: 'PT' },
                  { code: 'en', label: 'IN' }
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-medium transition-all ${language === l.code ? 'bg-white text-[#2E7D32] shadow-sm font-bold' : 'text-gray-400 hover:text-[#2E7D32]'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {user && (
                <div className="hidden lg:flex items-center gap-6 mr-4">
                  <Link to="/" className="text-[11px] font-medium uppercase tracking-wider text-[#263238] hover:text-[#2E7D32] transition-all">{t('nav_home' as any)}</Link>
                  <Link to="/shop" className="text-[11px] font-medium uppercase tracking-wider text-[#263238] hover:text-[#2E7D32] transition-all">{t('nav_shop' as any)}</Link>
                  <Link to="/relatorios-publicos" className="text-[11px] font-medium uppercase tracking-wider text-[#4CAF50] hover:text-[#2E7D32] transition-all">{t('nav_transparency' as any)}</Link>
                </div>
              )}

              <Link to="/checkout" className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl hover:bg-gray-100 text-[#263238] relative transition-all">
                <span className="text-xl">🛒</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#2E7D32] text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-2 md:gap-4 bg-white pl-3 md:pl-5 pr-2 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-[#E0E0E0] hover:bg-gray-50 transition-all group">
                    <div className="hidden sm:flex flex-col items-end mr-1">
                      <span className="text-[11px] font-medium uppercase tracking-tight leading-none mb-1 text-[#263238] group-hover:text-[#2E7D32]">{user.fullName.split(' ')[0]}</span>
                      <span className="text-[8px] font-medium uppercase tracking-wider text-[#757575]">{user.role}</span>
                    </div>
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-[#2E7D32] text-white rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shadow-sm">
                      {user.fullName[0]}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="bg-transparent hover:bg-red-50 text-red-500 border border-red-200 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-medium uppercase tracking-wider transition-all">
                    {t('nav_logout' as any)}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth" className="bg-transparent border border-[#E0E0E0] text-[#263238] hover:bg-gray-50 px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-[11px] font-medium uppercase tracking-wider transition-all">
                    Login
                  </Link>
                  <Link to="/auth?mode=register" className="bg-[#2E7D32] text-white hover:bg-[#1B5E20] px-4 md:px-6 py-2 border border-transparent rounded-xl text-[10px] md:text-[11px] font-medium uppercase tracking-wider shadow-sm transition-all hidden sm:block">
                    {t('nav_auth' as any)}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
        
        <main className="flex-grow container mx-auto px-4 md:px-6 py-6 md:py-10">

          <Routes>
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/shop" element={<Shop addToCart={addToCart} products={products} />} />
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
            <Route path="/checkout" element={<Checkout cart={cart} user={user} removeFromCart={(id) => setCart(c => c.filter(x => x.id !== id))} clearCart={() => setCart([])} onComplete={() => setCart([])} />} />
            <Route path="/profile" element={user ? <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateAccounts={updateLinkedAccounts} /> : <Navigate to="/auth" />} />
            <Route path="/relatorios-publicos" element={<PublicReport />} />
          </Routes>

          <footer className="mt-20 border-t border-[#E0E0E0] pt-16 pb-8 bg-[#F1F8F4]">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-1">
                <Logo className="w-10 h-10 mb-4" color="#2E7D32" />
                <h3 className="font-poppins font-bold text-[#263238] text-lg mb-2">AgroConnect</h3>
                <p className="text-[13px] text-[#757575] leading-relaxed">
                  Conectando produtores rurais a mercados internacionais, promovendo sustentabilidade e transparência.
                </p>
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-[#263238] text-[15px] mb-4">A Plataforma</h4>
                <div className="flex flex-col gap-3 text-[13px] text-[#757575]">
                  <Link to="/" className="hover:text-[#2E7D32] transition-colors">Sobre Nós</Link>
                  <Link to="/relatorios-publicos" className="hover:text-[#2E7D32] transition-colors">{t('nav_transparency' as any) || 'Transparência'}</Link>
                  <a href="#" className="hover:text-[#2E7D32] transition-colors">Sustentabilidade</a>
                  <a href="#" className="hover:text-[#2E7D32] transition-colors">Parceiros</a>
                </div>
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-[#263238] text-[15px] mb-4">Soluções</h4>
                <div className="flex flex-col gap-3 text-[13px] text-[#757575]">
                  <Link to="/shop" className="hover:text-[#2E7D32] transition-colors">Comprar Produtos</Link>
                  <a href="#" className="hover:text-[#2E7D32] transition-colors">Vender (Produtores)</a>
                  <a href="#" className="hover:text-[#2E7D32] transition-colors">Logística</a>
                  <a href="#" className="hover:text-[#2E7D32] transition-colors">Investimento Verde</a>
                </div>
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-[#263238] text-[15px] mb-4">Contato</h4>
                <div className="flex flex-col gap-3 text-[13px] text-[#757575]">
                  <p>geral@agroconnect.com</p>
                  <p>+258 84 000 0000</p>
                  <p className="mt-2">Maputo, Moçambique</p>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 border-t border-[#E0E0E0] pt-8 flex flex-col md:flex-row justify-between items-center text-[12px] text-[#757575]">
              <p>© {new Date().getFullYear()} AgroConnect. Todos os direitos reservados.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="hover:text-[#2E7D32]">Termos de Uso</a>
                <a href="#" className="hover:text-[#2E7D32]">Privacidade</a>
              </div>
            </div>
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
