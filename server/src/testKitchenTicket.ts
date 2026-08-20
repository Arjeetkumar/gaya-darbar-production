import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User, IUser } from './models/User.js';
import { MenuItem } from './models/MenuItem.js';
import { Order, IOrder } from './models/Order.js';
import { KitchenTicket, IKitchenTicket } from './models/KitchenTicket.js';
import { createOrder, getUserOrders, updateOrderStatus } from './services/orderService.js';
import {
  createKitchenTicketFromOrder,
  getKitchenTickets,
  getActiveKitchenTickets,
  getKitchenTicketById,
  updateKitchenTicketStatus,
  setKitchenTicketPriority,
} from './services/kitchenTicketService.js';
import { AppError } from './middleware/errorHandler.js';
import { authorizeRoles } from './middleware/authMiddleware.js';

dotenv.config();

async function runKitchenTicketTests() {
  console.log('🚀 Starting Phase 6.1 Kitchen Ticket System Verification Tests...\n');

  await connectDatabase();

  let testCustomer: IUser | null = null;
  let testKitchenStaff: IUser | null = null;
  let createdOrder: IOrder | null = null;
  let createdTicket: IKitchenTicket | null = null;

  try {
    // ----------------------------------------------------
    // Setup Test Users & Menu Item
    // ----------------------------------------------------
    testCustomer = await User.findOne({ email: 'test_customer_k@gayadarbar.com' });
    if (!testCustomer) {
      testCustomer = await User.create({
        name: 'Test Customer Kitchen',
        email: 'test_customer_k@gayadarbar.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuuu', // dummy hash
        role: 'customer',
      });
    }

    testKitchenStaff = await User.findOne({ email: 'test_staff_k@gayadarbar.com' });
    if (!testKitchenStaff) {
      testKitchenStaff = await User.create({
        name: 'Test Staff Kitchen',
        email: 'test_staff_k@gayadarbar.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuuu', // dummy hash
        role: 'kitchen_staff',
      });
    }

    let menuItem = await MenuItem.findOne({ isAvailable: true, isDeleted: false });
    if (!menuItem) {
      menuItem = await MenuItem.create({
        name: 'Test Protein Bowl',
        slug: 'test-protein-bowl',
        category: 'bowls',
        price: 350,
        description: 'Test dish for kitchen ticket verification',
        macros: { calories: 500, protein: 40, carbs: 45, fats: 12 },
        fuelScore: 85,
        isAvailable: true,
      });
    }

    // ----------------------------------------------------
    // TEST 1: Customer Places Order -> Automatic Kitchen Ticket Creation
    // ----------------------------------------------------
    console.log('📌 TEST 1: Placing customer order and checking automatic Kitchen Ticket creation...');
    createdOrder = await createOrder(testCustomer._id.toString(), {
      orderType: 'delivery',
      deliveryAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine1: '123 Test Street',
        city: 'Gaya',
        state: 'Bihar',
        postalCode: '823001',
      },
      items: [
        {
          itemType: 'STANDARD_ITEM',
          menuItemId: String((menuItem as any)._id),
          name: menuItem.name,
          quantity: 2,
          portionChoice: 'Double Protein',
          sauceChoice: 'Mint Yogurt',
        },
      ],
      customerNotes: 'Extra spicy please!',
    });

    console.log(`   ✅ Order created successfully: ${createdOrder.orderNumber} (ID: ${createdOrder._id})`);

    createdTicket = await KitchenTicket.findOne({ order: createdOrder._id });
    if (!createdTicket) {
      throw new Error('❌ TEST 1 FAILED: KitchenTicket was not created automatically upon order placement.');
    }

    if (createdTicket.orderNumber !== createdOrder.orderNumber) {
      throw new Error('❌ TEST 1 FAILED: Order number mismatch on KitchenTicket.');
    }

    if (createdTicket.status !== 'pending') {
      throw new Error(`❌ TEST 1 FAILED: Expected initial status 'pending', got '${createdTicket.status}'.`);
    }

    if (createdTicket.customerNotes !== 'Extra spicy please!') {
      throw new Error('❌ TEST 1 FAILED: Customer notes not passed to KitchenTicket.');
    }

    if (createdTicket.items.length !== 1 || createdTicket.items[0].name !== menuItem.name) {
      throw new Error('❌ TEST 1 FAILED: Kitchen ticket item snapshot does not match order item.');
    }

    console.log('   ✅ TEST 1 PASSED: KitchenTicket created automatically with correct snapshots.');

    // ----------------------------------------------------
    // TEST 2: Duplicate Kitchen Ticket Prevention
    // ----------------------------------------------------
    console.log('\n📌 TEST 2: Testing duplicate Kitchen Ticket creation prevention...');
    const duplicateCheckTicket = await createKitchenTicketFromOrder(createdOrder);
    if (duplicateCheckTicket._id.toString() !== createdTicket._id.toString()) {
      throw new Error('❌ TEST 2 FAILED: Duplicate Kitchen Ticket was created!');
    }
    console.log('   ✅ TEST 2 PASSED: Duplicate creation prevented safely.');

    // ----------------------------------------------------
    // TEST 3: Kitchen Staff Retrieves Active Tickets
    // ----------------------------------------------------
    console.log('\n📌 TEST 3: Kitchen staff retrieves active tickets...');
    const activeTickets = await getActiveKitchenTickets();
    const foundInActive = activeTickets.some((t) => t._id.toString() === createdTicket!._id.toString());
    if (!foundInActive) {
      throw new Error('❌ TEST 3 FAILED: Created kitchen ticket not found in active tickets list.');
    }
    console.log(`   ✅ TEST 3 PASSED: Active tickets retrieved successfully (${activeTickets.length} active tickets found).`);

    // ----------------------------------------------------
    // TEST 4: Customer Attempting Kitchen Staff Access -> RBAC 403 Verification
    // ----------------------------------------------------
    console.log('\n📌 TEST 4: Verifying RBAC restriction (Customers denied kitchen access)...');
    const authMiddlewareFunction = authorizeRoles('admin', 'manager', 'kitchen_staff');
    let rbacErrorCaught = false;

    const mockReq: any = { user: testCustomer };
    const mockRes: any = {};
    const mockNext = (err?: any) => {
      if (err && err.statusCode === 403) {
        rbacErrorCaught = true;
      }
    };

    authMiddlewareFunction(mockReq, mockRes, mockNext);

    if (!rbacErrorCaught) {
      throw new Error('❌ TEST 4 FAILED: Customer user was NOT rejected with 403 Forbidden on kitchen route.');
    }
    console.log('   ✅ TEST 4 PASSED: Customer correctly denied with 403 Forbidden.');

    // ----------------------------------------------------
    // TEST 5: Status Transition: pending -> preparing (Order synced)
    // ----------------------------------------------------
    console.log('\n📌 TEST 5: Transitioning status: pending -> preparing...');
    const ticketPreparing = await updateKitchenTicketStatus(
      createdTicket._id.toString(),
      'preparing',
      { userId: testKitchenStaff._id.toString(), role: 'kitchen_staff' }
    );

    if (ticketPreparing.status !== 'preparing' || !ticketPreparing.startedAt) {
      throw new Error('❌ TEST 5 FAILED: Ticket status or startedAt timestamp not updated properly.');
    }

    const orderPreparing = await Order.findById(createdOrder._id);
    if (orderPreparing?.status !== 'preparing') {
      throw new Error(`❌ TEST 5 FAILED: Linked Order status not synchronized to 'preparing'. Got '${orderPreparing?.status}'.`);
    }
    console.log('   ✅ TEST 5 PASSED: Status updated to preparing and Order synchronized.');

    // ----------------------------------------------------
    // TEST 6: Status Transition: preparing -> ready (Order synced)
    // ----------------------------------------------------
    console.log('\n📌 TEST 6: Transitioning status: preparing -> ready...');
    const ticketReady = await updateKitchenTicketStatus(
      createdTicket._id.toString(),
      'ready',
      { userId: testKitchenStaff._id.toString(), role: 'kitchen_staff' }
    );

    if (ticketReady.status !== 'ready' || !ticketReady.readyAt) {
      throw new Error('❌ TEST 6 FAILED: Ticket status or readyAt timestamp not updated properly.');
    }

    const orderReady = await Order.findById(createdOrder._id);
    if (orderReady?.status !== 'ready') {
      throw new Error(`❌ TEST 6 FAILED: Linked Order status not synchronized to 'ready'. Got '${orderReady?.status}'.`);
    }
    console.log('   ✅ TEST 6 PASSED: Status updated to ready and Order synchronized.');

    // ----------------------------------------------------
    // TEST 7: Status Transition: ready -> completed (Order synced)
    // ----------------------------------------------------
    console.log('\n📌 TEST 7: Transitioning status: ready -> completed...');
    const ticketCompleted = await updateKitchenTicketStatus(
      createdTicket._id.toString(),
      'completed',
      { userId: testKitchenStaff._id.toString(), role: 'kitchen_staff' }
    );

    if (ticketCompleted.status !== 'completed' || !ticketCompleted.completedAt) {
      throw new Error('❌ TEST 7 FAILED: Ticket status or completedAt timestamp not updated properly.');
    }

    const orderCompleted = await Order.findById(createdOrder._id);
    if (orderCompleted?.status !== 'completed') {
      throw new Error(`❌ TEST 7 FAILED: Linked Order status not synchronized to 'completed'. Got '${orderCompleted?.status}'.`);
    }
    console.log('   ✅ TEST 7 PASSED: Status updated to completed and Order synchronized.');

    // ----------------------------------------------------
    // TEST 8: Invalid Transition Attempt: completed -> preparing (Expect 400)
    // ----------------------------------------------------
    console.log('\n📌 TEST 8: Attempting invalid transition: completed -> preparing...');
    let transitionErrorCaught = false;
    try {
      await updateKitchenTicketStatus(createdTicket._id.toString(), 'preparing');
    } catch (err: any) {
      if (err instanceof AppError && err.statusCode === 400) {
        transitionErrorCaught = true;
        console.log(`   Expected Error Caught: "${err.message}"`);
      }
    }

    if (!transitionErrorCaught) {
      throw new Error('❌ TEST 8 FAILED: Invalid transition completed -> preparing did NOT throw 400 Bad Request.');
    }
    console.log('   ✅ TEST 8 PASSED: Invalid transition rejected with 400 Bad Request.');

    // ----------------------------------------------------
    // TEST 9: Immutability of Financial Totals via Kitchen API
    // ----------------------------------------------------
    console.log('\n📌 TEST 9: Verifying financial total immutability...');
    const kitchenTicketSchemaPaths = Object.keys(KitchenTicket.schema.paths);
    if (
      kitchenTicketSchemaPaths.includes('total') ||
      kitchenTicketSchemaPaths.includes('subtotal') ||
      kitchenTicketSchemaPaths.includes('unitPrice')
    ) {
      throw new Error('❌ TEST 9 FAILED: KitchenTicket schema illegally contains financial price fields!');
    }
    console.log('   ✅ TEST 9 PASSED: KitchenTicket schema strictly excludes financial fields.');

    // ----------------------------------------------------
    // TEST 10: Customer Order History Compatibility
    // ----------------------------------------------------
    console.log('\n📌 TEST 10: Verifying customer order history...');
    const customerOrders = await getUserOrders(testCustomer._id.toString());
    const orderInHistory = customerOrders.some((o) => o._id.toString() === createdOrder!._id.toString());
    if (!orderInHistory) {
      throw new Error('❌ TEST 10 FAILED: Placed order not found in customer order history.');
    }
    console.log(`   ✅ TEST 10 PASSED: Customer order history retrieved successfully (${customerOrders.length} orders).`);

    // ----------------------------------------------------
    // TEST 11: Controlled Order Status Update API
    // ----------------------------------------------------
    console.log('\n📌 TEST 11: Testing direct order status update API...');
    const testOrder2 = await createOrder(testCustomer._id.toString(), {
      orderType: 'delivery',
      deliveryAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Gaya',
        state: 'Bihar',
        postalCode: '823001',
      },
      items: [
        {
          itemType: 'STANDARD_ITEM',
          menuItemId: String((menuItem as any)._id),
          quantity: 1,
        },
      ],
    });

    const updatedOrder2 = await updateOrderStatus(testOrder2._id.toString(), 'preparing', {
      userId: testKitchenStaff._id.toString(),
      role: 'kitchen_staff',
    });

    if (updatedOrder2.status !== 'preparing') {
      throw new Error('❌ TEST 11 FAILED: Direct order status update failed.');
    }

    const syncedTicket2 = await KitchenTicket.findOne({ order: testOrder2._id });
    if (syncedTicket2?.status !== 'preparing') {
      throw new Error('❌ TEST 11 FAILED: Kitchen ticket status was not synced from direct Order status update.');
    }
    console.log('   ✅ TEST 11 PASSED: Direct order status update and KitchenTicket sync working.');

    // ----------------------------------------------------
    // Cleanup Test Data
    // ----------------------------------------------------
    console.log('\n🧹 Cleaning up test data...');
    if (createdOrder) {
      await KitchenTicket.deleteMany({ order: { $in: [createdOrder._id, testOrder2._id] } });
      await Order.deleteMany({ _id: { $in: [createdOrder._id, testOrder2._id] } });
    }
    await User.deleteMany({ email: { $in: ['test_customer_k@gayadarbar.com', 'test_staff_k@gayadarbar.com'] } });

    console.log('\n🎉 ALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

runKitchenTicketTests();
