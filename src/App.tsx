import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { AdminPanel } from './components/AdminPanel';
import { UserProfileSection } from './components/UserProfileSection';
import { ProductDetail } from './components/ProductDetail';
import { Product, UserProfile } from './types';
import { ProductService } from './services/productService';
import { AuthService } from './services/authService';
import { Search, Filter, Loader2, Gamepad2, SlidersHorizontal, ArrowUpDown, Sparkles, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [siteContent, setSiteContent] = useState({ 
    contactUs: '', 
    refundPolicy: '',
    privacyPolicy: '',
    termsOfService: '',
    faq: ''
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'date' | 'popularity'>('popularity');

  // UI States
  const [view, setView] = useState<'shop' | 'profile' | 'admin'>('shop');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activePolicy, setActivePolicy] = useState<'contact' | 'refund' | 'privacy' | 'terms' | 'faq' | null>(null);

  useEffect(() => {
    const init = async () => {
      await ProductService.seedProducts();
      const [allProducts, content] = await Promise.all([
        ProductService.getAllProducts(),
        ProductService.getSiteContent()
      ]);
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      if (content) setSiteContent(content);
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

  const addToCart = async (product: Product) => {
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

  const isAdmin = user?.role === 'admin' || user?.email === 'chadmulla7@gmail.com';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading ZEROS'...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar 
        user={user} 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onHomeClick={() => {
          setView('shop');
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
                    onAddToCart={addToCart} 
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
        )}

        {view === 'profile' && user && (
          <UserProfileSection 
            user={user} 
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            onBack={() => setView('shop')}
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

      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct}
          user={user}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => {
            addToCart(p);
            setSelectedProduct(null);
          }}
          onToggleWishlist={toggleWishlist}
          isInWishlist={user?.wishlist?.includes(selectedProduct.id) || false}
        />
      )}

      {activePolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setActivePolicy(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6">
              {activePolicy === 'contact' ? 'Contact Us' : 
               activePolicy === 'refund' ? 'Refund Policy' :
               activePolicy === 'privacy' ? 'Privacy Policy' :
               activePolicy === 'terms' ? 'Terms of Service' : 'FAQ'}
            </h2>
            <div className="prose prose-indigo max-h-[60vh] overflow-y-auto pr-4 text-gray-600 leading-relaxed whitespace-pre-wrap">
              {activePolicy === 'contact' ? siteContent.contactUs : 
               activePolicy === 'refund' ? siteContent.refundPolicy :
               activePolicy === 'privacy' ? siteContent.privacyPolicy :
               activePolicy === 'terms' ? siteContent.termsOfService : siteContent.faq}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-black text-xl">Z</div>
                <span className="text-xl font-black tracking-tighter uppercase">Zeros'</span>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Your ultimate destination for premium PC games. Instant delivery, secure payments, and 24/7 support.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setView('shop')} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">Home</button></li>
                <li><button onClick={() => setActivePolicy('privacy')} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => setActivePolicy('terms')} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">Terms of Service</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Support</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setActivePolicy('contact')} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">Contact Us</button></li>
                <li><button onClick={() => setActivePolicy('faq')} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">FAQ</button></li>
                <li><button onClick={() => setActivePolicy('refund')} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">Refund Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">© 2026 ZEROS' Gaming Store. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <img src="https://storage.googleapis.com/ucl-git-repo-v2-pre-prod-711087579239.asia-southeast1.run.app/ais-pre-inpr5gnpkn4ibimvazeffr-711087579239.asia-southeast1.run.app/input_file_1.png" className="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer object-contain" alt="bKash" />
              <img src="https://storage.googleapis.com/ucl-git-repo-v2-pre-prod-711087579239.asia-southeast1.run.app/ais-pre-inpr5gnpkn4ibimvazeffr-711087579239.asia-southeast1.run.app/input_file_0.png" className="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer object-contain" alt="Nagad" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
