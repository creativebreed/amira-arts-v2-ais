
import React, { useState } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { X, Lock, Mail } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fillCredentials = (e: string, p: string) => {
    setIsLogin(true);
    setEmail(e);
    setPassword(p);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = db.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } else {
      // Register logic
      const users = db.getUsers();
      if (users.find(u => u.email === email)) {
        setError('Email already exists.');
        return;
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: email.split('@')[0],
        email,
        password,
        role: 'customer'
      };
      db.saveUsers([...users, newUser]);
      onLogin(newUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[12px] shadow-2xl overflow-hidden relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>

        <div className="p-10 pt-12">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-2 tracking-tight">{isLogin ? 'Welcome Back' : 'Join Amira'}</h3>
            <p className="text-gray-500 text-sm">{isLogin ? 'Sign in to access your dashboard' : 'Create an account to start your artistic journey'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:border-[#1A1A1A] focus:bg-white transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-[#E0E0E0] rounded-[8px] outline-none focus:border-[#1A1A1A] focus:bg-white transition-all placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-[6px] font-medium text-center">{error}</div>}

            <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white font-bold rounded-[30px] hover:bg-black transition-all transform active:scale-[0.98] shadow-lg shadow-black/10">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {isLogin && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-4">Demo Credentials:</p>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => fillCredentials('guest@user.com', 'pass')}
                  className="py-2.5 bg-gray-50 text-gray-600 text-[12px] font-medium rounded-[6px] hover:bg-gray-100 transition-colors"
                >
                  Visitor
                </button>
                <button 
                  onClick={() => fillCredentials('hassan@artist.com', 'pass')}
                  className="py-2.5 bg-gray-50 text-gray-600 text-[12px] font-medium rounded-[6px] hover:bg-gray-100 transition-colors"
                >
                  Artist
                </button>
                <button 
                  onClick={() => fillCredentials('admin@amira.com', 'pass')}
                  className="py-2.5 bg-gray-50 text-gray-600 text-[12px] font-medium rounded-[6px] hover:bg-gray-100 transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-semibold text-gray-400 hover:text-[#1A1A1A] transition-colors underline decoration-gray-200 underline-offset-4 decoration-1">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
