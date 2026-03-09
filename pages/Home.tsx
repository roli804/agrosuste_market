
import { Link } from 'react-router-dom';
import React from 'react';
import { CATEGORIES } from '../constants';
import { Product, User } from '../types';
import Logo from '../components/Logo';

import { useLanguage } from '../LanguageContext';

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
        const resetProducts: Record<string, { name: string, desc: string }> = {};
        products.forEach(p => resetProducts[p.id] = { name: p.name, desc: p.description });
        setTranslatedProducts(resetProducts);

        const resetCats: Record<string, string> = {};
        CATEGORIES.forEach(c => resetCats[c.id] = c.name);
        setTranslatedCategories(resetCats);
        return;
      }

      // Batch translate products
      const productTexts: string[] = [];
      const productMap: { id: string, type: 'name' | 'desc' }[] = [];

      products.slice(0, 4).forEach(p => {
        productTexts.push(p.name);
        productMap.push({ id: p.id, type: 'name' });
        productTexts.push(p.description);
        productMap.push({ id: p.id, type: 'desc' });
      });

      // Batch translate categories
      const catTexts = CATEGORIES.map(c => c.name);

      const [translatedProductTexts, translatedCatTexts] = await Promise.all([
        translateBatch(productTexts),
        translateBatch(catTexts)
      ]);

      const newProductTrans: Record<string, { name: string, desc: string }> = {};
      translatedProductTexts.forEach((text, i) => {
        const info = productMap[i];
        if (!newProductTrans[info.id]) newProductTrans[info.id] = { name: '', desc: '' };
        newProductTrans[info.id][info.type] = text;
      });

      const newCatTrans: Record<string, string> = {};
      translatedCatTexts.forEach((text, i) => {
        newCatTrans[CATEGORIES[i].id] = text;
      });

      setTranslatedProducts(newProductTrans);
      setTranslatedCategories(newCatTrans);
    };
    translateAll();
  }, [language, products, translateBatch]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[550px] rounded-[3rem] overflow-hidden shadow-strong group">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600"
          alt="Agricultura em Moçambique"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-center text-center p-10 text-white">
          <div className="bg-[#43A047]/40 backdrop-blur-sm px-5 py-2 rounded-full text-xs font-semibold mb-6 border border-white/20">
            {t('hero_badge')}
          </div>
          <div className="flex items-center gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Logo className="w-20 h-20 drop-shadow-2xl" color="white" />
            <h1 className="text-5xl md:text-7xl font-black drop-shadow-2xl tracking-tighter">
              {t('hero_title').split(' ')[0]} <span className="text-[#43A047]">{t('hero_title').split(' ')[1]}</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl max-w-2xl mb-12 drop-shadow-lg font-medium opacity-90 leading-relaxed">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <Link to="/shop" className="bg-[#43A047] hover:bg-[#1B5E20] text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl text-sm">
              {t('hero_cta_shop')}
            </Link>
            <Link to="/auth?role=seller" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 px-10 py-4 rounded-2xl font-bold transition-all text-sm">
              {t('hero_cta_auth')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias - Estilo clássico limpo */}
      <section>
        <div className="flex justify-between items-end mb-10 px-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('cat_title')}</h2>
            <p className="text-gray-400 text-sm font-medium mt-1">{t('cat_subtitle')}</p>
          </div>
          <Link to="/shop" className="text-[#43A047] font-bold text-sm hover:underline">{t('cat_all')} &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 flex flex-col items-center hover:border-[#43A047] hover:-translate-y-1 transition-all group"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-green-50 transition-all">
                {cat.icon}
              </div>
              <span className="font-bold text-xs text-gray-500 uppercase tracking-widest">{translatedCategories[cat.id] || cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section>
        <div className="mb-10 px-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('featured_title')}</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">{t('featured_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
          {products.slice(0, 4).map(product => {
            const trans = translatedProducts[product.id] || { name: product.name, desc: product.description };
            return (
              <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-soft border border-gray-100 hover:shadow-strong transition-all flex flex-col group">
                <div className="relative h-64 overflow-hidden">
                  <img src={product.images[0]} alt={trans.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.isDried && (
                    <span className="absolute top-5 right-5 bg-[#795548] text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg uppercase tracking-wider">{t('home_dry_grain' as any)}</span>
                  )}
                  <div className="absolute bottom-5 left-5">
                    <div className="bg-white/95 px-3 py-1.5 rounded-xl text-[10px] font-bold text-[#1B5E20] shadow-md uppercase tracking-widest">
                      {product.stock} {t('stock_available')}
                    </div>
                  </div>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 leading-tight">{trans.name}</h3>
                  <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-6 leading-relaxed">{trans.desc}</p>
                  <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[#43A047] font-black text-2xl tracking-tighter">{product.price.toLocaleString()} MZN</span>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">{t('home_per_unit' as any)} {product.unit}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-[#43A047] hover:bg-[#1B5E20] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs active:scale-95"
                    >
                      <span>🛒</span> {t('add_to_cart')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nossos Parceiros - Estilo Ultra-Profissional e Elegante */}
      <section className="bg-white rounded-[3.5rem] py-12 px-6 border border-gray-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">{t('partners_title')}</h2>
              <p className="text-[#43A047] text-[8px] font-black uppercase tracking-[0.5em] mt-3">{t('partners_subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-green-100 hidden md:block"></div>
              <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{t('partners_network')}</span>
            </div>
          </div>

          <div className="relative overflow-hidden group/marquee">
            <div className="flex gap-6 animate-marquee whitespace-nowrap items-center py-2">
              {[...partners, ...partners].map((partner, idx) => (
                <div key={`${partner.id}-${idx}`} className="flex flex-col items-center gap-3 min-w-[200px] group/card">
                  <div className="w-full aspect-[2/1] bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-center p-6 group-hover/card:bg-white group-hover/card:shadow-strong group-hover/card:border-[#43A047]/20 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-50/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={partner.entityName}
                        className="max-w-full max-h-full object-contain relative z-10 filter grayscale brightness-110 contrast-75 group-hover/card:grayscale-0 group-hover/card:contrast-100 group-hover/card:brightness-100 transition-all duration-700"
                      />
                    ) : (
                      <span className="text-3xl relative z-10 opacity-30 group-hover/card:opacity-100 transition-opacity">🏢</span>
                    )}
                  </div>
                  <div className="text-center overflow-hidden w-full px-2">
                    <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest truncate opacity-0 group-hover/card:opacity-100 transition-all transform translate-y-1 group-hover/card:translate-y-0 duration-500">{partner.entityName || partner.fullName}</p>
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">{partner.entityType || 'PARCEIRO'}</p>
                  </div>
                </div>
              ))}
              {partners.length === 0 && (
                <div className="w-full text-center opacity-20 font-black uppercase tracking-widest py-8">{t('partners_waiting')}</div>
              )}
            </div>
            {/* Gradient Overlays for smooth fade */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Info Agro-Suste - Refinado para Elegância */}
      <section className="bg-[#1B5E20] rounded-[3.5rem] p-12 md:p-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

        <div className="space-y-6 relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md border border-white/10 shadow-inner">🛡️</div>
          <h3 className="font-black text-xl uppercase tracking-tight">{t('info_official_title')}</h3>
          <p className="text-xs opacity-70 leading-relaxed font-medium">{t('info_official_desc')}</p>
        </div>
        <div className="space-y-6 relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md border border-white/10 shadow-inner">💸</div>
          <h3 className="font-black text-xl uppercase tracking-tight">{t('info_payment_title')}</h3>
          <p className="text-xs opacity-70 leading-relaxed font-medium">{t('info_payment_desc')}</p>
        </div>
        <div className="space-y-6 relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md border border-white/10 shadow-inner">🌍</div>
          <h3 className="font-black text-xl uppercase tracking-tight">{t('info_global_title')}</h3>
          <p className="text-xs opacity-70 leading-relaxed font-medium">{t('info_global_desc')}</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
