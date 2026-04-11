
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
      <section className="relative h-[400px] md:h-[550px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-sm group mx-2 md:mx-0 border border-[#E0E0E0]">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600"
          alt="Agricultura em Moçambique"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/40 flex flex-col items-center justify-center text-center p-10 text-[#263238]">
          <div className="bg-[#4CAF50]/10 text-[#2E7D32] px-5 py-2 rounded-full text-xs font-semibold mb-6 border border-[#4CAF50]/20">
            {t('hero_badge')}
          </div>
          <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Logo className="w-12 h-12 md:w-16 md:h-16" color="#2E7D32" />
            <h1 className="font-poppins text-3xl md:text-6xl font-bold text-[#263238] mb-4 tracking-tight">
              {t('hero_title').split(' ')[0]} <span className="text-[#2E7D32]">{t('hero_title').split(' ')[1]}</span>
            </h1>
          </div>
          <p className="text-sm md:text-xl max-w-2xl mb-8 md:mb-12 font-regular text-[#757575] leading-relaxed">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <Link to="/shop" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-10 py-4 rounded-xl font-semibold transition-all shadow-md text-sm">
              {t('hero_cta_shop')}
            </Link>
            <Link to="/auth?role=seller" className="bg-transparent hover:bg-white text-[#2E7D32] border-2 border-[#2E7D32] px-10 py-4 rounded-xl font-semibold transition-all text-sm">
              {t('hero_cta_auth')}
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
              <span className="font-bold text-xs text-gray-500">{translatedCategories[cat.id] || cat.name}</span>
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
              <div key={product.id} className="product-card group">
                <div className="product-image-wrapper">
                  <img src={product.images[0]} alt={trans.name} className="product-image" />
                  {product.isDried && (
                    <span className="absolute top-4 left-4 bg-[#795548] text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-md z-10">{t('home_dry_grain')}</span>
                  )}
                  <div className="product-producer">{t('profile_official')}</div>
                  <p className="text-[10px] md:text-xs text-gray-400 font-medium line-clamp-2 mb-4 leading-relaxed">{trans.desc}</p>
                  
                  <div className="product-price-container">
                    <span className="product-price">
                        {product.price.toLocaleString()}
                        <small>MZN /{product.unit}</small>
                    </span>
                    <span className="product-unit font-bold text-[#2E5C4E]">{product.stock} {t('stock_available')}</span>
                  </div>
                  
                  <button onClick={() => addToCart(product)} className="product-action flex justify-center items-center gap-2 mt-2">
                    🛒 {t('add_to_cart')}
                  </button>
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
              <h2 className="text-2xl font-semibold text-gray-900   leading-none">{t('partners_title')}</h2>
              <p className="text-[#5B8C51] text-[8px] font-semibold   mt-3">{t('partners_subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-green-100 hidden md:block"></div>
              <span className="text-[8px] font-semibold text-gray-300">{t('partners_network')}</span>
            </div>
          </div>
          <div className="partners-grid">
              
              {/* 1. Rede Global Agro-Suste (ONG) */}
              <div className="partner-card ngo">
                  <div className="partner-icon">🌍</div>
                  <h4 className="partner-name">Rede Global Agro-Suste</h4>
                  <span className="partner-tag">ONG Internacional</span>
              </div>

              {/* 2. Ajuda Mútua (ONG) */}
              <div className="partner-card ngo">
                  <div className="partner-icon">🤝</div>
                  <h4 className="partner-name">Ajuda Mútua</h4>
                  <span className="partner-tag">Desenvolvimento Social</span>
              </div>

              {/* 3. Banco de Fomento (Finanças) */}
              <div className="partner-card finance">
                  <div className="partner-icon">🏦</div>
                  <h4 className="partner-name">Banco de Fomento</h4>
                  <span className="partner-tag">Crédito Agrícola</span>
              </div>

              {/* 4. Logística Nacional (Logística) */}
              <div className="partner-card logistics">
                  <div className="partner-icon">🚛</div>
                  <h4 className="partner-name">Logística Nacional</h4>
                  <span className="partner-tag">Escoamento Seguro</span>
              </div>

              {/* 5. Agro Invest (Finanças) */}
              <div className="partner-card finance">
                  <div className="partner-icon">📈</div>
                  <h4 className="partner-name">Agro Invest</h4>
                  <span className="partner-tag">Capital de Risco</span>
              </div>

              {/* 6. Certifica Moz (Certificação) */}
              <div className="partner-card">
                  <div className="partner-icon">✅</div>
                  <h4 className="partner-name">Certifica Moz</h4>
                  <span className="partner-tag">Selo Orgânico</span>
              </div>

              {/* 7. Inovação Verde (Tecnologia) */}
              <div className="partner-card">
                  <div className="partner-icon">💧</div>
                  <h4 className="partner-name">Inovação Verde</h4>
                  <span className="partner-tag">Irrigação Tech</span>
              </div>

              {/* 8. Aliança Climática (Sustentabilidade) */}
              <div className="partner-card ngo">
                  <div className="partner-icon">🌱</div>
                  <h4 className="partner-name">Aliança Climática</h4>
                  <span className="partner-tag">Carbono Neutro</span>
              </div>

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
