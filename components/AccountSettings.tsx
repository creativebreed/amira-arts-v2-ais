"use client";

import React, { useState } from 'react';
import { User, UserSettings } from '@/lib/types';
import { db } from '@/lib/db';
import ToggleSwitch from '@/components/ToggleSwitch';
import { Lock, Bell, Mail, Shield, Eye, EyeOff } from 'lucide-react';

interface AccountSettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onToast: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const defaultSettings: UserSettings = {
  notifications: true,
  workshopReminders: true,
  newArtworkAlerts: false,
  marketingOptIn: false,
  promoOffers: false,
  personalizedRecs: true,
  theme: 'light',
};

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpdateUser, onToast }) => {
  const settings = { ...defaultSettings, ...user.settings };
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: '', color: 'bg-gray-200', width: 'w-0' };
    if (pw.length < 6) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [pw.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/4' };
    if (score === 3) return { label: 'Strong', color: 'bg-emerald-400', width: 'w-3/4' };
    return { label: 'Very Strong', color: 'bg-emerald-600', width: 'w-full' };
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPassword !== user.password) {
      onToast('Current password is incorrect.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      onToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onToast('Passwords do not match.', 'error');
      return;
    }
    const updatedUser = { ...user, password: newPassword };
    onUpdateUser(updatedUser);
    db.log(user.id, 'CHANGE_PASSWORD', 'User changed their password');
    onToast('Password updated successfully.', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleToggle = (key: keyof UserSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    const updatedUser = { ...user, settings: newSettings };
    onUpdateUser(updatedUser);
    db.log(user.id, 'UPDATE_SETTINGS', `Updated ${key} to ${value}`);
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-10">
      {/* Profile Info */}
      <section className="bg-white border border-[#E0E0E0] rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <Shield size={18} className="text-[#D4145A]" />
          <h3 className="text-lg font-bold tracking-tight">Account Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Email Address</label>
            <div className="p-4 bg-gray-50 border border-[#E0E0E0] rounded-lg text-sm text-gray-600">{user.email}</div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Role</label>
            <div className="p-4 bg-gray-50 border border-[#E0E0E0] rounded-lg">
              <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded ${
                user.role === 'admin' ? 'bg-[#1A1A1A] text-white' : user.role === 'artist' ? 'bg-[#D4145A] text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-white border border-[#E0E0E0] rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <Lock size={18} className="text-[#D4145A]" />
          <h3 className="text-lg font-bold tracking-tight">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full p-4 pr-12 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] focus:bg-white transition-all"
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full p-4 pr-12 bg-gray-50 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#D4145A] focus:bg-white transition-all"
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 text-gray-400">
                  Strength: <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full p-4 bg-gray-50 border rounded-lg outline-none focus:bg-white transition-all ${
                confirmPassword && confirmPassword !== newPassword ? 'border-red-300 focus:border-red-400' : 'border-[#E0E0E0] focus:border-[#D4145A]'
              }`}
              placeholder="Re-enter new password"
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
            )}
          </div>
          <button
            type="submit"
            className="px-8 py-3.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4145A] transition-all"
          >
            Update Password
          </button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="bg-white border border-[#E0E0E0] rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <Bell size={18} className="text-[#D4145A]" />
          <h3 className="text-lg font-bold tracking-tight">Notification Preferences</h3>
        </div>
        <div className="divide-y divide-gray-50 max-w-lg">
          <ToggleSwitch
            enabled={settings.notifications}
            onToggle={(v) => handleToggle('notifications', v)}
            label="Booking confirmations"
            description="Receive email notifications for new bookings and purchases."
          />
          <ToggleSwitch
            enabled={settings.workshopReminders}
            onToggle={(v) => handleToggle('workshopReminders', v)}
            label="Workshop reminders"
            description="Get a reminder 24 hours before your scheduled workshops."
          />
          <ToggleSwitch
            enabled={settings.newArtworkAlerts}
            onToggle={(v) => handleToggle('newArtworkAlerts', v)}
            label="New artwork alerts"
            description="Be notified when artists you follow add new works."
          />
        </div>
      </section>

      {/* Marketing Preferences */}
      <section className="bg-white border border-[#E0E0E0] rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <Mail size={18} className="text-[#D4145A]" />
          <h3 className="text-lg font-bold tracking-tight">Marketing Preferences</h3>
        </div>
        <div className="divide-y divide-gray-50 max-w-lg">
          <ToggleSwitch
            enabled={settings.marketingOptIn}
            onToggle={(v) => handleToggle('marketingOptIn', v)}
            label="Amira Arts newsletter"
            description="Monthly digest of gallery events, artist spotlights, and exhibitions."
          />
          <ToggleSwitch
            enabled={settings.promoOffers}
            onToggle={(v) => handleToggle('promoOffers', v)}
            label="Promotional offers"
            description="Early bird discounts, flash sales, and exclusive member deals."
          />
          <ToggleSwitch
            enabled={settings.personalizedRecs}
            onToggle={(v) => handleToggle('personalizedRecs', v)}
            label="Personalised recommendations"
            description="Allow us to curate workshop and artwork suggestions for you."
          />
        </div>
        {!settings.marketingOptIn && !settings.promoOffers && (
          <p className="text-xs text-amber-600 mt-4 font-medium bg-amber-50 p-3 rounded-lg">
            You have opted out of all marketing communications. You may miss out on exclusive offers and events.
          </p>
        )}
      </section>
    </div>
  );
};

export default AccountSettings;
