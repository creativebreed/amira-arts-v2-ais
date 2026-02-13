"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { User, Workshop, Product } from '@/lib/types';
import AccountSettings from '@/components/AccountSettings';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Wallet, Clock, Trash2, Edit3, Palette, LayoutGrid,
  X, Zap, Settings, Image as ImageIcon, ChevronDown
} from 'lucide-react';

interface ArtistDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onRefreshData: () => void;
  onToast: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ user, onUpdateUser, onRefreshData, onToast }) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'workshops' | 'collection' | 'settings'>('workshops');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [workshopForm, setWorkshopForm] = useState({
    title: '', price: '', date: '', time: '18:00', capacity: '15',
    category: 'Painting' as Workshop['category'], image: '', description: '', longDescription: '',
  });

  const [productForm, setProductForm] = useState({
    title: '', price: '', category: '', image: '', description: '',
    galleryImages: '' as string,
  });

  const [addType, setAddType] = useState<'workshop' | 'product'>('workshop');

  const [profileData, setProfileData] = useState({
    name: user.name,
    bio: user.bio || '',
    avatar: user.avatar || ''
  });

  useEffect(() => { refreshData(); }, [user.id]);

  const refreshData = () => {
    setWorkshops(db.getWorkshops().filter(w => w.artistId === user.id));
    setProducts(db.getProducts().filter(p => p.artistId === user.id));
  };

  const totalSales = workshops.reduce((acc, curr) => acc + (curr.booked * curr.price), 0);
  const totalStudents = workshops.reduce((acc, curr) => acc + curr.booked, 0);
  const boostedCount = workshops.filter(w => w.isBoosted).length + products.filter(p => p.isBoosted).length;

  // Workshop CRUD
  const openWorkshopEdit = (w?: Workshop) => {
    if (w) {
      setEditingWorkshop(w);
      setWorkshopForm({
        title: w.title, price: String(w.price), date: w.date, time: w.time,
        capacity: String(w.capacity), category: w.category, image: w.image,
        description: w.description, longDescription: w.longDescription || '',
      });
    } else {
      setEditingWorkshop(null);
      setWorkshopForm({ title: '', price: '', date: '', time: '18:00', capacity: '15', category: 'Painting', image: '', description: '', longDescription: '' });
    }
    setAddType('workshop');
    setShowAddModal(true);
  };

  const handleSaveWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    const all = db.getWorkshops();
    if (editingWorkshop) {
      const updated = all.map(w => w.id === editingWorkshop.id ? {
        ...w, title: workshopForm.title, price: Number(workshopForm.price),
        date: workshopForm.date || w.date, time: workshopForm.time || w.time,
        capacity: Number(workshopForm.capacity), category: workshopForm.category,
        image: workshopForm.image || w.image, description: workshopForm.description,
        longDescription: workshopForm.longDescription,
      } : w);
      db.saveWorkshops(updated);
      db.log(user.id, 'EDIT_WORKSHOP', `Updated: ${workshopForm.title}`);
      onToast('Workshop updated successfully.', 'success');
    } else {
      const newW: Workshop = {
        id: `w-${Date.now()}`, title: workshopForm.title, artistId: user.id, artistName: user.name,
        price: Number(workshopForm.price),
        date: workshopForm.date || new Date(Date.now() + 604800000).toISOString().split('T')[0],
        time: workshopForm.time || '18:00', capacity: Number(workshopForm.capacity), booked: 0,
        category: workshopForm.category,
        image: workshopForm.image || 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800',
        description: workshopForm.description, longDescription: workshopForm.longDescription,
      };
      db.saveWorkshops([...all, newW]);
      db.log(user.id, 'ADD_WORKSHOP', `Created: ${workshopForm.title}`);
      onToast('Workshop created successfully.', 'success');
    }
    refreshData(); onRefreshData(); setShowAddModal(false);
  };

  const handleRemoveWorkshop = (id: string) => {
    if (confirm('Archive this masterclass?')) {
      db.saveWorkshops(db.getWorkshops().filter(w => w.id !== id));
      db.log(user.id, 'DELETE_WORKSHOP', `Removed workshop ID: ${id}`);
      refreshData(); onRefreshData(); onToast('Workshop removed.', 'success');
    }
  };

  const handleToggleWorkshopBoost = (id: string) => {
    const all = db.getWorkshops();
    const updated = all.map(w => w.id === id ? { ...w, isBoosted: !w.isBoosted } : w);
    db.saveWorkshops(updated);
    const item = updated.find(w => w.id === id);
    db.log(user.id, 'BOOST_WORKSHOP', `${item?.isBoosted ? 'Boosted' : 'Un-boosted'}: ${item?.title}`);
    refreshData(); onRefreshData();
    onToast(`Workshop ${item?.isBoosted ? 'boosted to homepage' : 'removed from homepage spotlight'}.`, 'success');
  };

  // Product CRUD
  const openProductEdit = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProductForm({
        title: p.title, price: String(p.price), category: p.category,
        image: p.image, description: p.description || '',
        galleryImages: (p.galleryImages || []).join(', '),
      });
    } else {
      setEditingProduct(null);
      setProductForm({ title: '', price: '', category: '', image: '', description: '', galleryImages: '' });
    }
    setAddType('product');
    setShowAddModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const all = db.getProducts();
    const galleryImages = productForm.galleryImages.split(',').map(s => s.trim()).filter(Boolean);
    if (editingProduct) {
      const updated = all.map(p => p.id === editingProduct.id ? {
        ...p, title: productForm.title, price: Number(productForm.price),
        category: productForm.category, image: productForm.image || p.image,
        description: productForm.description, galleryImages,
      } : p);
      db.saveProducts(updated);
      db.log(user.id, 'EDIT_PRODUCT', `Updated: ${productForm.title}`);
      onToast('Artwork updated successfully.', 'success');
    } else {
      const newP: Product = {
        id: `p-${Date.now()}`, title: productForm.title, artistId: user.id, artistName: user.name,
        price: Number(productForm.price), category: productForm.category,
        image: productForm.image || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
        status: 'available', description: productForm.description, galleryImages,
      };
      db.saveProducts([...all, newP]);
      db.log(user.id, 'ADD_PRODUCT', `Created: ${productForm.title}`);
      onToast('Artwork added to gallery.', 'success');
    }
    refreshData(); onRefreshData(); setShowAddModal(false);
  };

  const handleRemoveProduct = (id: string) => {
    if (confirm('Remove this artwork from the gallery?')) {
      db.saveProducts(db.getProducts().filter(p => p.id !== id));
      db.log(user.id, 'DELETE_PRODUCT', `Removed product ID: ${id}`);
      refreshData(); onRefreshData(); onToast('Artwork removed.', 'success');
    }
  };

  const handleToggleProductBoost = (id: string) => {
    const all = db.getProducts();
    const updated = all.map(p => p.id === id ? { ...p, isBoosted: !p.isBoosted } : p);
    db.saveProducts(updated);
    const item = updated.find(p => p.id === id);
    db.log(user.id, 'BOOST_PRODUCT', `${item?.isBoosted ? 'Boosted' : 'Un-boosted'}: ${item?.title}`);
    refreshData(); onRefreshData();
    onToast(`Artwork ${item?.isBoosted ? 'promoted to homepage' : 'removed from homepage spotlight'}.`, 'success');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, name: profileData.name, bio: profileData.bio, avatar: profileData.avatar });
    db.log(user.id, 'UPDATE_PROFILE', 'Updated artist profile');
    setShowEditProfile(false);
    onToast('Profile updated.', 'success');
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          {user.avatar ? (
            <img src={user.avatar} className="w-20 h-20 rounded-full object-cover ring-2 ring-[#D4145A] ring-offset-4" alt="" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-3xl font-bold ring-2 ring-[#D4145A] ring-offset-4">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-bold tracking-tighter font-serif">Studio Portfolio</h2>
              <button onClick={() => setShowEditProfile(true)} className="p-2 text-gray-400 hover:text-[#D4145A] transition-colors">
                <Edit3 size={20} />
              </button>
            </div>
            <p className="text-gray-500 font-medium italic mt-2 underline decoration-[#D4145A] decoration-2 underline-offset-4">{user.name}</p>
            {user.bio && <p className="text-sm text-gray-400 mt-1 max-w-md">{user.bio}</p>}
          </div>
        </div>
        <button
          onClick={() => { setEditingWorkshop(null); setEditingProduct(null); setAddType('workshop'); setShowAddModal(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-[#D4145A] text-white text-[11px] font-bold uppercase tracking-widest rounded hover:bg-[#1A1A1A] transition-all shadow-xl shadow-[#D4145A]/20"
        >
          <Plus size={18} /> New Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatItem label="Active Catalog" value={workshops.length + products.length} icon={<LayoutGrid className="text-[#D4145A]" />} />
        <StatItem label="Mentorship Base" value={totalStudents} icon={<Users className="text-[#1A1A1A]" />} />
        <StatItem label="Studio Revenue" value={`\u00A3${totalSales.toLocaleString()}`} icon={<Wallet className="text-[#1A1A1A]" />} />
        <StatItem label="Boosted Items" value={boostedCount} icon={<Zap className="text-[#D4145A]" />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-100">
        {([
          { key: 'workshops', label: 'Masterclasses' },
          { key: 'collection', label: 'Art Collection' },
          { key: 'settings', label: 'Account Settings' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === tab.key ? 'text-[#D4145A] border-b-2 border-[#D4145A]' : 'text-gray-400 hover:text-[#1A1A1A]'
            }`}
          >
            {tab.key === 'settings' && <Settings size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'workshops' && (
          <motion.div key="ws" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {workshops.length === 0 ? (
              <EmptyState msg="No active masterclasses. Add your first workshop." onAction={() => { setAddType('workshop'); setEditingWorkshop(null); setShowAddModal(true); }} />
            ) : (
              workshops.map(w => (
                <div key={w.id} className="bg-white p-6 rounded-lg border border-[#E0E0E0] flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition-all border-l-4 border-l-[#D4145A]">
                  <img src={w.image} className="w-24 h-24 object-cover rounded shrink-0 grayscale-[20%]" alt={w.title} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg tracking-tight truncate">{w.title}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-50 border border-gray-100 rounded">{w.category}</span>
                      {w.isBoosted && <span className="px-2 py-0.5 bg-[#D4145A]/10 text-[#D4145A] text-[8px] font-bold uppercase tracking-widest rounded flex items-center gap-1"><Zap size={10} />Boosted</span>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#D4145A]" /> {w.date} @ {w.time}</span>
                      <span className="flex items-center gap-1.5"><Users size={12} className="text-[#D4145A]" /> {w.booked}/{w.capacity} Booked</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold tracking-tighter">{'\u00A3'}{w.price}</div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Per Participant</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleToggleWorkshopBoost(w.id)} className={`p-2.5 rounded transition-colors ${w.isBoosted ? 'bg-[#D4145A] text-white' : 'bg-gray-100 text-gray-400 hover:text-[#D4145A]'}`} title="Toggle homepage boost">
                      <Zap size={16} />
                    </button>
                    <button onClick={() => openWorkshopEdit(w)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-[#1A1A1A] rounded transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => handleRemoveWorkshop(w.id)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-[#D4145A] rounded transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'collection' && (
          <motion.div key="col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setAddType('product'); setEditingProduct(null); setShowAddModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#D4145A] transition-all"
              >
                <Plus size={14} /> Add Artwork
              </button>
            </div>
            {products.length === 0 ? (
              <EmptyState msg="The studio collection is currently empty." onAction={() => { setAddType('product'); setEditingProduct(null); setShowAddModal(true); }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(p => (
                  <div key={p.id} className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden group hover:shadow-xl transition-all">
                    <div className="h-64 relative overflow-hidden">
                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={p.title} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => handleToggleProductBoost(p.id)} className={`p-2 rounded ${p.isBoosted ? 'bg-[#D4145A] text-white' : 'bg-white text-[#1A1A1A]'}`} title="Toggle boost"><Zap size={16} /></button>
                        <button onClick={() => openProductEdit(p)} className="p-2 bg-white rounded text-[#1A1A1A] hover:text-[#D4145A]"><Edit3 size={16} /></button>
                        <button onClick={() => handleRemoveProduct(p.id)} className="p-2 bg-white rounded text-[#1A1A1A] hover:text-[#D4145A]"><Trash2 size={16} /></button>
                      </div>
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded ${p.status === 'available' ? 'bg-white/90 text-emerald-700' : 'bg-[#1A1A1A] text-white'}`}>{p.status}</span>
                        {p.isBoosted && <span className="p-1.5 bg-[#D4145A] text-white rounded-full"><Zap size={10} /></span>}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold tracking-tight truncate pr-4">{p.title}</h4>
                        <span className="font-bold text-[#D4145A] shrink-0">{'\u00A3'}{p.price}</span>
                      </div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">{p.category}</p>
                      {p.description && <p className="text-xs text-gray-500 line-clamp-2 mb-4">{p.description}</p>}
                      {p.galleryImages && p.galleryImages.length > 0 && (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1"><ImageIcon size={12} /> {p.galleryImages.length} gallery images</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AccountSettings user={user} onUpdateUser={onUpdateUser} onToast={onToast} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl p-10 shadow-2xl relative"
            >
              <button onClick={() => setShowEditProfile(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#1A1A1A] transition-colors"><X size={20} /></button>
              <h3 className="text-2xl font-bold tracking-tight mb-8 font-serif">Update Identity</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Full Name</label>
                  <input required value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:bg-white focus:border-[#D4145A] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Professional Bio</label>
                  <textarea value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} rows={3}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:bg-white focus:border-[#D4145A] transition-all resize-none"
                    placeholder="Short description of your artistic background..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Avatar URL</label>
                  <input value={profileData.avatar} onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:bg-white focus:border-[#D4145A] transition-all" placeholder="https://..." />
                </div>
                <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4145A] transition-all mt-4">Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#1A1A1A] transition-colors"><X size={20} /></button>
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                <Palette className="text-[#D4145A]" />
                <h3 className="text-xl font-bold tracking-tight font-serif">
                  {addType === 'workshop' ? (editingWorkshop ? 'Edit Workshop' : 'New Workshop') : (editingProduct ? 'Edit Artwork' : 'New Artwork')}
                </h3>
              </div>

              {!editingWorkshop && !editingProduct && (
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setAddType('workshop')} className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest rounded transition-all ${addType === 'workshop' ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-500'}`}>Workshop</button>
                  <button onClick={() => setAddType('product')} className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest rounded transition-all ${addType === 'product' ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-500'}`}>Artwork</button>
                </div>
              )}

              {addType === 'workshop' ? (
                <form onSubmit={handleSaveWorkshop} className="space-y-5">
                  <FormInput label="Title" value={workshopForm.title} onChange={(v) => setWorkshopForm({ ...workshopForm, title: v })} required />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Price" value={workshopForm.price} onChange={(v) => setWorkshopForm({ ...workshopForm, price: v })} type="number" required />
                    <FormInput label="Capacity" value={workshopForm.capacity} onChange={(v) => setWorkshopForm({ ...workshopForm, capacity: v })} type="number" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Date" value={workshopForm.date} onChange={(v) => setWorkshopForm({ ...workshopForm, date: v })} type="date" />
                    <FormInput label="Time" value={workshopForm.time} onChange={(v) => setWorkshopForm({ ...workshopForm, time: v })} type="time" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Category</label>
                    <select value={workshopForm.category} onChange={(e) => setWorkshopForm({ ...workshopForm, category: e.target.value as Workshop['category'] })}
                      className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] text-sm">
                      <option value="Painting">Painting</option><option value="Drawing">Drawing</option><option value="Sculpture">Sculpture</option><option value="Digital">Digital</option>
                    </select>
                  </div>
                  <FormInput label="Image URL" value={workshopForm.image} onChange={(v) => setWorkshopForm({ ...workshopForm, image: v })} placeholder="https://..." />
                  {workshopForm.image && <img src={workshopForm.image} className="w-full h-32 object-cover rounded-lg border border-gray-100" alt="Preview" />}
                  <FormTextarea label="Short Description" value={workshopForm.description} onChange={(v) => setWorkshopForm({ ...workshopForm, description: v })} />
                  <FormTextarea label="Long Description" value={workshopForm.longDescription} onChange={(v) => setWorkshopForm({ ...workshopForm, longDescription: v })} />
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4145A] transition-all">
                      {editingWorkshop ? 'Update Workshop' : 'Create Workshop'}
                    </button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3.5 bg-gray-100 text-[11px] font-bold uppercase tracking-widest rounded-full">Cancel</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveProduct} className="space-y-5">
                  <FormInput label="Title" value={productForm.title} onChange={(v) => setProductForm({ ...productForm, title: v })} required />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Price" value={productForm.price} onChange={(v) => setProductForm({ ...productForm, price: v })} type="number" required />
                    <FormInput label="Category / Medium" value={productForm.category} onChange={(v) => setProductForm({ ...productForm, category: v })} placeholder="e.g. Oil on Canvas" required />
                  </div>
                  <FormInput label="Main Image URL" value={productForm.image} onChange={(v) => setProductForm({ ...productForm, image: v })} placeholder="https://..." />
                  {productForm.image && <img src={productForm.image} className="w-full h-32 object-cover rounded-lg border border-gray-100" alt="Preview" />}
                  <FormTextarea label="Description" value={productForm.description} onChange={(v) => setProductForm({ ...productForm, description: v })} />
                  <FormInput label="Gallery Images (comma-separated URLs)" value={productForm.galleryImages} onChange={(v) => setProductForm({ ...productForm, galleryImages: v })} placeholder="https://img1.jpg, https://img2.jpg" />
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4145A] transition-all">
                      {editingProduct ? 'Update Artwork' : 'Register Artwork'}
                    </button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3.5 bg-gray-100 text-[11px] font-bold uppercase tracking-widest rounded-full">Cancel</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Sub-components ─── */

const StatItem: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white border border-[#E0E0E0] rounded-lg p-6 shadow-sm flex justify-between items-center group hover:border-[#D4145A] transition-all">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tighter">{value}</p>
    </div>
    <div className="p-3 bg-gray-50 rounded group-hover:bg-[#D4145A]/10 transition-colors">{icon}</div>
  </div>
);

const EmptyState: React.FC<{ msg: string; onAction?: () => void }> = ({ msg, onAction }) => (
  <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-lg">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300"><LayoutGrid size={24} /></div>
    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">{msg}</p>
    {onAction && (
      <button onClick={onAction} className="px-6 py-2.5 bg-[#D4145A] text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#1A1A1A] transition-all">
        <Plus size={14} className="inline mr-2" />Add First Entry
      </button>
    )}
  </div>
);

const FormInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }> = ({
  label, value, onChange, type = 'text', required = false, placeholder,
}) => (
  <div>
    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
      className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] focus:bg-white transition-all text-sm" />
  </div>
);

const FormTextarea: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  label, value, onChange, placeholder,
}) => (
  <div>
    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
      className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] focus:bg-white transition-all text-sm resize-none" />
  </div>
);

export default ArtistDashboard;
