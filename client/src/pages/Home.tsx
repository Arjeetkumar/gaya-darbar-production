import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Dumbbell,
  Flame,
  Leaf,
  Target,
} from "lucide-react";
import type { FitnessGoal } from "../types/menu";

const goals: { title: string; goalKey: FitnessGoal; description: string; icon: typeof Dumbbell }[] = [
  {
    title: "Build Muscle",
    goalKey: "muscleGain",
    description: "Protein-forward meals for strength and growth.",
    icon: Dumbbell,
  },
  {
    title: "Lose Fat",
    goalKey: "fatLoss",
    description: "Balanced meals designed around controlled calories.",
    icon: Flame,
  },
  {
    title: "Performance",
    goalKey: "performance",
    description: "Fuel your training with balanced nutrition.",
    icon: Target,
  },
  {
    title: "Eat Clean",
    goalKey: "eatClean",
    description: "Simple, nourishing meals for everyday wellness.",
    icon: Leaf,
  },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--gd-ivory)]">
        <div className="gd-container grid min-h-[calc(100vh-80px)] items-center gap-16 py-20 lg:grid-cols-[1fr_0.85fr] lg:py-24">

          {/* Copy */}
          <div className="max-w-2xl animate-gd-fade-up">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--gd-border)] bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gd-forest)]" />
              Iron & Fuel House
            </div>

            <h1 className="font-display text-[clamp(3.8rem,8vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.045em] text-[var(--gd-charcoal)]">
              Food for the
              <br />
              <span className="text-[var(--gd-forest)]">
                way you train.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-7 text-[var(--gd-muted)] md:text-lg">
              Performance-focused meals crafted around your goals, your
              workouts and the way you want to feel.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="group inline-flex items-center gap-3 rounded-full bg-[var(--gd-charcoal)] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--gd-forest)] hover:shadow-xl"
              >
                Explore Menu
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/meal-builder"
                className="inline-flex items-center gap-3 rounded-full border border-[var(--gd-border)] bg-white px-7 py-4 text-sm font-semibold text-[var(--gd-charcoal)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--gd-forest)] hover:shadow-md"
              >
                Build Your Meal
              </Link>
            </div>

            <div className="mt-14 flex items-center gap-7 border-t border-[var(--gd-border)] pt-7">
              <div>
                <p className="font-display text-2xl font-semibold">
                  30+
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--gd-muted)]">
                  Performance Meals
                </p>
              </div>

              <div className="h-9 w-px bg-[var(--gd-border)]" />

              <div>
                <p className="font-display text-2xl font-semibold">
                  High
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--gd-muted)]">
                  Protein Focus
                </p>
              </div>

              <div className="h-9 w-px bg-[var(--gd-border)]" />

              <div>
                <p className="font-display text-2xl font-semibold">
                  Fresh
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--gd-muted)]">
                  Made Daily
                </p>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden min-h-[620px] lg:block">

            <div className="absolute right-0 top-1/2 h-[520px] w-[420px] -translate-y-1/2 rounded-[220px_220px_40px_40px] bg-[var(--gd-sage)]" />

            <div className="absolute right-8 top-1/2 h-[500px] w-[400px] -translate-y-1/2 overflow-hidden rounded-[210px_210px_32px_32px] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85"
                alt="Fresh healthy performance meal"
                className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105"
              />
            </div>

            <div className="absolute bottom-12 left-0 max-w-[220px] rounded-3xl border border-white/70 bg-white/85 p-5 shadow-xl backdrop-blur-xl animate-gd-float">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
                Today's Fuel
              </p>

              <p className="mt-2 font-display text-xl font-semibold">
                Chicken Power Bowl
              </p>

              <div className="mt-4 flex gap-3 text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
                <span>48g Protein</span>
                <span>620 kcal</span>
              </div>
            </div>

            <div className="absolute right-0 top-16 rounded-full border border-white/70 bg-white/85 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gd-charcoal)] shadow-lg backdrop-blur-xl">
              Built for performance
            </div>
          </div>
        </div>

        <a
          href="#goals"
          className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-muted)] md:flex"
        >
          Discover
          <ChevronDown size={15} className="animate-bounce" />
        </a>
      </section>

      {/* GOALS */}
      <section
        id="goals"
        className="gd-section bg-white"
      >
        <div className="gd-container">

          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
              Eat with intention
            </p>

            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Your goal changes
              <br />
              <span className="text-[var(--gd-muted)]">
                what goes on your plate.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--gd-muted)]">
              Tell us what you're working towards and we'll help you discover
              meals that fit the way you train.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((goal, index) => {
              const Icon = goal.icon;

              return (
                <Link
                  key={goal.title}
                  to={`/menu?goal=${goal.goalKey}`}
                  className="group gd-shadow-hover animate-gd-fade-up rounded-[28px] border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-7 text-left block"
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gd-sage)] text-[var(--gd-forest)] transition-all duration-300 group-hover:bg-[var(--gd-forest)] group-hover:text-white">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>

                  <h3 className="mt-7 font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
                    {goal.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[var(--gd-muted)]">
                    {goal.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd-forest)] opacity-70 transition-all duration-300 group-hover:gap-3 group-hover:opacity-100">
                    Explore
                    <ArrowRight size={13} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}