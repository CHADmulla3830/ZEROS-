import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, CheckCircle2, Loader2, Tag, Ticket } from 'lucide-react';
import { Product, Order, PromoCode } from '../types';
import { ProductService } from '../services/productService';
import Markdown from 'react-markdown';

interface CheckoutProps {
  items: { product: Product; quantity: number; version?: string }[];
  userId: string;
  paymentInstructions?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ items, userId, paymentInstructions, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'success'>('details');
  
  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [formError, setFormError] = useState('');

  const subtotal = items.reduce((sum, item) => {
    let price = item.product.discountPrice && item.product.discountPrice < item.product.price 
      ? item.product.discountPrice 
      : item.product.price;
    
    if (item.version && item.product.versions) {
      const v = item.product.versions.find(v => v.name === item.version);
      if (v) price = v.price;
    }
    
    return sum + price * item.quantity;
  }, 0);

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percentage') {
      return (subtotal * appliedPromo.value) / 100;
    }
    return appliedPromo.value;
  };

  const discountAmount = calculateDiscount();
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const promo = await ProductService.validatePromoCode(promoInput.trim().toUpperCase(), userId);
      if (promo) {
        if (promo.minPurchase && subtotal < promo.minPurchase) {
          setPromoError(`Minimum purchase of ৳${promo.minPurchase} required`);
        } else {
          setAppliedPromo(promo);
          setPromoInput('');
        }
      } else {
        setPromoError('Invalid or expired promo code');
      }
    } catch (error) {
      setPromoError('Error validating promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!paymentNumber || !transactionId) {
      setFormError('Please fill in all payment details');
      return;
    }

    // Basic validation for Bangladesh phone numbers (11 digits starting with 01)
    if (!/^01[3-9]\d{8}$/.test(paymentNumber)) {
      setFormError('Please enter a valid 11-digit phone number');
      return;
    }

    if (transactionId.length < 8) {
      setFormError('Please enter a valid Transaction ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = await ProductService.createOrder({
        userId,
        items: items.map(i => {
          let price = i.product.discountPrice && i.product.discountPrice < i.product.price 
            ? i.product.discountPrice 
            : i.product.price;
          
          if (i.version && i.product.versions) {
            const v = i.product.versions.find(v => v.name === i.version);
            if (v) price = v.price;
          }

          return {
            productId: i.product.id,
            name: i.product.name,
            price,
            quantity: i.quantity,
            version: i.version
          };
        }),
        totalAmount: total,
        discountAmount: discountAmount || 0,
        promoCode: appliedPromo?.code || null,
        paymentMethod,
        paymentNumber,
        transactionId,
        status: 'pending'
      });

      if (appliedPromo) {
        await ProductService.trackPromoUsage(appliedPromo.id, userId);
      }

      setStep('success');
    } catch (error) {
      console.error("Order error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-[2rem] p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-8">
            Your order is being processed. You will receive a notification once the top-up is complete.
          </p>
          <button 
            onClick={onSuccess}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 md:w-5/12 bg-gray-50 border-r border-gray-100 overflow-y-auto max-h-[90vh]">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {items.map((item, idx) => {
              let price = item.product.discountPrice && item.product.discountPrice < item.product.price 
                ? item.product.discountPrice 
                : item.product.price;
              
              if (item.version && item.product.versions) {
                const v = item.product.versions.find(v => v.name === item.version);
                if (v) price = v.price;
              }

              return (
                <div key={`${item.product.id}-${item.version || idx}`} className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600 font-medium">
                      {item.product.name} {item.version ? `(${item.version})` : ''} x {item.quantity}
                    </span>
                    {item.product.discountPrice && item.product.discountPrice < item.product.price && !item.version && (
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Discount Applied</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-900">৳{price * item.quantity}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900">৳{subtotal}</span>
            </div>
            
            {appliedPromo && (
              <div className="flex justify-between text-sm text-emerald-600">
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Promo ({appliedPromo.code})</span>
                </div>
                <span className="font-bold">-৳{discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-indigo-600">৳{total}</span>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Promo Code</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="ENTER CODE"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>
              <button 
                type="button"
                onClick={handleApplyPromo}
                disabled={isValidatingPromo || !promoInput.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all disabled:opacity-50"
              >
                {isValidatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
            {promoError && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase">{promoError}</p>}
            {appliedPromo && (
              <div className="mt-2 flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Code {appliedPromo.code} Applied!</span>
                <button 
                  onClick={() => setAppliedPromo(null)}
                  className="text-[10px] font-bold text-emerald-700 hover:underline uppercase"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Instructions
            </h3>
            <div className="text-xs text-indigo-700 leading-relaxed whitespace-pre-wrap prose prose-sm prose-indigo max-w-none">
              {paymentInstructions ? (
                <Markdown>{paymentInstructions}</Markdown>
              ) : (
                <>
                  1. Send Money to <b>01700-000000</b> (Personal)<br />
                  2. Use your Phone Number as reference<br />
                  3. Enter the Transaction ID below
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 md:w-7/12 relative bg-white">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>
          
          <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Manual Payment Verification</p>
              <p className="text-[10px] text-amber-700 leading-tight">This is a manual payment process. ZEROS' will NEVER ask for your bKash/Nagad PIN or OTP. Only provide your Transaction ID after sending money.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Select Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-100 hover:border-pink-200'
                  }`}
                >
                  <img src="https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg" className="w-6 h-6 object-contain" alt="bKash" />
                  bKash
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-orange-200'
                  }`}
                >
                  <img src="https://www.logo.wine/a/logo/Nagad/Nagad-Vertical-Logo.wine.svg" className="w-6 h-6 object-contain" alt="Nagad" />
                  Nagad
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Your {paymentMethod} Number</label>
              <input 
                required
                type="text" 
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Transaction ID</label>
              <input 
                required
                type="text" 
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="TRX123456789"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
              />
            </div>

            {formError && (
              <p className="text-xs font-bold text-red-500 uppercase bg-red-50 p-3 rounded-xl border border-red-100">
                {formError}
              </p>
            )}

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-xl shadow-gray-200"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Confirm Payment (৳{total})
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
