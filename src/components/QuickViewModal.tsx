import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Heart, Star, X, Check } from 'lucide-react';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-900 rounded-full backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {product.featured && (
            <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
              Featured
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span className="text-sm font-bold text-gray-600">{product.rating || '0.0'}</span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 leading-tight">
            {product.name}
          </h2>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-500">{product.publisher}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="text-sm font-medium text-gray-500">{product.genre}</span>
          </div>

          <div className="mb-8">
            <div className="flex items-end gap-3 mb-2">
              {product.priceRange ? (
                <span className="text-3xl font-black text-gray-900">৳{product.priceRange.min} - ৳{product.priceRange.max}</span>
              ) : product.discountPrice && product.discountPrice < product.price ? (
                <>
                  <span className="text-3xl font-black text-gray-900">৳{product.discountPrice}</span>
                  <span className="text-lg font-bold text-gray-400 line-through">৳{product.price}</span>
                </>
              ) : (
                <span className="text-3xl font-black text-gray-900">৳{product.price}</span>
              )}
            </div>
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <Check className="w-4 h-4" /> In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                <X className="w-4 h-4" /> Out of Stock
              </span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-8 flex-grow">
            {product.description}
          </p>

          <div className="flex gap-4 mt-auto">
            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              disabled={product.stock <= 0}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            
            {onToggleWishlist && (
              <button 
                onClick={() => onToggleWishlist(product.id)}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center ${
                  isInWishlist 
                    ? 'border-red-500 bg-red-50 text-red-500' 
                    : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                }`}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
