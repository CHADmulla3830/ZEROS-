import React, { useState, useEffect } from 'react';
import { Product, Review, UserProfile } from '../types';
import { ProductService } from '../services/productService';
import { X, Star, ShoppingCart, Heart, Send, Loader2, Calendar, ShieldCheck, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface ProductDetailProps {
  product: Product;
  user: UserProfile | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  user,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInWishlist
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await ProductService.getReviews(product.id);
      setReviews(data);
      setIsLoadingReviews(false);
    };
    fetchReviews();
  }, [product.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Left: Image & Quick Info */}
        <div className="md:w-1/2 relative bg-gray-50 flex flex-col">
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 z-10 p-3 bg-white/80 backdrop-blur-md rounded-2xl hover:bg-white transition-all shadow-lg md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex-grow relative overflow-hidden">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  {product.genre}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  {product.platform}
                </span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{product.name}</h2>
              <p className="text-white/80 text-sm font-medium">{product.publisher}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Delivery</span>
              </div>
              <p className="text-sm font-bold">Instant Email</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Warranty</span>
              </div>
              <p className="text-sm font-bold">Lifetime Support</p>
            </div>
          </div>
        </div>

        {/* Right: Details & Reviews */}
        <div className="md:w-1/2 flex flex-col h-full bg-white">
          <div className="p-8 border-b border-gray-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= (product.rating || 0) ? 'text-amber-400 fill-current' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-400">({product.reviewsCount || 0} Reviews)</span>
              </div>
              <div className="flex items-baseline gap-2">
                {product.discountPrice && product.discountPrice < product.price ? (
                  <>
                    <span className="text-4xl font-black text-gray-900">৳{product.discountPrice}</span>
                    <span className="text-lg font-bold text-gray-400 line-through">৳{product.price}</span>
                  </>
                ) : (
                  <span className="text-4xl font-black text-gray-900">৳{product.price}</span>
                )}
                <span className="text-sm font-bold text-emerald-500">In Stock</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => onToggleWishlist(product.id)}
                className={`p-4 rounded-2xl transition-all ${isInWishlist ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
              >
                <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={onClose}
                className="hidden md:block p-4 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-8 no-scrollbar">
            <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {product.description}
              </p>
            </div>

            <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">User Reviews</h3>
              
              {user && (
                <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-bold text-gray-700">Rate this game:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className="p-1 transition-transform hover:scale-125"
                        >
                          <Star className={`w-5 h-5 ${star <= newReview.rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea 
                      required
                      placeholder="Share your experience with this game..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={3}
                    />
                    <button 
                      type="submit"
                      disabled={isSubmittingReview}
                      className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              )}

              {isLoadingReviews ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <img src={review.userPhoto} className="w-10 h-10 rounded-full border border-gray-100" />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-gray-900">{review.userName}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm font-medium">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-gray-50/50 border-t border-gray-100">
            <button 
              onClick={() => onAddToCart(product)}
              className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200"
            >
              <ShoppingCart className="w-6 h-6" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
