
import { Link } from 'react-router-dom';
import React from 'react';
import { CATEGORIES } from '../constants';
import { Product, User } from '../types';
import Logo from '../components/Logo';

import { useLanguage } from '../LanguageContext';
import { ArrowRight } from 'lucide-react';

interface HomeProps {
  addToCart: (p: Product) => void;
  products: Product[];
  partners: User[];
}

const Home: React.FC<HomeProps> = ({ addToCart, products, partners }) => {
  const { t, translateBatch, language } = useLanguage();
  const [translatedProducts, setTranslatedProducts] = React.useState<Record<string, { name: string, desc: string }>>({});
  const [translatedCategories, setTranslatedCategories] = React.useState<Record<string, string>>({});
  const [currentPartnerIndex, setCurrentPartnerIndex] = React.useState(0);

  // Auto-slide for partners
  React.useEffect(() => {
    if (partners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPartnerIndex(prev => (prev + 1) % partners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [partners.length]);

  React.useEffect(() => {
    const translateAll = async () => {
      if (language === 'pt') {
        const resetProducts: Record<string, { name: string, desc: string }> = {};
        products.forEach(p => resetProducts[p.id] = { name: p.name, desc: p.description });
        setTranslatedProducts(resetProducts);

        const resetCats: Record<string, string> = {};
        CATEGORIES.forEach(c => resetCats[c.id] = t(c.name));
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
      const catTexts = CATEGORIES.map(c => t(c.name));

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
      <section className="relative min-h-[400px] md:min-h-[600px] rounded-[3rem] overflow-hidden shadow-sm mx-2 md:mx-0 border border-[#E0E0E0]">
        <img
          src="https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=1600"
          alt="Conectividade Global e Agricultura"
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="relative z-10 bg-white/80 sm:bg-white/85 flex flex-col items-center justify-center text-center p-8 sm:p-16 backdrop-blur-md min-h-[400px] md:min-h-[600px]">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-6">
            <Logo className="w-10 h-10 text-[#2E7D32] hidden sm:block" color="#2E7D32" />
            <h1 className="font-poppins text-2xl sm:text-4xl md:text-6xl font-bold text-[#263238] tracking-tight max-w-4xl leading-[1.15]">
              {t('home_hero_title_part1')} <br className="hidden md:block" /> <span className="text-[#2E7D32]">{t('home_hero_title_part2')}</span>
            </h1>
          </div>
          <p className="font-inter text-xs sm:text-[15px] md:text-[18px] max-w-2xl mb-8 md:mb-10 text-[#263238] font-medium leading-relaxed px-4 sm:px-0">
            {t('home_hero_subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="bg-[#2E7D32] text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-poppins font-bold text-sm md:text-md shadow-xl hover:bg-[#1B5E20] transition-all flex items-center gap-2">
              {t('home_hero_cta')} <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias - Estilo clássico limpo */}
      <section>
        <div className="flex justify-between items-end mb-10 px-4">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">{t('cat_title')}</h2>
            <p className="text-gray-400 text-sm font-medium mt-1">{t('cat_subtitle')}</p>
          </div>
          <Link to="/shop" className="text-[#5B8C51] font-bold text-sm hover:underline">{t('cat_all')} &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 flex flex-col items-center hover:border-[#5B8C51] hover:-translate-y-1 transition-all group"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-green-50 transition-all">
                {cat.icon}
              </div>
              <span className="font-bold text-xs text-gray-500">{translatedCategories[cat.id] || t(cat.name)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section>
        <div className="mb-10 px-4">
          <h2 className="text-3xl font-semibold text-gray-900">{t('featured_title')}</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">{t('featured_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
          {products.slice(0, 4).map(product => {
            const trans = translatedProducts[product.id] || { name: product.name, desc: product.description };
            return (
              <div key={product.id} className="bg-[#FFFFFF] rounded-[12px] border border-[#E0E0E0] shadow-[-6px_0_18px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-transform duration-300 ease-in-out flex flex-col overflow-hidden">
                <div className="relative">
                  <img src={product.images[0]} alt={trans.name} className="w-full h-[180px] object-cover" />
                  {product.isDried && (
                    <span className="absolute top-4 left-4 bg-[#795548] text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-md z-10">{t('home_dry_grain')}</span>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-poppins font-semibold text-[#263238] text-[16px] mb-2 leading-tight">{trans.name}</h3>
                  <p className="font-inter text-[#757575] text-[13px] line-clamp-2 mb-6 flex-grow">{trans.desc}</p>

                  <div className="flex justify-between items-center mb-5">
                    <span className="font-bold text-[#2E7D32] text-[18px]">
                      {product.price.toLocaleString()} <span className="text-[12px] font-medium text-[#757575]">MZN</span>
                    </span>
                    {product.stock > 0 ? (
                      <span className="font-inter text-[#4CAF50] text-[12px] font-medium">{t('stock_available')}</span>
                    ) : (
                      <span className="font-inter text-[#E53935] text-[12px] font-medium">{t('stock_none')}</span>
                    )}
                  </div>

                  <button onClick={() => addToCart(product)} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-[10px] rounded-[8px] font-inter font-medium text-[14px] transition-colors flex justify-center items-center uppercase">
                    {t('add_to_cart')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nossos Parceiros - Estilo Ultra-Profissional e Elegante */}
      <section className="bg-white rounded-[3.5rem] py-12 px-6 border border-gray-50 shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold text-gray-900 leading-none">{t('partners_title')}</h2>
            <p className="text-[#5B8C51] text-[10px] uppercase tracking-widest font-bold mt-3">{t('partners_subtitle')}</p>
          </div>
        </div>

        <div className="relative w-full overflow-hidden px-4 md:px-12">
          {partners.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-full overflow-hidden py-10 relative">
                <div
                  className="flex gap-6 md:gap-10 transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(calc(-${currentPartnerIndex * (240 + 24)}px))` }}
                >
                  {partners.map((partner, index) => (
                    <div
                      key={`${partner.id}-${index}`}
                      className="flex-shrink-0 w-[240px] bg-white p-6 rounded-2xl shadow-left-premium border border-gray-50 flex flex-col items-center text-center transition-transform hover:scale-105 select-none"
                    >
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4 overflow-hidden border border-gray-100">
                        {partner.logo ? (
                          <img src={partner.logo} alt={partner.entityName} className="w-full h-full object-cover" />
                        ) : (
                          <span>🤝</span>
                        )}
                      </div>
                      <h4 className="font-poppins font-bold text-[#263238] text-[15px] mb-1 line-clamp-1">{partner.entityName || partner.fullName}</h4>
                      <span className="text-[10px] text-[#5B8C51] font-bold uppercase tracking-widest truncate w-full">{partner.entityType || 'Estratégico'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Dots */}
              {partners.length > 1 && (
                <div className="flex gap-2 justify-center mt-6">
                  {partners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPartnerIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${currentPartnerIndex === idx ? 'w-8 bg-[#2E7D32]' : 'w-2 bg-[#E0E0E0] hover:bg-[#A0A0A0]'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 font-medium italic">
              {t('home_partners_loading')}
            </div>
          )}

          {/* CTA Partner */}
          <div className="mt-12 flex justify-center">
            <Link to="/auth?role=strategic_partner" className="premium-btn text-sm flex items-center gap-2 shadow-xl hover:shadow-2xl">
              {t('home_be_partner')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Info Agro-Suste - Transformado para Tons Suaves (Bege/Terrosos) */}
      <section className="bg-[#F5F5DC] rounded-[3.5rem] p-12 md:p-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-[#263238] shadow-sm relative overflow-hidden border border-[#E0E0E0]">

        <div className="space-y-6 relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
          <div className="w-16 h-16 bg-[#2E7D32]/10 rounded-2xl flex items-center justify-center text-3xl font-black text-[#2E7D32] border border-[#2E7D32]/20">🛡️</div>
          <h3 className="font-poppins font-bold text-2xl text-[#2E7D32]">{t('info_official_title')}</h3>
          <p className="text-sm text-[#757575] leading-relaxed font-regular">{t('info_official_desc')}</p>
        </div>

        <div className="space-y-6 relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
          <div className="w-16 h-16 bg-[#2E7D32]/10 rounded-2xl flex items-center justify-center text-3xl font-black text-[#2E7D32] border border-[#2E7D32]/20">💸</div>
          <h3 className="font-poppins font-bold text-2xl text-[#2E7D32]">{t('info_payment_title')}</h3>
          <p className="text-sm text-[#757575] leading-relaxed font-regular">{t('info_payment_desc')}</p>
        </div>

        <div className="space-y-6 relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
          <div className="w-16 h-16 bg-[#2E7D32]/10 rounded-2xl flex items-center justify-center text-3xl font-black text-[#2E7D32] border border-[#2E7D32]/20">🌍</div>
          <h3 className="font-poppins font-bold text-2xl text-[#2E7D32]">{t('info_global_title')}</h3>
          <p className="text-sm text-[#757575] leading-relaxed font-regular">{t('info_global_desc')}</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
