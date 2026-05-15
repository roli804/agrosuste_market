
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATEGORIES, MOZ_GEOGRAPHY } from '../constants';
import { Product } from '../types';
import { useLanguage } from '../LanguageContext';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface ShopProps {
  addToCart: (p: Product) => void;
  products: Product[];
}

const PRODUCTS_PER_PAGE = 9;

const CERT_LABELS: Record<string, string> = {
  '1': 'Secagem Natural', '2': 'Rastreável', '3': 'Orgânico',
  '4': 'Regenerativo', '5': 'Nativo', '6': 'Agro-Tech',
};

function buildPages(total: number, current: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '...')[] = [];
  pages.push(0);
  if (current > 2) pages.push('...');
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total - 1);
  return pages;
}

const Shop: React.FC<ShopProps> = ({ addToCart, products }) => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initCat = searchParams.get('category');

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initCat ? [initCat] : []);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(0);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setPage(0);
  };

  const filtered = products.filter(p => {
    const catOk = selectedCategories.length === 0 || selectedCategories.includes(p.categoryId);
    const minOk = !priceMin || p.price >= Number(priceMin);
    const maxOk = !priceMax || p.price <= Number(priceMax);
    return catOk && minOk && maxOk;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PRODUCTS_PER_PAGE);
  const paginated = sorted.slice(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE);
  const provinces = Object.keys(MOZ_GEOGRAPHY);

  const goToPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1320px] mx-auto px-5 xl:px-8 py-10">
        <div className="flex gap-7">

          {/* ─── Sidebar ─────────────────────────────────────────── */}
          <aside className="w-60 flex-shrink-0 hidden lg:block">
            <div className="sticky top-[88px] space-y-4">

              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                <h3 className="font-poppins font-bold text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] mb-4">Categoria</h3>
                <div className="space-y-2.5">
                  {CATEGORIES.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="w-4 h-4 rounded accent-[#2E7D32]"
                      />
                      <span className="text-[13px] text-[#3D3D3D] font-medium group-hover:text-[#2E7D32] transition-colors leading-tight">
                        {cat.icon} {t(cat.name as any)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                <h3 className="font-poppins font-bold text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] mb-4">Região</h3>
                <select
                  value={selectedRegion}
                  onChange={e => { setSelectedRegion(e.target.value); setPage(0); }}
                  className="w-full text-[13px] font-medium text-[#3D3D3D] border border-[#E0E0E0] rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32] bg-[#FAFAFA]"
                >
                  <option value="">Todas as Regiões</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                <h3 className="font-poppins font-bold text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] mb-4">Intervalo de Preço</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={priceMin}
                    onChange={e => { setPriceMin(e.target.value); setPage(0); }}
                    className="w-full text-[12px] font-medium border border-[#E0E0E0] rounded-xl px-3 py-2 outline-none focus:border-[#2E7D32] bg-[#FAFAFA]"
                  />
                  <span className="text-[#C0C0C0] text-sm font-bold">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={priceMax}
                    onChange={e => { setPriceMax(e.target.value); setPage(0); }}
                    className="w-full text-[12px] font-medium border border-[#E0E0E0] rounded-xl px-3 py-2 outline-none focus:border-[#2E7D32] bg-[#FAFAFA]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                <h3 className="font-poppins font-bold text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] mb-4">Nível de Certificação</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
                    <span className="text-[13px] font-medium text-[#3D3D3D]">Padrão Ouro</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] flex-shrink-0" />
                    <span className="text-[13px] font-medium text-[#3D3D3D]">Padrão Prata</span>
                  </div>
                </div>
              </div>

            </div>
          </aside>

          {/* ─── Main Content ─────────────────────────────────────── */}
          <div className="flex-grow min-w-0">

            {/* Header */}
            <div className="mb-7">
              <h1 className="font-poppins font-bold text-[#1C1C1C] text-[30px] md:text-[36px] leading-tight mb-1.5">
                Mercado Curado
              </h1>
              <p className="text-[#6D6D6D] text-[13px] leading-relaxed mb-5">
                Descubra produtos <span className="text-[#2E7D32] font-semibold">eticamente provenientes</span> e artesanais de fazendas comprometidas com a saúde{' '}
                <span className="text-[#2E7D32] font-semibold">planetária</span>.
              </p>

              <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-[#F0F0F0]">
                <span className="text-[13px] text-[#6D6D6D]">
                  A mostrar{' '}
                  <strong className="text-[#1C1C1C] font-semibold">{paginated.length}</strong>{' '}
                  de{' '}
                  <strong className="text-[#1C1C1C] font-semibold">{filtered.length}</strong>{' '}
                  resultados
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#9A9A9A] font-medium">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={e => { setSortBy(e.target.value); setPage(0); }}
                    className="text-[13px] font-semibold text-[#1C1C1C] border border-[#E0E0E0] rounded-lg px-3 py-1.5 outline-none focus:border-[#2E7D32] bg-white"
                  >
                    <option value="featured">Em Destaque</option>
                    <option value="price_asc">Preço: Menor → Maior</option>
                    <option value="price_desc">Preço: Maior → Menor</option>
                    <option value="name">Nome A–Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {paginated.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(product => (
                  <div key={product.id} className="group bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#F5F5F0]" style={{ height: '200px' }}>
                      <img
                        src={product.images[0]}
                        alt={product.name}
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
                          <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">Esgotado</span>
                        </div>
                      )}
                    </Link>
                    <div className="p-4 flex flex-col flex-grow">
                      <Link to={`/product/${product.id}`} className="block mb-auto">
                        <h3 className="font-poppins font-bold text-[#1C1C1C] text-[14px] leading-snug mb-1 group-hover:text-[#2E7D32] transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-[#B0B0B0] text-[10px] font-semibold uppercase tracking-widest mb-3">
                          {product.unit}
                        </p>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <Link to={`/product/${product.id}`} className="font-poppins font-bold text-[#2E7D32] text-[16px]">
                          {product.price.toLocaleString()}
                          <span className="text-[10px] font-semibold text-[#A0A0A0] ml-1">MZN</span>
                        </Link>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className="w-8 h-8 bg-[#E8F5E9] hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Adicionar ao carrinho"
                        >
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-5">🌾</div>
                <h3 className="font-poppins font-bold text-[#1C1C1C] text-xl mb-2">Nenhum produto encontrado</h3>
                <p className="text-[#6D6D6D] text-sm mb-6">Ajusta os filtros para ver mais produtos.</p>
                <button
                  onClick={() => { setSelectedCategories([]); setPriceMin(''); setPriceMax(''); }}
                  className="text-[#2E7D32] font-bold text-sm underline hover:no-underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  onClick={() => goToPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-lg border border-[#E0E0E0] bg-white flex items-center justify-center text-[#6D6D6D] hover:border-[#2E7D32] hover:text-[#2E7D32] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} />
                </button>

                {buildPages(totalPages, page).map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-[#A0A0A0] text-[13px]">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all ${page === p ? 'bg-[#2E7D32] text-white border border-[#2E7D32] shadow-sm' : 'border border-[#E0E0E0] bg-white text-[#6D6D6D] hover:border-[#2E7D32] hover:text-[#2E7D32]'}`}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="w-9 h-9 rounded-lg border border-[#E0E0E0] bg-white flex items-center justify-center text-[#6D6D6D] hover:border-[#2E7D32] hover:text-[#2E7D32] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
