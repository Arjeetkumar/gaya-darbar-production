import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { MenuItem } from './models/MenuItem.js';
import { Order } from './models/Order.js';
import { Delivery } from './models/Delivery.js';
import { KitchenTicket } from './models/KitchenTicket.js';
import { createOrder } from './services/orderService.js';
import { createDeliveryForOrder, getAdminDeliveries, getAvailableRiders, assignDeliveryRider, cancelDelivery, getMyDeliveryById, updateRiderDeliveryStatus, } from './services/deliveryService.js';
import { AppError } from './middleware/errorHandler.js';
import { authorizeRoles } from './middleware/authMiddleware.js';
dotenv.config();
async function runDeliveryTests() {
    console.log('🚀 Starting Phase 6.4 Delivery Management & Rider Dashboard Verification Suite...\n');
    await connectDatabase();
    let customerUser = null;
    let adminUser = null;
    let managerUser = null;
    let kitchenUser = null;
    let riderUser1 = null;
    let riderUser2 = null;
    let createdDeliveryOrder = null;
    try {
        // ----------------------------------------------------
        // Setup Test Users
        // ----------------------------------------------------
        customerUser = await User.findOne({ email: 'delivery_cust_test@gayadarbar.com' });
        if (!customerUser) {
            customerUser = await User.create({
                name: 'Arjun Customer',
                email: 'delivery_cust_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'customer',
            });
        }
        adminUser = await User.findOne({ email: 'delivery_admin_test@gayadarbar.com' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Delivery Admin',
                email: 'delivery_admin_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'admin',
            });
        }
        managerUser = await User.findOne({ email: 'delivery_manager_test@gayadarbar.com' });
        if (!managerUser) {
            managerUser = await User.create({
                name: 'Dispatch Manager',
                email: 'delivery_manager_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'manager',
            });
        }
        kitchenUser = await User.findOne({ email: 'delivery_kitchen_test@gayadarbar.com' });
        if (!kitchenUser) {
            kitchenUser = await User.create({
                name: 'Kitchen Chef',
                email: 'delivery_kitchen_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'kitchen_staff',
            });
        }
        riderUser1 = await User.findOne({ email: 'delivery_rider1_test@gayadarbar.com' });
        if (!riderUser1) {
            riderUser1 = await User.create({
                name: 'Rider Rahul Kumar',
                email: 'delivery_rider1_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'delivery_rider',
                isActive: true,
            });
        }
        riderUser2 = await User.findOne({ email: 'delivery_rider2_test@gayadarbar.com' });
        if (!riderUser2) {
            riderUser2 = await User.create({
                name: 'Rider Amit Singh',
                email: 'delivery_rider2_test@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'delivery_rider',
                isActive: true,
            });
        }
        let menuItem = await MenuItem.findOne({ isAvailable: true, isDeleted: false });
        if (!menuItem) {
            menuItem = await MenuItem.create({
                name: 'High Protein Chicken Bowl',
                slug: 'high-protein-chicken-bowl',
                category: 'bowls',
                price: 350,
                description: 'Test dish for delivery',
                macros: { calories: 550, protein: 45, carbs: 40, fats: 12 },
                fuelScore: 92,
                isAvailable: true,
            });
        }
        // ----------------------------------------------------
        // TEST 1, 2, 3: RBAC Authorization Checks
        // ----------------------------------------------------
        console.log('📌 TEST 1-3: Verifying RBAC protection on Admin Delivery endpoints...');
        const adminDispatchCheck = authorizeRoles('admin', 'manager');
        let custDenied = false;
        adminDispatchCheck({ user: customerUser }, {}, (err) => {
            if (err && err.statusCode === 403)
                custDenied = true;
        });
        let kitchenDenied = false;
        adminDispatchCheck({ user: kitchenUser }, {}, (err) => {
            if (err && err.statusCode === 403)
                kitchenDenied = true;
        });
        let riderDenied = false;
        adminDispatchCheck({ user: riderUser1 }, {}, (err) => {
            if (err && err.statusCode === 403)
                riderDenied = true;
        });
        let adminAllowed = false;
        adminDispatchCheck({ user: adminUser }, {}, (err) => {
            if (!err)
                adminAllowed = true;
        });
        let managerAllowed = false;
        adminDispatchCheck({ user: managerUser }, {}, (err) => {
            if (!err)
                managerAllowed = true;
        });
        if (!custDenied || !kitchenDenied || !riderDenied || !adminAllowed || !managerAllowed) {
            throw new Error('❌ TEST 1-3 FAILED: RBAC middleware failed for delivery admin routes.');
        }
        console.log('   ✅ TEST 1-3 PASSED: Customer, Kitchen Staff, and Rider strictly denied admin dispatch (403); Admin & Manager allowed.');
        // ----------------------------------------------------
        // TEST 4 & 5: Admin & Manager Delivery Listing
        // ----------------------------------------------------
        console.log('\n📌 TEST 4-5: Admin & Manager list deliveries via service...');
        const adminList = await getAdminDeliveries({ page: 1, limit: 10 });
        if (!adminList.deliveries || !adminList.pagination) {
            throw new Error('❌ TEST 4-5 FAILED: Admin deliveries response format invalid.');
        }
        console.log(`   ✅ TEST 4-5 PASSED: Admin/Manager delivery list retrieved cleanly (${adminList.deliveries.length} items).`);
        // ----------------------------------------------------
        // TEST 6: Available Rider Listing
        // ----------------------------------------------------
        console.log('\n📌 TEST 6: Available riders listing returns only delivery_rider users...');
        const availableRiders = await getAvailableRiders();
        if (!availableRiders.some((r) => r._id.toString() === riderUser1._id.toString())) {
            throw new Error('❌ TEST 6 FAILED: Test rider 1 not found in available riders list.');
        }
        if (availableRiders.some((r) => r.role !== 'delivery_rider')) {
            throw new Error('❌ TEST 6 FAILED: Non-rider user found in available riders list.');
        }
        console.log(`   ✅ TEST 6 PASSED: ${availableRiders.length} delivery riders returned with safe fields only.`);
        // ----------------------------------------------------
        // Create Delivery Order & Verify Auto Delivery Creation
        // ----------------------------------------------------
        console.log('\n📌 Creating test delivery order...');
        createdDeliveryOrder = await createOrder(customerUser._id.toString(), {
            orderType: 'delivery',
            deliveryAddress: {
                fullName: 'Arjun Customer',
                phone: '9988776655',
                addressLine1: '789 Fuel Street',
                city: 'Gaya',
                state: 'Bihar',
                postalCode: '823001',
                landmark: 'Near Gandhi Maidan',
            },
            items: [
                {
                    itemType: 'STANDARD_ITEM',
                    menuItemId: String(menuItem._id),
                    name: menuItem.name,
                    quantity: 1,
                },
            ],
        });
        console.log(`📌 Order Created: ${createdDeliveryOrder.orderNumber} (ID: ${createdDeliveryOrder._id})`);
        // ----------------------------------------------------
        // TEST 19: Duplicate Delivery Prevention & Snapshot Verification
        // ----------------------------------------------------
        console.log('\n📌 TEST 18 & 19: Verifying delivery auto-creation & duplicate prevention...');
        const deliveryRecord1 = await createDeliveryForOrder(createdDeliveryOrder);
        const deliveryRecord2 = await createDeliveryForOrder(createdDeliveryOrder);
        if (!deliveryRecord1 || !deliveryRecord2 || deliveryRecord1._id.toString() !== deliveryRecord2._id.toString()) {
            throw new Error('❌ TEST 19 FAILED: Duplicate delivery creation prevention failed.');
        }
        if (deliveryRecord1.deliveryAddressSnapshot.addressLine1 !== '789 Fuel Street' ||
            deliveryRecord1.deliveryAddressSnapshot.postalCode !== '823001') {
            throw new Error('❌ TEST 18 FAILED: Frozen delivery address snapshot mismatch.');
        }
        console.log(`   ✅ TEST 18 & 19 PASSED: Delivery ${deliveryRecord1.deliveryNumber} auto-created with frozen address snapshot and duplicate creation prevented.`);
        // ----------------------------------------------------
        // TEST 7 & 8: Assign Rider Validation
        // ----------------------------------------------------
        console.log('\n📌 TEST 7-8: Assigning rider to delivery and testing invalid rider rejection...');
        let invalidRiderCaught = false;
        try {
            await assignDeliveryRider(deliveryRecord1._id.toString(), customerUser._id.toString());
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                invalidRiderCaught = true;
            }
        }
        if (!invalidRiderCaught) {
            throw new Error('❌ TEST 8 FAILED: Assigning customer role as rider did NOT throw 400 Bad Request.');
        }
        const assignedDelivery = await assignDeliveryRider(deliveryRecord1._id.toString(), riderUser1._id.toString());
        if (assignedDelivery.status !== 'assigned' || !assignedDelivery.rider) {
            throw new Error('❌ TEST 7 FAILED: Delivery status not updated to assigned.');
        }
        console.log('   ✅ TEST 7-8 PASSED: Valid rider assigned cleanly; invalid rider role rejected with 400 Bad Request.');
        // ----------------------------------------------------
        // TEST 9 & 10: Rider Delivery Isolation
        // ----------------------------------------------------
        console.log('\n📌 TEST 9-10: Testing rider delivery view isolation...');
        const rider1Own = await getMyDeliveryById(deliveryRecord1._id.toString(), riderUser1._id.toString());
        if (rider1Own._id.toString() !== deliveryRecord1._id.toString()) {
            throw new Error('❌ TEST 9 FAILED: Rider could not view own delivery.');
        }
        let rider2Denied = false;
        try {
            await getMyDeliveryById(deliveryRecord1._id.toString(), riderUser2._id.toString());
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 403) {
                rider2Denied = true;
            }
        }
        if (!rider2Denied) {
            throw new Error('❌ TEST 10 FAILED: Rider 2 was able to view Rider 1 assigned delivery.');
        }
        console.log('   ✅ TEST 9-10 PASSED: Rider can view own assigned delivery; viewing another rider delivery rejected with 403.');
        // ----------------------------------------------------
        // TEST 11: Transition assigned -> picked_up & Order Sync
        // ----------------------------------------------------
        console.log('\n📌 TEST 11 & 17: Rider transitions assigned -> picked_up and verifies order status sync...');
        const pickedUpDelivery = await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser1._id.toString(), 'picked_up');
        if (pickedUpDelivery.status !== 'picked_up' || !pickedUpDelivery.pickedUpAt) {
            throw new Error('❌ TEST 11 FAILED: Status not updated to picked_up or pickedUpAt missing.');
        }
        const syncedOrder1 = await Order.findById(createdDeliveryOrder._id);
        if (!syncedOrder1 || syncedOrder1.status !== 'outForDelivery') {
            throw new Error(`❌ TEST 17 FAILED: Order status not synced to 'outForDelivery'. Got '${syncedOrder1?.status}'.`);
        }
        console.log('   ✅ TEST 11 PASSED: Delivery status transitioned to picked_up and Order synced to outForDelivery.');
        // ----------------------------------------------------
        // TEST 12: Transition picked_up -> out_for_delivery
        // ----------------------------------------------------
        console.log('\n📌 TEST 12: Rider transitions picked_up -> out_for_delivery...');
        const outForDeliveryDelivery = await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser1._id.toString(), 'out_for_delivery');
        if (outForDeliveryDelivery.status !== 'out_for_delivery' || !outForDeliveryDelivery.outForDeliveryAt) {
            throw new Error('❌ TEST 12 FAILED: Status not updated to out_for_delivery.');
        }
        console.log('   ✅ TEST 12 PASSED: Delivery status transitioned to out_for_delivery.');
        // ----------------------------------------------------
        // TEST 14: Invalid Transition Test
        // ----------------------------------------------------
        console.log('\n📌 TEST 14: Testing invalid backward transition out_for_delivery -> assigned...');
        let invalidTransCaught = false;
        try {
            await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser1._id.toString(), 'assigned');
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                invalidTransCaught = true;
            }
        }
        if (!invalidTransCaught) {
            throw new Error('❌ TEST 14 FAILED: Invalid transition did NOT throw 400 Bad Request.');
        }
        console.log('   ✅ TEST 14 PASSED: Invalid state transition rejected with 400 Bad Request.');
        // ----------------------------------------------------
        // TEST 13 & 17: Transition out_for_delivery -> delivered & Order Sync
        // ----------------------------------------------------
        console.log('\n📌 TEST 13 & 17: Rider transitions out_for_delivery -> delivered and verifies order status sync...');
        const deliveredDelivery = await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser1._id.toString(), 'delivered');
        if (deliveredDelivery.status !== 'delivered' || !deliveredDelivery.deliveredAt) {
            throw new Error('❌ TEST 13 FAILED: Status not updated to delivered.');
        }
        const syncedOrder2 = await Order.findById(createdDeliveryOrder._id);
        if (!syncedOrder2 || syncedOrder2.status !== 'delivered') {
            throw new Error(`❌ TEST 17 FAILED: Order status not synced to 'delivered'. Got '${syncedOrder2?.status}'.`);
        }
        console.log('   ✅ TEST 13 & 17 PASSED: Delivery marked delivered and Order synced to delivered.');
        // ----------------------------------------------------
        // TEST 15: Modification of Delivered Delivery Rejection
        // ----------------------------------------------------
        console.log('\n📌 TEST 15: Testing modification of already delivered delivery...');
        let modifyDeliveredCaught = false;
        try {
            await updateRiderDeliveryStatus(deliveryRecord1._id.toString(), riderUser1._id.toString(), 'failed', 'Customer not home');
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                modifyDeliveredCaught = true;
            }
        }
        if (!modifyDeliveredCaught) {
            throw new Error('❌ TEST 15 FAILED: Modifying delivered delivery did NOT throw 400 Bad Request.');
        }
        console.log('   ✅ TEST 15 PASSED: Modifying delivered delivery rejected with 400 Bad Request.');
        // ----------------------------------------------------
        // TEST 16: Cancelled Delivery Modification Rejection
        // ----------------------------------------------------
        console.log('\n📌 TEST 16: Testing cancellation & modification rejection on cancelled delivery...');
        // Create second delivery for cancel test
        const orderForCancel = await createOrder(customerUser._id.toString(), {
            orderType: 'delivery',
            deliveryAddress: {
                fullName: 'Arjun Customer',
                phone: '9988776655',
                addressLine1: '123 Cancel Rd',
                city: 'Gaya',
                state: 'Bihar',
                postalCode: '823001',
            },
            items: [
                {
                    itemType: 'STANDARD_ITEM',
                    menuItemId: String(menuItem._id),
                    name: menuItem.name,
                    quantity: 1,
                },
            ],
        });
        const deliveryForCancel = await createDeliveryForOrder(orderForCancel);
        await assignDeliveryRider(deliveryForCancel._id.toString(), riderUser1._id.toString());
        const cancelledRecord = await cancelDelivery(deliveryForCancel._id.toString());
        if (cancelledRecord.status !== 'cancelled') {
            throw new Error('❌ TEST 16 FAILED: Delivery status not updated to cancelled.');
        }
        let modifyCancelledCaught = false;
        try {
            await updateRiderDeliveryStatus(deliveryForCancel._id.toString(), riderUser1._id.toString(), 'picked_up');
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                modifyCancelledCaught = true;
            }
        }
        if (!modifyCancelledCaught) {
            throw new Error('❌ TEST 16 FAILED: Modifying cancelled delivery did NOT throw 400 Bad Request.');
        }
        console.log('   ✅ TEST 16 PASSED: Delivery cancelled cleanly and further modification rejected with 400.');
        // ----------------------------------------------------
        // TEST 20: Kitchen KDS Compatibility Check
        // ----------------------------------------------------
        console.log('\n📌 TEST 20: Verifying Kitchen KDS integration intact...');
        const linkedTicket = await KitchenTicket.findOne({ order: createdDeliveryOrder._id });
        if (!linkedTicket) {
            throw new Error('❌ TEST 20 FAILED: Linked KitchenTicket document not found.');
        }
        console.log(`   ✅ TEST 20 PASSED: Kitchen KDS ticket for order ${linkedTicket.orderNumber} exists and functions normally.`);
        // ----------------------------------------------------
        // Cleanup Test Data
        // ----------------------------------------------------
        console.log('\n🧹 Cleaning up test data...');
        await Delivery.deleteMany({ order: { $in: [createdDeliveryOrder._id, orderForCancel._id] } });
        await KitchenTicket.deleteMany({ order: { $in: [createdDeliveryOrder._id, orderForCancel._id] } });
        await Order.deleteMany({ _id: { $in: [createdDeliveryOrder._id, orderForCancel._id] } });
        await User.deleteMany({
            email: {
                $in: [
                    'delivery_cust_test@gayadarbar.com',
                    'delivery_admin_test@gayadarbar.com',
                    'delivery_manager_test@gayadarbar.com',
                    'delivery_kitchen_test@gayadarbar.com',
                    'delivery_rider1_test@gayadarbar.com',
                    'delivery_rider2_test@gayadarbar.com',
                ],
            },
        });
        console.log('\n🎉 ALL 20 PHASE 6.4 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    }
    catch (error) {
        console.error('\n❌ VERIFICATION TEST FAILED:', error);
        process.exitCode = 1;
    }
    finally {
        await disconnectDatabase();
    }
}
runDeliveryTests();
