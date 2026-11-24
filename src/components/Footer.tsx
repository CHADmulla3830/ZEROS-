import React from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Gamepad2, Mail, MapPin, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer border-t pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_.75fr_.75fr_1fr]">
          <div>
            <div className="brand-lockup mb-5 text-gray-900">
              <span className="brand-mark"><Gamepad2 className="h-5 w-5" /></span>
              <span>ZEROS<span className="brand-apostrophe">'</span></span>
            </div>
            <p className="max-w-sm text-sm leading-7 text-gray-500">
              Game top-ups, gift cards, and digital keys for players in Bangladesh. Clear instructions, local payment options, and human order review.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="footer-chip"><MapPin className="h-3.5 w-3.5" /> Bangladesh-first</span>
              <span className="footer-chip"><ShieldCheck className="h-3.5 w-3.5" /> PIN-free checkout</span>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Explore</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="footer-link">Shop all products</Link></li>
              <li><a href="#how-it-works" className="footer-link">How it works</a></li>
              <li><Link to="/page/faq" className="footer-link">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Policies</h4>
            <ul className="space-y-3">
              <li><Link to="/page/contact" className="footer-link">Contact us</Link></li>
              <li><Link to="/page/privacy" className="footer-link">Privacy policy</Link></li>
              <li><Link to="/page/terms" className="footer-link">Terms of service</Link></li>
              <li><Link to="/page/refund" className="footer-link">Refund policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Need a hand?</h4>
            <a href="mailto:support@zeros.com" className="footer-contact">
              <span className="footer-contact-icon"><Mail className="h-4 w-4" /></span>
              <span><small>Email support</small><strong>support@zeros.com</strong></span>
            </a>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p className="text-xs leading-5 text-emerald-900">Orders are manually reviewed. ZEROS' never asks for your bKash/Nagad PIN or OTP.</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom mt-14 flex flex-col gap-5 border-t pt-7 md:flex-row md:items-center md:justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gray-400">© {new Date().getFullYear()} ZEROS' Gaming Marketplace</p>
          <div className="flex items-center gap-3 text-xs font-extrabold text-gray-500"><span>Pay locally with</span><span className="payment-chip payment-chip-bkash">bKash</span><span className="payment-chip payment-chip-nagad">Nagad</span></div>
        </div>
      </div>
    </footer>
  );
};
