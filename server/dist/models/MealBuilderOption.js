import { Schema, model } from 'mongoose';
const MealBuilderOptionSchema = new Schema({
    name: { type: String, required: [true, 'Option name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    category: {
        type: String,
        required: true,
        enum: ['base', 'protein', 'carb', 'vegetables', 'sauce', 'extras'],
    },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    calories: { type: Number, required: true, min: [0, 'Calories cannot be negative'] },
    protein: { type: Number, required: true, min: [0, 'Protein cannot be negative'] },
    carbs: { type: Number, required: true, min: [0, 'Carbs cannot be negative'] },
    fats: { type: Number, required: true, min: [0, 'Fats cannot be negative'] },
    dietaryPreference: {
        type: String,
        required: true,
        enum: ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'],
    },
    allergens: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});
// Indexes
MealBuilderOptionSchema.index({ category: 1, isAvailable: 1 });
MealBuilderOptionSchema.index({ dietaryPreference: 1, isAvailable: 1 });
export const MealBuilderOption = model('MealBuilderOption', MealBuilderOptionSchema);
