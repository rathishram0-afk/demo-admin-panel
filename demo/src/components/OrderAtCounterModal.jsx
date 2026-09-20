import React, { useState } from 'react';
import { cafeOrderService } from '../services/cafeOrderService';
import { 
  ShoppingBag, 
  X, 
  CheckCircle2, 
  Plus, 
  Minus, 
  MessageSquare, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function OrderAtCounterModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const unitPrice = Number(product.numericPrice || product.price?.replace(/[^0-9]/g, '')) || 20;
  const totalAmount = unitPrice * quantity;

  const handleIncrement = () => setQuantity(prev => Math.min(20, prev + 1));
  const handleDecrement = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const order = await cafeOrderService.createOrder({
        product,
        quantity,
        customerName,
        mobile
      });

      setCompletedOrder(order);
      setIsSubmitting(false);

      // Auto trigger WhatsApp redirect
      const encodedMsg = cafeOrderService.generateWhatsAppMessage(order);
      const waUrl = `https://wa.me/919344176534?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Error submitting order:', err);
      setIsSubmitting(false);
    }
  };

  const handleCopyDetails = () => {
    if (!completedOrder) return;
    const rawText = `🎮 G-FORCE Gaming Hub - Order ID: ${completedOrder.id}\nProduct: ${completedOrder.productName} × ${completedOrder.quantity}\nTotal: ₹${completedOrder.total}\nCustomer: ${completedOrder.customerName}`;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setCompletedOrder(null);
    setQuantity(1);
    setCustomerName('');
    setMobile('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 font-sans text-gray-100">
      <div className="w-full max-w-md glass-panel bg-[#0C0A1D]/95 border border-purple-500/40 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(147,51,234,0.35)] space-y-5">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: ORDER AT COUNTER POPUP FORM */}
        {!completedOrder ? (
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-cyber text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" /> Order at Counter
              </h3>
              <p className="text-xs text-gray-400">Order refreshments directly for instant counter pickup</p>
            </div>

            {/* PRODUCT SUMMARY CARD */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/5 p-2 flex items-center justify-center shrink-0">
                <img src={product.image} alt={product.name} className="h-full object-contain" loading="lazy" decoding="async" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-cyber text-sm font-bold text-white">{product.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-cyber px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                    {product.badge || product.category || 'Café Item'}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{product.size}</span>
                </div>
                <div className="font-mono text-sm font-bold text-amber-300">Price: {product.price}</div>
              </div>
            </div>

            {/* FORM INPUTS */}
            <form onSubmit={handleConfirmOrder} className="space-y-3 text-left">
              
              {/* QUANTITY SELECTOR */}
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Quantity (Max 20)</label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#090C19] border border-white/10">
                  <span className="text-xs font-mono text-gray-400 pl-2">Select Items</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-base font-bold text-white w-6 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CUSTOMER NAME */}
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090C19] border border-white/10 focus:border-purple-500 text-xs text-white outline-none transition-all"
                />
              </div>

              {/* MOBILE NUMBER */}
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Mobile Number (Optional)</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090C19] border border-white/10 focus:border-purple-500 text-xs text-white outline-none transition-all"
                />
              </div>

              {/* TOTAL HIGHLIGHT BOX */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                <span className="text-xs font-cyber text-gray-300 uppercase">Total Amount</span>
                <span className="font-mono text-2xl font-black text-amber-300">₹ {totalAmount}</span>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-xs font-cyber font-bold text-white uppercase tracking-wider shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: SUCCESS POPUP MODAL MATCHING MOCKUP PANEL 3 */
          <div className="space-y-5 text-center py-2 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="font-cyber text-xl font-extrabold text-emerald-400 tracking-wider">
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-gray-400">Your order has been sent directly to the counter.</p>
            </div>

            {/* ORDER ID HIGHLIGHT BOX */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-cyber text-gray-400 uppercase tracking-widest block">Order ID</span>
              <span className="font-mono text-3xl font-black text-cyan-300 tracking-widest">{completedOrder.id}</span>
              <p className="text-[11px] text-gray-400 mt-1">Please collect your order from the counter.</p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleCopyDetails}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-cyber font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Order Details'}
                </button>

                <button
                  onClick={() => {
                    setCompletedOrder(null);
                    setQuantity(1);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-xs font-cyber font-bold text-purple-300 cursor-pointer"
                >
                  Order Another
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-cyber font-bold text-white uppercase tracking-wider shadow-[0_0_20px_rgba(147,51,234,0.4)] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
