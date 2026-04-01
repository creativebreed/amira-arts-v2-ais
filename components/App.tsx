"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { User, Workshop, Booking, Product, SubscriptionPlan, CTASection } from '@/lib/types';
import { LOGO } from '@/lib/constants';
import AdminDashboard from '@/components/AdminDashboard';
import ArtistDashboard from '@/components/ArtistDashboard';
import CustomerDashboard from '@/components/CustomerDashboard';
import AuthModal from '@/components/AuthModal';
import Toast, { ToastData } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, LayoutDashboard, LogOut, Loader2, CreditCard,
  ShoppingBag, ChevronRight, X, Check, Star, Zap,
  ChevronDown, ChevronUp, User as UserIcon, Clock, Palette,
  MapPin, Ruler, Truck, Menu, XIcon
} from 'lucide-react';

type ViewType = 'home' | 'workshops' | 'shop' | 'dashboard' | 'checkout' | 'details' | 'subscriptionCheckout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('home');
  const [previousView, setPreviousView] = useState<ViewType>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [ctas, setCtas] = useState<CTASection[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string; price: number; type: 'workshop' | 'product'; date?: string; time?: string } | null>(null);
  const [detailedItem, setDetailedItem] = useState<Workshop | Product | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Expandable sections state for details view
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    description: true,
    artist: false,
    session: false,
    purchase: false,
  });

  const addToast = useCallback((message: string, type: ToastData['type']) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    db.init();
    const savedUser = sessionStorage.getItem('amira_session');
    if (savedUser) setUser(JSON.parse(savedUser));
    refreshData();
    setLoading(false);
  }, []);

  const refreshData = () => {
    setWorkshops(db.getWorkshops());
    setProducts(db.getProducts());
    setSubscriptions(db.getSubscriptions());
    setCtas(db.getCTAs());
  };

  const navigateTo = (target: ViewType) => {
    setPreviousView(view);
    setView(target);
    setMobileMenuOpen(false);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('amira_session', JSON.stringify(u));
    setIsAuthOpen(false);
    navigateTo('dashboard');
    db.log(u.id, 'LOGIN', `User ${u.name} logged in`);
    addToast(`Welcome back, ${u.name}!`, 'success');
  };

  const handleUpdateUser = (updatedUser: User) => {
    const users = db.getUsers();
    const newUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    db.saveUsers(newUsers);
    setUser(updatedUser);
    sessionStorage.setItem('amira_session', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    if (user) db.log(user.id, 'LOGOUT', 'User logged out');
    setUser(null);
    sessionStorage.removeItem('amira_session');
    navigateTo('home');
    addToast('You have been signed out.', 'info');
  };

  const handlePurchaseClick = (item: Workshop | Product, type: 'workshop' | 'product') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    // Phase 1: Artists cannot buy their own creations
    if (user.id === item.artistId) {
      addToast(
        'As the creator of this entry, you cannot purchase or reserve your own listing. Please use your Studio Dashboard to manage availability.',
        'warning'
      );
      return;
    }

    setSelectedItem({
      id: item.id,
      title: item.title,
      price: item.price,
      type,
      ...(type === 'workshop' ? { date: (item as Workshop).date, time: (item as Workshop).time } : {}),
    });
    navigateTo('checkout');
    setDetailedItem(null);
  };

  const openDetails = (item: Workshop | Product) => {
    setDetailedItem(item);
    setExpandedSections({ overview: true, description: true, artist: false, session: false, purchase: false });
    navigateTo('details');
  };

  const handlePaymentSubmit = () => {
    if (!user || !selectedItem) return;
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      userId: user.id,
      itemId: selectedItem.id,
      type: selectedItem.type,
      amount: selectedItem.price,
      timestamp: new Date().toISOString(),
    };
    const bookings = db.getBookings();
    db.saveBookings([...bookings, newBooking]);

    if (selectedItem.type === 'workshop') {
      const updatedWorkshops = workshops.map((w) => (w.id === selectedItem.id ? { ...w, booked: w.booked + 1 } : w));
      db.saveWorkshops(updatedWorkshops);
      setWorkshops(updatedWorkshops);
    } else {
      const updatedProducts = products.map((p) => (p.id === selectedItem.id ? { ...p, status: 'sold' as const } : p));
      db.saveProducts(updatedProducts);
      setProducts(updatedProducts);
    }
    db.log(user.id, 'PURCHASE', `Completed purchase for: ${selectedItem.title}`);
    addToast('Transaction successful! Welcome to the collective.', 'success');
    navigateTo('dashboard');
    setSelectedItem(null);
  };

  const handleSubscriptionSelect = (plan: SubscriptionPlan) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setSelectedPlan(plan);
    navigateTo('subscriptionCheckout');
  };

  const handleSubscriptionSubmit = () => {
    if (!user || !selectedPlan) return;
    const updatedUser = { ...user, subscriptionPlanId: selectedPlan.id, subscriptionStartDate: new Date().toISOString() };
    handleUpdateUser(updatedUser);
    db.log(user.id, 'SUBSCRIBE', `Subscribed to ${selectedPlan.name} plan`);
    addToast(`You are now an ${selectedPlan.name} member! Your benefits are active immediately.`, 'success');
    navigateTo('dashboard');
    setSelectedPlan(null);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Active nav highlighting: details inherits parent
  const activeNavView = view === 'details' && detailedItem
    ? ('date' in detailedItem ? 'workshops' : 'shop')
    : view;

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-[#D4145A]" size={40} />
      </div>
    );

  const boostedItems = [
    ...workshops.filter((w) => w.isBoosted),
    ...products.filter((p) => p.isBoosted),
  ];

  const artistOfDetail = detailedItem
    ? db.getUsers().find((u) => u.id === detailedItem.artistId)
    : null;

  const userActivePlan = user?.subscriptionPlanId
    ? subscriptions.find((s) => s.id === user.subscriptionPlanId)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E0E0E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigateTo('home')}>
              {LOGO}
            </motion.div>

            <div className="hidden md:flex items-center gap-10">
              {(['home', 'workshops', 'shop'] as const).map((nav) => (
                <button
                  key={nav}
                  onClick={() => navigateTo(nav)}
                  className={`text-[12px] uppercase tracking-widest font-bold transition-all ${
                    activeNavView === nav ? 'text-[#D4145A]' : 'text-gray-400 hover:text-[#1A1A1A]'
                  }`}
                >
                  {nav === 'shop' ? 'Gallery Shop' : nav}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="hidden md:flex items-center gap-6">
                  {userActivePlan && (
                    <span className="px-3 py-1 bg-[#D4145A]/10 text-[#D4145A] text-[9px] font-bold uppercase tracking-widest rounded-full">
                      {userActivePlan.name}
                    </span>
                  )}
                  <button
                    onClick={() => navigateTo('dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-widest rounded hover:bg-[#D4145A] transition-all shadow-lg shadow-black/10"
                  >
                    <LayoutDashboard size={14} /> Profile
                  </button>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-[#D4145A] transition-colors">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="hidden md:block px-6 py-2.5 bg-[#D4145A] text-white text-[12px] font-bold uppercase tracking-widest rounded shadow-xl shadow-[#D4145A]/20 hover:bg-[#b0104a] transition-all active:scale-95"
                >
                  Join the Collective
                </button>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#1A1A1A]">
                {mobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-[#E0E0E0] bg-white overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-2">
                {(['home', 'workshops', 'shop'] as const).map((nav) => (
                  <button
                    key={nav}
                    onClick={() => navigateTo(nav)}
                    className={`text-left px-4 py-3 text-sm font-bold uppercase tracking-widest rounded ${
                      activeNavView === nav ? 'text-[#D4145A] bg-[#D4145A]/5' : 'text-gray-500'
                    }`}
                  >
                    {nav === 'shop' ? 'Gallery Shop' : nav}
                  </button>
                ))}
                {user ? (
                  <>
                    <button onClick={() => navigateTo('dashboard')} className="text-left px-4 py-3 text-sm font-bold uppercase tracking-widest text-gray-500">
                      Dashboard
                    </button>
                    <button onClick={handleLogout} className="text-left px-4 py-3 text-sm font-bold uppercase tracking-widest text-red-500">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setIsAuthOpen(true); setMobileMenuOpen(false); }} className="mt-2 w-full py-3 bg-[#D4145A] text-white text-sm font-bold uppercase tracking-widest rounded">
                    Join the Collective
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {/* HOME */}
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Hero */}
              <section className="relative h-[80vh] overflow-hidden flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1600"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[20%]"
                  alt="Art background"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                  <div className="max-w-7xl mx-auto px-6 w-full">
                    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-2xl">
                      <h1 className="text-6xl md:text-8xl text-white font-bold mb-8 leading-[0.9] tracking-tight font-serif">
                        Master <br />the Canvas.
                      </h1>
                      <p className="text-xl text-white/80 mb-12 font-light leading-relaxed">
                        {"London's premiere boutique studio for fine art education and original curation."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-5">
                        <button
                          onClick={() => navigateTo('workshops')}
                          className="px-10 py-4 bg-white text-[#1A1A1A] text-[12px] uppercase tracking-widest font-bold rounded hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                          Explore Workshops <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => navigateTo('shop')}
                          className="px-10 py-4 bg-[#D4145A] text-white text-[12px] uppercase tracking-widest font-bold rounded hover:bg-[#b0104a] transition-all shadow-xl shadow-[#D4145A]/30"
                        >
                          The Collection
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Sponsored Highlights */}
              {boostedItems.length > 0 && (
                <section className="bg-gray-50 py-16 border-b border-gray-100">
                  <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-2 mb-8">
                      <Zap className="text-[#D4145A]" size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4145A]">Sponsored Highlights</span>
                    </div>
                    <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar">
                      {boostedItems.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => openDetails(item)}
                          className="min-w-[300px] cursor-pointer group bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="h-40 overflow-hidden rounded mb-4">
                            <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={item.title} />
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-[#D4145A]/10 text-[#D4145A] text-[8px] font-bold uppercase tracking-widest rounded">Sponsored</span>
                          </div>
                          <h4 className="font-bold tracking-tight">{item.title}</h4>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                            Featured by {item.artistName || 'Studio Gallery'}
                          </p>
                        </div>
                      ))}
                      {/* CTA for artists */}
                      <div
                        onClick={() => (user?.role === 'artist' ? navigateTo('dashboard') : setIsAuthOpen(true))}
                        className="min-w-[300px] cursor-pointer bg-[#1A1A1A] text-white p-6 rounded-lg flex flex-col justify-center items-center text-center hover:bg-[#D4145A] transition-all"
                      >
                        <Zap size={32} className="mb-4 opacity-60" />
                        <h4 className="font-bold text-lg tracking-tight mb-2">Become Featured</h4>
                        <p className="text-xs text-white/60">Boost your listings to reach more collectors and students.</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Subscription Plans */}
              <section className="max-w-7xl mx-auto px-6 py-32">
                <div className="text-center mb-20">
                  <h2 className="text-5xl font-bold tracking-tighter mb-4 font-serif">Institutional Membership</h2>
                  <p className="text-gray-500 max-w-lg mx-auto">Choose a plan that fits your artistic commitment and provides exclusive access.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {subscriptions.filter(s => s.isActive !== false).map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`relative p-10 border rounded-lg ${
                        plan.recommended
                          ? 'border-[#D4145A] shadow-2xl shadow-[#D4145A]/10 bg-white'
                          : 'border-gray-100 bg-white hover:shadow-xl'
                      }`}
                    >
                      {plan.recommended && (
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#D4145A] text-white text-[9px] font-bold uppercase tracking-widest rounded-full"
                        >
                          Recommended
                        </motion.div>
                      )}
                      <h3 className="text-2xl font-bold mb-2 font-serif">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-4xl font-bold">{'\u00A3'}{plan.price}</span>
                        <span className="text-gray-400 text-sm font-medium">/month</span>
                      </div>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                            <Check size={16} className="text-[#D4145A] shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleSubscriptionSelect(plan)}
                        className={`w-full py-4 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${
                          user?.subscriptionPlanId === plan.id
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                            : plan.recommended
                            ? 'bg-[#D4145A] text-white hover:bg-[#1A1A1A]'
                            : 'bg-gray-50 text-gray-500 hover:bg-[#1A1A1A] hover:text-white'
                        }`}
                        disabled={user?.subscriptionPlanId === plan.id}
                      >
                        {user?.subscriptionPlanId === plan.id ? 'Current Plan' : 'Select Tier'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* CTA Sections */}
              {ctas
                .filter((c) => c.isActive)
                .map((cta) => (
                  <section key={cta.id} className="max-w-7xl mx-auto px-6 mb-32">
                    <div className="bg-[#1A1A1A] rounded-lg overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]">
                      <div className="flex-1 p-16 flex flex-col justify-center">
                        <h2 className="text-4xl text-white font-bold mb-4 tracking-tight font-serif">{cta.title}</h2>
                        <p className="text-gray-400 mb-10 leading-relaxed">{cta.subtitle}</p>
                        <button className="px-8 py-4 bg-[#D4145A] text-white text-[11px] font-bold uppercase tracking-widest rounded w-fit shadow-xl shadow-[#D4145A]/20">
                          {cta.buttonText}
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden min-h-[300px]">
                        <img src={cta.imageUrl} className="w-full h-full object-cover grayscale-[20%]" alt="CTA background" />
                      </div>
                    </div>
                  </section>
                ))}
            </motion.div>
          )}

          {/* WORKSHOPS */}
          {view === 'workshops' && (
            <motion.div key="workshops" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 py-20">
              <div className="mb-16">
                <h2 className="text-5xl font-bold tracking-tighter mb-4 font-serif">Masterclasses</h2>
                <p className="text-gray-500 max-w-xl">{"Deep dive into specific techniques with London's finest working artists."}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {workshops.map((w) => (
                  <WorkshopCard
                    key={w.id}
                    workshop={w}
                    currentUserId={user?.id}
                    onBook={() => handlePurchaseClick(w, 'workshop')}
                    onDetail={() => openDetails(w)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* SHOP */}
          {view === 'shop' && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 py-20">
              <div className="mb-16">
                <h2 className="text-5xl font-bold tracking-tighter mb-4 font-serif">The Collection</h2>
                <p className="text-gray-500">Original works of art available for purchase from our community.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    currentUserId={user?.id}
                    onBuy={() => handlePurchaseClick(p, 'product')}
                    onDetail={() => openDetails(p)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* DETAILS VIEW - Phase 2: Expandable sections */}
          {view === 'details' && detailedItem && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 py-20">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                <button onClick={() => navigateTo('home')} className="hover:text-[#D4145A] transition-colors">Home</button>
                <ChevronRight size={12} />
                <button
                  onClick={() => navigateTo('date' in detailedItem ? 'workshops' : 'shop')}
                  className="hover:text-[#D4145A] transition-colors"
                >
                  {'date' in detailedItem ? 'Workshops' : 'Gallery Shop'}
                </button>
                <ChevronRight size={12} />
                <span className="text-[#1A1A1A]">{detailedItem.title}</span>
              </div>

              <button
                onClick={() => navigateTo('date' in detailedItem ? 'workshops' : 'shop')}
                className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10 hover:text-[#1A1A1A] transition-colors"
              >
                <X size={16} /> Back to {'date' in detailedItem ? 'Workshops' : 'Collection'}
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={detailedItem.image} className="w-full h-full object-cover" alt={detailedItem.title} />
                </div>
                <div className="flex flex-col">
                  {/* Overview - always visible */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-gray-100 text-[9px] font-bold uppercase tracking-widest rounded-full">
                        {detailedItem.category}
                      </span>
                      {detailedItem.isBoosted && (
                        <span className="flex items-center gap-1 text-[#D4145A] text-[9px] font-bold uppercase tracking-widest">
                          <Star size={12} /> Featured
                        </span>
                      )}
                      {user?.id === detailedItem.artistId && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-widest rounded-full">
                          Your Listing
                        </span>
                      )}
                    </div>
                    <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter mb-6 font-serif">{detailedItem.title}</h2>
                    <div className="text-3xl font-bold text-[#D4145A] mb-6">{'\u00A3'}{detailedItem.price}</div>
                  </div>

                  {/* Expandable: Full Description */}
                  <ExpandableSection
                    title="Full Description"
                    icon={<Palette size={16} />}
                    isOpen={expandedSections.description}
                    onToggle={() => toggleSection('description')}
                  >
                    <p className="text-lg font-medium text-gray-900 mb-4">{detailedItem.description || 'No description available.'}</p>
                    <p className="text-gray-500 leading-relaxed">
                      {(detailedItem as Workshop).longDescription ||
                        (detailedItem as Product).description ||
                        "This piece/workshop is part of the curated seasonal collection at Amira Arts Gallery. Each entry represents the high standard of technical mastery and expressive depth we champion in our Shoreditch studio."}
                    </p>
                  </ExpandableSection>

                  {/* Expandable: Artist Profile */}
                  <ExpandableSection
                    title="Artist Profile"
                    icon={<UserIcon size={16} />}
                    isOpen={expandedSections.artist}
                    onToggle={() => toggleSection('artist')}
                  >
                    {artistOfDetail ? (
                      <div className="flex items-start gap-4">
                        {artistOfDetail.avatar ? (
                          <img src={artistOfDetail.avatar} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#D4145A] ring-offset-2" alt="" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-lg">
                            {artistOfDetail.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg">{artistOfDetail.name}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4145A] mb-2">
                            {artistOfDetail.role === 'artist' ? 'Resident Artist' : 'Gallery Curator'}
                          </p>
                          {artistOfDetail.bio && <p className="text-sm text-gray-500 leading-relaxed italic">{artistOfDetail.bio}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Artist information not available.</p>
                    )}
                  </ExpandableSection>

                  {/* Expandable: Session Details (workshops) */}
                  {'date' in detailedItem && (
                    <ExpandableSection
                      title="Session Details"
                      icon={<Clock size={16} />}
                      isOpen={expandedSections.session}
                      onToggle={() => toggleSection('session')}
                    >
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Session Date</span>
                          <span className="font-bold flex items-center gap-2"><Calendar size={14} className="text-[#D4145A]" />{(detailedItem as Workshop).date}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Schedule</span>
                          <span className="font-bold flex items-center gap-2"><Clock size={14} className="text-[#D4145A]" />{(detailedItem as Workshop).time}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Capacity</span>
                          <span className="font-bold">{(detailedItem as Workshop).booked}/{(detailedItem as Workshop).capacity} Enrolled</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Location</span>
                          <span className="font-bold flex items-center gap-2"><MapPin size={14} className="text-[#D4145A]" />Shoreditch Studio</span>
                        </div>
                      </div>
                    </ExpandableSection>
                  )}

                  {/* Expandable: Purchase Info (products) */}
                  {'status' in detailedItem && !('date' in detailedItem) && (
                    <ExpandableSection
                      title="Purchase Information"
                      icon={<Truck size={16} />}
                      isOpen={expandedSections.purchase}
                      onToggle={() => toggleSection('purchase')}
                    >
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Medium</span>
                          <span className="font-bold">{detailedItem.category}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Status</span>
                          <span className={`font-bold ${(detailedItem as Product).status === 'available' ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {(detailedItem as Product).status === 'available' ? 'Available' : 'Sold'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Dimensions</span>
                          <span className="font-bold flex items-center gap-2"><Ruler size={14} className="text-[#D4145A]" />60 x 80 cm</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Shipping</span>
                          <span className="font-bold flex items-center gap-2"><Truck size={14} className="text-[#D4145A]" />UK & International</span>
                        </div>
                      </div>
                    </ExpandableSection>
                  )}

                  {/* CTA Button */}
                  <div className="mt-8">
                    {user?.id === detailedItem.artistId ? (
                      <div className="w-full py-5 bg-amber-50 text-amber-700 text-center text-sm font-semibold rounded-lg border border-amber-200">
                        This is your own listing. Manage it from your Studio Dashboard.
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchaseClick(detailedItem, 'date' in detailedItem ? 'workshop' : 'product')}
                        disabled={!('date' in detailedItem) && (detailedItem as Product).status === 'sold'}
                        className="w-full py-5 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-widest rounded hover:bg-[#D4145A] transition-all shadow-2xl shadow-black/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {'date' in detailedItem ? 'Secure Enrollment' : 'Acquire Original Work'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DASHBOARD */}
          {view === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 py-16">
              {user.role === 'admin' ? (
                <AdminDashboard onRefreshData={refreshData} onToast={addToast} />
              ) : user.role === 'artist' ? (
                <ArtistDashboard user={user} onUpdateUser={handleUpdateUser} onRefreshData={refreshData} onToast={addToast} />
              ) : (
                <CustomerDashboard user={user} onUpdateUser={handleUpdateUser} onToast={addToast} />
              )}
            </motion.div>
          )}

          {/* CHECKOUT */}
          {view === 'checkout' && selectedItem && (
            <motion.div key="checkout" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto px-6 py-24">
              <div className="bg-white p-10 rounded-lg border border-[#E0E0E0] shadow-2xl">
                <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
                  <div className="w-12 h-12 bg-[#D4145A] text-white rounded flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight font-serif">Finalize Transaction</h2>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Amira Arts Secure Checkout</p>
                  </div>
                </div>
                <div className="mb-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Item</span>
                      <p className="font-bold text-lg">{selectedItem.title}</p>
                    </div>
                    <span className="text-2xl font-bold tracking-tighter">{'\u00A3'}{selectedItem.price}</span>
                  </div>
                </div>
                <div className="space-y-6">
                  <input type="text" placeholder="Cardholder Name" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 focus:bg-white transition-all outline-none focus:border-[#D4145A]" />
                  <input type="text" placeholder="Card Number" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 focus:bg-white transition-all outline-none focus:border-[#D4145A]" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/YY" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 outline-none focus:border-[#D4145A]" />
                    <input type="text" placeholder="CVC" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 outline-none focus:border-[#D4145A]" />
                  </div>
                  <button onClick={handlePaymentSubmit} className="w-full py-5 bg-[#1A1A1A] text-white text-[12px] uppercase font-bold tracking-widest rounded mt-4 shadow-2xl hover:bg-[#D4145A] transition-all">
                    Confirm Acquisition
                  </button>
                  <button onClick={() => navigateTo(previousView)} className="w-full text-[10px] uppercase tracking-widest text-gray-400 font-bold py-2 hover:text-[#1A1A1A] transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUBSCRIPTION CHECKOUT */}
          {view === 'subscriptionCheckout' && selectedPlan && (
            <motion.div key="sub-checkout" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto px-6 py-24">
              <div className="bg-white p-10 rounded-lg border border-[#E0E0E0] shadow-2xl">
                <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
                  <div className="w-12 h-12 bg-[#D4145A] text-white rounded flex items-center justify-center">
                    <Star size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight font-serif">Subscribe to {selectedPlan.name}</h2>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Membership Enrollment</p>
                  </div>
                </div>
                <div className="mb-10 p-6 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-lg">{selectedPlan.name} Plan</span>
                    <span className="text-2xl font-bold text-[#D4145A]">{'\u00A3'}{selectedPlan.price}/mo</span>
                  </div>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={14} className="text-[#D4145A]" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <input type="text" placeholder="Cardholder Name" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 focus:bg-white transition-all outline-none focus:border-[#D4145A]" />
                  <input type="text" placeholder="Card Number" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 focus:bg-white transition-all outline-none focus:border-[#D4145A]" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/YY" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 outline-none focus:border-[#D4145A]" />
                    <input type="text" placeholder="CVC" className="w-full p-4 border border-[#E0E0E0] rounded bg-gray-50 outline-none focus:border-[#D4145A]" />
                  </div>
                  <button onClick={handleSubscriptionSubmit} className="w-full py-5 bg-[#D4145A] text-white text-[12px] uppercase font-bold tracking-widest rounded mt-4 shadow-2xl hover:bg-[#1A1A1A] transition-all">
                    Activate Membership
                  </button>
                  <button onClick={() => navigateTo('home')} className="w-full text-[10px] uppercase tracking-widest text-gray-400 font-bold py-2 hover:text-[#1A1A1A] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 text-center md:text-left">
          <div className="col-span-1 md:col-span-2">
            <div className="flex justify-center md:justify-start">{LOGO}</div>
            <p className="mt-8 text-gray-400 max-w-sm leading-relaxed">
              Preserving the classical mastery while fostering the future of Shoreditch art scene. A sanctuary for artistic preservation.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-[0.3em] text-[10px] text-[#D4145A]">Directory</h4>
            <ul className="space-y-4 text-[12px] font-bold uppercase tracking-widest text-gray-500">
              <li><button onClick={() => navigateTo('workshops')} className="hover:text-[#D4145A] transition-colors">Workshops</button></li>
              <li><button onClick={() => navigateTo('shop')} className="hover:text-[#D4145A] transition-colors">Collection</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-8 uppercase tracking-[0.3em] text-[10px] text-[#D4145A]">Connect</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              14 Artisan Square, Shoreditch<br />London EC2A 3PR
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Sub-components ─── */

const ExpandableSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-100 py-4">
    <button onClick={onToggle} className="flex items-center justify-between w-full text-left group">
      <div className="flex items-center gap-3">
        <span className="text-[#D4145A]">{icon}</span>
        <span className="text-sm font-bold uppercase tracking-widest text-gray-700 group-hover:text-[#D4145A] transition-colors">{title}</span>
      </div>
      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-4 pb-2">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const WorkshopCard: React.FC<{
  workshop: Workshop;
  currentUserId?: string;
  onBook: () => void;
  onDetail: () => void;
}> = ({ workshop, currentUserId, onBook, onDetail }) => {
  const isOwner = currentUserId === workshop.artistId;
  return (
    <motion.div whileHover={{ y: -8 }} className="group bg-white border border-[#E0E0E0] rounded overflow-hidden hover:shadow-2xl transition-all duration-500">
      <div className="h-72 relative overflow-hidden cursor-pointer" onClick={onDetail}>
        <img src={workshop.image} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" alt={workshop.title} />
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-[#D4145A] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-sm">
            {workshop.category}
          </span>
          {workshop.isBoosted && (
            <span className="p-1.5 bg-[#D4145A] text-white rounded-full w-fit shadow-lg">
              <Zap size={10} />
            </span>
          )}
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-bold leading-tight tracking-tight mb-2 cursor-pointer hover:text-[#D4145A] transition-colors font-serif" onClick={onDetail}>
          {workshop.title}
        </h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium line-clamp-2">{workshop.description}</p>
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="text-xl font-bold tracking-tighter text-[#D4145A]">{'\u00A3'}{workshop.price}</div>
          {isOwner ? (
            <span className="px-4 py-2.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded">Your Listing</span>
          ) : (
            <button
              onClick={onBook}
              disabled={workshop.booked >= workshop.capacity}
              className={`px-6 py-2.5 rounded text-[11px] uppercase tracking-widest font-bold transition-all ${
                workshop.booked >= workshop.capacity ? 'bg-gray-100 text-gray-400' : 'bg-[#1A1A1A] text-white hover:bg-[#D4145A]'
              }`}
            >
              {workshop.booked >= workshop.capacity ? 'Full' : 'Reserve'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProductCard: React.FC<{
  product: Product;
  currentUserId?: string;
  onBuy: () => void;
  onDetail: () => void;
}> = ({ product, currentUserId, onBuy, onDetail }) => {
  const isOwner = currentUserId === product.artistId;
  return (
    <motion.div whileHover={{ y: -5 }} className="group bg-white border border-[#E0E0E0] rounded overflow-hidden hover:shadow-xl transition-all duration-500">
      <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 cursor-pointer" onClick={onDetail}>
        <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={product.title} />
        {product.isBoosted && (
          <div className="absolute top-4 left-4 p-1.5 bg-[#D4145A] text-white rounded-full shadow-lg">
            <Zap size={10} />
          </div>
        )}
        {product.status === 'sold' && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-6 py-2 bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-[0.3em] rounded-sm -rotate-12">
              Acquired
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h4 className="text-lg font-bold tracking-tight line-clamp-1 mb-1 cursor-pointer hover:text-[#D4145A]" onClick={onDetail}>
          {product.title}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{product.category}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold tracking-tighter text-[#D4145A]">{'\u00A3'}{product.price}</span>
          {isOwner ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Your Listing</span>
          ) : (
            <button
              onClick={onBuy}
              disabled={product.status === 'sold'}
              className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                product.status === 'sold' ? 'text-gray-300' : 'text-[#1A1A1A] hover:text-[#D4145A]'
              }`}
            >
              Purchase
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default App;
