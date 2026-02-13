
import { User, Workshop, Product, Booking, ActivityLog, SubscriptionPlan, CTASection } from '../types';

const STORAGE_KEYS = {
  USERS: 'amira_users',
  WORKSHOPS: 'amira_workshops',
  PRODUCTS: 'amira_products',
  BOOKINGS: 'amira_bookings',
  LOGS: 'amira_logs',
  SUBSCRIPTIONS: 'amira_subscriptions',
  CTAS: 'amira_ctas'
};

const SEED_USERS: User[] = [
  { id: '1', name: 'Zoya Amira', email: 'admin@amira.com', password: 'pass', role: 'admin', avatar: 'https://picsum.photos/seed/zoya/200' },
  { id: '2', name: 'Hassan Khalil', email: 'hassan@artist.com', password: 'pass', role: 'artist', bio: 'Specialist in abstract oil paintings.', avatar: 'https://picsum.photos/seed/hassan/200' },
  { id: '3', name: 'John Guest', email: 'guest@user.com', password: 'pass', role: 'customer' }
];

const SEED_WORKSHOPS: Workshop[] = [
  {
    id: 'w1',
    title: 'Beginner Abstract Painting',
    artistId: '2',
    artistName: 'Hassan Khalil',
    price: 45,
    date: '2024-06-15',
    time: '14:00',
    capacity: 12,
    booked: 4,
    category: 'Painting',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
    description: 'Learn the fundamentals of abstract composition using acrylics.',
    longDescription: 'This intensive session covers the theory of color tension, kinetic brushwork, and the philosophy of non-representational art. Participants will leave with a completed canvas.',
    isBoosted: true
  },
  {
    id: 'w2',
    title: 'Charcoal Portraiture Masterclass',
    artistId: '2',
    artistName: 'Hassan Khalil',
    price: 60,
    date: '2024-07-02',
    time: '10:00',
    capacity: 8,
    booked: 7,
    category: 'Drawing',
    image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&q=80&w=800',
    description: 'Deep dive into light and shadow through charcoal techniques.',
    longDescription: 'Portraiture requires a deep understanding of anatomical structure and lighting. We will focus on the "Chiaroscuro" technique used by old masters.'
  }
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Ethereal Whispers',
    artistId: '2',
    price: 1200,
    category: 'Oil on Canvas',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
    isBoosted: true
  },
  {
    id: 'p2',
    title: 'The Silent Watcher',
    artistId: '2',
    price: 850,
    category: 'Mixed Media',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800'
  }
];

const SEED_SUBSCRIPTIONS: SubscriptionPlan[] = [
  { id: 's1', name: 'Artisan', price: 15, features: ['2 Workshops/month', 'Community Forum', 'Digital Badge'], recommended: false },
  { id: 's2', name: 'Maestro', price: 45, features: ['Unlimited Workshops', 'Artist Mentorship', 'Early Access to Sales', 'Physical Art Kit'], recommended: true },
  { id: 's3', name: 'Curator', price: 120, features: ['Corporate Gifting', 'VIP Gallery Access', 'Private Studio Hire'], recommended: false }
];

const SEED_CTAS: CTASection[] = [
  { id: 'c1', title: 'Join our Winter Collective', subtitle: 'New residency opportunities for emerging artists.', buttonText: 'Apply Now', imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800', isActive: true }
];

export const db = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.setItem(STORAGE_KEYS.WORKSHOPS, JSON.stringify(SEED_WORKSHOPS));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(SEED_SUBSCRIPTIONS));
      localStorage.setItem(STORAGE_KEYS.CTAS, JSON.stringify(SEED_CTAS));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([{ id: 'l1', userId: '1', action: 'SYSTEM', details: 'Database Initialized', timestamp: new Date().toISOString() }]));
    }
  },

  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  getWorkshops: (): Workshop[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKSHOPS) || '[]'),
  getProducts: (): Product[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]'),
  getBookings: (): Booking[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]'),
  getLogs: (): ActivityLog[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]'),
  getSubscriptions: (): SubscriptionPlan[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS) || '[]'),
  getCTAs: (): CTASection[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CTAS) || '[]'),

  saveUsers: (data: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data)),
  saveWorkshops: (data: Workshop[]) => localStorage.setItem(STORAGE_KEYS.WORKSHOPS, JSON.stringify(data)),
  saveProducts: (data: Product[]) => localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data)),
  saveBookings: (data: Booking[]) => localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data)),
  saveSubscriptions: (data: SubscriptionPlan[]) => localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(data)),
  saveCTAs: (data: CTASection[]) => localStorage.setItem(STORAGE_KEYS.CTAS, JSON.stringify(data)),
  
  log: (userId: string, action: string, details: string) => {
    const logs = db.getLogs();
    const newLog: ActivityLog = { id: `log-${Date.now()}`, userId, action, details, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([newLog, ...logs].slice(0, 100)));
  }
};
