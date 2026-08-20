import { User, Mail, Shield, Edit3, Award } from 'lucide-react';
import type { UserProfile } from '../../types/profile';
import DietaryBadge from '../menu/DietaryBadge';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditClick: () => void;
}

const goalLabels: Record<string, string> = {
  muscleGain: 'Build Muscle',
  fatLoss: 'Lose Fat',
  performance: 'Performance',
  eatClean: 'Eat Clean',
};

export default function ProfileHeader({ profile, onEditClick }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-[var(--gd-border)] bg-white p-6 sm:p-8 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--gd-charcoal)] text-white shadow-md">
          <User size={32} />
        </div>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-[var(--gd-charcoal)] sm:text-3xl">
              {profile.name}
            </h1>
            <DietaryBadge preference={profile.dietaryPreference} />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-[var(--gd-muted)]">
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-[var(--gd-forest)]" />
              <span>{profile.email}</span>
            </span>

            <span className="flex items-center gap-1.5 font-semibold text-[var(--gd-forest)]">
              <Award size={13} />
              <span>Target: {goalLabels[profile.fitnessGoal] || profile.fitnessGoal}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-[var(--gd-border)] md:border-t-0 md:pt-0">
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--gd-ivory)] px-4 py-2 text-xs">
          <Shield size={14} className="text-[var(--gd-forest)]" />
          <span className="font-semibold text-[var(--gd-charcoal)]">Profile 100% Configured</span>
        </div>

        <button
          type="button"
          onClick={onEditClick}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gd-charcoal)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest)] shadow-sm"
          aria-label="Edit Profile Settings"
        >
          <Edit3 size={14} />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
}
