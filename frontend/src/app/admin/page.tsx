'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api/admin';
import { authApi } from '@/lib/api/auth';
import { Order, OrderStatus, Product, ProductCategory, AdminUser } from '@/lib/api/types';

export default function AdminPage() {
  const { user, isAuthenticated, logout, revalidateSession } = useAuth();
  const isAdmin = user && (user.role === 'owner' || user.role === 'staff');
  const isOwner = user?.role === 'owner';

  // Active tab: 'orders' | 'products' | 'staff'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'staff'>('orders');

  // Admin Login States (for when not logged in as admin)
  const [phone, setPhone] = useState('+91 7983636796');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<number>(0);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'insecticide' as ProductCategory,
    brand: '',
    price: 0,
    mrp: 0,
    stockQty: 10,
    description: '',
    dosageInfo: '',
  });

  // Staff State
  const [staffList, setStaffList] = useState<AdminUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', phoneNumber: '+91' });

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch functions
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await adminApi.listOrders({
        limit: 100,
        status: orderStatusFilter !== 'all' ? (orderStatusFilter as OrderStatus) : undefined,
      });
      setOrders(res.items || []);
    } catch (err: unknown) {
      console.error('Failed to fetch admin orders:', err);
      showToast('ऑर्डर लोड करने में त्रुटि (Error fetching orders)', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminApi.listProducts({ limit: 100 });
      setProducts(res.items || []);
    } catch (err: unknown) {
      console.error('Failed to fetch admin products:', err);
      showToast('उत्पाद सूची लोड करने में त्रुटि', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!isOwner) return;
    setStaffLoading(true);
    try {
      const res = await adminApi.listStaff();
      setStaffList(res || []);
    } catch (err: unknown) {
      console.error('Failed to fetch staff list:', err);
      showToast('कर्मचारी सूची लोड करने में त्रुटि', 'error');
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'staff') fetchStaff();
    }
  }, [isAdmin, activeTab, orderStatusFilter]);

  // Handle direct Admin Login
  const handleSendAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      await authApi.sendOtp(cleanPhone);
      setOtpSent(true);
      showToast('OTP भेजा गया है (OTP sent)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP भेजने में विफल';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      await authApi.verifyOtp(cleanPhone, otp.trim());
      await revalidateSession();
      showToast('संचालक लॉगिन सफल! (Admin logged in)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP सत्यापन विफल';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // Order state transition
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, nextStatus);
      showToast(`ऑर्डर स्थिति बदलकर "${nextStatus}" कर दी गई`);
      await fetchOrders();
      if (selectedOrderForModal?.id === orderId) {
        setSelectedOrderForModal(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'स्थिति बदलने में असमर्थ';
      showToast(`त्रुटि: ${msg}`, 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Product stock update
  const handleSaveStock = async (productId: string) => {
    try {
      await adminApi.updateStock(productId, stockInputVal);
      showToast('स्टॉक सफलतापूर्वक अपडेट हुआ');
      setEditingStockId(null);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'स्टॉक अपडेट विफल';
      showToast(msg, 'error');
    }
  };

  // Product Create
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createProduct(productForm);
      showToast('नया उत्पाद सफलतापूर्वक जोड़ा गया');
      setShowAddProductModal(false);
      setProductForm({
        name: '',
        category: 'insecticide',
        brand: '',
        price: 0,
        mrp: 0,
        stockQty: 10,
        description: '',
        dosageInfo: '',
      });
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'उत्पाद निर्माण विफल';
      showToast(msg, 'error');
    }
  };

  // Staff Create
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createStaff({
        name: staffForm.name.trim(),
        phoneNumber: staffForm.phoneNumber.replace(/\s+/g, ''),
      });
      showToast('स्टाफ सदस्य सफलतापूर्वक जोड़ा गया');
      setShowAddStaffModal(false);
      setStaffForm({ name: '', phoneNumber: '+91' });
      await fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'कर्मचारी निर्माण विफल';
      showToast(msg, 'error');
    }
  };

  // Staff Delete
  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('क्या आप वाकई इस स्टाफ सदस्य को हटाना चाहते हैं?')) return;
    try {
      await adminApi.deleteStaff(staffId);
      showToast('स्टाफ सदस्य हटा दिया गया');
      await fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'कर्मचारी हटाने में असमर्थ';
      showToast(msg, 'error');
    }
  };

  // If not authenticated as admin/staff, render admin login card
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-900 py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">संचालक पोर्टल (Operator Portal)</h1>
              <p className="text-xs text-stone-500">माँ भगवती किसान सेवा केंद्र • अधिकृत लॉगिन</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
              {loginError}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendAdminOtp} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  अधिकृत संचालक मोबाइल नंबर (Admin Phone)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 7983636796"
                  className="w-full font-mono text-sm border border-stone-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-slate-800"
                />
                <span className="text-[11px] text-stone-500 block mt-1">
                  सीडेड स्टोर ओनर: <strong className="font-mono text-slate-800">+91 7983636796</strong>
                </span>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {loginLoading ? 'सत्यापन हो रहा है...' : 'OTP भेजें (Send OTP)'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAdminOtp} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  6-अंकीय OTP दर्ज करें (Enter 6-digit OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full font-mono text-center tracking-widest text-lg font-bold border border-stone-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-slate-800"
                />
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  डेव मोड OTP: <strong className="font-mono">123456</strong>
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  नंबर बदलें
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-50"
                >
                  {loginLoading ? 'लॉगिन जारी...' : 'सत्यापित करें (Login)'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <Link href="/" className="text-xs text-stone-500 hover:text-slate-800 font-semibold">
              ← किसान स्टोर पर लौटें (Return to Storefront)
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Render Admin Dashboard
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold border transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">storefront</span>
            </div>
            <div>
              <span className="font-bold text-sm leading-tight block">
                माँ भगवती किसान सेवा केंद्र • संचालक पोर्टल
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Mandi Road Depot POS • {user.role.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-semibold">{user.name || 'Admin Operator'}</span>
              <span className="text-slate-400 font-mono text-[10px]">{user.phoneNumber}</span>
            </div>
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              किसान स्टोर (Store)
            </Link>
            <button
              onClick={() => logout()}
              className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              लॉगआउट
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar / Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>ऑर्डर प्रबंधन (Orders)</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>उत्पाद एवं स्टॉक (Products & Stock)</span>
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>स्टाफ नियंत्रण (Staff)</span>
              </button>
            )}
          </nav>

          <span className="text-[11px] font-mono text-slate-500">
            GST: 09AAAFB1234F1Z5 • CIB&RC Mandi License #UP-MND-4401
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ================= TAB 1: ORDERS ================= */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {/* Filter controls */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 mr-1">स्थिति (Status):</span>
                {['all', 'placed', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'picked_up', 'cancelled'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        orderStatusFilter === st
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span className={`material-symbols-outlined text-[16px] ${ordersLoading ? 'animate-spin' : ''}`}>
                  sync
                </span>
                ताजा करें
              </button>
            </div>

            {/* High Density Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Order ID</th>
                      <th className="py-2.5 px-4 font-semibold">Time</th>
                      <th className="py-2.5 px-4 font-semibold">Fulfillment</th>
                      <th className="py-2.5 px-4 font-semibold">Total</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">State Machine Action</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          ऑर्डर लोड हो रहे हैं...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          कोई ऑर्डर उपलब्ध नहीं है (No orders found)
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => {
                        const totalAmount = order.totalAmount ?? order.total_amount ?? 0;
                        const fulfillmentType = order.fulfillmentType || order.fulfillment_type || 'pickup';
                        const isUpdating = updatingOrderId === order.id;

                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                              {order.createdAt || order.created_at
                                ? new Date(order.createdAt || order.created_at!).toLocaleTimeString('hi-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '--:--'}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  fulfillmentType === 'pickup'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              ₹{totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  order.status === 'delivered' || order.status === 'picked_up'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              {/* State Transition Actions */}
                              <div className="flex items-center gap-1.5">
                                {order.status === 'placed' && (
                                  <>
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                    >
                                      स्वीकृत (Confirm)
                                    </button>
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                      className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                    >
                                      रद्द
                                    </button>
                                  </>
                                )}
                                {order.status === 'confirmed' && (
                                  <>
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateOrderStatus(order.id, 'packed')}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                    >
                                      पैकिंग पूर्ण (Pack)
                                    </button>
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                      className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                    >
                                      रद्द
                                    </button>
                                  </>
                                )}
                                {order.status === 'packed' && (
                                  <button
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                                      )
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                  >
                                    {fulfillmentType === 'delivery' ? 'रवाना करें (Out)' : 'उठाव तैयार (Ready)'}
                                  </button>
                                )}
                                {order.status === 'ready_for_pickup' && (
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'picked_up')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                  >
                                    सुपुर्द (Picked Up)
                                  </button>
                                )}
                                {order.status === 'out_for_delivery' && (
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors disabled:opacity-50"
                                  >
                                    सुपुर्द (Delivered)
                                  </button>
                                )}
                                {['delivered', 'picked_up', 'cancelled'].includes(order.status) && (
                                  <span className="text-[10px] text-slate-400 font-mono">Terminal (Closed)</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrderForModal(order)}
                                className="text-slate-600 hover:text-slate-900 font-bold text-[11px] underline"
                              >
                                View Items
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRODUCTS & STOCK ================= */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-slate-700">
                कुल उपलब्ध उत्पाद: {products.length} (Active Inventory Items)
              </span>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    नया उत्पाद जोड़ें (Add Product)
                  </button>
                )}
                <button
                  onClick={fetchProducts}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className={`material-symbols-outlined text-[16px] ${productsLoading ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  ताजा करें
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Product Name</th>
                      <th className="py-2.5 px-4 font-semibold">Category</th>
                      <th className="py-2.5 px-4 font-semibold">Selling Price</th>
                      <th className="py-2.5 px-4 font-semibold">MRP</th>
                      <th className="py-2.5 px-4 font-semibold">Stock Qty</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Inventory Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          उत्पाद लोड हो रहे हैं...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          कोई उत्पाद नहीं मिला
                        </td>
                      </tr>
                    ) : (
                      products.map((p, idx) => {
                        const isEditingStock = editingStockId === p.id;
                        const stock = p.stockQty ?? 0;

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <td className="py-2.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{p.name}</span>
                                <span className="text-[10px] text-slate-500">
                                  {p.brand} • {p.description || 'Govt Approved CIB&RC'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">
                              ₹{p.price.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500 line-through">
                              ₹{p.mrp.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4">
                              {isEditingStock ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    value={stockInputVal}
                                    onChange={(e) => setStockInputVal(Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                  />
                                  <button
                                    onClick={() => handleSaveStock(p.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingStockId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded text-[10px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                    stock === 0
                                      ? 'bg-red-100 text-red-800'
                                      : stock < 5
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {stock} units
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {!isEditingStock && (
                                <button
                                  onClick={() => {
                                    setEditingStockId(p.id);
                                    setStockInputVal(stock);
                                  }}
                                  className="text-xs font-bold text-primary hover:underline"
                                >
                                  स्टॉक बदलें (Edit Stock)
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STAFF (OWNER ONLY) ================= */}
        {activeTab === 'staff' && isOwner && (
          <div className="flex flex-col gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-slate-700">
                पंजीकृत कर्मचारी (Store Staff Members): {staffList.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  नया स्टाफ जोड़ें (Add Staff)
                </button>
                <button
                  onClick={fetchStaff}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className={`material-symbols-outlined text-[16px] ${staffLoading ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  ताजा करें
                </button>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Staff Name</th>
                      <th className="py-2.5 px-4 font-semibold">Phone Number</th>
                      <th className="py-2.5 px-4 font-semibold">Role</th>
                      <th className="py-2.5 px-4 font-semibold">Registered</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          स्टाफ लोड हो रहा है...
                        </td>
                      </tr>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          कोई स्टाफ पंजीकृत नहीं है (No staff members yet)
                        </td>
                      </tr>
                    ) : (
                      staffList.map((st, idx) => (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-bold text-slate-900">{st.name}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{st.phoneNumber}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                              {st.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                            {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'Active'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteStaff(st.id)}
                              className="text-xs font-bold text-red-600 hover:text-red-800"
                            >
                              हटाएं (Remove)
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ऑर्डर विवरण (Order #{selectedOrderForModal.id.slice(0, 8).toUpperCase()})
                </h3>
                <span className="text-xs text-slate-500">
                  GST Invoicing: {selectedOrderForModal.gstInvoiceNo || selectedOrderForModal.gst_invoice_no || 'NA'}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 my-4 max-h-60 overflow-y-auto">
              {selectedOrderForModal.items?.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {item.productName || item.product_name || `Product #${item.productId || item.product_id}`}
                    </span>
                    <span className="text-slate-500">
                      मात्रा: {item.quantity} • ₹{item.unitPrice ?? item.unit_price ?? 0} per unit
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{item.subtotal?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">कुल देय राशि:</span>
              <span className="font-mono font-bold text-base text-emerald-800">
                ₹{(selectedOrderForModal.totalAmount ?? selectedOrderForModal.total_amount ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD PRODUCT MODAL ================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">नया उत्पाद जोड़ें (Add Product)</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">उत्पाद का नाम (Name) *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="उदा. Dhanuka Dhanvit 500ml"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">श्रेणी (Category) *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                  >
                    <option value="insecticide">कीटनाशक (Insecticide)</option>
                    <option value="fungicide">फफूंदनाशक (Fungicide)</option>
                    <option value="herbicide">खरपतवारनाशक (Herbicide)</option>
                    <option value="seed">बीज (Seeds)</option>
                    <option value="fertilizer">उर्वरक (Fertilizers)</option>
                    <option value="farm_tool">कृषि यंत्र (Tools)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ब्रांड (Brand) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="उदा. Dhanuka Agritech"
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">विक्रय मूल्य (Price) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    placeholder="₹"
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP मूल्य *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.mrp || ''}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    placeholder="₹"
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">प्रारंभिक स्टॉक *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stockQty || ''}
                    onChange={(e) => setProductForm({ ...productForm, stockQty: Number(e.target.value) })}
                    placeholder="Qty"
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">उत्पाद विवरण (Description)</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg"
                >
                  उत्पाद बनाएं (Save)
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg"
                >
                  रद्द करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD STAFF MODAL ================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">नया स्टाफ जोड़ें (Add Staff)</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">कर्मचारी का नाम (Staff Name) *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="उदा. श्याम लाल"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">मोबाइल नंबर (Phone Number) *</label>
                <input
                  type="tel"
                  required
                  value={staffForm.phoneNumber}
                  onChange={(e) => setStaffForm({ ...staffForm, phoneNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg"
                >
                  स्टाफ जोड़ें (Save)
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg"
                >
                  रद्द करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
