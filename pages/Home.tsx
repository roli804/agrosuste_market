
import { Link } from 'react-router-dom';
import React from 'react';
import { CATEGORIES } from '../constants';
import { Product, User } from '../types';
import { useLanguage } from '../LanguageContext';
import { ArrowRight, ShieldCheck, Banknote, Globe, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

const CERT_LABELS: Record<string, string> = {
  '1': 'Secagem Natural', '2': 'Rastreável', '3': 'Orgânico',
  '4': 'Regenerativo', '5': 'Nativo', '6': 'Agro-Tech',
};

interface HomeProps {
  addToCart: (p: Product) => void;
  products: Product[];
  partners: User[];
}

const Home: React.FC<HomeProps> = ({ addToCart, products, partners }) => {
  const { t, translateBatch, language } = useLanguage();
  const [translatedProducts, setTranslatedProducts] = React.useState<Record<string, { name: string, desc: string }>>({});
  const [translatedCategories, setTranslatedCategories] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const translateAll = async () => {
      if (language === 'pt') {
        const rp: Record<string, { name: string, desc: string }> = {};
        products.forEach(p => rp[p.id] = { name: p.name, desc: p.description });
        setTranslatedProducts(rp);
        const rc: Record<string, string> = {};
        CATEGORIES.forEach(c => rc[c.id] = t(c.name));
        setTranslatedCategories(rc);
        return;
      }
      const productTexts: string[] = [];
      const productMap: { id: string, type: 'name' | 'desc' }[] = [];
      products.slice(0, 4).forEach(p => {
        productTexts.push(p.name); productMap.push({ id: p.id, type: 'name' });
        productTexts.push(p.description); productMap.push({ id: p.id, type: 'desc' });
      });
      const catTexts = CATEGORIES.map(c => t(c.name));
      const [pt2, ct2] = await Promise.all([translateBatch(productTexts), translateBatch(catTexts)]);
      const np: Record<string, { name: string, desc: string }> = {};
      pt2.forEach((text, i) => {
        const info = productMap[i];
        if (!np[info.id]) np[info.id] = { name: '', desc: '' };
        np[info.id][info.type] = text;
      });
      const nc: Record<string, string> = {};
      ct2.forEach((text, i) => nc[CATEGORIES[i].id] = text);
      setTranslatedProducts(np);
      setTranslatedCategories(nc);
    };
    translateAll();
  }, [language, products, translateBatch]);

  const [partnerPage, setPartnerPage] = React.useState(0);
  const PARTNERS_PER_PAGE = 4;
  const totalPartnerPages = Math.ceil(partners.length / PARTNERS_PER_PAGE);
  const visiblePartners = partners.slice(partnerPage * PARTNERS_PER_PAGE, (partnerPage + 1) * PARTNERS_PER_PAGE);

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: 'calc(100vh - 72px)' }}>
        <img
          src="https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=1600"
          alt="Campos agrícolas de Moçambique"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(8,22,11,0.92) 0%, rgba(8,22,11,0.72) 50%, rgba(8,22,11,0.40) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,22,11,0.82) 0%, transparent 58%)' }} />

        <div className="relative z-10 w-full px-6 md:px-20 xl:px-32 py-20">
          <span className="inline-flex items-center gap-2 text-[#A5D6A7] text-[11px] font-bold uppercase tracking-[0.2em] mb-7 border border-[#A5D6A7]/28 bg-[#A5D6A7]/7 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-pulse" />
            Plataforma Agro-Sustentável Oficial
          </span>

          <h1
            className="font-poppins font-bold leading-[1.06] tracking-tight max-w-4xl mb-7"
            style={{ fontSize: 'clamp(36px, 5.5vw, 70px)', color: 'white', textShadow: '0 2px 24px rgba(0,0,0,0.55)' }}
          >
            {t('home_hero_title_part1')}
            <br />
            <span style={{ color: '#6ED973', textShadow: '0 2px 20px rgba(0,0,0,0.40)' }}>
              {t('home_hero_title_part2')}
            </span>
          </h1>

          <p
            className="text-white/60 leading-[1.82] max-w-lg mb-10 font-inter"
            style={{ fontSize: 'clamp(14px, 1.5vw, 18px)' }}
          >
            {t('home_hero_subtitle')}
          </p>

          <div className="flex flex-wrap gap-4 mb-20">
            <Link to="/shop" className="hero-launch-btn inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-poppins font-bold text-[15px]">
              {t('home_hero_cta')} <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-poppins font-semibold text-[15px] text-white/88 border border-white/18 hover:border-white/38 hover:bg-white/7 transition-all"
            >
              {t('nav_consultant')}
            </button>
          </div>

          <div className="flex gap-10 md:gap-16">
            {[['500+', 'Produtores'], ['11', 'Províncias'], ['30+', 'Países']].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="font-poppins font-bold text-white leading-none mb-1.5" style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}>{val}</div>
                <div className="text-white/38 text-[10px] uppercase tracking-[0.16em] font-inter">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-28 pointer-events-none" style={{ background: 'linear-gradient(to top, #FAF9F6, transparent)' }} />
      </section>

      {/* ─── CATEGORIAS ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-20 xl:px-32 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[#2E7D32] text-[11px] font-bold uppercase tracking-[0.2em] mb-3">{t('cat_subtitle')}</p>
              <h2 className="font-poppins font-bold text-[#1C1C1C]" style={{ fontSize: 'clamp(24px, 2.8vw, 38px)' }}>{t('cat_title')}</h2>
            </div>
            <Link to="/shop" className="hidden sm:inline-flex items-center gap-1.5 text-[#2E7D32] font-bold text-sm hover:gap-3 transition-all duration-200">
              {t('cat_all')} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                className="group bg-white border border-[#EBEBEB] rounded-xl p-4 flex flex-col items-center text-center transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(46,125,50,0.10)] hover:border-[#2E7D32]/28"
              >
                <div className="w-10 h-10 bg-[#F3F8F3] rounded-lg flex items-center justify-center text-xl mb-2 group-hover:bg-[#E8F5E9] transition-colors duration-250">
                  {cat.icon}
                </div>
                <span className="font-semibold text-[10px] text-[#5A5A5A] uppercase tracking-wide leading-tight">
                  {translatedCategories[cat.id] || t(cat.name)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COLHEITAS VERIFICADAS ────────────────────────────────────── */}
      <section className="px-6 md:px-20 xl:px-32 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[#2E7D32] text-[11px] font-bold uppercase tracking-[0.2em] mb-3">{t('featured_subtitle')}</p>
              <h2 className="font-poppins font-bold text-[#1C1C1C]" style={{ fontSize: 'clamp(24px, 2.8vw, 38px)' }}>{t('featured_title')}</h2>
            </div>
            <Link to="/shop" className="hidden sm:inline-flex items-center gap-1.5 text-[#2E7D32] font-bold text-sm hover:gap-3 transition-all duration-200">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map(product => {
              const trans = translatedProducts[product.id] || { name: product.name, desc: product.description };
              return (
                <div key={product.id} className="group bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#F5F5F0]" style={{ height: '190px' }}>
                    <img
                      src={product.images[0]}
                      alt={trans.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80'; }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/92 backdrop-blur-sm text-[#2E7D32] shadow-sm border border-[#E8F5E9]">
                        {CERT_LABELS[product.categoryId] || 'Verificado'}
                      </span>
                    </div>
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">{t('stock_none')}</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-grow">
                    <Link to={`/product/${product.id}`} className="block mb-auto">
                      <h3 className="font-poppins font-bold text-[#1C1C1C] text-[14px] leading-snug mb-1 group-hover:text-[#2E7D32] transition-colors line-clamp-2">{trans.name}</h3>
                      <p className="text-[#B0B0B0] text-[10px] font-semibold uppercase tracking-widest mb-3">{product.unit}</p>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <Link to={`/product/${product.id}`} className="font-poppins font-bold text-[#2E7D32] text-[16px]">
                        {product.price.toLocaleString()}
                        <span className="text-[10px] font-semibold text-[#A0A0A0] ml-1">MZN</span>
                      </Link>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                        disabled={product.stock <= 0}
                        className="w-8 h-8 bg-[#E8F5E9] hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PARCEIROS ESTRATÉGICOS ───────────────────────────────────── */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a1a0c 0%, #111e13 100%)' }}
      >
        {/* Glow orbs — green palette, matching the site */}
        <div className="absolute top-[-80px] left-[10%] w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(46,125,50,0.28) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] right-[8%] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(27,94,32,0.22) 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[55%] w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(76,175,80,0.10) 0%, transparent 70%)' }} />

        {/* Dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.07 }} />

        <div className="px-6 md:px-20 xl:px-32 relative z-10">
          <div className="max-w-7xl mx-auto">

            {/* ── Section header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
              <div>
                <div className="inline-flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-[1.5px]" style={{ background: '#6ED973' }} />
                  <p
                    className="text-[10px] font-bold uppercase"
                    style={{ color: '#6ED973', letterSpacing: '0.28em' }}
                  >
                    {t('partners_subtitle')}
                  </p>
                </div>
                <h2
                  className="font-poppins font-bold"
                  style={{
                    fontSize: 'clamp(26px, 2.8vw, 40px)',
                    lineHeight: 1.15,
                    color: '#FFFFFF',
                    textShadow: '0 2px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  {t('partners_title')}
                </h2>
              </div>
              <Link
                to="/auth?role=strategic_partner"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-[13px] whitespace-nowrap group transition-all duration-250"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.40)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
                }}
              >
                {t('home_be_partner')}
                <ArrowRight size={14} className="transition-transform duration-250 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* ── Carousel ── */}
            {partners.length > 0 ? (
              <div className="flex flex-col items-center gap-8">

                {/* Cards row with flanking arrows */}
                <div className="flex items-center gap-4 w-full">

                  {/* ← Prev */}
                  <button
                    onClick={() => setPartnerPage(p => (p - 1 + totalPartnerPages) % totalPartnerPages)}
                    aria-label="Anterior"
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'rgba(255,255,255,0.10)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.22)',
                      color: 'rgba(255,255,255,0.80)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Cards */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {visiblePartners.map(partner => (
                      <div
                        key={partner.id}
                        className="relative flex flex-col items-center text-center rounded-2xl p-6 transition-all duration-300 group cursor-default hover:-translate-y-1"
                        style={{
                          background: 'rgba(255,255,255,0.09)',
                          backdropFilter: 'blur(24px)',
                          WebkitBackdropFilter: 'blur(24px)',
                          border: '1px solid rgba(255,255,255,0.20)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.14)',
                        }}
                      >
                        {/* Shine on hover */}
                        <div
                          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)' }}
                        />

                        {/* Logo */}
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden flex-shrink-0"
                          style={{
                            background: 'rgba(255,255,255,0.13)',
                            border: '1px solid rgba(255,255,255,0.22)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          {partner.logo
                            ? <img src={partner.logo} alt={partner.entityName || partner.fullName} className="w-full h-full object-cover" />
                            : <span className="text-2xl">🤝</span>
                          }
                        </div>

                        <h4
                          className="font-poppins font-bold text-[13px] mb-2 line-clamp-2 w-full leading-snug"
                          style={{ color: '#FFFFFF' }}
                        >
                          {partner.entityName || partner.fullName}
                        </h4>
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{ color: '#6ED973', letterSpacing: '0.16em' }}
                        >
                          {partner.entityType || 'Estratégico'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* → Next */}
                  <button
                    onClick={() => setPartnerPage(p => (p + 1) % totalPartnerPages)}
                    aria-label="Próximo"
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'rgba(255,255,255,0.10)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.22)',
                      color: 'rgba(255,255,255,0.80)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Dot indicators */}
                {totalPartnerPages > 1 && (
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPartnerPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPartnerPage(i)}
                        aria-label={`Página ${i + 1}`}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: partnerPage === i ? '28px' : '8px',
                          height: '8px',
                          background: partnerPage === i ? '#4CAF50' : 'rgba(255,255,255,0.25)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }}
                >
                  <span className="text-2xl opacity-50">🤝</span>
                </div>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>{t('home_partners_loading')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CONFIANÇA / INFO ─────────────────────────────────────────── */}
      <section className="px-6 md:px-20 xl:px-32 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#2E7D32] text-[11px] font-bold uppercase tracking-[0.2em] mb-3">Porquê escolher-nos</p>
            <h2 className="font-poppins font-bold text-[#1C1C1C]" style={{ fontSize: 'clamp(24px, 2.8vw, 38px)' }}>Construído para a confiança</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck size={24} className="text-[#2E7D32]" />, iconBg: 'bg-[#E8F5E9]', num: '01', title: t('info_official_title'), desc: t('info_official_desc') },
              { icon: <Banknote size={24} className="text-[#2E7D32]" />, iconBg: 'bg-[#E8F5E9]', num: '02', title: t('info_payment_title'), desc: t('info_payment_desc') },
              { icon: <Globe size={24} className="text-[#2E7D32]" />, iconBg: 'bg-[#E8F5E9]', num: '03', title: t('info_global_title'), desc: t('info_global_desc') },
            ].map(item => (
              <div key={item.num} className="bg-white border border-[#EAEAEA] rounded-3xl p-8 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] hover:border-[#2E7D32]/20 transition-all duration-300 flex flex-col gap-7">
                <div className="flex justify-between items-start">
                  <div className={`w-13 h-13 ${item.iconBg} rounded-xl flex items-center justify-center p-3.5`}>
                    {item.icon}
                  </div>
                  <span className="font-poppins font-black leading-none select-none" style={{ fontSize: '52px', color: 'rgba(0,0,0,0.04)' }}>{item.num}</span>
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-[18px] text-[#1C1C1C] mb-2.5">{item.title}</h3>
                  <p className="text-[#727272] text-[13px] leading-[1.76]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
