import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { config } from '../config/env.js';
import { MenuItem } from '../models/MenuItem.js';
import { MealBuilderOption } from '../models/MealBuilderOption.js';
import { initialMenuItems } from './menuSeedData.js';
import { initialMealBuilderOptions } from './mealBuilderSeedData.js';
import { logger } from '../utils/logger.js';
async function runSeed() {
    logger.info('===================================================');
    logger.info(' Starting Gaya Darbar Development Database Seeding  ');
    logger.info('===================================================');
    // Production Safeguard
    if (config.isProduction && !process.argv.includes('--force-prod-seed')) {
        logger.error('CRITICAL SAFETY PRECAUTION: Seeding script aborted! Cannot run destructive database seed in PRODUCTION mode without --force-prod-seed flag.');
        process.exit(1);
    }
    const connected = await connectDatabase();
    if (!connected) {
        logger.error('Database connection failed. Aborting database seed.');
        process.exit(1);
    }
    try {
        // Clear targeted development collections
        logger.info('Clearing existing MenuItem documents...');
        await MenuItem.deleteMany({});
        logger.info('Clearing existing MealBuilderOption documents...');
        await MealBuilderOption.deleteMany({});
        // Seed Menu Items
        logger.info(`Inserting ${initialMenuItems.length} initial Menu Items...`);
        const insertedMenu = await MenuItem.insertMany(initialMenuItems);
        logger.info(`Successfully seeded ${insertedMenu.length} Menu Items.`);
        // Seed Meal Builder Options
        logger.info(`Inserting ${initialMealBuilderOptions.length} initial Meal Builder Options...`);
        const insertedOptions = await MealBuilderOption.insertMany(initialMealBuilderOptions);
        logger.info(`Successfully seeded ${insertedOptions.length} Meal Builder Options.`);
        logger.info('===================================================');
        logger.info(' Database Seeding Completed Successfully!           ');
        logger.info('===================================================');
    }
    catch (error) {
        logger.error('An error occurred during database seeding:', error);
        process.exitCode = 1;
    }
    finally {
        await disconnectDatabase();
    }
}
runSeed();
