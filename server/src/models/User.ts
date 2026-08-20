import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'admin' | 'manager' | 'kitchen_staff' | 'delivery_rider';
export type FitnessGoal = 'muscleGain' | 'fatLoss' | 'performance' | 'eatClean';
export type DietaryPreference = 'vegetarian' | 'nonVegetarian' | 'vegan' | 'eggitarian';

export interface INutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fitnessGoal: FitnessGoal;
  dietaryPreference: DietaryPreference;
  nutritionTargets: INutritionTargets;
  favorites: mongoose.Types.ObjectId[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): ISafeUser;
}

export interface ISafeUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  fitnessGoal: FitnessGoal;
  dietaryPreference: DietaryPreference;
  nutritionTargets: INutritionTargets;
  favorites: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'manager', 'kitchen_staff', 'delivery_rider'],
      default: 'customer',
      index: true,
    },
    fitnessGoal: {
      type: String,
      enum: ['muscleGain', 'fatLoss', 'performance', 'eatClean'],
      default: 'muscleGain',
    },
    dietaryPreference: {
      type: String,
      enum: ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'],
      default: 'nonVegetarian',
    },
    nutritionTargets: {
      calories: { type: Number, default: 2400, min: 500, max: 10000 },
      protein: { type: Number, default: 160, min: 0, max: 500 },
      carbs: { type: Number, default: 250, min: 0, max: 1000 },
      fats: { type: Number, default: 70, min: 0, max: 300 },
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Secondary Indexes
UserSchema.index({ role: 1, isDeleted: 1 });
UserSchema.index({ createdAt: -1 });

// Instance Method: Password verification
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance Method: Safe object projection (strips sensitive fields)
UserSchema.methods.toSafeObject = function (): ISafeUser {
  const obj = this.toObject();
  return {
    id: obj._id.toString(),
    _id: obj._id.toString(),
    name: obj.name,
    email: obj.email,
    role: obj.role,
    fitnessGoal: obj.fitnessGoal,
    dietaryPreference: obj.dietaryPreference,
    nutritionTargets: obj.nutritionTargets || { calories: 2400, protein: 160, carbs: 250, fats: 70 },
    favorites: (obj.favorites || []).map((fav: any) => fav.toString()),
    isActive: obj.isActive,
    createdAt: obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: obj.updatedAt ? obj.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
