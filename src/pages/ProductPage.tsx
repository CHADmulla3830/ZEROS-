import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, UserProfile } from '../types';
import { ProductService } from '../services/productService';
import { AuthService } from '../services/authService';
import { ProductDetail } from '../components/ProductDetail';
import { Loader2 } from 'lucide-react';

interface ProductPageProps {
  user: UserProfile | null;
  addToCart: (product: Product) => void;
  toggleWishlist: (productId: string) => void;
}

export function ProductPage({ user, addToCart, toggleWishlist }: ProductPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const p = await ProductService.getProductById(id);
        if (p) {
          setProduct(p);
          if (user) {
            AuthService.addToRecentlyViewed(user.uid, id);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ProductDetail 
        product={product}
        user={user}
        onClose={() => navigate('/')}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        isInWishlist={user?.wishlist?.includes(product.id) || false}
        isModal={false}
      />
    </div>
  );
}
