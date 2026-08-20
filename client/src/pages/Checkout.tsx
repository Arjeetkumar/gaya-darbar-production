import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import { createRazorpayPaymentOrder, verifyPaymentSignature } from '../services/paymentService';
import type { CreateOrderPayload, CreateOrderPayloadItem, IDeliveryAddressSnapshot, OrderType } from '../types/order';
import {
  Truck,
  UtensilsCrossed,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [table, setTable] = useState('Table #1');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address State
  const [address, setAddress] = useState<IDeliveryAddressSnapshot>({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Gaya',
    state: 'Bihar',
    postalCode: '823001',
    landmark: '',
  });

  const deliveryFee = orderType === 'delivery' ? 40 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const finalTotal = subtotal + deliveryFee + tax;

  const handleAddressChange = (field: keyof IDeliveryAddressSnapshot, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Your Fuel Bag is empty.');
      return;
    }

    if (orderType === 'delivery') {
      if (!address.fullName.trim() || !address.phone.trim() || !address.addressLine1.trim() || !address.city.trim()) {
        setError('Please complete all required delivery address fields.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payloadItems: CreateOrderPayloadItem[] = items.map((cartItem) => {
        if (cartItem.itemType === 'CUSTOM_MEAL') {
          return {
            itemType: 'CUSTOM_MEAL',
            name: cartItem.name,
            quantity: cartItem.quantity,
            customMealSelection: cartItem.customMealSelection,
          };
        }
        return {
          itemType: 'STANDARD_ITEM',
          menuItemId: cartItem.menuItemId || cartItem.id,
          name: cartItem.name,
          quantity: cartItem.quantity,
          portionChoice: cartItem.portionChoice,
          sauceChoice: cartItem.sauceChoice,
        };
      });

      const payload: CreateOrderPayload = {
        orderType,
        items: payloadItems,
        deliveryAddress: orderType === 'delivery' ? address : null,
        table: orderType === 'dineIn' ? table : null,
        customerNotes,
      };

      const newOrder = await createOrder(payload);
      clearCart();

      // Trigger Razorpay Payment Workflow
      try {
        const paymentOrder = await createRazorpayPaymentOrder(newOrder._id || newOrder.id);

        const loaded = await new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (loaded && (window as any).Razorpay) {
          const options = {
            key: paymentOrder.keyId,
            amount: paymentOrder.amount * 100,
            currency: paymentOrder.currency,
            name: 'Gaya Darbar — Iron & Fuel House',
            description: `Order ${paymentOrder.orderNumber}`,
            order_id: paymentOrder.providerOrderId,
            handler: async function (response: any) {
              try {
                await verifyPaymentSignature({
                  orderId: newOrder._id || newOrder.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  razorpay_order_id: response.razorpay_order_id,
                });
              } catch (vErr) {
                console.error('Signature verification error:', vErr);
              } finally {
                navigate(`/order/${newOrder.orderNumber}`);
              }
            },
            prefill: {
              name: user?.name || address.fullName || '',
              email: user?.email || '',
              contact: address.phone || '',
            },
            theme: {
              color: '#1a3c34',
            },
            modal: {
              ondismiss: function () {
                navigate(`/order/${newOrder.orderNumber}`);
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // Fallback if Razorpay SDK script fails to load
          navigate(`/order/${newOrder.orderNumber}`);
        }
      } catch (payErr: any) {
        console.error('Payment initialization warning:', payErr);
        navigate(`/order/${newOrder.orderNumber}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 bg-[var(--gd-ivory)]">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-[var(--gd-forest)] mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold text-[var(--gd-charcoal)]">
            Your Fuel Bag is Empty
          </h2>
          <p className="mt-2 text-sm text-[var(--gd-muted)]">
            Add standard meals or custom fuel bowls before continuing to checkout.
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--gd-forest)] px-6 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-[var(--gd-charcoal)] transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--gd-ivory)] py-12 lg:py-16">
      <div className="gd-container">
        <header className="max-w-3xl">
          <p className="inline-block rounded-full bg-[var(--gd-sage)]/60 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            CHECKOUT & DESTINATION
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--gd-charcoal)] md:text-5xl">
            Confirm your <span className="text-[var(--gd-forest)]">fuel delivery.</span>
          </h1>
        </header>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT FORM (7 COLS) */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
            {/* ORDER TYPE SELECTOR */}
            <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)] mb-4">
                1. Order Fulfillment Method
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center gap-3 rounded-2xl p-4 border text-left transition-all ${
                    orderType === 'delivery'
                      ? 'border-[var(--gd-forest)] bg-[var(--gd-sage)]/30 text-[var(--gd-forest)] ring-2 ring-[var(--gd-forest)]/20'
                      : 'border-[var(--gd-border)] bg-white text-[var(--gd-charcoal)] hover:bg-zinc-50'
                  }`}
                >
                  <Truck className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Home / Gym Delivery</p>
                    <p className="text-[10px] text-[var(--gd-muted)]">Delivered to your address (₹40)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('dineIn')}
                  className={`flex items-center gap-3 rounded-2xl p-4 border text-left transition-all ${
                    orderType === 'dineIn'
                      ? 'border-[var(--gd-forest)] bg-[var(--gd-sage)]/30 text-[var(--gd-forest)] ring-2 ring-[var(--gd-forest)]/20'
                      : 'border-[var(--gd-border)] bg-white text-[var(--gd-charcoal)] hover:bg-zinc-50'
                  }`}
                >
                  <UtensilsCrossed className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Dine-In Restaurant</p>
                    <p className="text-[10px] text-[var(--gd-muted)]">Eat at Gaya Darbar (Free)</p>
                  </div>
                </button>
              </div>
            </div>

            {/* DELIVERY ADDRESS OR DINE-IN TABLE */}
            {orderType === 'delivery' ? (
              <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)] mb-2">
                  2. Delivery Address Snapshot
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                      Recipient Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={address.fullName}
                        onChange={(e) => handleAddressChange('fullName', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-forest)]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                      Contact Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={address.phone}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-forest)]/30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                    Street Address & House / Flat No. *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Flat 402, Iron Heights, Station Road"
                      value={address.addressLine1}
                      onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-forest)]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)] mb-2">
                  2. Table Assignment
                </h2>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--gd-muted)] mb-1">
                    Select Table Number
                  </label>
                  <select
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)]"
                  >
                    <option value="Table #1">Table #1 (Main Dining)</option>
                    <option value="Table #2">Table #2 (Main Dining)</option>
                    <option value="Table #3">Table #3 (Courtyard)</option>
                    <option value="Table #4">Table #4 (VIP Zone)</option>
                  </select>
                </div>
              </div>
            )}

            {/* CUSTOMER NOTES */}
            <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)] mb-2">
                3. Special Kitchen Instructions
              </h2>
              <textarea
                rows={3}
                placeholder="Extra spicy, dressing on the side, cutlery requests..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-[var(--gd-border)] rounded-xl text-xs text-[var(--gd-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-forest)]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-sm font-bold uppercase tracking-wider text-white bg-[var(--gd-forest)] hover:bg-[var(--gd-charcoal)] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Calculating & Creating Order...</span>
                </>
              ) : (
                <>
                  <span>Place Fuel Order • ₹{finalTotal}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* RIGHT SUMMARY (5 COLS) */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-md space-y-4">
              <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)] border-b border-[var(--gd-border)] pb-3">
                Order Summary ({items.length} items)
              </h2>

              <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-[var(--gd-charcoal)]">{item.name}</p>
                      <p className="text-[10px] text-[var(--gd-muted)]">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">{item.nutrition.protein}g Protein | {item.nutrition.calories} kcal</p>
                    </div>
                    <span className="font-bold text-[var(--gd-charcoal)]">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--gd-border)] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[var(--gd-muted)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--gd-charcoal)]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[var(--gd-muted)]">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-[var(--gd-charcoal)]">{deliveryFee > 0 ? `₹${deliveryFee}` : 'Free'}</span>
                </div>
                <div className="flex justify-between text-[var(--gd-muted)]">
                  <span>GST Tax (5%)</span>
                  <span className="font-medium text-[var(--gd-charcoal)]">₹{tax}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--gd-border)] pt-3 font-display text-xl font-bold text-[var(--gd-charcoal)]">
                  <span>Total Payable</span>
                  <span className="text-[var(--gd-forest)]">₹{finalTotal}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--gd-muted)] pt-2 border-t border-[var(--gd-border)]">
                <ShieldCheck size={16} className="text-[var(--gd-forest)] shrink-0" />
                <span>Price & nutrition calculated & verified server-side.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
