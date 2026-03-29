import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Plus, Heart, Star, Loader2, Eye, Share2, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void> | void;
  onToggleWishlist?: (productId: string) => void;
  onClick?: (product: Product) => void;
  isInWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart,
  onToggleWishlist,
  onClick,
  isInWishlist = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    try {
      await onAddToCart(product);
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on our store!`,
          url: url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  return (
    <div 
      onClick={() => onClick?.(product)}
      className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {onToggleWishlist && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(product.id);
              }}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                isInWishlist 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                  : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
              }`}
              title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}
          <button 
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/80 text-gray-400 hover:text-blue-600 hover:bg-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            title="Share Product"
          >
            {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(product);
            }}
            className="p-2 rounded-xl bg-white/80 text-gray-400 hover:text-indigo-600 hover:bg-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            title="Quick View"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
        {product.featured && (
          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
            Featured
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-current" />
              <span className="text-xs font-bold text-gray-600">{product.rating || '0.0'}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Price</span>
            <div className="flex items-center gap-2">
              {product.priceRange ? (
                <span className="text-xl font-bold text-gray-900">৳{product.priceRange.min} - ৳{product.priceRange.max}</span>
              ) : product.discountPrice && product.discountPrice < product.price ? (
                <>
                  <span className="text-xl font-bold text-gray-900">৳{product.discountPrice}</span>
                  <span className="text-xs text-gray-400 line-through">৳{product.price}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-900">৳{product.price}</span>
              )}
            </div>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="bg-gray-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
