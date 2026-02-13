
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, Workshop, Booking, ActivityLog, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, TrendingUp, AlertCircle, 
  Trash2, Plus, BarChart, Activity, ShieldCheck, 
  ShoppingBag, Search, Filter, MoreVertical
} from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'workshops' | 'shop' | 'logs'>('stats');

  useEffect(() => {
    setUsers(db.getUsers());
    setWorkshops(db.getWorkshops());
    setProducts(db.getProducts());
    setBookings(db.getBookings());
    setLogs(db.getLogs());
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
  const chartData = [
    { name: 'Mon', revenue: 420 }, { name: 'Tue', revenue: 840 }, 
    { name: 'Wed', revenue: 630 }, { name: 'Thu', revenue: 1100 }, 
    { name: 'Fri', revenue: 950 }, { name: 'Sat', revenue: 1600 }, 
    { name: 'Sun', revenue: totalRevenue },
  ];

  const handleRemoveProduct = (id: string) => {
    if (confirm('Permanently remove this artwork from the gallery?')) {
      const updated = products.filter(p => p.id !== id);
      db.saveProducts(updated);
      setProducts(updated);
      db.log('1', 'ADMIN_DELETE_PRODUCT', `Artwork ID ${id} removed`);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-5xl font-bold tracking-tighter">Registry Console</h2>
          <p className="text-gray-500 font-medium mt-1">Institutional oversight and operational analytics.</p>
        </div>
        <div className="flex bg-white border border-[#E0E0E0] rounded-[4px] p-1 shadow-sm overflow-x-auto max-w-full">
          {(['stats', 'users', 'workshops', 'shop', 'logs'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-[3px] transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10' : 'text-gray-400 hover:text-black'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<TrendingUp size={20} />} title="Platform Revenue" value={`£${totalRevenue.toLocaleString()}`} color="text-[#D4145A]" />
              <StatCard icon={<Users size={20} />} title="Total Collective" value={users.length} color="text-black" />
              <StatCard icon={<Calendar size={20} />} title="Active Workshops" value={workshops.length} color="text-black" />
              <StatCard icon={<ShoppingBag size={20} />} title="Listed Artworks" value={products.length} color="text-black" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[4px] p-10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-3">
                    <BarChart size={18} className="text-[#D4145A]" />
                    Performance Metrics
                  </h3>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D4145A]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Revenue (GBP)</span>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999', fontWeight: 600}} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#fcfcfc'}} 
                        contentStyle={{borderRadius: '4px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold'}} 
                      />
                      <Bar dataKey="revenue" fill="#1A1A1A" radius={[2, 2, 0, 0]} barSize={40} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#1A1A1A] text-white rounded-[4px] p-10 flex flex-col">
                <h3 className="text-lg font-bold mb-8 border-b border-white/10 pb-4">Real-time Logs</h3>
                <div className="flex-1 space-y-6 custom-scrollbar overflow-y-auto max-h-[350px] pr-2">
                  {logs.slice(0, 8).map(log => (
                    <div key={log.id} className="group cursor-default">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-bold uppercase text-[#D4145A] tracking-[0.2em]">{log.action}</span>
                        <span className="text-[9px] text-gray-500 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[12px] font-medium text-gray-300 leading-snug group-hover:text-white transition-colors">{log.details}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('logs')} className="mt-8 text-[10px] uppercase font-bold tracking-[0.3em] text-[#D4145A] text-center w-full">Detailed Audit Trace</button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-sm uppercase tracking-widest">Global Directory</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Filter members..." className="pl-9 pr-4 py-2 border border-[#E0E0E0] rounded-[4px] text-xs outline-none focus:border-[#D4145A]" />
                </div>
              </div>
            </div>
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
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-[4px] bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm tracking-tight">{u.name}</div>
                          <div className="text-[11px] text-gray-400 font-medium">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-[2px] ${u.role === 'admin' ? 'bg-black text-white' : u.role === 'artist' ? 'bg-[#D4145A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-300 hover:text-[#D4145A] transition-colors" disabled={u.role === 'admin'}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'shop' && (
          <motion.div 
            key="shop-mgmt"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold tracking-tight">Gallery Inventory</h3>
              <button className="flex items-center gap-2 px-6 py-3 bg-[#D4145A] text-white text-[10px] font-bold uppercase tracking-widest rounded-[4px] shadow-lg shadow-[#D4145A]/20">
                <Plus size={16} /> Register Artwork
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden group">
                  <div className="h-48 relative">
                    <img src={p.image} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white rounded-[4px] text-black hover:text-[#D4145A]"><MoreVertical size={16}/></button>
                      <button onClick={() => handleRemoveProduct(p.id)} className="p-2 bg-white rounded-[4px] text-black hover:text-[#D4145A]"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm tracking-tight truncate pr-4">{p.title}</h4>
                      <span className="font-bold text-sm">£{p.price}</span>
                    </div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-4">{p.category}</p>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-[2px] ${p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {logs.map(log => (
              <div key={log.id} className="bg-white border-l-4 border-[#D4145A] p-6 rounded-[4px] border border-[#E0E0E0] shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] font-bold uppercase bg-[#D4145A] text-white px-2 py-1 rounded-[2px] tracking-widest">{log.action}</span>
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
    </div>
  );
};

const StatCard: React.FC<{ icon: any, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white border border-[#E0E0E0] rounded-[4px] p-8 shadow-sm transition-all"
  >
    <div className={`p-2.5 rounded-[4px] bg-gray-50 w-fit mb-6 ${color} border border-gray-100`}>
      {icon}
    </div>
    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">{title}</p>
    <p className="text-3xl font-bold tracking-tighter">{value}</p>
  </motion.div>
);

export default AdminDashboard;
