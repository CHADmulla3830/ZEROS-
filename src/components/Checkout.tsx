import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import { Product, Order } from '../types';
import { ProductService } from '../services/productService';

interface CheckoutProps {
  items: { product: Product; quantity: number }[];
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ items, userId, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'success'>('details');

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentNumber || !transactionId) return;

    setIsSubmitting(true);
    try {
      await ProductService.createOrder({
        userId,
        items: items.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity
        })),
        totalAmount: total,
        paymentMethod,
        paymentNumber,
        transactionId,
        status: 'pending'
      });
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
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 md:w-1/2 bg-gray-50 border-r border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product.name} x {item.quantity}</span>
                <span className="font-bold text-gray-900">৳{item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">৳{total}</span>
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Instructions
            </h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              1. Send Money to <b>017XX-XXXXXX</b> (Personal)<br />
              2. Use your Order ID as reference<br />
              3. Enter the Transaction ID below
            </p>
          </div>
        </div>

        <div className="p-8 md:w-1/2 relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>
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
                  <Smartphone className="w-4 h-4" />
                  bKash
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-orange-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
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

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-200"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Confirm Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
