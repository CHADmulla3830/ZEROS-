import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Loader2, Eye, X, Upload, Filter, ChevronDown, Sparkles, Search, Tag, Percent } from 'lucide-react';
import { Product, Order, PromoCode } from '../types';
import { ProductService } from '../services/productService';
import { AiService } from '../services/aiService';
import { format } from 'date-fns';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'site' | 'promo'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [siteContent, setSiteContent] = useState({ 
    contactUs: '', 
    refundPolicy: '',
    privacyPolicy: '',
    termsOfService: '',
    faq: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'product' | 'order' | 'promo' } | null>(null);

  // AI Fetch State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiFetching, setIsAiFetching] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

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
    category: 'PC Games',
    genre: '',
    platform: 'PC',
    publisher: '',
    releaseDate: new Date().toISOString().split('T')[0],
    popularity: 50,
    imageUrl: '',
    stock: 0,
    featured: false
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
    const [p, o, pr] = await Promise.all([
      ProductService.getAllProducts(),
      ProductService.getAllOrders(),
      ProductService.getPromoCodes()
    ]);
    setProducts(p);
    setOrders(o);
    setPromoCodes(pr);
    setIsLoading(false);
  };

  const handleAiFetch = async () => {
    if (!aiSearchQuery.trim()) return;
    setIsAiFetching(true);
    try {
      const details = await AiService.fetchGameDetails(aiSearchQuery);
      if (details) {
        setProductForm(prev => ({
          ...prev,
          name: details.name || prev.name,
          description: details.description || prev.description,
          price: details.price || prev.price,
          genre: details.genre || prev.genre,
          publisher: details.publisher || prev.publisher,
          releaseDate: details.releaseDate || prev.releaseDate,
          imageUrl: details.imageUrl || prev.imageUrl
        }));
      }
    } finally {
      setIsAiFetching(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    setIsActionLoading(orderId);
    try {
      await ProductService.updateOrderStatus(orderId, status);
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
        category: 'PC Games',
        genre: '',
        platform: 'PC',
        publisher: '',
        releaseDate: new Date().toISOString().split('T')[0],
        popularity: 50,
        imageUrl: '',
        stock: 0,
        featured: false
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
    return statusMatch && paymentMatch;
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

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('promo')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'promo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
          >
            Promo Codes
          </button>
          <button 
            onClick={() => setActiveTab('site')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'site' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}
          >
            Site Content
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold">Manage Products</h2>
            <div className="flex items-center gap-4">
              <select 
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>
              <button 
                onClick={() => setIsAddingProduct(true)}
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
                {sortedProducts.map(p => (
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
                              category: p.category,
                              genre: p.genre,
                              platform: p.platform,
                              publisher: p.publisher,
                              releaseDate: p.releaseDate,
                              popularity: p.popularity,
                              imageUrl: p.imageUrl,
                              stock: p.stock,
                              featured: p.featured || false
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
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Filters:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
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
                          <span className="text-xs font-bold text-gray-900 line-clamp-1">{o.items.map(i => i.name).join(', ')}</span>
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
                          o.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {o.status}
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
                          <button 
                            onClick={() => handleUpdateStatus(o.id, 'pending')} 
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50"
                            disabled={o.status === 'pending' || isActionLoading === o.id}
                            title="Set to Pending"
                          >
                            {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
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
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold mb-8">Edit Site Content</h2>
          <form onSubmit={handleSaveSiteContent} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Contact Us</label>
                <textarea 
                  rows={4}
                  value={siteContent.contactUs}
                  onChange={e => setSiteContent({...siteContent, contactUs: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Refund Policy</label>
                <textarea 
                  rows={4}
                  value={siteContent.refundPolicy}
                  onChange={e => setSiteContent({...siteContent, refundPolicy: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Privacy Policy</label>
                <textarea 
                  rows={4}
                  value={siteContent.privacyPolicy}
                  onChange={e => setSiteContent({...siteContent, privacyPolicy: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Terms of Service</label>
                <textarea 
                  rows={4}
                  value={siteContent.termsOfService}
                  onChange={e => setSiteContent({...siteContent, termsOfService: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">FAQ</label>
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
              {isActionLoading === 'save-site' ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
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

            {!editingProduct && (
              <div className="mb-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-3">AI Quick Fill</label>
                <div className="flex gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input 
                      type="text"
                      placeholder="Enter game name (e.g. Elden Ring)"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button 
                    onClick={handleAiFetch}
                    disabled={isAiFetching || !aiSearchQuery.trim()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAiFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Fetch</span>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400 mt-2 ml-1">AI will automatically find description, price, genre, and more.</p>
              </div>
            )}

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
                        <span className="font-bold text-sm">{item.name}</span>
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

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-indigo-600">৳{selectedOrder.totalAmount}</span>
              </div>
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
    </div>
  );
};
