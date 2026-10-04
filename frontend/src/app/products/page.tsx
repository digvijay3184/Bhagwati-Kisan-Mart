'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ProductCard } from '../../components/ProductCard';
import { productsApi } from '../../lib/api/products';
import { Product, ProductCategory, ProductsMeta } from '../../lib/api/types';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = (searchParams.get('category') as ProductCategory) || undefined;
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductsMeta>({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | undefined>(currentCategory);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  useEffect(() => {
    setSelectedCategory(currentCategory);
  }, [currentCategory]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    productsApi
      .getProducts({
        page: currentPage,
        limit: 12,
        category: selectedCategory,
        search: currentSearch || undefined,
      })
      .then((res) => {
        setProducts(res.items);
        setMeta(res.meta);
      })
      .catch((err) => setError(err.message || 'उत्पाद लोड करने में असमर्थ।'))
      .finally(() => setLoading(false));
  }, [selectedCategory, currentSearch, currentPage]);

  const handleCategorySelect = (cat?: ProductCategory) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (currentSearch) params.set('search', currentSearch);
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/products?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return 0;
  });

  const categories: { id?: ProductCategory; hi: string; en: string }[] = [
    { id: undefined, hi: 'सभी उत्पाद', en: 'All' },
    { id: 'insecticide', hi: 'कीटनाशक', en: 'Insecticides' },
    { id: 'fungicide', hi: 'फफूंदनाशक', en: 'Fungicides' },
    { id: 'herbicide', hi: 'खरपतवारनाशक', en: 'Herbicides' },
    { id: 'fertilizer', hi: 'खाद व उर्वरक', en: 'Fertilizers' },
    { id: 'seed', hi: 'प्रमाणित बीज', en: 'Seeds' },
    { id: 'growth_promoter', hi: 'टॉनिक / PGR', en: 'Growth' },
    { id: 'farm_tool', hi: 'कृषि यंत्र', en: 'Tools' },
    { id: 'cattle_feed', hi: 'पशु आहार', en: 'Cattle Feed' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-label-sm text-on-surface-variant">
            <span className="hover:text-primary cursor-pointer" onClick={() => router.push('/')}>होम</span>
            <span>/</span>
            <span className="text-primary font-bold">कृषि उत्पाद कैटलॉग</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-space-sm mt-1">
            <h1 className="font-headline-xl text-2xl md:text-3xl text-on-surface font-bold">
              {currentSearch
                ? `खोज परिणाम: "${currentSearch}"`
                : selectedCategory
                ? `${categories.find((c) => c.id === selectedCategory)?.hi} (${categories.find((c) => c.id === selectedCategory)?.en})`
                : 'सम्पूर्ण कृषि उत्पाद संकलन'}
            </h1>
            <span className="font-code-md text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
              कुल {meta.total} उत्पाद उपलब्ध
            </span>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.en}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3 py-1.5 rounded-full font-label-md text-xs whitespace-nowrap transition-all flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border-outline-variant/30'
                }`}
              >
                <span>{cat.hi}</span>
                <span className={`text-[10px] opacity-80 ${isSelected ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  ({cat.en})
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls Bar: Sort & Search Reset */}
        <div className="flex items-center justify-between gap-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">मूल्य क्रम:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1 outline-none text-on-surface font-label-sm"
            >
              <option value="default">अनुशंसित (Default)</option>
              <option value="price_asc">मूल्य: कम से अधिक (Low to High)</option>
              <option value="price_desc">मूल्य: अधिक से कम (High to Low)</option>
            </select>
          </div>

          {currentSearch && (
            <button
              onClick={() => router.push('/products')}
              className="text-error font-label-sm flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              खोज फ़िल्टर हटाएं
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-80 bg-surface-container-lowest rounded-xl p-4 animate-pulse border border-outline-variant/20" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-error/30 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl text-error mb-2">cloud_off</span>
            <p className="font-headline-md font-bold text-on-surface">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md"
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="p-16 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-outline mb-3">inventory_2</span>
            <h3 className="font-headline-md font-bold text-on-surface">कोई उत्पाद नहीं मिला</h3>
            <p className="font-body-sm text-on-surface-variant max-w-sm mt-1">
              {currentSearch
                ? `"${currentSearch}" से संबंधित कोई कृषि उत्पाद मौजूद नहीं है।`
                : 'इस श्रेणी में वर्तमान में कोई सक्रिय उत्पाद उपलब्ध नहीं है।'}
            </p>
            <button
              onClick={() => handleCategorySelect(undefined)}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-bold"
            >
              सम्पूर्ण कैटलॉग देखें
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pb-8">
            <button
              disabled={meta.page <= 1}
              onClick={() => handlePageChange(meta.page - 1)}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 font-label-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
            >
              पिछला
            </button>
            <span className="font-code-md text-xs px-3 py-2 bg-surface-container-low rounded-lg">
              पेज {meta.page} / {meta.totalPages}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => handlePageChange(meta.page + 1)}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 font-label-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
            >
              अगला
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface p-8 text-center">कैटलॉग लोड हो रहा है...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
