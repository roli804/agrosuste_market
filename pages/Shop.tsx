
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
    <div className="flex flex-col lg:flex-row gap-12 pb-24">
      <aside className="w-full lg:w-72 space-y-6 md:space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-soft border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#5B8C51] rounded-full"></span> {t('shop_search_title')}
          </h3>
          <input 
            type="text" 
            placeholder={t('shop_search_placeholder')}
            className="w-full p-4 rounded-xl border-2 border-gray-50 bg-[#F9FBF8] text-gray-900 font-bold placeholder:text-gray-300 focus:border-[#5B8C51] focus:bg-white focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-soft border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 mb-4 ">{t('shop_categories')}</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-5 py-3 rounded-xl transition-all font-bold text-sm ${!selectedCategory ? 'bg-[#2E5C4E] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t('shop_all_products')}
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-5 py-3 rounded-xl transition-all flex items-center gap-3 font-bold text-sm ${selectedCategory === cat.id ? 'bg-[#5B8C51] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="text-lg">{cat.icon}</span> {translatedCategories[cat.id] || cat.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-grow">
        <div className="mb-6 md:mb-10 px-2 md:px-4">
          <h2 className="text-2xl md:text-4xl font-semibold text-gray-900">
            {selectedCategory ? (translatedCategories[selectedCategory] || CATEGORIES.find(c => c.id === selectedCategory)?.name) : t('shop_market_title')}
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-2">
            {t('shop_showing')} {filteredProducts.length} {t('shop_harvests')}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map(product => {
              const trans = translatedProducts[product.id] || { name: product.name, desc: product.description };
              return (
                <div key={product.id} className="product-card group">
                  <div className="product-image-wrapper">
                    <img src={product.images[0]} alt={trans.name} className="product-image" />
                    {product.isDried && (
                      <span className="absolute top-4 left-4 bg-[#795548] text-white text-[10px] px-3 py-1 rounded-full font-semibold shadow-md z-10">{t('home_dry_grain')}</span>
                    )}
                    <span className="verified-badge">{t('profile_official')}</span>
                  </div>
                  <div className="product-content">
                    <h3 className="product-title">{trans.name}</h3>
                    <div className="product-producer">{t('profile_official')}</div>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium line-clamp-2 mb-4 md:mb-6 leading-relaxed">{trans.desc}</p>
                    <div className="product-price-container">
                      <span className="product-price">
                          {product.price.toLocaleString()}
                          <small>MZN /{product.unit}</small>
                      </span>
                      <span className="product-unit font-semibold text-[#2E5C4E]">{product.stock} {t('stock_available')}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="product-action flex justify-center items-center gap-2 mt-2"
                    >
                      🛒 {t('add_to_cart')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-gray-200">
            <div className="text-6xl mb-6">🌾</div>
            <h3 className="text-2xl font-semibold text-gray-900">{t('shop_no_products')}</h3>
            <p className="text-gray-400 mt-2 font-medium text-sm">{t('shop_no_products_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
