import React from 'react';
import { ShoppingCart, User, LogIn, LogOut, ShieldCheck, Home, Gamepad2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { AuthService } from '../services/authService';

interface NavbarProps {
  user: UserProfile | null;
  cartCount: number;
  onCartClick: () => void;
  onHomeClick: () => void;
  onProfileClick: () => void;
  onAdminClick: () => void;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  cartCount, 
  onCartClick, 
  onHomeClick,
  onProfileClick,
  onAdminClick,
  isAdmin
}) => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <button onClick={onHomeClick} className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">
              ZEROS'
            </span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={onHomeClick} className="text-gray-600 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors">Shop</button>
            {isAdmin && (
              <button onClick={onAdminClick} className="text-gray-600 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors">Admin</button>
            )}
            <button onClick={onProfileClick} className="text-gray-600 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors">Profile</button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onCartClick}
              className="relative p-3 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-2xl transition-all group"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <button 
                  onClick={onProfileClick}
                  className="flex items-center gap-3 p-1.5 pr-4 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt={user.displayName}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                  />
                  <div className="hidden sm:block">
                    <p className="text-xs font-black text-gray-900 leading-tight">{user.displayName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                  </div>
                </button>
                <button 
                  onClick={() => AuthService.signOut()}
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => AuthService.signInWithGoogle()}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 hover:scale-105 transition-all shadow-lg shadow-gray-200"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
