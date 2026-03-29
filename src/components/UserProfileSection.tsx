import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle, Loader2, X, AlertTriangle, Heart, ArrowLeft, History, Undo2, Trash2, LogOut, User, Package } from 'lucide-react';
import { Order, UserProfile, Product } from '../types';
import { ProductService } from '../services/productService';
import { AuthService } from '../services/authService';
import { format } from 'date-fns';
import { ProductCard } from './ProductCard';

interface UserProfileSectionProps {
  user: UserProfile;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onBack: () => void;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({ 
  user, 
  onAddToCart,
  onToggleWishlist,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'recent'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userOrders, allProducts] = await Promise.all([
        ProductService.getUserOrders(user.uid),
        ProductService.getAllProducts()
      ]);
      setOrders(userOrders);
      
      if (user.wishlist) {
        setWishlistProducts(allProducts.filter(p => user.wishlist?.includes(p.id)));
      }

      // Load recently viewed from local storage
      const stored = localStorage.getItem('recentlyViewed');
      if (stored) {
        try {
          const ids = JSON.parse(stored) as string[];
          setRecentlyViewed(ids.map(id => allProducts.find(p => p.id === id)).filter((p): p is Product => p !== undefined));
        } catch (e) {
          console.error('Failed to parse recently viewed:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid, user.wishlist]);

  const handleRequestCancellation = async (orderId: string) => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    setIsSubmittingCancellation(true);
    try {
      await ProductService.requestOrderCancellation(orderId, cancellationReason);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancellation_requested' } : o));
      setCancellingOrderId(null);
      setCancellationReason('');
    } catch (error) {
      console.error('Failed to request cancellation:', error);
      alert('Failed to request cancellation. Please try again.');
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'cancelled': return 'text-rose-600 bg-rose-50';
      case 'cancellation_requested': return 'text-amber-600 bg-amber-50';
      case 'cancellation_approved': return 'text-rose-600 bg-rose-50';
      case 'cancellation_rejected': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'cancellation_requested': return <Clock className="w-4 h-4" />;
      case 'cancellation_approved': return <XCircle className="w-4 h-4" />;
      case 'cancellation_rejected': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const canCancel = (order: Order) => {
    return order.status === 'pending';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 font-bold group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm sticky top-24">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-4">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-24 h-24 rounded-[2rem] object-cover ring-4 ring-indigo-50 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-1">{user.displayName}</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{user.email}</p>
            </div>

            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Package className="w-5 h-5" />
                My Orders
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'wishlist' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Heart className="w-5 h-5" />
                Wishlist
              </button>
              <button 
                onClick={() => setActiveTab('recent')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'recent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <History className="w-5 h-5" />
                Recently Viewed
              </button>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button 
                  onClick={() => AuthService.signOut()}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm min-h-[600px]">
            <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">
              {activeTab === 'orders' ? 'Order History' : 
               activeTab === 'wishlist' ? 'My Wishlist' : 'Recently Viewed'}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'orders' && (
                  orders.length > 0 ? (
                    orders.map(order => (
                      <div key={order.id} className="group bg-gray-50 rounded-[2rem] p-8 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Order ID</span>
                              <span className="text-sm font-black text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Date</span>
                              <span className="text-sm font-black text-gray-900">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Amount</span>
                            <span className="text-2xl font-black text-indigo-600">৳{order.totalAmount}</span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-8">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                                  {item.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-gray-900">{item.name}</h4>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {item.version ? `${item.version} • ` : ''}Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-black text-gray-900">৳{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-100">
                          <div className="flex flex-col gap-4 w-full">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment: {order.paymentMethod.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TXID: {order.transactionId}</span>
                              </div>
                            </div>

                            {order.status === 'cancellation_rejected' && order.cancellationRejectionReason && (
                              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Cancellation Rejection Reason</p>
                                <p className="text-sm font-medium text-rose-700">{order.cancellationRejectionReason}</p>
                              </div>
                            )}
                          </div>
                          
                          {canCancel(order) && (
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                              {cancellingOrderId === order.id ? (
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    placeholder="Reason for cancellation..."
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    className="w-full md:w-64 p-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleRequestCancellation(order.id)}
                                      disabled={isSubmittingCancellation}
                                      className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                                    >
                                      {isSubmittingCancellation ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit Request'}
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setCancellingOrderId(null);
                                        setCancellationReason('');
                                      }}
                                      disabled={isSubmittingCancellation}
                                      className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setCancellingOrderId(order.id)}
                                  className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition-all"
                                >
                                  <Undo2 className="w-4 h-4" />
                                  Request Cancellation
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                      <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">No orders found yet.</p>
                      <button onClick={onBack} className="mt-4 text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline">Start Shopping</button>
                    </div>
                  )
                )}

                {activeTab === 'wishlist' && (
                  wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {wishlistProducts.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          onAddToCart={onAddToCart}
                          onToggleWishlist={onToggleWishlist}
                          isInWishlist={true}
                          onClick={() => {
                            // Navigation is handled by App.tsx via routing if we use Link, 
                            // but here we can just let it be clickable if needed.
                            // For now, ProductCard handles its own click if provided.
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                      <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">Your wishlist is empty.</p>
                      <button onClick={onBack} className="mt-4 text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline">Explore Games</button>
                    </div>
                  )
                )}

                {activeTab === 'recent' && (
                  recentlyViewed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {recentlyViewed.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          onAddToCart={onAddToCart}
                          onToggleWishlist={onToggleWishlist}
                          isInWishlist={user.wishlist?.includes(product.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                      <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">No recently viewed items.</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
