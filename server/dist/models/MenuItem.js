import { Schema, model } from 'mongoose';
const MacroInfoSchema = new Schema({
    calories: { type: Number, required: true, min: [0, 'Calories cannot be negative'] },
    protein: { type: Number, required: true, min: [0, 'Protein cannot be negative'] },
    carbs: { type: Number, required: true, min: [0, 'Carbs cannot be negative'] },
    fats: { type: Number, required: true, min: [0, 'Fats cannot be negative'] },
}, { _id: false });
const MenuItemSchema = new Schema({
    name: { type: String, required: [true, 'Meal name is required'], trim: true },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        index: true,
        lowercase: true,
        trim: true,
    },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    image: { type: String, required: [true, 'Image URL is required'] },
    category: {
        type: String,
        required: true,
        enum: [
            'highProtein',
            'muscleGain',
            'fatLoss',
            'performance',
            'preWorkout',
            'postWorkout',
            'drinks',
            'desserts',
        ],
    },
    dietaryPreference: {
        type: String,
        required: true,
        enum: ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'],
    },
    fitnessGoals: {
        type: [String],
        required: true,
        validate: [(v) => v.length > 0, 'At least one fitness goal is required'],
    },
    macros: { type: MacroInfoSchema, required: true },
    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    fuelScore: {
        type: Number,
        required: true,
        min: [1, 'Fuel Score must be at least 1'],
        max: [100, 'Fuel Score cannot exceed 100'],
    },
    preparationTime: {
        type: Number,
        required: true,
        min: [0, 'Preparation time cannot be negative'],
    },
    isAvailable: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});
// Secondary Indexes
MenuItemSchema.index({ category: 1, isAvailable: 1 });
MenuItemSchema.index({ dietaryPreference: 1, isAvailable: 1 });
MenuItemSchema.index({ fitnessGoals: 1, isAvailable: 1 });
export const MenuItem = model('MenuItem', MenuItemSchema);
