import React from 'react';
import { ShoppingCart, User, LogIn, LogOut, Gamepad2, Sparkles, MessageSquare } from 'lucide-react';
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
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onHomeClick}
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ZEROS'
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={onHomeClick} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Shop</button>
            {isAdmin && (
              <button onClick={onAdminClick} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Admin</button>
            )}
            <button onClick={onProfileClick} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Profile</button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onCartClick}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div 
                  className="hidden sm:block text-right cursor-pointer"
                  onClick={onProfileClick}
                >
                  <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer"
                  onClick={onProfileClick}
                />
                <button 
                  onClick={() => AuthService.logout()}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => AuthService.signInWithGoogle()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
