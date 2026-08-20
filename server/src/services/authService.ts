import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, IUser, ISafeUser, FitnessGoal, DietaryPreference } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  fitnessGoal?: FitnessGoal;
  dietaryPreference?: DietaryPreference;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: ISafeUser;
}

const VALID_GOALS: FitnessGoal[] = ['muscleGain', 'fatLoss', 'performance', 'eatClean'];
const VALID_DIETS: DietaryPreference[] = ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
}

export async function registerCustomer(input: RegisterInput): Promise<AuthResult> {
  const { name, email, password, fitnessGoal, dietaryPreference } = input;

  // Validation: Name
  if (!name || !name.trim()) {
    throw new AppError('Name is required for account registration.', 400);
  }

  // Validation: Email
  if (!email || !email.trim()) {
    throw new AppError('Email address is required.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  // Validation: Password strength
  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters in length.', 400);
  }

  // Validation: Fitness Goal
  if (fitnessGoal && !VALID_GOALS.includes(fitnessGoal)) {
    throw new AppError(
      `Invalid fitnessGoal parameter '${fitnessGoal}'. Valid options: ${VALID_GOALS.join(', ')}`,
      400
    );
  }

  // Validation: Dietary Preference
  if (dietaryPreference && !VALID_DIETS.includes(dietaryPreference)) {
    throw new AppError(
      `Invalid dietaryPreference parameter '${dietaryPreference}'. Valid options: ${VALID_DIETS.join(', ')}`,
      400
    );
  }

  // Check Duplicate Email
  const existingUser = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 400);
  }

  // Hash Password
  const passwordHash = await bcrypt.hash(password, 10);

  // Security Rule: Registration ALWAYS defaults to role 'customer'
  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
    fitnessGoal: fitnessGoal || 'muscleGain',
    dietaryPreference: dietaryPreference || 'nonVegetarian',
    nutritionTargets: { calories: 2400, protein: 160, carbs: 250, fats: 70 },
    favorites: [],
    isActive: true,
    isDeleted: false,
  });

  const token = generateToken(newUser);

  return {
    token,
    user: newUser.toSafeObject(),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  if (!email || !email.trim() || !password) {
    throw new AppError('Please provide both email address and password.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Query User including passwordHash
  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  }).select('+passwordHash');

  // Generic authentication error to prevent user enumeration security vulnerability
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(user);

  return {
    token,
    user: user.toSafeObject(),
  };
}
