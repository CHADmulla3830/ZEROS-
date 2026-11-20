import React, { useState } from 'react';
import { Product } from '../types';
import { Heart, Star, Share2, Check, ArrowUpRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onToggleWishlist?: (productId: string) => void;
  onClick?: (product: Product) => void;
  isInWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onToggleWishlist, onClick, isInWishlist = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const copyToClipboard = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setIsCopied(true); setTimeout(() => setIsCopied(false), 1800); } catch { /* noop */ }
  };
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: `Check out ${product.name} on ZEROS'`, url }); }
      catch (error) { if ((error as Error).name !== 'AbortError') copyToClipboard(url); }
    } else copyToClipboard(url);
  };

  return (
    <article onClick={() => onClick?.(product)} className="product-card group">
      <div className="product-media">
        <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <div className="product-media-shade" />
        {product.featured && <span className="product-badge">Featured</span>}
        <div className="product-actions">
          {onToggleWishlist && <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }} className={`product-action ${isInWishlist ? 'product-action-liked' : ''}`} aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}><Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} /></button>}
          <button onClick={handleShare} className="product-action" aria-label="Share product">{isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}</button>
        </div>
        <span className="product-open"><ArrowUpRight className="h-4 w-4" /></span>
      </div>
      <div className="product-body">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="product-category">{product.category}</span>
          <span className="product-rating"><Star className="h-3 w-3 fill-current" /> {product.rating || 'New'}</span>
        </div>
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div><span className="product-price-label">From</span><div className="product-price">৳{product.priceRange ? `${product.priceRange.min}–${product.priceRange.max}` : product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price}</div></div>
          <span className="product-cta">View details <ArrowUpRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </article>
  );
};
