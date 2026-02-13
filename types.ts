
export type Role = 'admin' | 'artist' | 'customer';

export interface UserSettings {
  notifications: boolean;
  marketingOptIn: boolean;
  theme: 'light' | 'dark';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  bio?: string;
  avatar?: string;
  settings?: UserSettings;
}

export interface Workshop {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  price: number;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  image: string;
  description: string;
  longDescription?: string;
  category: 'Painting' | 'Drawing' | 'Sculpture' | 'Digital';
  isBoosted?: boolean;
}

export interface Product {
  id: string;
  title: string;
  artistId: string;
  price: number;
  image: string;
  category: string;
  status: 'available' | 'sold';
  isBoosted?: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  itemId: string;
  type: 'workshop' | 'product';
  amount: number;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export interface CTASection {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl: string;
  isActive: boolean;
}
