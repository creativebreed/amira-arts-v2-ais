"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { User, Workshop, Product } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Image as ImageIcon, Users, Wallet, 
  Clock, Trash2, Edit3, Palette, LayoutGrid, X
} from 'lucide-react';

interface ArtistDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ user, onUpdateUser }) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'workshops' | 'collection'>('workshops');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    type: 'Workshop',
    price: '',
    category: 'Painting',
    description: ''
  });

  const [profileData, setProfileData] = useState({
    name: user.name,
    bio: user.bio || '',
    avatar: user.avatar || ''
  });

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const refreshData = () => {
    const allWorkshops = db.getWorkshops();
    const allProducts = db.getProducts();
    setWorkshops(allWorkshops.filter(w => w.artistId === user.id));
    setProducts(allProducts.filter(p => p.artistId === user.id));
  };

  const totalSales = workshops.reduce((acc, curr) => acc + (curr.booked * curr.price), 0);
  const totalStudents = workshops.reduce((acc, curr) => acc + curr.booked, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'Workshop') {
      const newWorkshop: Workshop = {
        id: `w-${Date.now()}`,
        title: formData.title,
        artistId: user.id,
        artistName: user.name,
        price: Number(formData.price),
        date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
        time: '18:00',
        capacity: 15,
        booked: 0,
        category: formData.category as any,
        image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800',
        description: formData.description
      };
      const all = db.getWorkshops();
      db.saveWorkshops([...all, newWorkshop]);
      db.log(user.id, 'ADD_WORKSHOP', `Added ${formData.title}`);
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        title: formData.title,
        artistId: user.id,
        price: Number(formData.price),
        category: formData.category,
        image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
        status: 'available'
      };
      const all = db.getProducts();
      db.saveProducts([...all, newProduct]);
      db.log(user.id, 'ADD_PRODUCT', `Added ${formData.title}`);
    }
    
    refreshData();
    setShowAddModal(false);
    setFormData({ title: '', type: 'Workshop', price: '', category: 'Painting', description: '' });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: profileData.name,
      bio: profileData.bio,
      avatar: profileData.avatar
    });
    setShowEditProfile(false);
  };

  const handleRemoveWorkshop = (id: string) => {
    if (confirm('Archive this masterclass?')) {
      const all = db.getWorkshops();
      db.saveWorkshops(all.filter(w => w.id !== id));
      refreshData();
    }
  };

  const handleRemoveProduct = (id: string) => {
    if (confirm('Remove this artwork from the gallery?')) {
      const all = db.getProducts();
      db.saveProducts(all.filter(p => p.id !== id));
      refreshData();
    }
  };

  return (
    <div className="space-y-12">
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
              <h2 className="text-5xl font-bold tracking-tighter">Studio Portfolio</h2>
              <button 
                onClick={() => setShowEditProfile(true)}
                className="p-2 text-gray-400 hover:text-[#D4145A] transition-colors"
              >
                <Edit3 size={20} />
              </button>
            </div>
            <p className="text-gray-500 font-medium italic mt-2 underline decoration-[#D4145A] decoration-2 underline-offset-4">{user.name}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-[#D4145A] text-white text-[11px] font-bold uppercase tracking-widest rounded-[4px] hover:bg-black transition-all shadow-xl shadow-[#D4145A]/20"
          >
            <Plus size={18} />
            New Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatItem label="Active Catalog" value={workshops.length + products.length} icon={<LayoutGrid className="text-[#D4145A]" />} />
        <StatItem label="Mentorship Base" value={totalStudents} icon={<Users className="text-black" />} />
        <StatItem label="Studio Revenue" value={`£${totalSales.toLocaleString()}`} icon={<Wallet className="text-black" />} />
      </div>

      <div className="space-y-8">
        <div className="flex gap-8 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('workshops')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'workshops' ? 'text-[#D4145A] border-b-2 border-[#D4145A]' : 'text-gray-400 hover:text-black'}`}
          >
            Masterclasses
          </button>
          <button 
            onClick={() => setActiveTab('collection')}
            className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'collection' ? 'text-[#D4145A] border-b-2 border-[#D4145A]' : 'text-gray-400 hover:text-black'}`}
          >
            Art Collection
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'workshops' ? (
            <motion.div 
              key="workshops-list"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4"
            >
              {workshops.length === 0 ? (
                <EmptyState msg="No active masterclasses." />
              ) : (
                workshops.map(w => (
                  <div key={w.id} className="bg-white p-6 rounded-[4px] border border-[#E0E0E0] flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-all border-l-4 border-l-[#D4145A]">
                    <img src={w.image} className="w-24 h-24 object-cover rounded-[3px] grayscale-[20%]" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg tracking-tight">{w.title}</h4>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-[2px]">{w.category}</span>
                      </div>
                      <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#D4145A]"/> {w.date} @ {w.time}</span>
                        <span className="flex items-center gap-1.5"><Users size={12} className="text-[#D4145A]"/> {w.booked}/{w.capacity} Booked</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-xl font-bold tracking-tighter">£{w.price}</div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Per Participant</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-3 text-gray-300 hover:text-black transition-colors"><Edit3 size={18} /></button>
                        <button onClick={() => handleRemoveWorkshop(w.id)} className="p-3 text-gray-300 hover:text-[#D4145A] transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="collection-list"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {products.length === 0 ? (
                <div className="col-span-full"><EmptyState msg="The studio collection is currently empty." /></div>
              ) : (
                products.map(p => (
                  <div key={p.id} className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden group hover:shadow-xl transition-all">
                    <div className="h-64 relative overflow-hidden">
                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-[2px] ${p.status === 'available' ? 'bg-white/90 text-green-700' : 'bg-black text-white'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold tracking-tight">{p.title}</h4>
                        <span className="font-bold text-[#D4145A]">£{p.price}</span>
                      </div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-6">{p.category}</p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2.5 border border-[#E0E0E0] rounded-[4px] text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">Details</button>
                        <button onClick={() => handleRemoveProduct(p.id)} className="p-2.5 text-gray-300 hover:text-[#D4145A] transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[12px] p-10 shadow-2xl relative"
            >
              <button onClick={() => setShowEditProfile(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-colors"><X size={20}/></button>
              <h3 className="text-2xl font-bold tracking-tight mb-8">Update Identity</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Full Name</label>
                  <input 
                    required 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Professional Bio</label>
                  <textarea 
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows={3}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all resize-none" 
                    placeholder="Short description of your background..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Avatar URL</label>
                  <input 
                    value={profileData.avatar}
                    onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all" 
                    placeholder="https://..."
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-[30px] hover:bg-[#D4145A] transition-all mt-4">Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-xl rounded-[12px] p-10 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <Palette className="text-[#D4145A]" />
              <h3 className="text-2xl font-bold tracking-tight">Add to Portfolio</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Listing Title</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all" 
                    placeholder="e.g. Midnight over Mayfair" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Entry Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Artwork">Artwork</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Valuation (£)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Category</label>
                  <input 
                    required 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all" 
                    placeholder="e.g. Oil on Canvas" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-[30px] hover:bg-[#D4145A] transition-all">Register Asset</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-gray-100 text-[11px] font-bold uppercase tracking-widest rounded-[30px] transition-colors">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string, value: any, icon: any }> = ({ label, value, icon }) => (
  <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-8 shadow-sm flex justify-between items-center group hover:border-[#D4145A] transition-all">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tighter">{value}</p>
    </div>
    <div className="p-3.5 bg-gray-50 rounded-[4px] group-hover:bg-[#D4145A]/10 transition-colors">
      {icon}
    </div>
  </div>
);

const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-[4px]">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
      <LayoutGrid size={24} />
    </div>
    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{msg}</p>
  </div>
);

export default ArtistDashboard;
