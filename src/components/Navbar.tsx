import React from 'react';
import { ShoppingCart, LogIn, LogOut, Gamepad2, Menu, X } from 'lucide-react';
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

export const Navbar: React.FC<NavbarProps> = ({ user, cartCount, onCartClick, onHomeClick, onProfileClick, onAdminClick, isAdmin }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="site-nav">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={onHomeClick} className="brand-lockup" aria-label="Go to ZEROS' home">
          <span className="brand-mark"><Gamepad2 className="h-5 w-5" /></span>
          <span>ZEROS<span className="brand-apostrophe">'</span></span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          <button onClick={onHomeClick} className="nav-link nav-link-active">Shop</button>
          <a href="#how-it-works" className="nav-link">How it works</a>
          {isAdmin && <button onClick={onAdminClick} className="nav-link">Admin</button>}
          <button onClick={onProfileClick} className="nav-link">Profile</button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onCartClick} className="cart-button" aria-label={`Open cart${cartCount ? `, ${cartCount} items` : ''}`}>
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <button onClick={onProfileClick} className="avatar-button" title="Open profile">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName} />
              </button>
              <button onClick={() => AuthService.signOut()} className="icon-button" title="Sign out"><LogOut className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => AuthService.signInWithGoogle()} className="signin-button"><LogIn className="h-4 w-4" /><span>Sign in</span></button>
          )}
          <button onClick={() => setMenuOpen(v => !v)} className="icon-button md:hidden" aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="mobile-nav md:hidden">
          <button onClick={() => { onHomeClick(); closeMenu(); }} className="mobile-nav-link">Shop</button>
          <a href="#how-it-works" onClick={closeMenu} className="mobile-nav-link">How it works</a>
          <button onClick={() => { onProfileClick(); closeMenu(); }} className="mobile-nav-link">Profile</button>
          {isAdmin && <button onClick={() => { onAdminClick(); closeMenu(); }} className="mobile-nav-link">Admin</button>}
        </div>
      )}
    </nav>
  );
};
