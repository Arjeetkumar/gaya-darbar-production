import { Router } from 'express';
import menuRoutes from './menuRoutes.js';
import mealBuilderRoutes from './mealBuilderRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import orderRoutes from './orderRoutes.js';
import tableRoutes from './tableRoutes.js';
import reservationRoutes from './reservationRoutes.js';
import kitchenTicketRoutes from './kitchenTicketRoutes.js';
import adminOrderRoutes from './adminOrderRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import adminPaymentRoutes from './adminPaymentRoutes.js';
const v1Router = Router();
v1Router.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Gaya Darbar API v1 Endpoint Gateway',
        version: '1.0.0',
    });
});
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/menu', menuRoutes);
v1Router.use('/meal-builder', mealBuilderRoutes);
v1Router.use('/orders', orderRoutes);
v1Router.use('/tables', tableRoutes);
v1Router.use('/reservations', reservationRoutes);
v1Router.use('/kitchen', kitchenTicketRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/admin/orders', adminOrderRoutes);
v1Router.use('/admin/payments', adminPaymentRoutes);
v1Router.use('/admin/analytics', analyticsRoutes);
v1Router.use('/', deliveryRoutes);
export default v1Router;
