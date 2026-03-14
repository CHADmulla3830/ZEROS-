import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Loader2, Eye, X, Upload, Filter, ChevronDown, Sparkles, Search } from 'lucide-react';
import { Product, Order } from '../types';
import { ProductService } from '../services/productService';
import { AiService } from '../services/aiService';
import { format } from 'date-fns';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'product' | 'order' } | null>(null);

  // AI Fetch State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiFetching, setIsAiFetching] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('All');

  // Form State
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [p, o] = await Promise.all([
      ProductService.getAllProducts(),
      ProductService.getAllOrders()
    ]);
    setProducts(p);
    setOrders(o);
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

  const filteredOrders = orders.filter(o => {
    const statusMatch = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const paymentMatch = orderPaymentFilter === 'All' || o.paymentMethod === orderPaymentFilter;
    return statusMatch && paymentMatch;
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
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Products</h2>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
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
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.genre}</td>
                    <td className="px-6 py-4 font-bold">৳{p.price}</td>
                    <td className="px-6 py-4 text-sm">{p.stock}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm(p);
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
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Filters:</span>
            </div>
            <div className="flex items-center gap-4">
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
                    <th className="px-6 py-4 font-bold">Order Details</th>
                    <th className="px-6 py-4 font-bold">Payment</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Status Log</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-gray-400 mb-1">#{o.id.slice(-6)}</span>
                          <span className="text-sm font-medium">{format(new Date(o.createdAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-indigo-600">{o.paymentMethod}</span>
                          <span className="text-xs text-gray-500">{o.paymentNumber}</span>
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
                            onClick={() => handleUpdateStatus(o.id, 'completed')} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                            disabled={o.status === 'completed' || isActionLoading === o.id}
                          >
                            {isActionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(o.id, 'cancelled')} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            disabled={o.status === 'cancelled' || isActionLoading === o.id}
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
                    onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</label>
                  <input 
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})}
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-xs font-mono text-gray-400 mt-1">ID: {selectedOrder.id}</p>
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
