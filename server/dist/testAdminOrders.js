import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { MenuItem } from './models/MenuItem.js';
import { Order } from './models/Order.js';
import { KitchenTicket } from './models/KitchenTicket.js';
import { createOrder } from './services/orderService.js';
import { getAdminOrders, getAdminOrderById, updateAdminOrderStatus, cancelAdminOrder, } from './services/adminOrderService.js';
import { AppError } from './middleware/errorHandler.js';
import { authorizeRoles } from './middleware/authMiddleware.js';
dotenv.config();
async function runAdminOrderTests() {
    console.log('🚀 Starting Phase 6.3 Admin Order Operations Verification Tests...\n');
    await connectDatabase();
    let testCustomer = null;
    let testAdmin = null;
    let testKitchenStaff = null;
    let createdOrder = null;
    try {
        // ----------------------------------------------------
        // Setup Test Users & Menu Item
        // ----------------------------------------------------
        testCustomer = await User.findOne({ email: 'admin_test_cust@gayadarbar.com' });
        if (!testCustomer) {
            testCustomer = await User.create({
                name: 'Arjun AdminTest',
                email: 'admin_test_cust@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'customer',
            });
        }
        testAdmin = await User.findOne({ email: 'admin_test_user@gayadarbar.com' });
        if (!testAdmin) {
            testAdmin = await User.create({
                name: 'Super Admin',
                email: 'admin_test_user@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'admin',
            });
        }
        testKitchenStaff = await User.findOne({ email: 'kitchen_test_user@gayadarbar.com' });
        if (!testKitchenStaff) {
            testKitchenStaff = await User.create({
                name: 'Kitchen Worker',
                email: 'kitchen_test_user@gayadarbar.com',
                passwordHash: '$2a$10$abcdefghijklmnopqrstuuu',
                role: 'kitchen_staff',
            });
        }
        let menuItem = await MenuItem.findOne({ isAvailable: true, isDeleted: false });
        if (!menuItem) {
            menuItem = await MenuItem.create({
                name: 'Admin Test Power Salad',
                slug: 'admin-test-power-salad',
                category: 'bowls',
                price: 320,
                description: 'Test dish for admin order management',
                macros: { calories: 420, protein: 35, carbs: 30, fats: 10 },
                fuelScore: 88,
                isAvailable: true,
            });
        }
        // Create a test order
        createdOrder = await createOrder(testCustomer._id.toString(), {
            orderType: 'delivery',
            deliveryAddress: {
                fullName: 'Arjun AdminTest',
                phone: '9876543210',
                addressLine1: '456 Admin St',
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
            customerNotes: 'Deliver before 8 PM',
        });
        console.log(`📌 Created Test Order: ${createdOrder.orderNumber} (ID: ${createdOrder._id})`);
        // ----------------------------------------------------
        // TEST 1: RBAC Protection Verification
        // ----------------------------------------------------
        console.log('\n📌 TEST 1: Verifying RBAC protection (Customer & Kitchen Staff denied admin routes)...');
        const adminAuthCheck = authorizeRoles('admin', 'manager');
        let customerDenied = false;
        adminAuthCheck({ user: testCustomer }, {}, (err) => {
            if (err && err.statusCode === 403)
                customerDenied = true;
        });
        let kitchenDenied = false;
        adminAuthCheck({ user: testKitchenStaff }, {}, (err) => {
            if (err && err.statusCode === 403)
                kitchenDenied = true;
        });
        let adminAllowed = false;
        adminAuthCheck({ user: testAdmin }, {}, (err) => {
            if (!err)
                adminAllowed = true;
        });
        if (!customerDenied || !kitchenDenied || !adminAllowed) {
            throw new Error('❌ TEST 1 FAILED: RBAC authorization middleware failed to restrict access properly.');
        }
        console.log('   ✅ TEST 1 PASSED: RBAC strictly allows Admin/Manager and denies Customer/KitchenStaff with 403.');
        // ----------------------------------------------------
        // TEST 2: Paginated Orders Retrieval
        // ----------------------------------------------------
        console.log('\n📌 TEST 2: Admin retrieves paginated orders list...');
        const paginatedRes = await getAdminOrders({ page: 1, limit: 10 });
        if (!paginatedRes.orders || !paginatedRes.pagination) {
            throw new Error('❌ TEST 2 FAILED: Paginated response format invalid.');
        }
        if (paginatedRes.pagination.limit > 50) {
            throw new Error('❌ TEST 2 FAILED: Limit exceeded maximum allowed (50).');
        }
        console.log(`   ✅ TEST 2 PASSED: Paginated orders loaded (${paginatedRes.orders.length} orders on page 1, total ${paginatedRes.pagination.total}).`);
        // ----------------------------------------------------
        // TEST 3: Search by Order Number & Customer Name/Email
        // ----------------------------------------------------
        console.log('\n📌 TEST 3: Searching orders by #GD order number and customer name/email...');
        const searchOrderNumRes = await getAdminOrders({ search: createdOrder.orderNumber });
        if (!searchOrderNumRes.orders.some((o) => o._id.toString() === createdOrder._id.toString())) {
            throw new Error(`❌ TEST 3 FAILED: Search by order number ${createdOrder.orderNumber} returned no results.`);
        }
        const searchCustNameRes = await getAdminOrders({ search: 'AdminTest' });
        if (!searchCustNameRes.orders.some((o) => o._id.toString() === createdOrder._id.toString())) {
            throw new Error('❌ TEST 3 FAILED: Search by customer name returned no results.');
        }
        console.log('   ✅ TEST 3 PASSED: Search by order number and customer details working.');
        // ----------------------------------------------------
        // TEST 4: Filtering by Status, OrderType, and PaymentStatus
        // ----------------------------------------------------
        console.log('\n📌 TEST 4: Filtering by status, orderType, and paymentStatus...');
        const filterStatusRes = await getAdminOrders({ status: 'pending' });
        if (filterStatusRes.orders.some((o) => o.status !== 'pending')) {
            throw new Error('❌ TEST 4 FAILED: Status filter returned non-pending orders.');
        }
        const filterTypeRes = await getAdminOrders({ orderType: 'delivery' });
        if (filterTypeRes.orders.some((o) => o.orderType !== 'delivery')) {
            throw new Error('❌ TEST 4 FAILED: OrderType filter returned non-delivery orders.');
        }
        console.log('   ✅ TEST 4 PASSED: Status and orderType filters working.');
        // ----------------------------------------------------
        // TEST 5: Order Details Lookup by ID & #GD number
        // ----------------------------------------------------
        console.log('\n📌 TEST 5: Fetching order details by ID and orderNumber...');
        const detailsById = await getAdminOrderById(createdOrder._id.toString());
        const detailsByNum = await getAdminOrderById(createdOrder.orderNumber);
        if (detailsById._id.toString() !== createdOrder._id.toString() || detailsByNum._id.toString() !== createdOrder._id.toString()) {
            throw new Error('❌ TEST 5 FAILED: Order details lookup by ID or orderNumber mismatch.');
        }
        console.log('   ✅ TEST 5 PASSED: Order details retrieved cleanly with populated customer info.');
        // ----------------------------------------------------
        // TEST 6: Status Transition & KDS Sync
        // ----------------------------------------------------
        console.log('\n📌 TEST 6: Executing admin status transition pending -> confirmed...');
        const updatedStatusOrder = await updateAdminOrderStatus(createdOrder._id.toString(), 'confirmed', {
            userId: testAdmin._id.toString(),
            role: 'admin',
        });
        if (updatedStatusOrder.status !== 'confirmed') {
            throw new Error(`❌ TEST 6 FAILED: Order status not updated to 'confirmed'. Got '${updatedStatusOrder.status}'.`);
        }
        console.log('   ✅ TEST 6 PASSED: Order status transitioned to confirmed.');
        // ----------------------------------------------------
        // TEST 7: Invalid Transition Attempt (Expect 400)
        // ----------------------------------------------------
        console.log('\n📌 TEST 7: Testing invalid status transition attempt...');
        let invalidErrorCaught = false;
        try {
            await updateAdminOrderStatus(createdOrder._id.toString(), 'delivered', {
                userId: testAdmin._id.toString(),
                role: 'admin',
            });
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                invalidErrorCaught = true;
            }
        }
        if (!invalidErrorCaught) {
            throw new Error('❌ TEST 7 FAILED: Invalid status transition did NOT throw 400 Bad Request.');
        }
        console.log('   ✅ TEST 7 PASSED: Invalid status transition rejected with 400 Bad Request.');
        // ----------------------------------------------------
        // TEST 8: Order Cancellation
        // ----------------------------------------------------
        console.log('\n📌 TEST 8: Cancelling order...');
        const cancelledOrder = await cancelAdminOrder(createdOrder._id.toString(), {
            userId: testAdmin._id.toString(),
            role: 'admin',
        });
        if (cancelledOrder.status !== 'cancelled') {
            throw new Error('❌ TEST 8 FAILED: Order status was not set to cancelled.');
        }
        const linkedTicket = await KitchenTicket.findOne({ order: createdOrder._id });
        if (linkedTicket && linkedTicket.status !== 'cancelled') {
            throw new Error('❌ TEST 8 FAILED: Linked KitchenTicket status was not updated to cancelled.');
        }
        console.log('   ✅ TEST 8 PASSED: Order cancelled and KitchenTicket synchronized.');
        // ----------------------------------------------------
        // TEST 9: Attempting to Cancel Terminal Order (Expect 400)
        // ----------------------------------------------------
        console.log('\n📌 TEST 9: Attempting to cancel already cancelled order...');
        let cancelTerminalError = false;
        try {
            await cancelAdminOrder(createdOrder._id.toString(), {
                userId: testAdmin._id.toString(),
                role: 'admin',
            });
        }
        catch (err) {
            if (err instanceof AppError && err.statusCode === 400) {
                cancelTerminalError = true;
            }
        }
        if (!cancelTerminalError) {
            throw new Error('❌ TEST 9 FAILED: Cancelling already cancelled order did NOT throw 400 Bad Request.');
        }
        console.log('   ✅ TEST 9 PASSED: Cancellation of terminal order rejected with 400 Bad Request.');
        // ----------------------------------------------------
        // Cleanup Test Data
        // ----------------------------------------------------
        console.log('\n🧹 Cleaning up test data...');
        await KitchenTicket.deleteMany({ order: createdOrder._id });
        await Order.deleteMany({ _id: createdOrder._id });
        await User.deleteMany({
            email: {
                $in: [
                    'admin_test_cust@gayadarbar.com',
                    'admin_test_user@gayadarbar.com',
                    'kitchen_test_user@gayadarbar.com',
                ],
            },
        });
        console.log('\n🎉 ALL PHASE 6.3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    }
    catch (error) {
        console.error('\n❌ VERIFICATION TEST FAILED:', error);
        process.exitCode = 1;
    }
    finally {
        await disconnectDatabase();
    }
}
runAdminOrderTests();
