import { useCart } from '../context/CartContext';
import CartItemCard from '../components/cart/CartItemCard';
import CartSummaryPanel from '../components/cart/CartSummaryPanel';
import EmptyCart from '../components/cart/EmptyCart';

export default function Cart() {
  const {
    items,
    itemCount,
    subtotal,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--gd-ivory)] py-12 lg:py-16">
        <div className="gd-container">
          <header className="max-w-3xl">
            <p className="inline-block rounded-full bg-[var(--gd-sage)]/60 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
              YOUR FUEL BAG
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--gd-charcoal)] md:text-5xl">
              Review your <span className="text-[var(--gd-forest)]">performance fuel.</span>
            </h1>
          </header>
          <EmptyCart />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--gd-ivory)] py-12 lg:py-16">
      <div className="gd-container">
        {/* HEADER SECTION */}
        <header className="max-w-3xl">
          <p className="inline-block rounded-full bg-[var(--gd-sage)]/60 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            YOUR FUEL BAG
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--gd-charcoal)] md:text-5xl lg:text-6xl">
            Review your <span className="text-[var(--gd-forest)]">performance fuel.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[var(--gd-muted)]">
            Verify your macro targets, custom bowls, and quantity selections before proceeding to checkout.
          </p>
        </header>

        {/* CART WORKSPACE (2 COLUMNS ON DESKTOP) */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: CART ITEMS LIST (7 COLS) */}
          <section className="lg:col-span-7 xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-3">
              <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)]">
                Selected Meals ({itemCount})
              </h2>
            </div>

            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeItem}
              />
            ))}
          </section>

          {/* RIGHT: STICKY ORDER & NUTRITION SUMMARY (5 COLS) */}
          <aside className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-28 lg:h-fit">
            <CartSummaryPanel
              itemCount={itemCount}
              subtotal={subtotal}
              totalCalories={totalCalories}
              totalProtein={totalProtein}
              totalCarbs={totalCarbs}
              totalFats={totalFats}
              onClearCart={clearCart}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
