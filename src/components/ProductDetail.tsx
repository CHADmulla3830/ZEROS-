import React, { useState, useEffect } from 'react';
import { Product, Review, UserProfile } from '../types';
import { ProductService } from '../services/productService';
import { AuthService } from '../services/authService';
import { X, Star, ShoppingCart, Heart, Send, Loader2, Calendar, ShieldCheck, Zap, Trash2, Users, Clock, CheckCircle2, MessageSquare, Share2, Check, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ProductCard } from './ProductCard';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailProps {
  product: Product;
  user: UserProfile | null;
  onClose: () => void;
  onAddToCart: (product: Product, version?: string) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
  isModal?: boolean;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  user,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isModal = true
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'warranty'>('details');
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await ProductService.getReviews(product.id);
      setReviews(data);
      setIsLoadingReviews(false);
    };
    fetchReviews();
  }, [product.id]);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (user?.recentlyViewed) {
        const products = await Promise.all(
          user.recentlyViewed.map(id => ProductService.getProductById(id))
        );
        setRecentlyViewed(products.filter((p): p is Product => !!p && p.id !== product.id));
      }
    };
    fetchRecentlyViewed();
  }, [user, product.id]);

  useEffect(() => {
    const fetchRelated = async () => {
      const related = await ProductService.getRelatedProducts(product.id, product.genre);
      setRelatedProducts(related);
    };
    fetchRelated();
  }, [product.id, product.genre]);

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      AuthService.signInWithGoogle();
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      await ProductService.addReview({
        productId: product.id,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        rating: newReview.rating,
        comment: newReview.comment
      });
      
      setNewReview({ rating: 5, comment: '' });
      const updatedReviews = await ProductService.getReviews(product.id);
      setReviews(updatedReviews);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await ProductService.deleteReview(reviewId, product.id);
      const updatedReviews = await ProductService.getReviews(product.id);
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  const content = (
    <div className={`bg-white rounded-[3rem] overflow-hidden shadow-2xl relative ${isModal ? 'max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row' : 'w-full flex flex-col lg:flex-row'}`}>
      {isModal && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md hover:bg-white rounded-full transition-all shadow-sm"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Left Side: Media */}
      <div className={`lg:w-1/2 bg-gray-900 relative ${isModal ? 'h-[40vh] md:h-auto' : 'h-[60vh] lg:h-auto'}`}>
        <motion.img 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.8 }}
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        
        {!isModal && (
          <button 
            onClick={onClose}
            className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </button>
        )}

        <div className="absolute bottom-12 left-12 right-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-500/20">
              {product.genre}
            </span>
            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
              {product.platform}
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tight leading-none mb-6"
          >
            {product.name}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-6 text-white/60 text-sm font-bold"
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-lg">{(product.rating || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{product.publisher}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Content */}
      <div className={`lg:w-1/2 flex flex-col bg-white ${isModal ? 'overflow-y-auto' : ''}`}>
        <div className="p-8 lg:p-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-gray-900 tracking-tighter">
                {product.priceRange ? (
                  `৳${product.priceRange.min} - ৳${product.priceRange.max}`
                ) : (
                  `৳${product.discountPrice || product.price}`
                )}
              </span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="text-2xl text-gray-400 line-through font-bold">৳{product.price}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleShare}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-2 ${isCopied ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
                title="Share Product"
              >
                {isCopied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
                {isCopied && <span className="text-xs font-black uppercase tracking-widest">Copied</span>}
              </button>
              <button 
                onClick={() => onToggleWishlist(product.id)}
                className={`p-4 rounded-2xl border transition-all ${isInWishlist ? 'bg-red-50 border-red-100 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
              >
                <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={() => onAddToCart(product, selectedVersion?.name)}
                disabled={product.stock === 0 || (product.versions && product.versions.length > 0 && !selectedVersion)}
                className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{product.stock === 0 ? 'Out of Stock' : (product.versions && product.versions.length > 0 && !selectedVersion) ? 'Select Version' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>

          {product.versions && product.versions.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Select Version</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.versions.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVersion(v)}
                    className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 ${
                      selectedVersion?.name === v.name 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xl shadow-indigo-100' 
                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-gray-900">{v.name}</span>
                      <span className="text-indigo-600 font-black">৳{v.price}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-10 border-b border-gray-100 mb-10">
            {(['details', 'reviews', 'warranty'] as const).filter(tab => tab !== 'warranty' || product.warranty).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'details' && (
                  <div className="space-y-10">
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                      {product.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Release Date</span>
                        </div>
                        <p className="font-black text-xl text-gray-900">{new Date(product.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Status</span>
                        </div>
                        <p className={`font-black text-xl ${product.stock > 10 ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {product.stock > 0 ? `${product.stock} Units Available` : 'Out of Stock'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'warranty' && (
                  <div className="p-10 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden">
                    <Zap className="absolute -right-8 -top-8 w-48 h-48 text-indigo-100/50 rotate-12" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Warranty Information</h3>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Official ZEROS' Support Included</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed font-medium mb-8">
                        {product.warranty || 'This product comes with a standard manufacturer warranty. ZEROS\' provides 24/7 technical support and a 7-day replacement guarantee for any digital key issues.'}
                      </p>
                      <div className="flex items-center gap-3 text-indigo-600 font-black text-sm uppercase tracking-widest">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Verified Genuine Digital License</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-8">
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <motion.div 
                          layout
                          key={review.id} 
                          className="p-8 bg-gray-50 rounded-[2rem] relative group border border-gray-100"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <img src={review.userPhoto} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm" />
                              <div>
                                <p className="text-base font-black text-gray-900">{review.userName}</p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium leading-relaxed">{review.comment}</p>
                          {user && (user.uid === review.userId || user.role === 'admin') && (
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                      {reviews.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Be the first to review this game</p>
                        </div>
                      )}
                    </div>

                    {user ? (
                      <form onSubmit={handleSubmitReview} className="p-10 bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-sm">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Write a Review</h4>
                        <div className="flex gap-3 mb-8">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className="p-1 transition-all hover:scale-125 active:scale-90"
                            >
                              <Star className={`w-10 h-10 ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-100'}`} />
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            placeholder="Share your experience with this game..."
                            className="w-full p-8 bg-gray-50 border-none rounded-[2rem] text-base font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[160px] mb-8 transition-all"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="absolute bottom-12 right-6 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 font-black uppercase tracking-widest text-xs"
                          >
                            {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                <span>Post Review</span>
                                <Send className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-12 bg-indigo-50 rounded-[2.5rem] text-center border border-indigo-100">
                        <p className="text-base font-black text-gray-900 uppercase tracking-tight mb-2">Want to share your thoughts?</p>
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-8">Sign in to leave a review</p>
                        <button 
                          onClick={() => AuthService.signInWithGoogle()}
                          className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                        >
                          Sign In with Google
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="space-y-20">
        {content}
        
        {relatedProducts.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Related Games</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">More {product.genre} titles you might like</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <ProductCard 
                  key={p.id}
                  product={p}
                  onToggleWishlist={onToggleWishlist}
                  isInWishlist={user?.wishlist?.includes(p.id)}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {recentlyViewed.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Recently Viewed</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Continue where you left off</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recentlyViewed.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="cursor-pointer"
                >
                  <ProductCard 
                    product={p}
                    onToggleWishlist={onToggleWishlist}
                    isInWishlist={user?.wishlist?.includes(p.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        {content}
      </motion.div>
    </div>
  );
};
