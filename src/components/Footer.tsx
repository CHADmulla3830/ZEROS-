import React from 'react';
import { Gamepad2, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">
                ZEROS'
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The most trusted platform in Bangladesh for game top-ups, gift cards, and digital keys. 
              Experience instant delivery and secure payments.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-8">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-8">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">Refund Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">Payment Methods</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">How to Buy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-8">Contact Info</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-900">support@zeros.com</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} ZEROS' Gaming Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">We Accept</span>
            <div className="flex items-center gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/BKash_Logo.svg/512px-BKash_Logo.svg.png" className="h-6 object-contain grayscale hover:grayscale-0 transition-all cursor-help" alt="bKash" title="bKash" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Nagad_Logo.svg/512px-Nagad_Logo.svg.png" className="h-6 object-contain grayscale hover:grayscale-0 transition-all cursor-help" alt="Nagad" title="Nagad" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
