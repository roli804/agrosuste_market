
import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { Product } from '../types';
import { useLanguage } from '../LanguageContext';

interface ShopProps {
  addToCart: (p: Product) => void;
  products: Product[];
}

const Shop: React.FC<ShopProps> = ({ addToCart, products }) => {
  const { t, translateBatch, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [translatedProducts, setTranslatedProducts] = useState<Record<string, { name: string, desc: string }>>({});
  const [translatedCategories, setTranslatedCategories] = useState<Record<string, string>>({});

  useEffect(() => {
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
      
      products.forEach(p => {
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

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    const trans = translatedProducts[p.id] || { name: p.name, desc: p.description };
    const matchesSearch = trans.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar - Sticky & Elegant */}
        <aside className="w-full lg:w-80 space-y-8 flex-shrink-0">
          <div className="sticky top-[100px] space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#2E7D32] rounded-full animate-pulse"></span> {t('shop_search_title')}
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('shop_search_placeholder')}
                  className="w-full bg-[#F5F5F0] border-transparent focus:bg-white focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/5 rounded-2xl py-4 px-5 text-sm font-medium transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-widest mb-6">Categorias de Produção</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`sidebar-link ${!selectedCategory ? 'active' : ''}`}
                >
                  🌾 {t('shop_all_products')}
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`sidebar-link ${selectedCategory === cat.id ? 'active' : ''}`}
                  >
                    <span className="text-lg">{cat.icon}</span> {translatedCategories[cat.id] || cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="hidden lg:block bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] p-8 rounded-3xl text-white shadow-xl overflow-hidden relative group">
               <div className="relative z-10">
                  <h4 className="font-poppins font-bold text-lg mb-2">Qualidade AgroSuste</h4>
                  <p className="text-xs text-green-100/80 leading-relaxed mb-6">Todos os produtos nesta montra são verificados pela nossa equipa técnica.</p>
                  <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-sm">Saber Mais</button>
               </div>
               <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:rotate-12 transition-transform duration-700">🌱</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 px-2">
            <div>
              <h2 className="text-4xl md:text-5xl font-poppins font-bold text-[#1C1C1C] tracking-tight">
                {selectedCategory ? (translatedCategories[selectedCategory] || CATEGORIES.find(c => c.id === selectedCategory)?.name) : t('shop_market_title')}
              </h2>
              <div className="flex items-center gap-2 mt-4">
                <span className="px-3 py-1 bg-[#2E7D32]/10 text-[#2E7D32] rounded-full text-[10px] font-bold uppercase tracking-wider">Marketplace Oficial</span>
                <span className="text-[#A0A0A0] text-sm font-medium border-l border-gray-200 pl-3">
                  {t('shop_showing')} {filteredProducts.length} {t('shop_harvests')}
                </span>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product, idx) => {
                const trans = translatedProducts[product.id] || { name: product.name, desc: product.description };
                return (
                  <div 
                    key={product.id} 
                    className="shop-card group animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="shop-card-img-wrapper">
                      <img 
                        src={product.images[0]} 
                        alt={trans.name} 
                        className="shop-card-img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                         {product.isDried && (
                           <span className="bg-[#795548] text-white text-[9px] px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-md uppercase tracking-wider">{t('home_dry_grain')}</span>
                         )}
                         <span className="bg-white/90 text-[#2E7D32] text-[9px] px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-md flex items-center gap-1 uppercase tracking-wider">
                           <span className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full"></span> {t('profile_official')}
                         </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-poppins font-bold text-[#1C1C1C] text-[17px] leading-tight group-hover:text-[#2E7D32] transition-colors">{trans.name}</h3>
                      </div>
                      <p className="text-[12px] text-[#6D6D6D] leading-relaxed line-clamp-2 mb-4 font-medium">{trans.desc}</p>
                      
                      <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                          <div>
                            <p className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest mb-0.5">Preço Atual</p>
                            <span className="text-xl font-poppins font-bold text-[#2E7D32]">
                              {product.price.toLocaleString()}
                              <small className="text-[10px] font-bold text-[#6D6D6D] ml-1 uppercase">MZN / {product.unit}</small>
                            </span>
                          </div>
                          <div className="text-right">
                             <div className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${product.stock > 0 ? 'bg-green-50 text-[#2E7D32]' : 'bg-red-50 text-red-600'}`}>
                               {product.stock > 0 ? `${product.stock} em stock` : 'Sem Stock'}
                             </div>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-full bg-[#1C1C1C] hover:bg-[#2E7D32] text-white py-3 rounded-xl font-bold text-[13px] transition-all shadow-lg hover:shadow-[0_8px_25px_rgba(46,125,50,0.25)] flex justify-center items-center gap-2 active:scale-[0.98]"
                        >
                          <span className="text-sm">🛒</span> {t('add_to_cart')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-24 text-center border border-dashed border-gray-200 flex flex-col items-center max-w-2xl mx-auto shadow-sm">
              <div className="w-24 h-24 bg-[#F5F5F0] rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce">🌾</div>
              <h3 className="text-3xl font-poppins font-bold text-[#1C1C1C]">{t('shop_no_products')}</h3>
              <p className="text-[#6D6D6D] mt-4 font-medium leading-relaxed">{t('shop_no_products_desc')}</p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory(null);}}
                className="mt-8 text-[#2E7D32] font-bold text-sm underline hover:no-underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
