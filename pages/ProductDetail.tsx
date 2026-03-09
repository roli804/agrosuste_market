
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';
import { useLanguage } from '../LanguageContext';

interface ProductDetailProps {
  addToCart: (p: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ addToCart }) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const product = MOCK_PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">{t('product_not_found' as any)}</h2>
        <Link to="/shop" className="text-primary hover:underline">{t('product_back_market' as any)}</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 h-[400px] md:h-auto">
          <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
        </div>
        <div className="md:w-1/2 p-8 md:p-12 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full mb-4 inline-block">{t('product_category_label' as any)}: {product.categoryId}</span>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{product.name}</h1>
            </div>
            {product.isDried && (
              <span className="bg-earthy text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">{t('product_dried_badge' as any)}</span>
            )}
          </div>

          <p className="text-gray-500 leading-relaxed text-lg">{product.description}</p>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-4xl font-black text-primary">{product.price.toLocaleString()} MZN</span>
                <span className="text-sm text-gray-400 block font-semibold uppercase">{t('product_price_per' as any)} {product.unit}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{t('product_in_stock' as any)}: {product.stock}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => addToCart(product)}
                className="flex-grow bg-primary hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                {t('product_add_cart' as any)} 🛒
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="text-xs font-bold text-gray-800">{t('product_local_logistics' as any)}</p>
                <p className="text-[10px] text-gray-400">{t('product_available_for' as any)}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-xs font-bold text-gray-800">{t('product_verified' as any)}</p>
                <p className="text-[10px] text-gray-400">{t('product_quality_label' as any)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
