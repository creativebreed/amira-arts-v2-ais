"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { User, Workshop, Booking, ActivityLog, Product, SubscriptionPlan, CTASection } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, TrendingUp, Trash2, Plus, BarChart, ShieldCheck,
  ShoppingBag, Search, MoreVertical, X, Edit3, Zap, Eye, EyeOff,
  ArrowUp, ArrowDown, Image as ImageIcon, CreditCard, LayoutGrid, Megaphone
} from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  onRefreshData: () => void;
  onToast: (message: string, type: 'success' | 'warning' | 'error') => void;
}

type TabType = 'stats' | 'users' | 'workshops' | 'shop' | 'ctas' | 'plans' | 'logs';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onRefreshData, onToast }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [ctas, setCtas] = useState<CTASection[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCTAModal, setShowCTAModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCTA, setEditingCTA] = useState<CTASection | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form states
  const [workshopForm, setWorkshopForm] = useState({
    title: '', artistId: '', artistName: '', price: '', date: '', time: '',
    capacity: '12', category: 'Painting' as Workshop['category'], image: '', description: '', longDescription: '',
  });
  const [productForm, setProductForm] = useState({
    title: '', artistId: '', artistName: '', price: '', category: '', image: '', description: '', status: 'available' as Product['status'],
  });
  const [ctaForm, setCtaForm] = useState({ title: '', subtitle: '', buttonText: '', imageUrl: '', isActive: true });
  const [planForm, setPlanForm] = useState({ name: '', price: '', features: '', recommended: false, isActive: true });

  useEffect(() => { refreshAll(); }, []);

  const refreshAll = () => {
    setUsers(db.getUsers());
    setWorkshops(db.getWorkshops());
    setProducts(db.getProducts());
    setBookings(db.getBookings());
    setLogs(db.getLogs());
    setSubscriptions(db.getSubscriptions());
    setCtas(db.getCTAs());
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
  const boostedCount = workshops.filter(w => w.isBoosted).length + products.filter(p => p.isBoosted).length;
  const chartData = [
    { name: 'Mon', revenue: 420 }, { name: 'Tue', revenue: 840 },
    { name: 'Wed', revenue: 630 }, { name: 'Thu', revenue: 1100 },
    { name: 'Fri', revenue: 950 }, { name: 'Sat', revenue: 1600 },
    { name: 'Sun', revenue: totalRevenue || 200 },
  ];

  // Workshop CRUD
  const openWorkshopModal = (workshop?: Workshop) => {
    if (workshop) {
      setEditingWorkshop(workshop);
      setWorkshopForm({
        title: workshop.title, artistId: workshop.artistId, artistName: workshop.artistName,
        price: String(workshop.price), date: workshop.date, time: workshop.time,
        capacity: String(workshop.capacity), category: workshop.category,
        image: workshop.image, description: workshop.description, longDescription: workshop.longDescription || '',
      });
    } else {
      setEditingWorkshop(null);
      setWorkshopForm({ title: '', artistId: '', artistName: '', price: '', date: '', time: '', capacity: '12', category: 'Painting', image: '', description: '', longDescription: '' });
    }
    setShowWorkshopModal(true);
  };

  const handleSaveWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    const all = db.getWorkshops();
    if (editingWorkshop) {
      const updated = all.map(w => w.id === editingWorkshop.id ? {
        ...w, ...workshopForm, price: Number(workshopForm.price), capacity: Number(workshopForm.capacity),
      } : w);
      db.saveWorkshops(updated);
      db.log('1', 'ADMIN_EDIT_WORKSHOP', `Updated workshop: ${workshopForm.title}`);
      onToast('Workshop updated successfully.', 'success');
    } else {
      const newW: Workshop = {
        id: `w-${Date.now()}`, title: workshopForm.title, artistId: workshopForm.artistId || '2',
        artistName: workshopForm.artistName || 'Studio Artist', price: Number(workshopForm.price),
        date: workshopForm.date || new Date().toISOString().split('T')[0], time: workshopForm.time || '14:00',
        capacity: Number(workshopForm.capacity), booked: 0, category: workshopForm.category,
        image: workshopForm.image || 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800',
        description: workshopForm.description, longDescription: workshopForm.longDescription,
      };
      db.saveWorkshops([...all, newW]);
      db.log('1', 'ADMIN_ADD_WORKSHOP', `Added workshop: ${workshopForm.title}`);
      onToast('Workshop created successfully.', 'success');
    }
    refreshAll(); onRefreshData(); setShowWorkshopModal(false);
  };

  const handleDeleteWorkshop = (id: string) => {
    if (confirm('Permanently remove this workshop?')) {
      db.saveWorkshops(db.getWorkshops().filter(w => w.id !== id));
      db.log('1', 'ADMIN_DELETE_WORKSHOP', `Workshop ID ${id} removed`);
      refreshAll(); onRefreshData(); onToast('Workshop removed.', 'success');
    }
  };

  const handleToggleWorkshopBoost = (id: string) => {
    const all = db.getWorkshops();
    const updated = all.map(w => w.id === id ? { ...w, isBoosted: !w.isBoosted } : w);
    db.saveWorkshops(updated);
    refreshAll(); onRefreshData();
    const item = updated.find(w => w.id === id);
    onToast(`Workshop ${item?.isBoosted ? 'boosted' : 'un-boosted'}.`, 'success');
  };

  // Product CRUD
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        title: product.title, artistId: product.artistId, artistName: product.artistName || '',
        price: String(product.price), category: product.category, image: product.image,
        description: product.description || '', status: product.status,
      });
    } else {
      setEditingProduct(null);
      setProductForm({ title: '', artistId: '', artistName: '', price: '', category: '', image: '', description: '', status: 'available' });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const all = db.getProducts();
    if (editingProduct) {
      const updated = all.map(p => p.id === editingProduct.id ? {
        ...p, ...productForm, price: Number(productForm.price),
      } : p);
      db.saveProducts(updated);
      db.log('1', 'ADMIN_EDIT_PRODUCT', `Updated product: ${productForm.title}`);
      onToast('Artwork updated successfully.', 'success');
    } else {
      const newP: Product = {
        id: `p-${Date.now()}`, title: productForm.title, artistId: productForm.artistId || '2',
        artistName: productForm.artistName, price: Number(productForm.price), category: productForm.category,
        image: productForm.image || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
        status: productForm.status, description: productForm.description,
      };
      db.saveProducts([...all, newP]);
      db.log('1', 'ADMIN_ADD_PRODUCT', `Added product: ${productForm.title}`);
      onToast('Artwork registered successfully.', 'success');
    }
    refreshAll(); onRefreshData(); setShowProductModal(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Permanently remove this artwork?')) {
      db.saveProducts(db.getProducts().filter(p => p.id !== id));
      db.log('1', 'ADMIN_DELETE_PRODUCT', `Product ID ${id} removed`);
      refreshAll(); onRefreshData(); onToast('Artwork removed.', 'success');
    }
  };

  const handleToggleProductBoost = (id: string) => {
    const all = db.getProducts();
    const updated = all.map(p => p.id === id ? { ...p, isBoosted: !p.isBoosted } : p);
    db.saveProducts(updated);
    refreshAll(); onRefreshData();
    const item = updated.find(p => p.id === id);
    onToast(`Artwork ${item?.isBoosted ? 'boosted' : 'un-boosted'}.`, 'success');
  };

  // CTA CRUD
  const openCTAModal = (cta?: CTASection) => {
    if (cta) {
      setEditingCTA(cta);
      setCtaForm({ title: cta.title, subtitle: cta.subtitle, buttonText: cta.buttonText, imageUrl: cta.imageUrl, isActive: cta.isActive });
    } else {
      setEditingCTA(null);
      setCtaForm({ title: '', subtitle: '', buttonText: '', imageUrl: '', isActive: true });
    }
    setShowCTAModal(true);
  };

  const handleSaveCTA = (e: React.FormEvent) => {
    e.preventDefault();
    const all = db.getCTAs();
    if (editingCTA) {
      const updated = all.map(c => c.id === editingCTA.id ? { ...c, ...ctaForm } : c);
      db.saveCTAs(updated);
      onToast('CTA section updated.', 'success');
    } else {
      const newCTA: CTASection = { id: `c-${Date.now()}`, ...ctaForm };
      db.saveCTAs([...all, newCTA]);
      onToast('CTA section created.', 'success');
    }
    refreshAll(); onRefreshData(); setShowCTAModal(false);
  };

  const handleDeleteCTA = (id: string) => {
    if (confirm('Remove this CTA section?')) {
      db.saveCTAs(db.getCTAs().filter(c => c.id !== id));
      refreshAll(); onRefreshData(); onToast('CTA removed.', 'success');
    }
  };

  const handleToggleCTAActive = (id: string) => {
    const all = db.getCTAs();
    const updated = all.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    db.saveCTAs(updated);
    refreshAll(); onRefreshData();
  };

  // Plan CRUD
  const openPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({ name: plan.name, price: String(plan.price), features: plan.features.join(', '), recommended: plan.recommended || false, isActive: plan.isActive !== false });
    } else {
      setEditingPlan(null);
      setPlanForm({ name: '', price: '', features: '', recommended: false, isActive: true });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const all = db.getSubscriptions();
    const features = planForm.features.split(',').map(f => f.trim()).filter(Boolean);
    if (editingPlan) {
      const updated = all.map(p => p.id === editingPlan.id ? {
        ...p, name: planForm.name, price: Number(planForm.price), features, recommended: planForm.recommended, isActive: planForm.isActive,
      } : p);
      db.saveSubscriptions(updated);
      onToast('Plan updated.', 'success');
    } else {
      const newPlan: SubscriptionPlan = {
        id: `s-${Date.now()}`, name: planForm.name, price: Number(planForm.price),
        features, recommended: planForm.recommended, isActive: planForm.isActive, order: all.length,
      };
      db.saveSubscriptions([...all, newPlan]);
      onToast('Plan created.', 'success');
    }
    refreshAll(); onRefreshData(); setShowPlanModal(false);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Remove this subscription plan?')) {
      db.saveSubscriptions(db.getSubscriptions().filter(p => p.id !== id));
      refreshAll(); onRefreshData(); onToast('Plan removed.', 'success');
    }
  };

  const handleRemoveUser = (id: string) => {
    if (confirm('Remove this user?')) {
      db.saveUsers(db.getUsers().filter(u => u.id !== id));
      refreshAll(); onToast('User removed.', 'success');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-5xl font-bold tracking-tighter font-serif">Registry Console</h2>
          <p className="text-gray-500 font-medium mt-1">Institutional oversight and operational analytics.</p>
        </div>
        <div className="flex bg-white border border-[#E0E0E0] rounded p-1 shadow-sm overflow-x-auto max-w-full">
          {(['stats', 'users', 'workshops', 'shop', 'ctas', 'plans', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 lg:px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10' : 'text-gray-400 hover:text-[#1A1A1A]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STATS */}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<TrendingUp size={20} />} title="Platform Revenue" value={`\u00A3${totalRevenue.toLocaleString()}`} color="text-[#D4145A]" />
              <StatCard icon={<Users size={20} />} title="Total Collective" value={users.length} color="text-[#1A1A1A]" />
              <StatCard icon={<Calendar size={20} />} title="Active Workshops" value={workshops.length} color="text-[#1A1A1A]" />
              <StatCard icon={<Zap size={20} />} title="Boosted Items" value={boostedCount} color="text-[#D4145A]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-lg p-10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-3">
                    <BarChart size={18} className="text-[#D4145A]" /> Performance Metrics
                  </h3>
                  <div className="flex gap-2 items-center">
                    <span className="w-3 h-3 rounded-full bg-[#1A1A1A]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Revenue (GBP)</span>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999', fontWeight: 600 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#fcfcfc' }} contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="revenue" fill="#1A1A1A" radius={[2, 2, 0, 0]} barSize={40} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#1A1A1A] text-white rounded-lg p-10 flex flex-col">
                <h3 className="text-lg font-bold mb-8 border-b border-white/10 pb-4">Real-time Logs</h3>
                <div className="flex-1 space-y-6 custom-scrollbar overflow-y-auto max-h-[350px] pr-2">
                  {logs.slice(0, 8).map((log) => (
                    <div key={log.id} className="group cursor-default">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-bold uppercase text-[#D4145A] tracking-[0.2em]">{log.action}</span>
                        <span className="text-[9px] text-gray-500 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[12px] font-medium text-gray-300 leading-snug group-hover:text-white transition-colors">{log.details}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('logs')} className="mt-8 text-[10px] uppercase font-bold tracking-[0.3em] text-[#D4145A] text-center w-full">
                  Detailed Audit Trace
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-sm uppercase tracking-widest">Global Directory</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-[#E0E0E0] rounded text-xs outline-none focus:border-[#D4145A]"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-[#E0E0E0]">
                  <tr>
                    <th className="px-8 py-5 text-left text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Contributor</th>
                    <th className="px-8 py-5 text-left text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Clearance</th>
                    <th className="px-8 py-5 text-left text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Activity</th>
                    <th className="px-8 py-5 text-right text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs">{u.name.charAt(0)}</div>
                          <div>
                            <div className="font-bold text-sm tracking-tight">{u.name}</div>
                            <div className="text-[11px] text-gray-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm ${
                          u.role === 'admin' ? 'bg-[#1A1A1A] text-white' : u.role === 'artist' ? 'bg-[#D4145A] text-white' : 'bg-gray-100 text-gray-600'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleRemoveUser(u.id)} className="p-2 text-gray-300 hover:text-[#D4145A] transition-colors" disabled={u.role === 'admin'}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* WORKSHOPS MANAGEMENT */}
        {activeTab === 'workshops' && (
          <motion.div key="workshops-mgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Workshop Management</h3>
              <button onClick={() => openWorkshopModal()} className="flex items-center gap-2 px-6 py-3 bg-[#D4145A] text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg shadow-[#D4145A]/20 hover:bg-[#1A1A1A] transition-all">
                <Plus size={16} /> Add Workshop
              </button>
            </div>
            <div className="space-y-4">
              {workshops.map((w) => (
                <div key={w.id} className="bg-white border border-[#E0E0E0] rounded-lg p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition-all">
                  <img src={w.image} className="w-20 h-20 object-cover rounded shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-lg tracking-tight truncate">{w.title}</h4>
                      {w.isBoosted && <span className="px-2 py-0.5 bg-[#D4145A]/10 text-[#D4145A] text-[8px] font-bold uppercase tracking-widest rounded">Boosted</span>}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{w.artistName} | {w.date} | {w.booked}/{w.capacity} booked</p>
                  </div>
                  <div className="text-xl font-bold text-[#D4145A] shrink-0">{'\u00A3'}{w.price}</div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleToggleWorkshopBoost(w.id)} className={`p-2.5 rounded transition-colors ${w.isBoosted ? 'bg-[#D4145A] text-white' : 'bg-gray-100 text-gray-400 hover:text-[#D4145A]'}`} title="Toggle boost">
                      <Zap size={16} />
                    </button>
                    <button onClick={() => openWorkshopModal(w)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-[#1A1A1A] rounded transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteWorkshop(w.id)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-[#D4145A] rounded transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SHOP MANAGEMENT */}
        {activeTab === 'shop' && (
          <motion.div key="shop-mgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Gallery Inventory</h3>
              <button onClick={() => openProductModal()} className="flex items-center gap-2 px-6 py-3 bg-[#D4145A] text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg shadow-[#D4145A]/20 hover:bg-[#1A1A1A] transition-all">
                <Plus size={16} /> Register Artwork
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden group">
                  <div className="h-48 relative">
                    <img src={p.image} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => handleToggleProductBoost(p.id)} className={`p-2 rounded ${p.isBoosted ? 'bg-[#D4145A] text-white' : 'bg-white text-[#1A1A1A] hover:text-[#D4145A]'}`}><Zap size={16} /></button>
                      <button onClick={() => openProductModal(p)} className="p-2 bg-white rounded text-[#1A1A1A] hover:text-[#D4145A]"><Edit3 size={16} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-white rounded text-[#1A1A1A] hover:text-[#D4145A]"><Trash2 size={16} /></button>
                    </div>
                    {p.isBoosted && <div className="absolute top-3 right-3 p-1.5 bg-[#D4145A] text-white rounded-full"><Zap size={10} /></div>}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm tracking-tight truncate pr-4">{p.title}</h4>
                      <span className="font-bold text-sm shrink-0">{'\u00A3'}{p.price}</span>
                    </div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-3">{p.category}</p>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-sm ${p.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA MANAGEMENT */}
        {activeTab === 'ctas' && (
          <motion.div key="ctas-mgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">CTA Sections</h3>
              <button onClick={() => openCTAModal()} className="flex items-center gap-2 px-6 py-3 bg-[#D4145A] text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg shadow-[#D4145A]/20 hover:bg-[#1A1A1A] transition-all">
                <Plus size={16} /> Add CTA
              </button>
            </div>
            <div className="space-y-4">
              {ctas.map((cta) => (
                <div key={cta.id} className={`bg-white border rounded-lg p-6 flex flex-col md:flex-row items-center gap-6 transition-all ${cta.isActive ? 'border-[#D4145A]/30' : 'border-[#E0E0E0] opacity-60'}`}>
                  <div className="w-24 h-16 rounded overflow-hidden bg-gray-100 shrink-0">
                    {cta.imageUrl && <img src={cta.imageUrl} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold tracking-tight truncate">{cta.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{cta.subtitle}</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4145A]">{cta.buttonText}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleToggleCTAActive(cta.id)} className={`p-2.5 rounded transition-colors ${cta.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`} title="Toggle active">
                      {cta.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => openCTAModal(cta)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-[#1A1A1A] rounded transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteCTA(cta.id)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-[#D4145A] rounded transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {ctas.length === 0 && <EmptyState msg="No CTA sections configured." />}
            </div>
          </motion.div>
        )}

        {/* PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <motion.div key="plans-mgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Subscription Plans</h3>
              <button onClick={() => openPlanModal()} className="flex items-center gap-2 px-6 py-3 bg-[#D4145A] text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg shadow-[#D4145A]/20 hover:bg-[#1A1A1A] transition-all">
                <Plus size={16} /> Add Plan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptions.map((plan) => (
                <div key={plan.id} className={`bg-white border rounded-lg p-8 relative ${plan.recommended ? 'border-[#D4145A] shadow-xl' : 'border-[#E0E0E0]'} ${plan.isActive === false ? 'opacity-50' : ''}`}>
                  {plan.recommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#D4145A] text-white text-[8px] font-bold uppercase tracking-widest rounded-full">Recommended</div>}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold font-serif">{plan.name}</h4>
                      <p className="text-2xl font-bold text-[#D4145A]">{'\u00A3'}{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded ${plan.isActive !== false ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {plan.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => <li key={i} className="text-sm text-gray-500 flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#D4145A]" />{f}</li>)}
                  </ul>
                  <div className="flex gap-2">
                    <button onClick={() => openPlanModal(plan)} className="flex-1 py-2 bg-gray-50 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-gray-100 transition-colors">Edit</button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-gray-300 hover:text-[#D4145A] transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-white border-l-4 border-l-[#D4145A] p-6 rounded-lg border border-[#E0E0E0] shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] font-bold uppercase bg-[#D4145A] text-white px-2 py-1 rounded-sm tracking-widest">{log.action}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[13px] font-bold text-[#1A1A1A]">{log.details}</p>
                </div>
                <div className="flex flex-col items-end gap-1 opacity-20">
                  <ShieldCheck size={28} />
                  <span className="text-[8px] font-bold uppercase">Verified</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      {/* Workshop Modal */}
      <AnimatePresence>
        {showWorkshopModal && (
          <ModalWrapper onClose={() => setShowWorkshopModal(false)} title={editingWorkshop ? 'Edit Workshop' : 'Add Workshop'}>
            <form onSubmit={handleSaveWorkshop} className="space-y-5">
              <FormInput label="Title" value={workshopForm.title} onChange={(v) => setWorkshopForm({ ...workshopForm, title: v })} required />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Artist Name" value={workshopForm.artistName} onChange={(v) => setWorkshopForm({ ...workshopForm, artistName: v })} />
                <FormInput label="Price" value={workshopForm.price} onChange={(v) => setWorkshopForm({ ...workshopForm, price: v })} type="number" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Date" value={workshopForm.date} onChange={(v) => setWorkshopForm({ ...workshopForm, date: v })} type="date" />
                <FormInput label="Time" value={workshopForm.time} onChange={(v) => setWorkshopForm({ ...workshopForm, time: v })} type="time" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Capacity" value={workshopForm.capacity} onChange={(v) => setWorkshopForm({ ...workshopForm, capacity: v })} type="number" />
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Category</label>
                  <select value={workshopForm.category} onChange={(e) => setWorkshopForm({ ...workshopForm, category: e.target.value as Workshop['category'] })} className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] text-sm">
                    <option value="Painting">Painting</option><option value="Drawing">Drawing</option><option value="Sculpture">Sculpture</option><option value="Digital">Digital</option>
                  </select>
                </div>
              </div>
              <FormInput label="Image URL" value={workshopForm.image} onChange={(v) => setWorkshopForm({ ...workshopForm, image: v })} placeholder="https://..." />
              {workshopForm.image && <img src={workshopForm.image} className="w-full h-32 object-cover rounded-lg border border-gray-100" alt="Preview" />}
              <FormTextarea label="Description" value={workshopForm.description} onChange={(v) => setWorkshopForm({ ...workshopForm, description: v })} />
              <FormTextarea label="Long Description" value={workshopForm.longDescription} onChange={(v) => setWorkshopForm({ ...workshopForm, longDescription: v })} />
              <ModalActions onCancel={() => setShowWorkshopModal(false)} submitLabel={editingWorkshop ? 'Update Workshop' : 'Create Workshop'} />
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <ModalWrapper onClose={() => setShowProductModal(false)} title={editingProduct ? 'Edit Artwork' : 'Register Artwork'}>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <FormInput label="Title" value={productForm.title} onChange={(v) => setProductForm({ ...productForm, title: v })} required />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Artist Name" value={productForm.artistName} onChange={(v) => setProductForm({ ...productForm, artistName: v })} />
                <FormInput label="Price" value={productForm.price} onChange={(v) => setProductForm({ ...productForm, price: v })} type="number" required />
              </div>
              <FormInput label="Category / Medium" value={productForm.category} onChange={(v) => setProductForm({ ...productForm, category: v })} placeholder="e.g. Oil on Canvas" required />
              <FormInput label="Image URL" value={productForm.image} onChange={(v) => setProductForm({ ...productForm, image: v })} placeholder="https://..." />
              {productForm.image && <img src={productForm.image} className="w-full h-32 object-cover rounded-lg border border-gray-100" alt="Preview" />}
              <FormTextarea label="Description" value={productForm.description} onChange={(v) => setProductForm({ ...productForm, description: v })} />
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Status</label>
                <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value as Product['status'] })} className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] text-sm">
                  <option value="available">Available</option><option value="sold">Sold</option>
                </select>
              </div>
              <ModalActions onCancel={() => setShowProductModal(false)} submitLabel={editingProduct ? 'Update Artwork' : 'Register Artwork'} />
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* CTA Modal */}
      <AnimatePresence>
        {showCTAModal && (
          <ModalWrapper onClose={() => setShowCTAModal(false)} title={editingCTA ? 'Edit CTA Section' : 'Add CTA Section'}>
            <form onSubmit={handleSaveCTA} className="space-y-5">
              <FormInput label="Title" value={ctaForm.title} onChange={(v) => setCtaForm({ ...ctaForm, title: v })} required />
              <FormTextarea label="Subtitle" value={ctaForm.subtitle} onChange={(v) => setCtaForm({ ...ctaForm, subtitle: v })} />
              <FormInput label="Button Text" value={ctaForm.buttonText} onChange={(v) => setCtaForm({ ...ctaForm, buttonText: v })} required />
              <FormInput label="Image URL" value={ctaForm.imageUrl} onChange={(v) => setCtaForm({ ...ctaForm, imageUrl: v })} placeholder="https://..." />
              {ctaForm.imageUrl && <img src={ctaForm.imageUrl} className="w-full h-32 object-cover rounded-lg border border-gray-100" alt="Preview" />}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={ctaForm.isActive} onChange={(e) => setCtaForm({ ...ctaForm, isActive: e.target.checked })} className="w-4 h-4 accent-[#D4145A]" />
                <span className="text-sm font-medium">Active (visible on homepage)</span>
              </label>
              <ModalActions onCancel={() => setShowCTAModal(false)} submitLabel={editingCTA ? 'Update CTA' : 'Create CTA'} />
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <ModalWrapper onClose={() => setShowPlanModal(false)} title={editingPlan ? 'Edit Plan' : 'Add Subscription Plan'}>
            <form onSubmit={handleSavePlan} className="space-y-5">
              <FormInput label="Plan Name" value={planForm.name} onChange={(v) => setPlanForm({ ...planForm, name: v })} required />
              <FormInput label="Monthly Price" value={planForm.price} onChange={(v) => setPlanForm({ ...planForm, price: v })} type="number" required />
              <FormTextarea label="Features (comma-separated)" value={planForm.features} onChange={(v) => setPlanForm({ ...planForm, features: v })} placeholder="Feature 1, Feature 2, Feature 3" />
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={planForm.recommended} onChange={(e) => setPlanForm({ ...planForm, recommended: e.target.checked })} className="w-4 h-4 accent-[#D4145A]" />
                <span className="text-sm font-medium">Recommended plan</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })} className="w-4 h-4 accent-[#D4145A]" />
                <span className="text-sm font-medium">Active (visible on homepage)</span>
              </label>
              {/* Live Preview */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Preview</p>
                <div className={`p-6 border rounded-lg ${planForm.recommended ? 'border-[#D4145A]' : 'border-gray-200'} bg-white`}>
                  <h4 className="font-bold text-lg font-serif">{planForm.name || 'Plan Name'}</h4>
                  <p className="text-2xl font-bold text-[#D4145A]">{'\u00A3'}{planForm.price || '0'}<span className="text-sm text-gray-400">/mo</span></p>
                  {planForm.features && (
                    <ul className="mt-3 space-y-1">
                      {planForm.features.split(',').map((f, i) => f.trim() && <li key={i} className="text-sm text-gray-500 flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#D4145A]" />{f.trim()}</li>)}
                    </ul>
                  )}
                </div>
              </div>
              <ModalActions onCancel={() => setShowPlanModal(false)} submitLabel={editingPlan ? 'Update Plan' : 'Create Plan'} />
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Reusable sub-components ─── */

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#E0E0E0] rounded-lg p-8 shadow-sm transition-all">
    <div className={`p-2.5 rounded bg-gray-50 w-fit mb-6 ${color} border border-gray-100`}>{icon}</div>
    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">{title}</p>
    <p className="text-3xl font-bold tracking-tighter">{value}</p>
  </motion.div>
);

const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-lg">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300"><LayoutGrid size={24} /></div>
    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{msg}</p>
  </div>
);

const ModalWrapper: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white w-full max-w-lg rounded-xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#1A1A1A] transition-colors"><X size={20} /></button>
      <h3 className="text-xl font-bold tracking-tight mb-6 font-serif">{title}</h3>
      {children}
    </motion.div>
  </div>
);

const FormInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }> = ({
  label, value, onChange, type = 'text', required = false, placeholder,
}) => (
  <div>
    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
      className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] focus:bg-white transition-all text-sm"
    />
  </div>
);

const FormTextarea: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  label, value, onChange, placeholder,
}) => (
  <div>
    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
      className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] focus:bg-white transition-all text-sm resize-none"
    />
  </div>
);

const ModalActions: React.FC<{ onCancel: () => void; submitLabel: string }> = ({ onCancel, submitLabel }) => (
  <div className="flex gap-3 pt-4">
    <button type="submit" className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4145A] transition-all">
      {submitLabel}
    </button>
    <button type="button" onClick={onCancel} className="px-6 py-3.5 bg-gray-100 text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors">
      Cancel
    </button>
  </div>
);

export default AdminDashboard;
