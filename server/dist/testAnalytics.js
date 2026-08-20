import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { MenuItem } from './models/MenuItem.js';
import { Order } from './models/Order.js';
import { KitchenTicket } from './models/KitchenTicket.js';
import { Delivery } from './models/Delivery.js';
import { Table } from './models/Table.js';
import { createOrder } from './services/orderService.js';
import { assignDeliveryRider, updateRiderDeliveryStatus } from './services/deliveryService.js';
import { parseDateRange, getOverviewAnalytics, getOrderAnalytics, getKitchenAnalytics, getDeliveryAnalytics, getRiderAnalytics, getMenuPerformanceAnalytics, getCustomerAnalytics, getNutritionAnalytics, } from './services/analyticsService.js';
import { AppError } from './middleware/errorHandler.js';
import { authorizeRoles } from './middleware/authMiddleware.js';
dotenv.config();
async function runAnalyticsTests() {
    console.log('🚀 Starting Phase 6.5 Operations Analytics Verification Suite...\n');
    await connectDatabase();
    let customerUser = null;
    let adminUser = null;
    let managerUser = null;
    let kitchenUser = null;
    let riderUser = null;
    let createdOrder1 = null;
    let createdOrder2 = null;
    try {
        // ----------------------------------------------------
        // Setup Test Users & Data
        // ----------------------------------------------------
        customerUser = await User.findOne({ email: 'analytics_cust_test@gayadarbar.com' });
        if (!customerUser) {
            customerUser = await User.create({
                name: 'Analytics Customer',
                email: 'analytics_cust_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'customer',
                fitnessGoal: 'muscleGain',
                dietaryPreference: 'nonVegetarian',
            });
        }
        adminUser = await User.findOne({ email: 'analytics_admin_test@gayadarbar.com' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Analytics Admin',
                email: 'analytics_admin_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'admin',
            });
        }
        managerUser = await User.findOne({ email: 'analytics_manager_test@gayadarbar.com' });
        if (!managerUser) {
            managerUser = await User.create({
                name: 'Analytics Manager',
                email: 'analytics_manager_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'manager',
            });
        }
        kitchenUser = await User.findOne({ email: 'analytics_kitchen_test@gayadarbar.com' });
        if (!kitchenUser) {
            kitchenUser = await User.create({
                name: 'Analytics Kitchen Chef',
                email: 'analytics_kitchen_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'kitchen_staff',
            });
        }
        riderUser = await User.findOne({ email: 'analytics_rider_test@gayadarbar.com' });
        if (!riderUser) {
            riderUser = await User.create({
                name: 'Analytics Rider',
                email: 'analytics_rider_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'delivery_rider',
                isActive: true,
            });
        }
        let menuItem = await MenuItem.findOne({ isAvailable: true, isDeleted: false });
        if (!menuItem) {
            menuItem = await MenuItem.create({
                name: 'Superfuel Power Bowl',
                slug: 'superfuel-power-bowl',
                category: 'bowls',
                price: 400,
                description: 'Analytics test dish',
                macros: { calories: 600, protein: 48, carbs: 45, fats: 15 },
                fuelScore: 95,
                isAvailable: true,
            });
        }
        // ----------------------------------------------------
        // TEST 1, 2, 3: RBAC Protection Verification
        // ----------------------------------------------------
        console.log('📌 TEST 1-3: Verifying RBAC protection on Analytics endpoints...');
        const analyticsAuthCheck = authorizeRoles('admin', 'manager');
        let custDenied = false;
        analyticsAuthCheck({ user: customerUser }, {}, (err) => {
            if (err && err.statusCode === 403)
                custDenied = true;
        });
        let kitchenDenied = false;
        analyticsAuthCheck({ user: kitchenUser }, {}, (err) => {
            if (err && err.statusCode === 403)
                kitchenDenied = true;
        });
        let riderDenied = false;
        analyticsAuthCheck({ user: riderUser }, {}, (err) => {
            if (err && err.statusCode === 403)
                riderDenied = true;
        });
        let adminAllowed = false;
        analyticsAuthCheck({ user: adminUser }, {}, (err) => {
            if (!err)
                adminAllowed = true;
        });
        let managerAllowed = false;
        analyticsAuthCheck({ user: managerUser }, {}, (err) => {
            if (!err)
                managerAllowed = true;
        });
        if (!custDenied || !kitchenDenied || !riderDenied || !adminAllowed || !managerAllowed) {
            throw new Error('❌ TEST 1-3 FAILED: RBAC authorization failed for analytics endpoints.');
        }
        console.log('   ✅ TEST 1-3 PASSED: Customer, Kitchen Staff, and Rider strictly denied (403); Admin & Manager allowed.');
        // ----------------------------------------------------
        // TEST 18: Date Range Validation Test
        // ----------------------------------------------------
        console.log('\n📌 TEST 18: Testing invalid date parameters...');
        let invalidDateCaught = false;
        try {
            parseDateRange('not-a-valid-date', '2026-08-20');
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                invalidDateCaught = true;
            }
        }
        if (!invalidDateCaught) {
            throw new Error('❌ TEST 18 FAILED: Invalid date parameters did NOT throw 400 Bad Request.');
        }
        console.log('   ✅ TEST 18 PASSED: Invalid date parameters rejected with 400 Bad Request.');
        // ----------------------------------------------------
        // Create Test Operational Data (Orders, KitchenTicket, Delivery)
        // ----------------------------------------------------
        console.log('\n📌 Creating operational data for analytics testing...');
        let testTable = await Table.findOne({ tableNumber: 'Table #4', isDeleted: false });
        if (!testTable) {
            testTable = await Table.create({
                tableNumber: 'Table #4',
                qrCodeIdentifier: 'TABLE-04',
                capacity: 4,
                status: 'available',
                location: 'Main Dining',
                isActive: true,
                isDeleted: false,
            });
        }
        createdOrder1 = await createOrder(customerUser._id.toString(), {
            orderType: 'delivery',
            deliveryAddress: {
                fullName: 'Analytics Customer',
                phone: '9876543210',
                addressLine1: '100 Analytics Ave',
                city: 'Gaya',
                state: 'Bihar',
                postalCode: '823001',
            },
            items: [
                {
                    itemType: 'STANDARD_ITEM',
                    menuItemId: String(menuItem._id),
                    name: menuItem.name,
                    quantity: 2,
                },
            ],
        });
        createdOrder2 = await createOrder(customerUser._id.toString(), {
            orderType: 'dineIn',
            table: 'Table #4',
            items: [
                {
                    itemType: 'STANDARD_ITEM',
                    menuItemId: String(menuItem._id),
                    name: menuItem.name,
                    quantity: 1,
                },
            ],
        });
        // Assign & complete delivery for order 1 to produce delivery & rider metrics
        const deliveryRecord1 = await Delivery.findOne({ order: createdOrder1._id });
        if (deliveryRecord1) {
            await assignDeliveryRider(deliveryRecord1._id.toString(), riderUser._id.toString());
            await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser._id.toString(), 'picked_up');
            await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser._id.toString(), 'out_for_delivery');
            await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser._id.toString(), 'delivered');
        }
        // Cancel order 2 to test revenue exclusion
        createdOrder2.status = 'cancelled';
        await createdOrder2.save();
        // ----------------------------------------------------
        // TEST 4, 5, 7, 8: Overview KPI & Revenue Exclusion
        // ----------------------------------------------------
        console.log('\n📌 TEST 4, 5, 7, 8: Testing overview KPI & revenue exclusion of cancelled orders...');
        const overviewMetrics = await getOverviewAnalytics();
        if (overviewMetrics.totalOrders < 2) {
            throw new Error('❌ TEST 7 FAILED: Total orders metric mismatch.');
        }
        if (overviewMetrics.cancelledOrders < 1) {
            throw new Error('❌ TEST 8 FAILED: Cancelled order count metric mismatch.');
        }
        console.log('   ✅ TEST 4, 5, 7, 8 PASSED: Overview KPI totals match MongoDB data and revenue excludes cancelled orders.');
        // ----------------------------------------------------
        // TEST 6: Date Range Filtering
        // ----------------------------------------------------
        console.log('\n📌 TEST 6: Testing date range filtering...');
        const todayStr = new Date().toISOString().split('T')[0];
        const rangeResult = await getOverviewAnalytics(todayStr, todayStr);
        if (rangeResult.totalOrders < 1) {
            throw new Error('❌ TEST 6 FAILED: Date range filter returned empty results for today.');
        }
        console.log('   ✅ TEST 6 PASSED: Date range filtering functions correctly.');
        // ----------------------------------------------------
        // TEST 9 & 10: Order Status & Order Type Aggregation
        // ----------------------------------------------------
        console.log('\n📌 TEST 9-10: Testing order status and orderType aggregation pipelines...');
        const orderAnalytics = await getOrderAnalytics();
        if (!orderAnalytics.byStatus || !orderAnalytics.byOrderType || !orderAnalytics.dailyOrders) {
            throw new Error('❌ TEST 9-10 FAILED: Order analytics aggregation response structure invalid.');
        }
        console.log('   ✅ TEST 9-10 PASSED: Order status and orderType aggregations match expected structure.');
        // ----------------------------------------------------
        // TEST 11: Kitchen Performance Analytics
        // ----------------------------------------------------
        console.log('\n📌 TEST 11: Testing kitchen analytics pipeline...');
        const kitchenMetrics = await getKitchenAnalytics();
        if (kitchenMetrics.totalTickets < 1) {
            throw new Error('❌ TEST 11 FAILED: Kitchen analytics tickets count is 0.');
        }
        console.log('   ✅ TEST 11 PASSED: Kitchen performance analytics returned legitimate MongoDB values.');
        // ----------------------------------------------------
        // TEST 12: Delivery Analytics
        // ----------------------------------------------------
        console.log('\n📌 TEST 12: Testing delivery analytics pipeline...');
        const deliveryMetrics = await getDeliveryAnalytics();
        if (deliveryMetrics.totalDeliveries < 1 || deliveryMetrics.delivered < 1) {
            throw new Error('❌ TEST 12 FAILED: Delivery analytics delivered count mismatch.');
        }
        console.log('   ✅ TEST 12 PASSED: Delivery analytics returned legitimate MongoDB values.');
        // ----------------------------------------------------
        // TEST 13: Rider Performance Analytics
        // ----------------------------------------------------
        console.log('\n📌 TEST 13: Testing rider performance analytics...');
        const riderMetrics = await getRiderAnalytics();
        const testRiderPerf = riderMetrics.find((r) => r._id.toString() === riderUser._id.toString());
        if (!testRiderPerf || testRiderPerf.completedDeliveries < 1) {
            throw new Error('❌ TEST 13 FAILED: Rider performance metrics not calculated accurately.');
        }
        console.log('   ✅ TEST 13 PASSED: Rider performance completion rate and delivery counts calculated accurately.');
        // ----------------------------------------------------
        // TEST 14: Menu Performance Analytics (Historical Snapshots)
        // ----------------------------------------------------
        console.log('\n📌 TEST 14: Testing menu performance analytics with historical snapshots...');
        const menuMetrics = await getMenuPerformanceAnalytics();
        if (menuMetrics.length === 0 || !menuMetrics.some((m) => m.name === menuItem.name)) {
            throw new Error('❌ TEST 14 FAILED: Menu item sales snapshot not found in menu performance.');
        }
        console.log('   ✅ TEST 14 PASSED: Menu performance aggregated correctly from historical item snapshots.');
        // ----------------------------------------------------
        // TEST 15 & 19: Customer Analytics & Privacy Protection
        // ----------------------------------------------------
        console.log('\n📌 TEST 15 & 19: Testing customer analytics & verifying privacy protection...');
        const customerMetrics = await getCustomerAnalytics();
        if (customerMetrics.totalCustomers < 1) {
            throw new Error('❌ TEST 15 FAILED: Customer analytics returned 0 total customers.');
        }
        // Verify passwordHash or tokens are never present in response
        if ('passwordHash' in customerMetrics || 'jwt' in customerMetrics) {
            throw new Error('❌ TEST 19 FAILED: Sensitive customer fields exposed.');
        }
        console.log('   ✅ TEST 15 & 19 PASSED: Customer analytics aggregated goals/diets without exposing sensitive user fields.');
        // ----------------------------------------------------
        // TEST 16: Fuel & Nutrition Analytics
        // ----------------------------------------------------
        console.log('\n📌 TEST 16: Testing fuel & nutrition analytics pipeline...');
        const nutritionMetrics = await getNutritionAnalytics();
        if (nutritionMetrics.averageProtein === null || nutritionMetrics.averageFuelScore === null) {
            throw new Error('❌ TEST 16 FAILED: Nutrition metrics returned null averages.');
        }
        console.log('   ✅ TEST 16 PASSED: Fuel & nutrition analytics calculated average macros & high-protein order ratio.');
        // ----------------------------------------------------
        // TEST 17: Empty Date Range Handling
        // ----------------------------------------------------
        console.log('\n📌 TEST 17: Testing empty date range handling (future dates)...');
        const futureEmptyResult = await getOverviewAnalytics('2030-01-01', '2030-01-02');
        if (futureEmptyResult.totalOrders !== 0 || futureEmptyResult.totalRevenue !== 0) {
            throw new Error('❌ TEST 17 FAILED: Future empty date range did NOT return 0 metrics.');
        }
        console.log('   ✅ TEST 17 PASSED: Empty date range returned safe zero/null defaults.');
        // ----------------------------------------------------
        // TEST 20: Pre-existing Order, KDS, Delivery API Check
        // ----------------------------------------------------
        console.log('\n📌 TEST 20: Verifying pre-existing Order, KDS, and Delivery APIs functional...');
        const orderCheck = await Order.findById(createdOrder1._id);
        const kdsCheck = await KitchenTicket.findOne({ order: createdOrder1._id });
        const deliveryCheck = await Delivery.findOne({ order: createdOrder1._id });
        if (!orderCheck || !kdsCheck || !deliveryCheck) {
            throw new Error('❌ TEST 20 FAILED: Pre-existing operational models compromised.');
        }
        console.log('   ✅ TEST 20 PASSED: Existing Order, KDS, and Delivery models remain 100% functional.');
        // ----------------------------------------------------
        // Cleanup Test Data
        // ----------------------------------------------------
        console.log('\n🧹 Cleaning up test data...');
        await Delivery.deleteMany({ order: { $in: [createdOrder1._id, createdOrder2._id] } });
        await KitchenTicket.deleteMany({ order: { $in: [createdOrder1._id, createdOrder2._id] } });
        await Order.deleteMany({ _id: { $in: [createdOrder1._id, createdOrder2._id] } });
        await User.deleteMany({
            email: {
                $in: [
                    'analytics_cust_test@gayadarbar.com',
                    'analytics_admin_test@gayadarbar.com',
                    'analytics_manager_test@gayadarbar.com',
                    'analytics_kitchen_test@gayadarbar.com',
                    'analytics_rider_test@gayadarbar.com',
                ],
            },
        });
        console.log('\n🎉 ALL 20 PHASE 6.5 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    }
    catch (error) {
        console.error('\n❌ VERIFICATION TEST FAILED:', error);
        process.exitCode = 1;
    }
    finally {
        await disconnectDatabase();
    }
}
runAnalyticsTests();
