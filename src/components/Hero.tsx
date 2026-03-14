import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, ShieldCheck, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -mr-48 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50 -ml-48 -mb-24"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Instant Delivery in Bangladesh
            </span>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 mb-8">
              ZEROS' <br />
              <span className="text-indigo-600">Gaming Marketplace</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10">
              The most trusted platform in Bangladesh for game top-ups, gift cards, and digital keys. 
              Pay securely with bKash and Nagad.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">100% Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">Instant Activation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
