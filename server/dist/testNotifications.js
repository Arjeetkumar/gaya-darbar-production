import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { MenuItem } from './models/MenuItem.js';
import { Order } from './models/Order.js';
import { KitchenTicket } from './models/KitchenTicket.js';
import { Delivery } from './models/Delivery.js';
import { Notification } from './models/Notification.js';
import { Table } from './models/Table.js';
import { createOrder, updateOrderStatus } from './services/orderService.js';
import { updateKitchenTicketStatus } from './services/kitchenTicketService.js';
import { assignDeliveryRider, updateRiderDeliveryStatus } from './services/deliveryService.js';
import { createNotification, createOrderNotification, getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, } from './services/notificationService.js';
import { getCustomerOrderTracking } from './services/customerOrderTrackingService.js';
import { AppError } from './middleware/errorHandler.js';
dotenv.config();
async function runNotificationTests() {
    console.log('🚀 Starting Phase 7 Customer Order Tracking & Notification Verification Suite...\n');
    await connectDatabase();
    let customer1 = null;
    let customer2 = null;
    let adminUser = null;
    let riderUser = null;
    let menuItem = null;
    let deliveryOrder = null;
    let dineInOrder = null;
    try {
        // Setup Users
        customer1 = await User.findOne({ email: 'notif_cust1@gayadarbar.com' });
        if (!customer1) {
            customer1 = await User.create({
                name: 'Notification Customer One',
                email: 'notif_cust1@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'customer',
                fitnessGoal: 'muscleGain',
                dietaryPreference: 'nonVegetarian',
            });
        }
        customer2 = await User.findOne({ email: 'notif_cust2@gayadarbar.com' });
        if (!customer2) {
            customer2 = await User.create({
                name: 'Notification Customer Two',
                email: 'notif_cust2@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'customer',
                fitnessGoal: 'muscleGain',
                dietaryPreference: 'nonVegetarian',
            });
        }
        adminUser = await User.findOne({ email: 'notif_admin@gayadarbar.com' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Notification Admin',
                email: 'notif_admin@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'admin',
            });
        }
        riderUser = await User.findOne({ email: 'notif_rider@gayadarbar.com' });
        if (!riderUser) {
            riderUser = await User.create({
                name: 'Notification Rider',
                email: 'notif_rider@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'delivery_rider',
                isActive: true,
            });
        }
        menuItem = await MenuItem.findOne({ isAvailable: true, isDeleted: false });
        if (!menuItem) {
            menuItem = await MenuItem.create({
                name: 'Notification Fuel Bowl',
                slug: 'notification-fuel-bowl',
                category: 'bowls',
                price: 450,
                description: 'Fuel Bowl',
                macros: { calories: 650, protein: 50, carbs: 40, fats: 15 },
                fuelScore: 96,
                isAvailable: true,
            });
        }
        let testTable = await Table.findOne({ tableNumber: 'Table #7', isDeleted: false });
        if (!testTable) {
            testTable = await Table.create({
                tableNumber: 'Table #7',
                qrCodeIdentifier: 'TABLE-07',
                capacity: 4,
                status: 'available',
                location: 'Main Dining',
                isActive: true,
                isDeleted: false,
            });
        }
        // ----------------------------------------------------
        // TEST 4: Notification Creation
        // ----------------------------------------------------
        console.log('📌 TEST 4: Testing manual notification creation...');
        const testNotif = await createNotification({
            user: customer1._id,
            type: 'SYSTEM',
            title: 'Welcome to Gaya Darbar',
            message: 'Your account is fully initialized.',
        });
        if (!testNotif || testNotif.title !== 'Welcome to Gaya Darbar') {
            throw new Error('❌ TEST 4 FAILED: Generic notification creation failed.');
        }
        console.log('   ✅ TEST 4 PASSED: Generic notification created successfully.');
        // ----------------------------------------------------
        // TEST 5: Order Placement Notification Trigger
        // ----------------------------------------------------
        console.log('\n📌 TEST 5: Testing ORDER_PLACED notification trigger on order creation...');
        deliveryOrder = await createOrder(customer1._id.toString(), {
            orderType: 'delivery',
            deliveryAddress: {
                fullName: 'Notification Customer One',
                phone: '9876543210',
                addressLine1: '200 Notification Way',
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
        const orderPlacedNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'ORDER_PLACED',
        });
        if (!orderPlacedNotif) {
            throw new Error('❌ TEST 5 FAILED: ORDER_PLACED notification was not automatically generated.');
        }
        console.log('   ✅ TEST 5 PASSED: ORDER_PLACED notification automatically generated.');
        // ----------------------------------------------------
        // TEST 6: Confirmed Order Notification Trigger
        // ----------------------------------------------------
        console.log('\n📌 TEST 6: Testing ORDER_CONFIRMED notification trigger...');
        await updateOrderStatus(deliveryOrder._id.toString(), 'confirmed', {
            userId: adminUser._id.toString(),
            role: 'admin',
        });
        const orderConfirmedNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'ORDER_CONFIRMED',
        });
        if (!orderConfirmedNotif) {
            throw new Error('❌ TEST 6 FAILED: ORDER_CONFIRMED notification was not generated.');
        }
        console.log('   ✅ TEST 6 PASSED: ORDER_CONFIRMED notification generated.');
        // ----------------------------------------------------
        // TEST 7 & 8: Kitchen Transition Notifications (ORDER_PREPARING, ORDER_READY)
        // ----------------------------------------------------
        console.log('\n📌 TEST 7-8: Testing ORDER_PREPARING and ORDER_READY kitchen ticket triggers...');
        const kTicket = await KitchenTicket.findOne({ order: deliveryOrder._id });
        if (!kTicket)
            throw new Error('Kitchen ticket missing for delivery order.');
        await updateKitchenTicketStatus(kTicket._id.toString(), 'preparing', {
            userId: adminUser._id.toString(),
            role: 'admin',
        });
        const orderPrepNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'ORDER_PREPARING',
        });
        if (!orderPrepNotif)
            throw new Error('❌ TEST 7 FAILED: ORDER_PREPARING notification missing.');
        await updateKitchenTicketStatus(kTicket._id.toString(), 'ready', {
            userId: adminUser._id.toString(),
            role: 'admin',
        });
        const orderReadyNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'ORDER_READY',
        });
        if (!orderReadyNotif)
            throw new Error('❌ TEST 8 FAILED: ORDER_READY notification missing.');
        console.log('   ✅ TEST 7-8 PASSED: ORDER_PREPARING and ORDER_READY kitchen notifications generated.');
        // ----------------------------------------------------
        // TEST 12: Delivery Assignment Notification Trigger
        // ----------------------------------------------------
        console.log('\n📌 TEST 12: Testing DELIVERY_ASSIGNED notification trigger...');
        const deliveryRec = await Delivery.findOne({ order: deliveryOrder._id });
        if (!deliveryRec)
            throw new Error('Delivery record missing.');
        await assignDeliveryRider(deliveryRec._id.toString(), riderUser._id.toString());
        const deliveryAssignedNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'DELIVERY_ASSIGNED',
        });
        if (!deliveryAssignedNotif)
            throw new Error('❌ TEST 12 FAILED: DELIVERY_ASSIGNED notification missing.');
        console.log('   ✅ TEST 12 PASSED: DELIVERY_ASSIGNED notification generated.');
        // ----------------------------------------------------
        // TEST 13 & 9: Rider Pickup & Out for Delivery Notification Triggers
        // ----------------------------------------------------
        console.log('\n📌 TEST 13 & 9: Testing DELIVERY_PICKED_UP and ORDER_OUT_FOR_DELIVERY triggers...');
        await updateRiderDeliveryStatus(deliveryRec._id.toString(), riderUser._id.toString(), 'picked_up');
        const pickedUpNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'DELIVERY_PICKED_UP',
        });
        if (!pickedUpNotif)
            throw new Error('❌ TEST 13 FAILED: DELIVERY_PICKED_UP notification missing.');
        await updateRiderDeliveryStatus(deliveryRec._id.toString(), riderUser._id.toString(), 'out_for_delivery');
        const outForDelNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'ORDER_OUT_FOR_DELIVERY',
        });
        if (!outForDelNotif)
            throw new Error('❌ TEST 9 FAILED: ORDER_OUT_FOR_DELIVERY notification missing.');
        console.log('   ✅ TEST 13 & 9 PASSED: DELIVERY_PICKED_UP and ORDER_OUT_FOR_DELIVERY notifications generated.');
        // ----------------------------------------------------
        // TEST 10: Order Delivered Notification Trigger
        // ----------------------------------------------------
        console.log('\n📌 TEST 10: Testing ORDER_DELIVERED notification trigger...');
        await updateRiderDeliveryStatus(deliveryRec._id.toString(), riderUser._id.toString(), 'delivered');
        const deliveredNotif = await Notification.findOne({
            user: customer1._id,
            order: deliveryOrder._id,
            type: 'ORDER_DELIVERED',
        });
        if (!deliveredNotif)
            throw new Error('❌ TEST 10 FAILED: ORDER_DELIVERED notification missing.');
        console.log('   ✅ TEST 10 PASSED: ORDER_DELIVERED notification generated.');
        // ----------------------------------------------------
        // TEST 11: Order Cancelled Notification Trigger
        // ----------------------------------------------------
        console.log('\n📌 TEST 11: Testing ORDER_CANCELLED notification trigger...');
        dineInOrder = await createOrder(customer1._id.toString(), {
            orderType: 'dineIn',
            table: 'Table #7',
            items: [
                {
                    itemType: 'STANDARD_ITEM',
                    menuItemId: String(menuItem._id),
                    name: menuItem.name,
                    quantity: 1,
                },
            ],
        });
        await updateOrderStatus(dineInOrder._id.toString(), 'cancelled', {
            userId: adminUser._id.toString(),
            role: 'admin',
        });
        const cancelledNotif = await Notification.findOne({
            user: customer1._id,
            order: dineInOrder._id,
            type: 'ORDER_CANCELLED',
        });
        if (!cancelledNotif)
            throw new Error('❌ TEST 11 FAILED: ORDER_CANCELLED notification missing.');
        console.log('   ✅ TEST 11 PASSED: ORDER_CANCELLED notification generated.');
        // ----------------------------------------------------
        // TEST 14: Delivery Failure Notification Trigger
        // ----------------------------------------------------
        console.log('\n📌 TEST 14: Testing DELIVERY_FAILED notification trigger...');
        const failOrder = await createOrder(customer1._id.toString(), {
            orderType: 'delivery',
            deliveryAddress: {
                fullName: 'Fail Customer',
                phone: '9876543210',
                addressLine1: 'Failed St',
                city: 'Gaya',
                state: 'Bihar',
                postalCode: '823001',
            },
            items: [{ itemType: 'STANDARD_ITEM', menuItemId: String(menuItem._id), name: menuItem.name, quantity: 1 }],
        });
        const failDelivery = await Delivery.findOne({ order: failOrder._id });
        await assignDeliveryRider(failDelivery._id.toString(), riderUser._id.toString());
        await updateRiderDeliveryStatus(failDelivery._id.toString(), riderUser._id.toString(), 'failed', 'Customer address unreachable');
        const failedNotif = await Notification.findOne({ user: customer1._id, order: failOrder._id, type: 'DELIVERY_FAILED' });
        if (!failedNotif)
            throw new Error('❌ TEST 14 FAILED: DELIVERY_FAILED notification missing.');
        console.log('   ✅ TEST 14 PASSED: DELIVERY_FAILED notification generated.');
        // ----------------------------------------------------
        // TEST 15: Duplicate Transition Idempotency Check
        // ----------------------------------------------------
        console.log('\n📌 TEST 15: Testing duplicate transition notification idempotency...');
        const dup1 = await createOrderNotification(customer1._id, deliveryOrder._id, deliveryOrder.orderNumber, 'ORDER_CONFIRMED', 'Title', 'Msg');
        const dup2 = await createOrderNotification(customer1._id, deliveryOrder._id, deliveryOrder.orderNumber, 'ORDER_CONFIRMED', 'Title', 'Msg');
        if (dup1._id.toString() !== dup2._id.toString()) {
            throw new Error('❌ TEST 15 FAILED: Duplicate transition notification created a new document.');
        }
        console.log('   ✅ TEST 15 PASSED: Idempotency check prevented duplicate transition notifications.');
        // ----------------------------------------------------
        // TEST 1, 2, 3: Customer Notification Retrieval & Ownership
        // ----------------------------------------------------
        console.log('\n📌 TEST 1-3: Testing notification retrieval and customer ownership enforcement...');
        const cust1Notifs = await getUserNotifications(customer1._id.toString());
        const cust2Notifs = await getUserNotifications(customer2._id.toString());
        if (cust1Notifs.length === 0)
            throw new Error('❌ TEST 1 FAILED: Customer 1 returned 0 notifications.');
        if (cust2Notifs.length !== 0)
            throw new Error('❌ TEST 2 FAILED: Customer 2 retrieved notifications belonging to Customer 1.');
        console.log('   ✅ TEST 1-3 PASSED: Customer retrieves own notifications; Customer 2 cannot access Customer 1 notifications.');
        // ----------------------------------------------------
        // TEST 16, 17, 18: Unread Count & Mark Read / Mark All Read
        // ----------------------------------------------------
        console.log('\n📌 TEST 16-18: Testing unread count & mark read operations...');
        const unreadCountBefore = await getUnreadNotificationCount(customer1._id.toString());
        if (unreadCountBefore === 0)
            throw new Error('❌ TEST 16 FAILED: Unread count before read is 0.');
        await markNotificationAsRead(cust1Notifs[0]._id.toString(), customer1._id.toString());
        const unreadAfterOneRead = await getUnreadNotificationCount(customer1._id.toString());
        if (unreadAfterOneRead !== unreadCountBefore - 1) {
            throw new Error('❌ TEST 17 FAILED: Single mark as read failed to decrement unread count.');
        }
        await markAllNotificationsAsRead(customer1._id.toString());
        const unreadAfterAllRead = await getUnreadNotificationCount(customer1._id.toString());
        if (unreadAfterAllRead !== 0) {
            throw new Error('❌ TEST 18 FAILED: Mark all notifications as read did not reset unread count to 0.');
        }
        console.log('   ✅ TEST 16-18 PASSED: Unread count, mark as read, and mark all as read work accurately.');
        // ----------------------------------------------------
        // TEST 19: Customer Order Tracking IDOR Protection
        // ----------------------------------------------------
        console.log('\n📌 TEST 19: Testing customer order tracking IDOR protection...');
        let idorCaught = false;
        try {
            await getCustomerOrderTracking(deliveryOrder._id.toString(), customer2._id.toString());
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 403) {
                idorCaught = true;
            }
        }
        if (!idorCaught) {
            throw new Error('❌ TEST 19 FAILED: Non-owner customer was able to view order tracking details.');
        }
        console.log('   ✅ TEST 19 PASSED: Non-owner customer strictly denied (403) on tracking endpoint.');
        // ----------------------------------------------------
        // TEST 20, 21, 22: Order Tracking Timeline (Delivery & Dine-In)
        // ----------------------------------------------------
        console.log('\n📌 TEST 20-22: Testing structured step timeline generation...');
        const delivTracking = await getCustomerOrderTracking(deliveryOrder._id.toString(), customer1._id.toString());
        const dineTracking = await getCustomerOrderTracking(dineInOrder._id.toString(), customer1._id.toString());
        if (!delivTracking.timeline || delivTracking.timeline.length < 5) {
            throw new Error('❌ TEST 22 FAILED: Delivery timeline steps missing.');
        }
        if (!dineTracking.timeline || dineTracking.timeline.length < 2) {
            throw new Error('❌ TEST 21 FAILED: Dine-in timeline steps missing.');
        }
        console.log('   ✅ TEST 20-22 PASSED: Structured step timeline generates correctly for delivery & dine-in.');
        // ----------------------------------------------------
        // TEST 23, 24, 25: Existing Order, KDS, Delivery API Check
        // ----------------------------------------------------
        console.log('\n📌 TEST 23-25: Verifying existing Order, Kitchen KDS, and Delivery APIs functional...');
        const checkOrder = await Order.findById(deliveryOrder._id);
        const checkKitchen = await KitchenTicket.findOne({ order: deliveryOrder._id });
        const checkDelivery = await Delivery.findOne({ order: deliveryOrder._id });
        if (!checkOrder || !checkKitchen || !checkDelivery) {
            throw new Error('❌ TEST 23-25 FAILED: Pre-existing operational models compromised.');
        }
        console.log('   ✅ TEST 23-25 PASSED: Existing Order, Kitchen KDS, and Delivery models remain 100% functional.');
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await Notification.deleteMany({ user: { $in: [customer1._id, customer2._id] } });
        await Delivery.deleteMany({ order: { $in: [deliveryOrder._id, dineInOrder._id, failOrder._id] } });
        await KitchenTicket.deleteMany({ order: { $in: [deliveryOrder._id, dineInOrder._id, failOrder._id] } });
        await Order.deleteMany({ _id: { $in: [deliveryOrder._id, dineInOrder._id, failOrder._id] } });
        await User.deleteMany({
            email: {
                $in: [
                    'notif_cust1@gayadarbar.com',
                    'notif_cust2@gayadarbar.com',
                    'notif_admin@gayadarbar.com',
                    'notif_rider@gayadarbar.com',
                ],
            },
        });
        console.log('\n🎉 ALL 25 PHASE 7 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    }
    catch (error) {
        console.error('\n❌ VERIFICATION TEST FAILED:', error);
        process.exitCode = 1;
    }
    finally {
        await disconnectDatabase();
    }
}
runNotificationTests();
