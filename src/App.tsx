import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { AdminPanel } from './components/AdminPanel';
import { UserProfileSection } from './components/UserProfileSection';
import { ProductDetail } from './components/ProductDetail';
import { ProductPage } from './pages/ProductPage';
import { Footer } from './components/Footer';
import { Product, UserProfile } from './types';
import { ProductService } from './services/productService';
import { AuthService } from './services/authService';
import { db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { Search, Filter, Loader2, Gamepad2, SlidersHorizontal, ArrowUpDown, Sparkles, X, History } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [siteContent, setSiteContent] = useState({ 
    contactUs: '', 
    refundPolicy: '',
    privacyPolicy: '',
    termsOfService: '',
    faq: '',
    paymentInstructions: ''
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number; version?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'date' | 'popularity'>('popularity');

  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activePolicy, setActivePolicy] = useState<'contact' | 'refund' | 'privacy' | 'terms' | 'faq' | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'settings', 'siteContent'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };

    const init = async () => {
      // Set a safety timeout to ensure loading state is cleared
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 10000); // 10 seconds timeout

      try {
        await testConnection();
        // Seed products in background, don't block
        ProductService.seedProducts().catch(err => console.error('Seeding failed:', err));
        
        const [allProducts, content] = await Promise.all([
          ProductService.getAllProducts(),
          ProductService.getSiteContent()
        ]);
        
        if (allProducts) {
          setProducts(allProducts);
          setFilteredProducts(allProducts);
          
          // Load recently viewed from local storage
          const stored = localStorage.getItem('recentlyViewed');
          if (stored) {
            try {
              const ids = JSON.parse(stored) as string[];
              const recent = ids
                .map(id => allProducts.find(p => p.id === id))
                .filter((p): p is Product => p !== undefined);
              setRecentlyViewed(recent);
            } catch (e) {
              console.error('Failed to parse recently viewed:', e);
            }
          }
        }
        if (content) {
          setSiteContent(content);
        }
      } catch (error) {
        console.error('Initialization failed:', error);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    init();

    const unsubscribe = AuthService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await AuthService.getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
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
    result = result.filter(p => {
      const min = p.priceRange?.min ?? p.price;
      const max = p.priceRange?.max ?? p.price;
      return max >= priceRange[0] && min <= priceRange[1];
    });

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

  const addToCart = async (product: Product, version?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.version === version);
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.version === version)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, version }];
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

  const removeFromCart = (productId: string, version?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.version === version)));
  };

  const genres = ['All', ...new Set(products.map(p => p.genre))];

  const isAdmin = user?.role === 'admin' || user?.email === 'chadmulla7@gmail.com';

  const handleProductClick = (product: Product) => {
    // Add to local storage recently viewed
    const stored = localStorage.getItem('recentlyViewed');
    let ids: string[] = stored ? JSON.parse(stored) : [];
    ids = [product.id, ...ids.filter(id => id !== product.id)].slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(ids));
    
    // Update state
    const recent = ids
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
    setRecentlyViewed(recent);

    // Navigate to product page
    navigate(`/product/${product.id}`);
  };

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
          navigate('/');
          setSearchQuery('');
        }}
        onProfileClick={() => navigate('/profile')}
        onAdminClick={() => navigate('/admin')}
        isAdmin={isAdmin}
      />

      <main>
        <Routes>
          <Route path="/" element={
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
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Price</label>
                            <span className="text-sm font-black text-indigo-600">৳{priceRange[0]}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10000" 
                            step="100"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
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
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
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
                      onClick={handleProductClick}
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

                {/* Recently Viewed Section */}
                {recentlyViewed.length > 0 && (
                  <div className="mt-24">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Recently Viewed</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your browsing history</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {recentlyViewed.map(product => (
                        <ProductCard 
                          key={`recent-${product.id}`} 
                          product={product} 
                          onAddToCart={addToCart} 
                          onToggleWishlist={toggleWishlist}
                          onClick={handleProductClick}
                          isInWishlist={user?.wishlist?.includes(product.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          } />
          <Route path="/profile" element={
            user ? (
              <UserProfileSection 
                user={user} 
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                onBack={() => navigate('/')}
              />
            ) : (
              <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <p className="text-gray-500 mb-4">Please sign in to view your profile.</p>
                <button 
                  onClick={() => AuthService.signInWithGoogle()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold"
                >
                  Sign In
                </button>
              </div>
            )
          } />
          <Route path="/admin" element={
            isAdmin ? <AdminPanel currentUser={user} /> : <div className="text-center py-20">Access Denied</div>
          } />
          <Route path="/product/:id" element={
            <ProductPage 
              user={user}
              addToCart={addToCart}
              toggleWishlist={toggleWishlist}
            />
          } />
        </Routes>
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
          paymentInstructions={siteContent.paymentInstructions}
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
          onAddToCart={(p, v) => {
            addToCart(p, v);
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

      <Footer />
    </div>
  );
}
