import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { AdminPanel } from './components/AdminPanel';
import { UserProfileSection } from './components/UserProfileSection';
import { Product, UserProfile } from './types';
import { ProductService } from './services/productService';
import { AuthService } from './services/authService';
import { Search, Filter, Loader2, Gamepad2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'date' | 'popularity'>('popularity');

  // UI States
  const [view, setView] = useState<'shop' | 'profile' | 'admin'>('shop');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const init = async () => {
      await ProductService.seedProducts();
      const allProducts = await ProductService.getAllProducts();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setIsLoading(false);
    };

    init();

    const unsubscribe = AuthService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await AuthService.getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
        setView('shop');
      }
    });

    return () => unsubscribe();
  }, []);

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

    // Category
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Genre
    if (genreFilter !== 'All') {
      result = result.filter(p => p.genre === genreFilter);
    }

    // Platform
    if (platformFilter !== 'All') {
      result = result.filter(p => p.platform === platformFilter);
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
  }, [activeCategory, searchQuery, genreFilter, platformFilter, priceRange, sortBy, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      AuthService.signInWithGoogle();
      return;
    }
    try {
      const newWishlist = await AuthService.toggleWishlist(user.uid, productId);
      setUser(prev => prev ? { ...prev, wishlist: newWishlist } : null);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const genres = ['All', ...new Set(products.map(p => p.genre))];
  const platforms = ['All', ...new Set(products.map(p => p.platform))];
  const categories = ['All', ...new Set(products.map(p => p.category))];

  const isAdmin = user?.role === 'admin' || user?.email === 'chadmulla7@gmail.com';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar 
        user={user} 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onHomeClick={() => {
          setView('shop');
          setActiveCategory('All');
          setSearchQuery('');
        }}
        onProfileClick={() => setView('profile')}
        onAdminClick={() => setView('admin')}
        isAdmin={isAdmin}
      />

      <main>
        {view === 'shop' && (
          <>
            <Hero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col gap-8 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                          activeCategory === cat 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative flex-grow md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search by title, publisher, genre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                    >
                      <SlidersHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Genre</label>
                      <select 
                        value={genreFilter}
                        onChange={(e) => setGenreFilter(e.target.value)}
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none"
                      >
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Platform</label>
                      <select 
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none"
                      >
                        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sort By</label>
                      <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full pl-10 pr-3 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none"
                        >
                          <option value="popularity">Popularity</option>
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="date">Newest First</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Max Price: ৳{priceRange[1]}</label>
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

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">Loading ZEROS'...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={addToCart} 
                      onToggleWishlist={toggleWishlist}
                      isInWishlist={user?.wishlist?.includes(product.id)}
                    />
                  ))}
                </div>
              )}

              {!isLoading && filteredProducts.length === 0 && (
                <div className="text-center py-24">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No games found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'profile' && user && (
          <UserProfileSection 
            user={user} 
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
          />
        )}

        {view === 'admin' && isAdmin && (
          <AdminPanel />
        )}
      </main>

      {/* Modals & Overlays */}
      {isCartOpen && (
        <Cart 
          items={cart} 
          onClose={() => setIsCartOpen(false)} 
          onRemove={removeFromCart}
          onCheckout={() => {
            if (!user) {
              AuthService.signInWithGoogle();
              return;
            }
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {isCheckoutOpen && (
        <Checkout 
          items={cart}
          userId={user?.uid || ''}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setCart([]);
            setIsCheckoutOpen(false);
          }}
        />
      )}

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ZEROS'</span>
          </div>
          <p className="text-gray-500 text-sm mb-8">
            The ultimate gaming marketplace in Bangladesh. <br />
            © 2026 ZEROS'. All rights reserved.
          </p>
          <div className="flex justify-center gap-8">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Privacy Policy</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Terms of Service</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Us</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
