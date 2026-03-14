import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle, Loader2, X, AlertTriangle, Heart } from 'lucide-react';
import { Order, UserProfile, Product } from '../types';
import { ProductService } from '../services/productService';
import { format } from 'date-fns';
import { ProductCard } from './ProductCard';

interface UserProfileSectionProps {
  user: UserProfile;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({ 
  user, 
  onAddToCart,
  onToggleWishlist 
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    const userOrders = await ProductService.getUserOrders(user.uid);
    setOrders(userOrders);
    setIsLoading(false);
  };

  const fetchWishlist = async () => {
    if (!user.wishlist || user.wishlist.length === 0) {
      setWishlistProducts([]);
      return;
    }
    setIsLoadingWishlist(true);
    try {
      const allProducts = await ProductService.getAllProducts();
      const filtered = allProducts.filter(p => user.wishlist?.includes(p.id));
      setWishlistProducts(filtered);
    } catch (error) {
      console.error('Failed to fetch wishlist products:', error);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchWishlist();
  }, [user.uid, user.wishlist]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await ProductService.updateOrderStatus(orderToCancel.id, 'cancelled');
      setOrderToCancel(null);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
          <img src={user.photoURL} className="w-32 h-32 rounded-full border-4 border-white/20" />
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">{user.displayName}</h1>
            <p className="text-indigo-100 mb-4">{user.email}</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Role</p>
                <p className="font-bold capitalize">{user.role}</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Joined</p>
                <p className="font-bold">{format(new Date(user.createdAt), 'MMM yyyy')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold">Order History</h2>
            </div>
            
            <div className="p-8">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className={`p-4 rounded-2xl ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                          order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {order.status === 'completed' ? <CheckCircle /> : order.status === 'pending' ? <Clock /> : <XCircle />}
                        </div>
                        <div>
                          <p className="text-xs font-mono text-gray-400 mb-1">#{order.id.slice(-8).toUpperCase()}</p>
                          <h3 className="font-bold text-gray-900">
                            {order.items.map(i => i.name).join(', ')}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(order.createdAt), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">৳{order.totalAmount}</p>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{order.paymentMethod}</p>
                        </div>
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => setOrderToCancel(order)}
                            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-100 transition-all"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="p-8 border-b border-gray-100 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold">Wishlist</h2>
            </div>
            
            <div className="p-8">
              {isLoadingWishlist ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : wishlistProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-500">Your wishlist is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {wishlistProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={onAddToCart || (() => {})} 
                      onToggleWishlist={onToggleWishlist}
                      isInWishlist={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Cancel Order?</h2>
            <p className="text-gray-500 mb-8">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setOrderToCancel(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                disabled={isCancelling}
              >
                No, Keep
              </button>
              <button 
                onClick={handleCancelOrder}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
