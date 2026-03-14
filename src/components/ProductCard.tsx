import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.featured && (
          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
            Featured
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {product.category}
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Price</span>
            <span className="text-xl font-bold text-gray-900">৳{product.price}</span>
          </div>
          <button 
            onClick={() => onAddToCart(product)}
            className="bg-gray-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
