import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Bell, Shield, LogOut } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  return (
    <div className="p-6 max-w-[700px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Settings</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">Manage your account and platform preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-[#6F6F6F]" />
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Profile</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Name</label>
            <input className="input-field" defaultValue={user?.name || ''} placeholder="Your name" />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input-field" defaultValue={user?.email || ''} readOnly disabled />
          </div>
          <div>
            <label className="input-label">Role</label>
            <input className="input-field" value={user?.role?.replace('_', ' ') || '—'} readOnly disabled />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary btn-sm">Save changes</button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-4 h-4 text-[#6F6F6F]" />
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'notif', label: 'Live event notifications', desc: 'Browser notifications for blocked actions', state: notifications, set: setNotifications },
            { key: 'email', label: 'Email alerts', desc: 'Email alerts for critical security incidents', state: emailAlerts, set: setEmailAlerts },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <div>
                <div className="text-[13px] text-[#F5F5F5]">{s.label}</div>
                <div className="text-[11px] text-[#6F6F6F] mt-0.5">{s.desc}</div>
              </div>
              <button
                className={`w-10 h-6 rounded-full transition-all relative ${s.state ? 'bg-brand' : 'bg-[#2A2A2A]'}`}
                onClick={() => s.set(!s.state)}
                role="switch"
                aria-checked={s.state}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${s.state ? 'left-5' : 'left-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-4 h-4 text-[#6F6F6F]" />
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Security</h2>
        </div>
        <div>
          <label className="input-label">Current Password</label>
          <input className="input-field mb-3" type="password" placeholder="••••••••" />
          <label className="input-label">New Password</label>
          <input className="input-field mb-3" type="password" placeholder="••••••••" />
          <label className="input-label">Confirm Password</label>
          <input className="input-field mb-4" type="password" placeholder="••••••••" />
          <button className="btn-primary btn-sm">Update password</button>
        </div>
      </div>

      {/* Sign out */}
      <div className="card p-5 flex items-center justify-between" style={{ borderColor: 'rgba(224,106,98,0.15)' }}>
        <div>
          <div className="text-[13px] font-medium text-[#F5F5F5]">Sign out</div>
          <div className="text-[12px] text-[#6F6F6F] mt-0.5">End your current session</div>
        </div>
        <button onClick={logout} className="btn-danger btn-sm">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
};
