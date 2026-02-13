
import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, Workshop, Booking, Product, SubscriptionPlan, CTASection } from './types';
import { LOGO } from './constants';
import AdminDashboard from './components/AdminDashboard';
import ArtistDashboard from './components/ArtistDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import AuthModal from './components/AuthModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, LayoutDashboard, LogOut, Loader2, CreditCard, 
  ShoppingBag, ChevronRight, Filter, Search, X, Check, Star, Zap
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'workshops' | 'shop' | 'dashboard' | 'checkout' | 'details'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [ctas, setCtas] = useState<CTASection[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string, title: string, price: number, type: 'workshop' | 'product', date?: string, time?: string } | null>(null);
  const [detailedItem, setDetailedItem] = useState<Workshop | Product | null>(null);

  useEffect(() => {
    db.init();
    const savedUser = sessionStorage.getItem('amira_session');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    setWorkshops(db.getWorkshops());
    setProducts(db.getProducts());
    setSubscriptions(db.getSubscriptions());
    setCtas(db.getCTAs());
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('amira_session', JSON.stringify(u));
    setIsAuthOpen(false);
    setView('dashboard'); // Task 2: Redirect to dashboard after login
    db.log(u.id, 'LOGIN', `User ${u.name} logged in`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const users = db.getUsers();
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    db.saveUsers(newUsers);
    setUser(updatedUser);
    sessionStorage.setItem('amira_session', JSON.stringify(updatedUser));
    db.log(updatedUser.id, 'UPDATE_PROFILE', 'User updated their profile information');
  };

  const handleLogout = () => {
    if (user) db.log(user.id, 'LOGOUT', 'User logged out');
    setUser(null);
    sessionStorage.removeItem('amira_session');
    setView('home');
  };

  const handlePurchaseClick = (item: Workshop | Product, type: 'workshop' | 'product') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    // Task 1: Artists cannot buy their own creations
    if (user.id === item.artistId) {
      alert("Professional Etiquette Warning: Artists cannot reserve spots or purchase their own listings. Please use the Studio Dashboard to manage your availability.");
      return;
    }

    setSelectedItem({
      id: item.id,
      title: item.title,
      price: item.price,
      type,
      ...(type === 'workshop' ? { date: (item as Workshop).date, time: (item as Workshop).time } : {})
    });
    setView('checkout');
    setDetailedItem(null);
  };

  const openDetails = (item: Workshop | Product) => {
    // Task 3: Details view expansion
    setDetailedItem(item);
    setView('details');
  };

  const handlePaymentSubmit = () => {
    if (!user || !selectedItem) return;
    
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      userId: user.id,
      itemId: selectedItem.id,
      type: selectedItem.type,
      amount: selectedItem.price,
      timestamp: new Date().toISOString()
    };

    const bookings = db.getBookings();
    db.saveBookings([...bookings, newBooking]);

    if (selectedItem.type === 'workshop') {
      const updatedWorkshops = workshops.map(w => 
        w.id === selectedItem.id ? { ...w, booked: w.booked + 1 } : w
      );
      db.saveWorkshops(updatedWorkshops);
      setWorkshops(updatedWorkshops);
    } else {
      const updatedProducts = products.map(p =>
        p.id === selectedItem.id ? { ...p, status: 'sold' as const } : p
      );
      db.saveProducts(updatedProducts);
      setProducts(updatedProducts);
    }

    db.log(user.id, 'PURCHASE', `Completed purchase for: ${selectedItem.title}`);
    alert('Transaction successful! Welcome to the collective.');
    setView('dashboard');
    setSelectedItem(null);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fcfcfc]">
      <Loader2 className="animate-spin text-[#D4145A]" size={40} />
    </div>
  );

  const boostedItems = workshops.filter(w => w.isBoosted).concat(products.filter(p => p.isBoosted) as any);

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#D4145A] selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E0E0E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setView('home')}>{LOGO}</motion.div>
            
            <div className="hidden md:flex items-center space-x-10">
              <button onClick={() => setView('home')} className={`text-[12px] uppercase tracking-widest font-bold transition-all ${view === 'home' ? 'text-[#D4145A]' : 'text-gray-400 hover:text-black'}`}>Home</button>
              <button onClick={() => setView('workshops')} className={`text-[12px] uppercase tracking-widest font-bold transition-all ${view === 'workshops' ? 'text-[#D4145A]' : 'text-gray-400 hover:text-black'}`}>Workshops</button>
              <button onClick={() => setView('shop')} className={`text-[12px] uppercase tracking-widest font-bold transition-all ${view === 'shop' ? 'text-[#D4145A]' : 'text-gray-400 hover:text-black'}`}>Gallery Shop</button>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-6">
                  <button onClick={() => setView('dashboard')} className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-widest rounded-[4px] hover:bg-black transition-all shadow-lg shadow-black/10">
                    <LayoutDashboard size={14} /> Profile
                  </button>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-[#D4145A] transition-colors"><LogOut size={20} /></button>
                </div>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="px-6 py-2.5 bg-[#D4145A] text-white text-[12px] font-bold uppercase tracking-widest rounded-[4px] shadow-xl shadow-[#D4145A]/20 hover:bg-[#b0104a] transition-all transform active:scale-95">
                  Join the Collective
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Hero */}
              <section className="relative h-[80vh] overflow-hidden flex items-center">
                <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 2 }} src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover grayscale-[20%]" alt="Art background" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                  <div className="max-w-7xl mx-auto px-6 w-full">
                    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-2xl">
                      <h1 className="text-6xl md:text-8xl text-white font-bold mb-8 leading-[0.9] tracking-tight">Master <br/>the Canvas.</h1>
                      <p className="text-xl text-white/80 mb-12 font-light leading-relaxed">London's premiere boutique studio for fine art education and original curation.</p>
                      <div className="flex flex-col sm:flex-row gap-5">
                        <button onClick={() => setView('workshops')} className="px-10 py-4 bg-white text-black text-[12px] uppercase tracking-widest font-bold rounded-[4px] hover:bg-gray-100 transition-all flex items-center gap-2">Explore Workshops <ChevronRight size={16}/></button>
                        <button onClick={() => setView('shop')} className="px-10 py-4 bg-[#D4145A] text-white text-[12px] uppercase tracking-widest font-bold rounded-[4px] hover:bg-[#b0104a] transition-all shadow-xl shadow-[#D4145A]/30">The Collection</button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Task 6: Booster Section */}
              {boostedItems.length > 0 && (
                <section className="bg-gray-50 py-16 border-b border-gray-100">
                  <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-2 mb-8">
                      <Zap className="text-[#D4145A]" size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4145A]">Sponsored Highlights</span>
                    </div>
                    <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar">
                      {boostedItems.map((item: any) => (
                        <div key={item.id} onClick={() => openDetails(item)} className="min-w-[300px] cursor-pointer group bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
                          <div className="h-40 overflow-hidden rounded-[4px] mb-4">
                            <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                          </div>
                          <h4 className="font-bold tracking-tight">{item.title}</h4>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Featured by {item.artistName || 'Studio Gallery'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Task 7: Subscriptions */}
              <section className="max-w-7xl mx-auto px-6 py-32">
                <div className="text-center mb-20">
                  <h2 className="text-5xl font-bold tracking-tighter mb-4">Institutional Membership</h2>
                  <p className="text-gray-500 max-w-lg mx-auto">Choose a plan that fits your artistic commitment and provides exclusive access.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {subscriptions.map(plan => (
                    <div key={plan.id} className={`relative p-10 border rounded-[4px] ${plan.recommended ? 'border-[#D4145A] shadow-2xl shadow-[#D4145A]/10 bg-white' : 'border-gray-100 bg-white'}`}>
                      {plan.recommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#D4145A] text-white text-[9px] font-bold uppercase tracking-widest rounded-full">Recommended</div>}
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-4xl font-bold">£{plan.price}</span>
                        <span className="text-gray-400 text-sm font-medium">/month</span>
                      </div>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                            <Check size={16} className="text-[#D4145A]" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button className={`w-full py-4 rounded-[4px] text-[11px] font-bold uppercase tracking-widest transition-all ${plan.recommended ? 'bg-[#D4145A] text-white hover:bg-black' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Select Tier</button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Task 4: Editable CTA Sections */}
              {ctas.filter(c => c.isActive).map(cta => (
                <section key={cta.id} className="max-w-7xl mx-auto px-6 mb-32">
                  <div className="bg-[#1A1A1A] rounded-[4px] overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]">
                    <div className="flex-1 p-16 flex flex-col justify-center">
                      <h2 className="text-4xl text-white font-bold mb-4 tracking-tight">{cta.title}</h2>
                      <p className="text-gray-400 mb-10 leading-relaxed">{cta.subtitle}</p>
                      <button className="px-8 py-4 bg-[#D4145A] text-white text-[11px] font-bold uppercase tracking-widest rounded-[4px] w-fit shadow-xl shadow-[#D4145A]/20">{cta.buttonText}</button>
                    </div>
                    <div className="flex-1 overflow-hidden min-h-[300px]">
                      <img src={cta.imageUrl} className="w-full h-full object-cover grayscale-[20%]" alt="CTA background" />
                    </div>
                  </div>
                </section>
              ))}
            </motion.div>
          )}

          {view === 'workshops' && (
            <motion.div key="workshops" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 py-20">
              <div className="mb-16">
                <h2 className="text-5xl font-bold tracking-tighter mb-4">Masterclasses</h2>
                <p className="text-gray-500 max-w-xl">Deep dive into specific techniques with London's finest working artists.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {workshops.map((w) => (
                  <WorkshopCard key={w.id} workshop={w} onBook={() => handlePurchaseClick(w, 'workshop')} onDetail={() => openDetails(w)} />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'shop' && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 py-20">
              <div className="mb-16">
                <h2 className="text-5xl font-bold tracking-tighter mb-4">The Collection</h2>
                <p className="text-gray-500">Original works of art available for purchase from our community.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onBuy={() => handlePurchaseClick(p, 'product')} onDetail={() => openDetails(p)} />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'details' && detailedItem && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 py-20">
              <button onClick={() => setView('workshops')} className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10 hover:text-black transition-colors"><X size={16}/> Back to Archive</button>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="rounded-[4px] overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={detailedItem.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-gray-100 text-[9px] font-bold uppercase tracking-widest rounded-full">{detailedItem.category}</span>
                    {detailedItem.isBoosted && <span className="flex items-center gap-1 text-[#D4145A] text-[9px] font-bold uppercase tracking-widest"><Star size={12}/> Featured</span>}
                  </div>
                  <h2 className="text-6xl font-bold tracking-tighter mb-6">{detailedItem.title}</h2>
                  <div className="text-3xl font-bold text-[#D4145A] mb-10">£{detailedItem.price}</div>
                  <div className="prose prose-sm max-w-none text-gray-500 leading-relaxed mb-12">
                    <p className="text-lg font-medium text-gray-900 mb-4">{detailedItem.description}</p>
                    <p>{(detailedItem as Workshop).longDescription || "This piece/workshop is part of the curated seasonal collection at Amira Arts Gallery. Each entry represents the high standard of technical mastery and expressive depth we champion in our Shoreditch studio."}</p>
                  </div>
                  
                  {'date' in detailedItem ? (
                    <div className="grid grid-cols-2 gap-4 mb-12 bg-gray-50 p-6 rounded-[4px] border border-gray-100">
                      <div><span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Session Date</span><span className="font-bold">{(detailedItem as Workshop).date}</span></div>
                      <div><span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Schedule</span><span className="font-bold">{(detailedItem as Workshop).time}</span></div>
                    </div>
                  ) : null}

                  <button 
                    onClick={() => handlePurchaseClick(detailedItem, 'date' in detailedItem ? 'workshop' : 'product')}
                    className="w-full py-5 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-widest rounded-[4px] hover:bg-[#D4145A] transition-all shadow-2xl shadow-black/10"
                  >
                    {'date' in detailedItem ? 'Secure Enrollment' : 'Acquire Original Work'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 py-16">
              {user.role === 'admin' ? <AdminDashboard /> : 
               user.role === 'artist' ? <ArtistDashboard user={user} onUpdateUser={handleUpdateUser} /> : 
               <CustomerDashboard user={user} onUpdateUser={handleUpdateUser} />}
            </motion.div>
          )}

          {view === 'checkout' && selectedItem && (
            <motion.div key="checkout" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto px-6 py-24">
              <div className="bg-white p-10 rounded-[4px] border border-[#E0E0E0] shadow-2xl">
                <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
                  <div className="w-12 h-12 bg-[#D4145A] text-white rounded-[4px] flex items-center justify-center"><CreditCard size={24} /></div>
                  <div><h2 className="text-2xl font-bold tracking-tight">Finalize Transaction</h2><p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Amira Arts Secure Checkout</p></div>
                </div>
                <div className="mb-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div><span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Item</span><p className="font-bold text-lg">{selectedItem.title}</p></div>
                    <span className="text-2xl font-bold tracking-tighter">£{selectedItem.price}</span>
                  </div>
                </div>
                <div className="space-y-6">
                  <input type="text" placeholder="Cardholder Name" className="w-full p-4 border border-[#E0E0E0] rounded-[4px] bg-gray-50 focus:bg-white transition-all outline-none" />
                  <input type="text" placeholder="Card Number" className="w-full p-4 border border-[#E0E0E0] rounded-[4px] bg-gray-50 focus:bg-white transition-all outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/YY" className="w-full p-4 border border-[#E0E0E0] rounded-[4px] bg-gray-50 outline-none" />
                    <input type="text" placeholder="CVC" className="w-full p-4 border border-[#E0E0E0] rounded-[4px] bg-gray-50 outline-none" />
                  </div>
                  <button onClick={handlePaymentSubmit} className="w-full py-5 bg-[#1A1A1A] text-white text-[12px] uppercase font-bold tracking-widest rounded-[4px] mt-4 shadow-2xl hover:bg-[#D4145A] transition-all">Confirm Acquisition</button>
                  <button onClick={() => setView('home')} className="w-full text-[10px] uppercase tracking-widest text-gray-400 font-bold py-2 hover:text-black transition-colors">Discard</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>{isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />}</AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 text-center md:text-left">
          <div className="col-span-1 md:col-span-2">
            <div className="flex justify-center md:justify-start">{LOGO}</div>
            <p className="mt-8 text-gray-400 max-w-sm leading-relaxed">Preserving the classical mastery while fostering the future of Shoreditch art scene. A sanctuary for artistic preservation.</p>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-[0.3em] text-[10px] text-[#D4145A]">Directory</h4>
            <ul className="space-y-4 text-[12px] font-bold uppercase tracking-widest text-gray-500">
              <li><button onClick={() => setView('workshops')} className="hover:text-[#D4145A] transition-colors">Workshops</button></li>
              <li><button onClick={() => setView('shop')} className="hover:text-[#D4145A] transition-colors">Collection</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-[0.3em] text-[10px] text-[#D4145A]">Connect</h4>
            <p className="text-gray-400 text-sm leading-relaxed">14 Artisan Square, Shoreditch<br/>London EC2A 3PR</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const WorkshopCard: React.FC<{ workshop: Workshop, onBook: () => void, onDetail: () => void }> = ({ workshop, onBook, onDetail }) => (
  <motion.div whileHover={{ y: -8 }} className="group bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden hover:shadow-2xl transition-all duration-500">
    <div className="h-72 relative overflow-hidden cursor-pointer" onClick={onDetail}>
      <img src={workshop.image} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" alt={workshop.title} />
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-[#D4145A] text-[10px] font-bold uppercase tracking-[0.2em] rounded-[2px] shadow-sm">{workshop.category}</span>
        {workshop.isBoosted && <span className="p-1.5 bg-[#D4145A] text-white rounded-full w-fit shadow-lg"><Zap size={10}/></span>}
      </div>
    </div>
    <div className="p-8">
      <h3 className="text-2xl font-bold leading-tight tracking-tight mb-2 cursor-pointer hover:text-[#D4145A] transition-colors" onClick={onDetail}>{workshop.title}</h3>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium line-clamp-2">{workshop.description}</p>
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="text-xl font-bold tracking-tighter text-[#D4145A]">£{workshop.price}</div>
        <button onClick={onBook} disabled={workshop.booked >= workshop.capacity} className={`px-6 py-2.5 rounded-[4px] text-[11px] uppercase tracking-widest font-bold transition-all ${workshop.booked >= workshop.capacity ? 'bg-gray-100 text-gray-400' : 'bg-[#1A1A1A] text-white hover:bg-[#D4145A]'}`}>
          {workshop.booked >= workshop.capacity ? 'Full' : 'Reserve'}
        </button>
      </div>
    </div>
  </motion.div>
);

const ProductCard: React.FC<{ product: Product, onBuy: () => void, onDetail: () => void }> = ({ product, onBuy, onDetail }) => (
  <motion.div whileHover={{ y: -5 }} className="group bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden hover:shadow-xl transition-all duration-500">
    <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 cursor-pointer" onClick={onDetail}>
      <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={product.title} />
      {product.isBoosted && <div className="absolute top-4 left-4 p-1.5 bg-[#D4145A] text-white rounded-full shadow-lg"><Zap size={10}/></div>}
      {product.status === 'sold' && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"><span className="px-6 py-2 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-[0.3em] rounded-[2px] -rotate-12">Acquired</span></div>}
    </div>
    <div className="p-6">
      <h4 className="text-lg font-bold tracking-tight line-clamp-1 mb-1 cursor-pointer hover:text-[#D4145A]" onClick={onDetail}>{product.title}</h4>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{product.category}</p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold tracking-tighter text-[#D4145A]">£{product.price}</span>
        <button onClick={onBuy} disabled={product.status === 'sold'} className={`px-4 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all ${product.status === 'sold' ? 'text-gray-300' : 'text-[#1A1A1A] hover:text-[#D4145A]'}`}>Purchase</button>
      </div>
    </div>
  </motion.div>
);

export default App;
