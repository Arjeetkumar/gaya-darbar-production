import { Link } from "react-router-dom";


export default function Footer() {
  return (
    <footer className="border-t border-[var(--gd-border)] bg-[var(--gd-charcoal)] text-white">

      <div className="gd-container grid gap-14 py-20 md:grid-cols-2 lg:grid-cols-4">

        <div className="lg:col-span-2">
          <p className="font-display text-4xl font-semibold">
            Gaya Darbar
          </p>

          <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-[#9FC5B0]">
            Iron & Fuel House
          </p>

          <p className="mt-7 max-w-md text-sm leading-7 text-white/55">
            Performance-focused food built for training, recovery and everyday
            nutrition.
          </p>
        </div>

        <div>
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
            Explore
          </p>

          <div className="flex flex-col gap-4 text-sm text-white/65">
            <Link className="transition-colors hover:text-white" to="/menu">
              Menu
            </Link>

            <Link
              className="transition-colors hover:text-white"
              to="/meal-builder"
            >
              Meal Builder
            </Link>

            <Link
              className="transition-colors hover:text-white"
              to="/profile"
            >
              Nutrition
            </Link>
          </div>
        </div>

        
      </div>

      <div className="border-t border-white/10">
        <div className="gd-container flex flex-col justify-between gap-3 py-6 text-[10px] font-medium uppercase tracking-[0.15em] text-white/30 sm:flex-row">
          <p>© {new Date().getFullYear()} Gaya Darbar</p>

          <div className="flex gap-5">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}