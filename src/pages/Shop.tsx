import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { Product, UserProfile } from '../types';
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles, X, Gamepad2 } from 'lucide-react';

interface ShopProps {
  products: Product[];
  user: UserProfile | null;
  toggleWishlist: (productId: string) => void;
  setSelectedProduct: (product: Product) => void;
}

export function Shop({ products, user, toggleWishlist, setSelectedProduct }: ShopProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'date' | 'popularity'>('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    let result = [...products];
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.publisher.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q)
      );
    }

    // Genre
    if (genreFilter !== 'All') {
      result = result.filter(p => p.genre === genreFilter);
    }

    // Price Range
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popularity') return b.popularity - a.popularity;
      if (sortBy === 'date') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      return 0;
    });

    setFilteredProducts(result);
  }, [searchQuery, genreFilter, priceRange, sortBy, products]);

  const genres = ['All', ...new Set(products.map(p => p.genre))];

  return (
    <>
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">PC Games</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing {filteredProducts.length} results</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-grow md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by title, publisher, genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-4 rounded-2xl border transition-all ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Genre</label>
                <select 
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sort By</label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="date">Newest First</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Price</label>
                  <span className="text-sm font-black text-indigo-600">৳{priceRange[1]}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2 mb-8 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">AI Enhanced Search Results</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onToggleWishlist={toggleWishlist}
              onClick={setSelectedProduct}
              isInWishlist={user?.wishlist?.includes(product.id)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No games found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </>
  );
}
