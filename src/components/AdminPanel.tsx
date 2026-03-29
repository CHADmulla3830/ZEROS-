import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Loader2, Eye, X, Upload, Filter, ChevronDown, Search, Tag, Percent } from 'lucide-react';
import { Product, Order, PromoCode, UserProfile, UserRole } from '../types';
import { ProductService } from '../services/productService';
import { format } from 'date-fns';

interface AdminPanelProps {
  currentUser: UserProfile | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'site' | 'promo' | 'users'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [siteContent, setSiteContent] = useState({ 
    contactUs: '', 
    refundPolicy: '',
    privacyPolicy: '',
    termsOfService: '',
    faq: '',
    paymentInstructions: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'product' | 'order' | 'promo' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({ trackingNumber: '', estimatedDelivery: '' });

  // Search States
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 30;

  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const getAllowedTabs = (role: UserRole): ('dashboard' | 'products' | 'orders' | 'site' | 'promo' | 'users')[] => {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'manager':
        return ['dashboard', 'products', 'orders', 'promo', 'users', 'site'];
      case 'content_manager':
        return ['dashboard', 'products', 'site'];
      case 'sales_manager':
        return ['dashboard', 'orders', 'promo'];
      case 'product_manager':
        return ['dashboard', 'products'];
      case 'editor':
        return ['dashboard', 'site'];
      default:
        return [];
    }
  };

  const allowedTabs = currentUser ? getAllowedTabs(currentUser.role) : [];

  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedTabs(currentUser.role);
      if (allowed.length > 0 && !allowed.includes(activeTab)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [currentUser]);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('All');

  // Sorting
  const [productSortBy, setProductSortBy] = useState<string>('newest');
  const [orderSortBy, setOrderSortBy] = useState<string>('newest');

  // Form State
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    priceRange: { min: 0, max: 0 },
    category: 'PC Games',
    genre: '',
    platform: 'PC',
    publisher: '',
    releaseDate: new Date().toISOString().split('T')[0],
    popularity: 50,
    imageUrl: '',
    stock: 0,
    featured: false,
    versions: []
  });

  const [promoForm, setPromoForm] = useState<Omit<PromoCode, 'id'>>({
    code: '',
    type: 'percentage',
    value: 0,
    minPurchase: 0,
    expiryDate: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'site') {
      fetchSiteContent();
    }
  }, [activeTab]);

  const fetchSiteContent = async () => {
    const content = await ProductService.getSiteContent();
    if (content) setSiteContent(content);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const [p, o, pr, u] = await Promise.all([
      ProductService.getAllProducts(),
      ProductService.getAllOrders(),
      ProductService.getPromoCodes(),
      ProductService.getUsers()
    ]);
    setProducts(p);
    setOrders(o);
    setPromoCodes(pr);
    setUsers(u);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status'], approved?: boolean, reason?: string, extraData?: Partial<Order>) => {
    setIsActionLoading(orderId);
    try {
      if (status === 'cancellation_approved' || status === 'cancellation_rejected') {
        await ProductService.confirmOrderCancellation(orderId, approved!, reason);
      } else {
        await ProductService.updateOrderStatus(orderId, status, extraData);
      }
      await fetchData();
      if (selectedOrder?.id === orderId) {
        const updatedOrder = (await ProductService.getAllOrders()).find(o => o.id === orderId);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } finally {
      setIsActionLoading(null);
      setShowRejectionModal(false);
      setShowShippingModal(false);
      setRejectionReason('');
      setShippingInfo({ trackingNumber: '', estimatedDelivery: '' });
    }
  };

  const handleUpdateUserRole = async (uid: string, role: UserRole) => {
    setIsActionLoading(uid);
    try {
      await ProductService.updateAdminRole(uid, role);
      await fetchData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsActionLoading('delete');
    try {
      if (confirmDelete.type === 'product') {
        await ProductService.deleteProduct(confirmDelete.id);
      } else {
        await ProductService.deleteOrder(confirmDelete.id);
      }
      setConfirmDelete(null);
      await fetchData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading('save');
    try {
      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, productForm);
      } else {
        await ProductService.addProduct(productForm);
      }
      setEditingProduct(null);
      setIsAddingProduct(false);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        discountPrice: 0,
        priceRange: { min: 0, max: 0 },
        category: 'PC Games',
        genre: '',
        platform: 'PC',
        publisher: '',
        releaseDate: new Date().toISOString().split('T')[0],
        popularity: 50,
        imageUrl: '',
        stock: 0,
        featured: false,
        versions: []
      });
      await fetchData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading('save-site');
    try {
      await ProductService.updateSiteContent(siteContent);
      alert("Site content updated successfully!");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading('save-promo');
    try {
      if (editingPromo) {
        await ProductService.updatePromoCode(editingPromo.id, promoForm);
      } else {
        await ProductService.addPromoCode(promoForm);
      }
      setEditingPromo(null);
      setIsAddingPromo(false);
      setPromoForm({
        code: '',
        type: 'percentage',
        value: 0,
        minPurchase: 0,
        expiryDate: '',
        active: true
      });
      await fetchData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const statusMatch = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const paymentMatch = orderPaymentFilter === 'All' || o.paymentMethod === orderPaymentFilter;
    const searchMatch = orderSearchQuery === '' || 
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.userId.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.transactionId.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.paymentNumber.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return statusMatch && paymentMatch && searchMatch;
  });

  const sortedProducts = [...products].sort((a, b) => {
    if (productSortBy === 'price-low') return a.price - b.price;
    if (productSortBy === 'price-high') return b.price - a.price;
    if (productSortBy === 'popularity') return b.popularity - a.popularity;
    if (productSortBy === 'newest') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    return 0;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (orderSortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (orderSortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (orderSortBy === 'amount-high') return b.totalAmount - a.totalAmount;
    if (orderSortBy === 'amount-low') return a.totalAmount - b.totalAmount;
    return 0;
  });

  const filteredAndSortedProducts = sortedProducts.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
  const totalProductPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE);

  // Dashboard Stats
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalUsers = users.length;
  const totalOrders = orders.length;

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {allowedTabs.includes('dashboard') && (
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
            >
              Dashboard
            </button>
          )}
          {allowedTabs.includes('products') && (
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
            >
              Products
            </button>
          )}
          {allowedTabs.includes('orders') && (
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
            >
              Orders
            </button>
          )}
          {allowedTabs.includes('promo') && (
            <button 
              onClick={() => setActiveTab('promo')}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'promo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
            >
              Promo Codes
            </button>
          )}
          {allowedTabs.includes('users') && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
            >
              Users
            </button>
          )}
          {allowedTabs.includes('site') && (
            <button 
              onClick={() => setActiveTab('site')}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'site' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
            >
              Site Content
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">{totalOrders}</h3>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">Lifetime orders placed</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">৳{totalRevenue}</h3>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">From completed orders</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">{pendingOrders}</h3>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">Awaiting processing</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">Registered customers</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">Recent Orders</h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        o.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Order #{o.id.slice(-6)}</p>
                        <p className="text-xs text-gray-500">{format(new Date(o.createdAt), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">৳{o.totalAmount}</p>
                      <p className={`text-[10px] font-bold uppercase ${
                        o.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('orders')}
                className="w-full mt-6 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                View All Orders
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">Top Selling Products</h3>
              <div className="space-y-4">
                {products.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">৳{p.price}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Popularity: {p.popularity || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('products')}
                className="w-full mt-6 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                Manage Products
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'products' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <h2 className="text-xl font-bold">Manage Products</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setProductPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={productSortBy}
                onChange={(e) => {
                  setProductSortBy(e.target.value);
                  setProductPage(1);
                }}
                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>
              <button 
                onClick={() => {
                  setProductForm({
                    name: '',
                    description: '',
                    price: 0,
                    discountPrice: 0,
                    priceRange: { min: 0, max: 0 },
                    category: 'PC Games',
                    genre: '',
                    platform: 'PC',
                    publisher: '',
                    releaseDate: new Date().toISOString().split('T')[0],
                    popularity: 50,
                    imageUrl: '',
                    stock: 0,
                    featured: false,
                    versions: []
                  });
                  setIsAddingProduct(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Product</th>
                  <th className="px-6 py-4 font-bold">Genre</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Stock</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.genre}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-600">৳{p.price}</span>
                        {p.discountPrice && p.discountPrice < p.price && (
                          <span className="text-[10px] text-emerald-500 font-bold">Discount: ৳{p.discountPrice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm({
                              name: p.name,
                              description: p.description,
                              price: p.price,
                              discountPrice: p.discountPrice || 0,
                              priceRange: p.priceRange || { min: 0, max: 0 },
                              category: p.category,
                              genre: p.genre,
                              platform: p.platform,
                              publisher: p.publisher,
                              releaseDate: p.releaseDate,
                              popularity: p.popularity,
                              imageUrl: p.imageUrl,
                              stock: p.stock,
                              featured: p.featured || false,
                              versions: p.versions || []
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete({ id: p.id, type: 'product' })} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalProductPages > 1 && (
            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {(productPage - 1) * PRODUCTS_PER_PAGE + 1} to {Math.min(productPage * PRODUCTS_PER_PAGE, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setProductPage(p => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
                  disabled={productPage === totalProductPages}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Filters:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 flex-grow">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search Order ID, User ID, Transaction ID..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select 
                value={orderSortBy}
                onChange={(e) => setOrderSortBy(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
              <select 
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="cancellation_requested">Cancellation Requested</option>
                <option value="cancellation_approved">Cancellation Approved</option>
                <option value="cancellation_rejected">Cancellation Rejected</option>
              </select>
              <select 
                value={orderPaymentFilter}
                onChange={(e) => setOrderPaymentFilter(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Payments</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Order ID</th>
                    <th className="px-6 py-4 font-bold">User ID</th>
                    <th className="px-6 py-4 font-bold">Items</th>
                    <th className="px-6 py-4 font-bold">Payment</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Status Log</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-gray-400 mb-1">#{o.id.slice(-6)}</span>
                          <span className="text-sm font-medium">{format(new Date(o.createdAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-gray-400" title={o.userId}>#{o.userId.slice(-6)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-[150px]">
                          <span className="text-xs font-bold text-gray-900 line-clamp-1">
                            {o.items.map(i => `${i.name}${i.version ? ` (${i.version})` : ''}`).join(', ')}
                          </span>
                          <span className="text-[10px] text-gray-500">{o.items.length} items</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-indigo-600">{o.paymentMethod}</span>
                          <span className="text-xs text-gray-500">{o.paymentNumber}</span>
                          <span className="text-[10px] font-mono text-gray-400 mt-1">{o.transactionId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-900">৳{o.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          o.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                          o.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                          o.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                          o.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' :
                          o.status === 'delivered' ? 'bg-teal-100 text-teal-600' :
                          o.status === 'cancellation_requested' ? 'bg-purple-100 text-purple-600' :
                          o.status === 'cancellation_approved' ? 'bg-emerald-100 text-emerald-600' :
                          o.status === 'cancellation_rejected' ? 'bg-red-100 text-red-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-h-20 overflow-y-auto no-scrollbar space-y-1">
                          {o.statusLog?.map((log, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{log.status}: {format(new Date(log.timestamp), 'HH:mm')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedOrder(o)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {o.status === 'cancellation_requested' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(o.id, 'cancellation_approved', true)} 
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all disabled:opacity-50 text-xs font-bold"
                                disabled={isActionLoading === o.id}
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Accept
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowRejectionModal(true);
                                }} 
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50 text-xs font-bold"
                                disabled={isActionLoading === o.id}
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(o.id, 'pending')} 
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50"
                                disabled={o.status === 'pending' || isActionLoading === o.id}
                                title="Set to Pending"
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(o.id, 'processing')} 
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                                disabled={o.status === 'processing' || isActionLoading === o.id}
                                title="Set to Processing"
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Loader2 className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowShippingModal(true);
                                }} 
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
                                disabled={o.status === 'shipped' || isActionLoading === o.id}
                                title="Set to Shipped"
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(o.id, 'delivered')} 
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all disabled:opacity-50"
                                disabled={o.status === 'delivered' || isActionLoading === o.id}
                                title="Set to Delivered"
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(o.id, 'completed')} 
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                                disabled={o.status === 'completed' || isActionLoading === o.id}
                                title="Set to Completed"
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(o.id, 'cancelled')} 
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                disabled={o.status === 'cancelled' || isActionLoading === o.id}
                                title="Set to Cancelled"
                              >
                                {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setConfirmDelete({ id: o.id, type: 'order' })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'promo' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Promo Codes</h2>
            <button 
              onClick={() => setIsAddingPromo(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Promo Code
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Code</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Value</th>
                  <th className="px-6 py-4 font-bold">Min Purchase</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promoCodes.map(promo => (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{promo.code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{promo.type}</td>
                    <td className="px-6 py-4 font-bold">
                      {promo.type === 'percentage' ? `${promo.value}%` : `৳${promo.value}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">৳{promo.minPurchase || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${promo.active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingPromo(promo);
                            setPromoForm({
                              code: promo.code,
                              type: promo.type,
                              value: promo.value,
                              minPurchase: promo.minPurchase || 0,
                              expiryDate: promo.expiryDate || '',
                              active: promo.active
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete({ id: promo.id, type: 'promo' })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <h2 className="text-xl font-bold">User Management</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users
                  .filter(u => 
                    u.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map(user => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {user.displayName?.[0] || user.email[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{user.displayName || 'No Name'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-600' :
                          user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' :
                          user.role === 'editor' ? 'bg-blue-100 text-blue-600' :
                          user.role === 'product_manager' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as UserRole)}
                          disabled={isActionLoading === user.uid}
                          className="bg-gray-50 border-none rounded-lg px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="product_manager">Product Manager</option>
                          <option value="sales_manager">Sales Manager</option>
                          <option value="content_manager">Content Manager</option>
                          <option value="manager">Manager</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                          {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold mb-8">Edit Site Content</h2>
          <form onSubmit={handleSaveSiteContent} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Contact Us (Markdown Supported)</label>
                <textarea 
                  rows={4}
                  value={siteContent.contactUs}
                  onChange={e => setSiteContent({...siteContent, contactUs: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Refund Policy (Markdown Supported)</label>
                <textarea 
                  rows={4}
                  value={siteContent.refundPolicy}
                  onChange={e => setSiteContent({...siteContent, refundPolicy: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Privacy Policy (Markdown Supported)</label>
                <textarea 
                  rows={4}
                  value={siteContent.privacyPolicy}
                  onChange={e => setSiteContent({...siteContent, privacyPolicy: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Terms of Service (Markdown Supported)</label>
                <textarea 
                  rows={4}
                  value={siteContent.termsOfService}
                  onChange={e => setSiteContent({...siteContent, termsOfService: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Payment Instructions (Markdown Supported)</label>
                <textarea 
                  rows={4}
                  value={siteContent.paymentInstructions}
                  onChange={e => setSiteContent({...siteContent, paymentInstructions: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                  placeholder="Enter payment instructions for bKash/Nagad..."
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">FAQ (Markdown Supported)</label>
                </div>
                <textarea 
                  rows={6}
                  value={siteContent.faq}
                  onChange={e => setSiteContent({...siteContent, faq: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isActionLoading === 'save-site'}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {isActionLoading === 'save-site' ? <Loader2 className="animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Name</label>
                  <input 
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({...productForm, name: e.target.value})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Genre</label>
                  <input 
                    required
                    placeholder="e.g. RPG, FPS, Action"
                    value={productForm.genre}
                    onChange={e => setProductForm({...productForm, genre: e.target.value})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Publisher</label>
                  <input 
                    required
                    value={productForm.publisher}
                    onChange={e => setProductForm({...productForm, publisher: e.target.value})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (৳)</label>
                  <input 
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Discount Price (৳)</label>
                  <input 
                    type="number"
                    value={productForm.discountPrice || 0}
                    onChange={e => setProductForm({...productForm, discountPrice: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Price Range (৳)</label>
                  <input 
                    type="number"
                    value={productForm.priceRange?.min || 0}
                    onChange={e => setProductForm({...productForm, priceRange: { ...productForm.priceRange!, min: parseFloat(e.target.value) || 0 }})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Price Range (৳)</label>
                  <input 
                    type="number"
                    value={productForm.priceRange?.max || 0}
                    onChange={e => setProductForm({...productForm, priceRange: { ...productForm.priceRange!, max: parseFloat(e.target.value) || 0 }})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Product Versions</label>
                  <div className="space-y-3">
                    {(productForm.versions || []).map((v, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl">
                        <input 
                          placeholder="Version Name (e.g. Standard)"
                          value={v.name}
                          onChange={e => {
                            const newVersions = [...(productForm.versions || [])];
                            newVersions[idx].name = e.target.value;
                            setProductForm({...productForm, versions: newVersions});
                          }}
                          className="flex-1 bg-white border-none rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input 
                          type="number"
                          placeholder="Price"
                          value={v.price}
                          onChange={e => {
                            const newVersions = [...(productForm.versions || [])];
                            newVersions[idx].price = parseFloat(e.target.value) || 0;
                            setProductForm({...productForm, versions: newVersions});
                          }}
                          className="w-24 bg-white border-none rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input 
                          type="number"
                          placeholder="Stock"
                          value={v.stock}
                          onChange={e => {
                            const newVersions = [...(productForm.versions || [])];
                            newVersions[idx].stock = parseInt(e.target.value) || 0;
                            setProductForm({...productForm, versions: newVersions});
                          }}
                          className="w-20 bg-white border-none rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newVersions = (productForm.versions || []).filter((_, i) => i !== idx);
                            setProductForm({...productForm, versions: newVersions});
                          }}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setProductForm({...productForm, versions: [...(productForm.versions || []), { name: '', price: 0, stock: 0 }]})}
                      className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Add Version
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</label>
                  <input 
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Release Date</label>
                  <input 
                    type="date"
                    required
                    value={productForm.releaseDate}
                    onChange={e => setProductForm({...productForm, releaseDate: e.target.value})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input 
                    type="checkbox"
                    id="featured-checkbox"
                    checked={productForm.featured}
                    onChange={e => setProductForm({...productForm, featured: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="featured-checkbox" className="text-sm font-bold text-gray-700 cursor-pointer">
                    Featured Product
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Product Image</label>
                <div className="flex items-center gap-6">
                  {productForm.imageUrl && (
                    <img src={productForm.imageUrl} className="w-24 h-24 rounded-2xl object-cover border border-gray-100" />
                  )}
                  <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-500">Click to upload image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isActionLoading === 'save'}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isActionLoading === 'save' && <Loader2 className="w-5 h-5 animate-spin" />}
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Promo Code Modal */}
      {(isAddingPromo || editingPromo) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{editingPromo ? 'Edit Promo Code' : 'Add Promo Code'}</h2>
              <button onClick={() => { setIsAddingPromo(false); setEditingPromo(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Promo Code</label>
                <input 
                  required
                  placeholder="e.g. SAVE20"
                  value={promoForm.code}
                  onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type</label>
                  <select 
                    value={promoForm.type}
                    onChange={e => setPromoForm({...promoForm, type: e.target.value as any})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Value</label>
                  <input 
                    type="number"
                    required
                    value={promoForm.value}
                    onChange={e => setPromoForm({...promoForm, value: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Purchase (৳)</label>
                  <input 
                    type="number"
                    value={promoForm.minPurchase}
                    onChange={e => setPromoForm({...promoForm, minPurchase: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expiry Date</label>
                  <input 
                    type="date"
                    value={promoForm.expiryDate}
                    onChange={e => setPromoForm({...promoForm, expiryDate: e.target.value})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <input 
                  type="checkbox"
                  id="promo-active"
                  checked={promoForm.active}
                  onChange={e => setPromoForm({...promoForm, active: e.target.checked})}
                  className="w-5 h-5 accent-indigo-600"
                />
                <label htmlFor="promo-active" className="text-sm font-bold text-gray-600">Active and usable</label>
              </div>

              <button 
                type="submit"
                disabled={isActionLoading === 'save-promo'}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isActionLoading === 'save-promo' && <Loader2 className="w-5 h-5 animate-spin" />}
                {editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs font-mono text-gray-400">Order ID: {selectedOrder.id}</p>
                  <p className="text-xs font-mono text-gray-400">User ID: {selectedOrder.userId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{item.name} {item.version ? `(${item.version})` : ''}</span>
                        <span className="text-xs text-gray-500">Qty: {item.quantity} × ৳{item.price}</span>
                      </div>
                      <span className="font-bold text-indigo-600">৳{item.quantity * item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment</h3>
                  <p className="font-bold text-sm uppercase text-indigo-600">{selectedOrder.paymentMethod}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.paymentNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction ID</h3>
                  <p className="font-mono text-xs font-bold text-gray-700">{selectedOrder.transactionId}</p>
                </div>
              </div>

              {selectedOrder.status === 'cancellation_rejected' && selectedOrder.cancellationRejectionReason && (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Cancellation Rejection Reason</h3>
                  <p className="text-sm font-medium text-red-700">{selectedOrder.cancellationRejectionReason}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-indigo-600">৳{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Info Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Shipping Information</h2>
              <button onClick={() => setShowShippingModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking Number</label>
                <input 
                  value={shippingInfo.trackingNumber}
                  onChange={e => setShippingInfo({...shippingInfo, trackingNumber: e.target.value})}
                  placeholder="e.g. ZEROS-123456"
                  className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estimated Delivery</label>
                <input 
                  type="date"
                  value={shippingInfo.estimatedDelivery}
                  onChange={e => setShippingInfo({...shippingInfo, estimatedDelivery: e.target.value})}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowShippingModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedOrder!.id, 'shipped', undefined, undefined, shippingInfo)}
                disabled={isActionLoading === selectedOrder?.id}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isActionLoading === selectedOrder?.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Ship Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
            <p className="text-gray-500 mb-8">
              Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isActionLoading === 'delete'}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isActionLoading === 'delete' && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Reject Cancellation</h2>
              <button onClick={() => setShowRejectionModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 mb-6 text-sm">
              Please provide a reason for rejecting this cancellation request. This will be visible to the user.
            </p>
            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700 mb-6"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedOrder!.id, 'cancellation_rejected', false, rejectionReason)}
                disabled={!rejectionReason.trim() || isActionLoading === selectedOrder?.id}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isActionLoading === selectedOrder?.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
