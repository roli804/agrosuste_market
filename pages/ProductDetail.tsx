
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { CATEGORIES, MOCK_PRODUCTS } from '../constants';
import { useLanguage } from '../LanguageContext';
import { ShieldCheck, Truck, Heart, ShoppingCart, ChevronLeft } from 'lucide-react';

interface ProductDetailProps {
  addToCart: (p: Product) => void;
  products: Product[];
}

const CERT_LABELS: Record<string, string> = {
  '1': 'Secagem Natural', '2': 'Rastreável', '3': 'Orgânico',
  '4': 'Regenerativo', '5': 'Nativo', '6': 'Agro-Tech',
};

const ProductDetail: React.FC<ProductDetailProps> = ({ addToCart, products }) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const product = products.find(p => p.id === id) || MOCK_PRODUCTS.find(p => p.id === id);

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const category = CATEGORIES.find(c => c.id === product?.categoryId);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FAFAF8]">
        <div className="text-5xl mb-5">🌾</div>
        <h2 className="font-poppins font-bold text-2xl text-[#1C1C1C] mb-3">Produto não encontrado</h2>
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-[#2E7D32] font-semibold hover:underline">
          <ChevronLeft size={16} /> Voltar ao Mercado
        </Link>
      </div>
    );
  }

  // Pad images array so we always show at least 4 thumbnails
  const baseImg = product.images[0] || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80';
  const allImages = product.images.length >= 4
    ? product.images
    : [...product.images, ...Array(4 - product.images.length).fill(baseImg)];

  const extraCount = Math.max(0, allImages.length - 4);

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-5 xl:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] mb-8">
          <Link to="/shop" className="text-[#2E7D32] font-semibold hover:underline">Mercado</Link>
          <span className="text-[#D0D0D0]">›</span>
          <span className="text-[#9A9A9A] font-medium">{category ? t(category.name as any) : 'Produto'}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* ─── Left: Image Gallery ──────────────────────────────── */}
          <div className="lg:w-[52%] flex-shrink-0">
            {/* Main image */}
            <div
              className="rounded-3xl overflow-hidden border border-[#EBEBEB] bg-white relative"
              style={{ aspectRatio: '4/3' }}
            >
              <img
                src={allImages[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
                onError={e => { (e.currentTarget as HTMLImageElement).src = baseImg; }}
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 mt-4">
              {allImages.slice(0, 3).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`flex-1 rounded-xl overflow-hidden border-2 transition-all`}
                  style={{
                    aspectRatio: '1',
                    borderColor: activeImg === i ? '#2E7D32' : 'transparent',
                    outline: activeImg === i ? 'none' : undefined,
                    boxShadow: activeImg === i ? '0 0 0 1px #2E7D32' : undefined,
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = baseImg; }}
                  />
                </button>
              ))}

              {/* 4th thumbnail — shows overflow count */}
              <button
                onClick={() => setActiveImg(3)}
                className="flex-1 rounded-xl overflow-hidden relative border-2 transition-all"
                style={{
                  aspectRatio: '1',
                  borderColor: activeImg === 3 ? '#2E7D32' : 'transparent',
                  boxShadow: activeImg === 3 ? '0 0 0 1px #2E7D32' : undefined,
                }}
              >
                <img
                  src={allImages[3]}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = baseImg; }}
                />
                {extraCount > 0 && (
                  <div className="absolute inset-0 bg-black/52 flex items-center justify-center rounded-xl">
                    <span className="text-white text-[12px] font-bold">+{extraCount} Mais</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* ─── Right: Product Info ───────────────────────────────── */}
          <div className="flex-grow min-w-0">

            {/* Title */}
            <h1
              className="font-poppins font-bold text-[#1C1C1C] leading-tight mb-3"
              style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
            >
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-[#6D6D6D] text-[14px] leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className="font-poppins font-bold text-[#1C1C1C]" style={{ fontSize: 'clamp(26px, 3.5vw, 38px)' }}>
                {product.price.toLocaleString()} MZN
              </span>
              <span className="text-[#A0A0A0] text-[13px] font-medium ml-2">por {product.unit}</span>
            </div>

            {/* Quantity */}
            <div className="mb-7">
              <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-[0.15em] mb-3">Quantidade</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#F5F5F0] rounded-xl border border-[#E8E8E8] overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center text-[#6D6D6D] hover:bg-[#E8E8E2] transition-colors text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-poppins font-bold text-[#1C1C1C] text-[15px] select-none">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock || 999, q + 1))}
                    className="w-11 h-11 flex items-center justify-center text-[#6D6D6D] hover:bg-[#E8E8E2] transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[12px] text-[#A0A0A0] font-medium">
                  {product.stock > 0 ? `${product.stock} disponíveis` : 'Esgotado'}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-grow flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-poppins font-bold text-[15px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: added ? 'linear-gradient(135deg,#1B5E20,#2E7D32)' : 'linear-gradient(135deg,#4CAF50,#2E7D32)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(46,125,50,0.30)',
                }}
              >
                <ShoppingCart size={18} />
                {added ? '✓ Adicionado ao Carrinho!' : 'Adicionar ao Carrinho'}
              </button>

              <button
                onClick={() => setWishlisted(w => !w)}
                className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-[14px] border-2 transition-all duration-200 active:scale-[0.97] ${
                  wishlisted
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'bg-white border-[#E0E0E0] text-[#6D6D6D] hover:border-[#2E7D32] hover:text-[#2E7D32]'
                }`}
              >
                <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
                {wishlisted ? 'Guardado' : 'Lista de Desejos'}
              </button>
            </div>

            {/* Certification badges */}
            <div className="border-t border-[#F0F0F0] pt-6 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={15} className="text-[#2E7D32]" />
                </div>
                <div>
                  <span className="text-[13px] text-[#2D2D2D] font-semibold">
                    {CERT_LABELS[product.categoryId] || 'Produto Certificado'}
                  </span>
                  <span className="text-[#9A9A9A] text-[12px]"> · Verificado pela AgroSuste</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={15} className="text-[#2E7D32]" />
                </div>
                <div>
                  <span className="text-[13px] text-[#2D2D2D] font-semibold">Entrega disponível</span>
                  <span className="text-[#9A9A9A] text-[12px]"> · Logística sustentável em carbono neutro</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
