
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, Booking, Workshop } from '../types';
import { Ticket, Star, Clock, MapPin, Edit3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onUpdateUser }) => {
  const [myBookings, setMyBookings] = useState<(Booking & { workshop?: Workshop })[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    bio: user.bio || '',
    avatar: user.avatar || ''
  });

  useEffect(() => {
    const allBookings = db.getBookings().filter(b => b.userId === user.id);
    const workshops = db.getWorkshops();
    
    const enriched = allBookings.map(b => ({
      ...b,
      workshop: workshops.find(w => w.id === b.itemId)
    }));

    setMyBookings(enriched);
  }, [user.id]);

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

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-bold">Collector's Studio</h2>
        <p className="text-gray-500 font-medium mt-2">Personal collection of experiences and art.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Ticket size={20} className="text-[#D4145A]" />
            Your Reserved Spots
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {myBookings.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-300 rounded-[4px]">
                <p className="text-gray-400 font-medium">Your collection is empty. Start your journey today.</p>
              </div>
            ) : (
              myBookings.map(b => (
                <div key={b.id} className="bg-white border border-[#E0E0E0] rounded-[4px] p-6 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl transition-all">
                  <div className="w-20 h-20 bg-[#D4145A]/10 text-[#D4145A] rounded-[4px] flex items-center justify-center shrink-0">
                    <Ticket size={32} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-lg mb-1">{b.workshop?.title || 'Unknown Event'}</h4>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-semibold text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={14}/> {b.workshop?.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={14}/> London Studio</span>
                      <span className="text-[#D4145A]">Ref: {b.id.split('-')[1]}</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-[4px]">Confirmed</span>
                    <p className="text-sm font-bold text-gray-400 mt-1 italic">Paid £{b.amount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#1A1A1A] text-white p-8 rounded-[4px] relative overflow-hidden">
            <button 
              onClick={() => setShowEditProfile(true)}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-[#D4145A] transition-colors"
            >
              <Edit3 size={16} />
            </button>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Star size={20} className="text-[#D4145A]" />
              Artistic Profile
            </h3>
            <div className="flex items-center gap-4 mb-6">
              {user.avatar ? (
                <img src={user.avatar} className="w-16 h-16 rounded-full object-cover ring-2 ring-[#D4145A] ring-offset-2" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#D4145A] flex items-center justify-center text-2xl font-bold ring-2 ring-[#D4145A] ring-offset-2">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{user.name}</p>
                <p className="text-xs text-[#D4145A] font-bold uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            {user.bio && (
              <p className="text-xs text-gray-400 leading-relaxed mb-6 italic">"{user.bio}"</p>
            )}
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Total Bookings</span>
                <span className="text-white font-bold">{myBookings.length}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Loyalty Status</span>
                <span className="text-[#D4145A] font-bold uppercase tracking-widest text-[10px]">Emerald</span>
              </div>
            </div>
          </div>

          <div className="border border-[#E0E0E0] rounded-[4px] p-6">
            <h4 className="font-bold text-sm uppercase tracking-widest mb-4">Recommended for You</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-[4px]" />
                <div className="flex-1"><p className="text-xs font-bold">Oil Portrait Basics</p><p className="text-[10px] text-gray-400">Starts July 12</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-[4px]" />
                <div className="flex-1"><p className="text-xs font-bold">Sculpting in Clay</p><p className="text-[10px] text-gray-400">Starts Aug 05</p></div>
              </div>
            </div>
          </div>
        </div>
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
              <h3 className="text-2xl font-bold tracking-tight mb-8">Personalize Profile</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Display Name</label>
                  <input 
                    required 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Collector's Statement</label>
                  <textarea 
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows={3}
                    className="w-full p-4 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:bg-white transition-all resize-none" 
                    placeholder="Tell us about your interest in art..."
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
                <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-[30px] hover:bg-[#D4145A] transition-all mt-4">Update Profile</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
