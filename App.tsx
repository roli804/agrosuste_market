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
import ResetPassword from './pages/ResetPassword';
import ProductDetail from './pages/ProductDetail';
import ExtensionistDashboard from './pages/ExtensionistDashboard';
import Logo from './components/Logo';
import NotificationBell from './components/NotificationBell';
import { supabase } from './lib/supabase';

import { LanguageProvider, useLanguage } from './LanguageContext';
import AIAgent from './components/AIAgent';
import { mockDb } from './lib/mock_db';

const mapUserFromSession = (sessionUser: any): User | null => {
  if (!sessionUser) return null;
  const m = sessionUser.user_metadata || {};
  const isAdmin = ['jaimecebola001@gmail.com', 'brestondaniel@gmail.com'].includes(sessionUser.email?.toLowerCase()) || m.role === UserRole.ADMIN;
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    fullName: m.full_name || 'Utilizador',
    phone: m.phone || '',
    commercialPhone: m.commercial_phone || m.phone || '',
    country: m.country || 'Moçambique',
    province: m.province,
    district: m.district,
    posto: m.posto,
    localidade: m.localidade,
    entityType: m.entity_type,
    entityName: m.entity_name,
    role: isAdmin ? UserRole.ADMIN : (m.role as UserRole || UserRole.BUYER),
    isApproved: true,
    balance: m.balance || 0,
    status: (m.status as 'active' | 'inactive' | 'blocked') || 'active',
    linkedAccounts: m.linked_accounts || []
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
    const local = mockDb.getUsers().filter(u => u.role === UserRole.STRATEGIC_PARTNER);
    const merged = [...local];
    MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER).forEach(mp => {
      if (!merged.find(p => p.email === mp.email)) merged.push(mp);
    });
    return merged;
  });
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const handleDbChange = () => {
      const existing = mockDb.getProducts();
      const mergedProducts = [...existing];
      MOCK_PRODUCTS.forEach(mp => { if (!mergedProducts.find(p => p.id === mp.id)) mergedProducts.push(mp); });
      setProducts(mergedProducts);

      const local = mockDb.getUsers().filter(u => u.role === UserRole.STRATEGIC_PARTNER);
      const mergedPartners = [...local];
      MOCK_USERS.filter(u => u.role === UserRole.STRATEGIC_PARTNER).forEach(mp => {
        if (!mergedPartners.find(p => p.email === mp.email)) mergedPartners.push(mp);
      });
      setPartners(mergedPartners);
    };

    window.addEventListener('mock-db-changed', handleDbChange);

    const fetchPartners = async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*').eq('role', UserRole.STRATEGIC_PARTNER);
        if (profiles && profiles.length > 0) {
          setPartners(profiles.map(p => ({
            id: p.id, fullName: p.full_name, entityName: p.entity_name,
            logo: p.logo, role: p.role as UserRole, isApproved: p.isapproved,
            status: p.status, linkedAccounts: p.linked_accounts || [],
            email: p.email, phone: p.phone, commercialPhone: p.commercial_phone, country: p.country
          })));
        } else {
          handleDbChange();
        }
      } catch { handleDbChange(); }
      finally { setLoading(false); }
    };

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          setProducts(prev => {
            const merged = [...prev];
            data.forEach((sp: any) => {
              const idx = merged.findIndex(p => p.id === sp.id);
              const mapped = {
                id: sp.id, producerId: sp.producer_id, categoryId: sp.category_id,
                name: sp.name, description: sp.description || '', price: sp.price,
                unit: sp.unit || 'Unidade', stock: sp.stock ?? 0,
                images: sp.images || [], isDried: sp.is_dried || false,
              };
              if (idx >= 0) merged[idx] = { ...merged[idx], ...mapped };
              else merged.unshift(mapped);
            });
            return merged;
          });
        }
      } catch { /* products table may not exist — use mockDb fallback */ }
    };

    fetchPartners();
    fetchProducts();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const mappedUser = mapUserFromSession(session?.user);
      setUser(mappedUser);
      if (event === 'SIGNED_IN' && session?.user?.id) {
        supabase.from('profiles').update({ status: 'online' }).eq('id', session.user.id).then(() => {});
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    const partnersChannel = supabase
      .channel('public:profiles:partners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `role=eq.${UserRole.STRATEGIC_PARTNER}` }, () => {
        fetchPartners();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      partnersChannel.unsubscribe();
      productsChannel.unsubscribe();
      window.removeEventListener('mock-db-changed', handleDbChange);
    };
  }, []);

  useEffect(() => {
    // Persistir produtos novos e actualizados directamente no localStorage sem disparar
    // 'mock-db-changed' (evita loop: setProducts → saveProduct → handleDbChange → setProducts)
    const saved: any[] = JSON.parse(localStorage.getItem('agro_suste_products') || '[]');
    let changed = false;

    products.forEach(p => {
      const idx = saved.findIndex((s: any) => s.id === p.id);
      if (idx < 0) {
        saved.push(p);
        changed = true;
      } else if (JSON.stringify(saved[idx]) !== JSON.stringify(p)) {
        saved[idx] = p;
        changed = true;
      }
    });

    if (changed) {
      try {
        localStorage.setItem('agro_suste_products', JSON.stringify(saved));
      } catch {
        // Quota excedida: guardar sem imagens base64 (mantém URLs do Supabase Storage)
        const stripped = saved.map((p: any) => ({
          ...p,
          images: (p.images || []).filter((img: string) => !img.startsWith('data:'))
        }));
        try { localStorage.setItem('agro_suste_products', JSON.stringify(stripped)); } catch {}
      }
    }
  }, [products]);

  const handleLogout = async () => {
    if (user?.id) {
      await supabase.from('profiles').update({ status: 'offline' }).eq('id', user.id);
    }
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
      case UserRole.EXTENSIONIST:
        return <ExtensionistDashboard user={user} onLogout={handleLogout} />;
      case UserRole.SELLER:
      case UserRole.TRANSPORTER:
      case UserRole.BUYER:
        return <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateProduct={(p) => setProducts(prev => prev.map(x => x.id === p.id ? p : x))} onUpdateAccounts={updateLinkedAccounts} />;
      default:
        return <Home addToCart={addToCart} products={products} partners={partners} />;
    }
  };

  const isAdminView = user && [UserRole.ADMIN, UserRole.STRATEGIC_PARTNER].includes(user.role) && location.pathname === '/' && !location.search.includes('view=public');
  const isAuthView = ['/auth', '/reset-password'].includes(location.pathname);
  const isHomeView = location.pathname === '/' && !user && !location.search.includes('view=public');
  const isShopView = location.pathname === '/shop' || location.pathname.startsWith('/product/');

  const navDark = isAuthView;

  return (
    <div className={`min-h-screen flex flex-col ${isAuthView ? 'bg-[#162b1a]' : 'bg-[#FAF9F6]'} selection:bg-green-100 italic-text-fix`}>
      {!isAdminView && (
        <nav className={`text-[#263238] sticky top-0 z-[100] border-b transition-all duration-500 ${navDark ? 'nav-glass' : 'bg-white border-[#E0E0E0]'}`}>
          <div className="mx-auto px-[20px] md:px-[80px] h-[72px] flex justify-between items-center w-full">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo className="w-8 h-8 group-hover:rotate-[15deg] transition-transform duration-500" color={navDark ? "#A5D6A7" : "#2E7D32"} />
              <span className="nav-logo-text font-poppins font-bold text-lg tracking-tight leading-none text-[#263238]">AgroSuste</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              <Link to="/" className="nav-link text-[16px] font-inter text-[#263238] hover:text-[#2E7D32] transition-colors hover:border-b-2 hover:border-[#2E7D32] border-b-2 border-transparent pb-1">{t('nav_home')}</Link>
              <Link to="/shop" className="nav-link text-[16px] font-inter text-[#263238] hover:text-[#2E7D32] transition-colors hover:border-b-2 hover:border-[#2E7D32] border-b-2 border-transparent pb-1">{t('nav_shop')}</Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 mr-2 nav-lang-switch">
                {[{ code: 'pt', label: 'PT' }, { code: 'en', label: 'IN' }].map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${language === l.code ? 'bg-white text-[#2E7D32] shadow-sm font-bold lang-active' : 'text-gray-400 hover:text-[#2E7D32]'}`}>
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="flex md:hidden items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 nav-lang-switch">
                {[{ code: 'pt', label: 'PT' }, { code: 'en', label: 'IN' }].map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${language === l.code ? 'bg-white text-[#2E7D32] shadow-sm lang-active' : 'text-gray-400'}`}>
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
                  <Link to="/auth" className="entry-point">
                    {t('nav_login')}
                  </Link>
                  <Link to="/auth?mode=register" className="signup-trigger hidden sm:block">
                    {t('nav_consultant')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className={isAdminView ? "flex-grow bg-[#F5F5F0]" : isAuthView ? "flex-grow" : (isHomeView || isShopView) ? "flex-grow" : "flex-grow container mx-auto px-4 md:px-6 py-6 md:py-10"}>

          <Routes>
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/shop" element={<Shop addToCart={addToCart} products={products} />} />
            <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} products={products} />} />
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout cart={cart} user={user} removeFromCart={(id) => setCart(c => c.filter(x => x.id !== id))} clearCart={() => setCart([])} onComplete={() => setCart([])} />} />
            <Route path="/profile" element={user ? <Profile user={user} products={products} onAddProduct={(p) => setProducts([p, ...products])} onUpdateProduct={(p) => setProducts(prev => prev.map(x => x.id === p.id ? p : x))} onUpdateAccounts={updateLinkedAccounts} /> : <Navigate to="/auth" />} />
            <Route path="/relatorios-publicos" element={<PublicReport />} />
          </Routes>

          {!isAdminView && !isAuthView && (
            <footer style={{ background: 'linear-gradient(160deg, #0a1a0c 0%, #111e13 100%)' }} className="pt-16 pb-8 px-6 md:px-20 xl:px-32">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16 mb-12">
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Logo className="w-7 h-7" color="#4CAF50" />
                      <span className="font-poppins font-bold text-lg text-white">AgroSuste</span>
                    </div>
                    <p className="text-white/38 text-[13px] leading-relaxed font-inter mb-6 max-w-[220px]">
                      {t('footer_tagline')}
                    </p>
                    <div className="flex gap-2">
                      {['in', 'X', 'f'].map(s => (
                        <div key={s} className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/42 hover:text-white hover:bg-white/12 hover:border-white/20 transition-all cursor-pointer text-[12px] font-bold">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-poppins font-semibold text-white/80 text-[12px] uppercase tracking-[0.14em] mb-5">{t('nav_solutions')}</h4>
                    <div className="flex flex-col gap-3">
                      <Link to="/shop" className="text-white/38 text-[13px] font-inter hover:text-white transition-colors">{t('shop_market_title')}</Link>
                      <Link to="#" className="text-white/38 text-[13px] font-inter hover:text-white transition-colors">{t('nav_finance')}</Link>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-poppins font-semibold text-white/80 text-[12px] uppercase tracking-[0.14em] mb-5">{t('shop_categories')}</h4>
                    <div className="flex flex-col gap-3">
                      {['Europa', 'Ásia', 'África'].map(r => (
                        <Link key={r} to="#" className="text-white/38 text-[13px] font-inter hover:text-white transition-colors">{r}</Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-poppins font-semibold text-white/80 text-[12px] uppercase tracking-[0.14em] mb-5">{t('nav_home')}</h4>
                    <div className="flex flex-col gap-3">
                      <Link to="/" className="text-white/38 text-[13px] font-inter hover:text-white transition-colors">{t('nav_home')}</Link>
                      <Link to="/shop" className="text-white/38 text-[13px] font-inter hover:text-white transition-colors">{t('nav_shop')}</Link>
                      <Link to="/auth" className="text-white/38 text-[13px] font-inter hover:text-white transition-colors">{t('nav_login')}</Link>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/7 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] font-inter text-white/22">
                  <p>© 2025 AgroSuste. Todos os direitos reservados</p>
                  <p>Feito com 🌱 para Moçambique</p>
                </div>
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
