import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';
export async function authenticateUser(req, _res, next) {
    try {
        let token;
        // 1. Extract Bearer Token from Authorization Header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // 2. Fallback to HTTP-only cookie if header is absent
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            throw new AppError('Authentication required. Please log in to access this resource.', 401);
        }
        // Verify Token
        let decoded;
        try {
            decoded = jwt.verify(token, config.jwtSecret);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new AppError('Session expired. Please log in again.', 401);
            }
            throw new AppError('Invalid authentication token.', 401);
        }
        // Verify User Existence & Status
        const user = await User.findById(decoded.id).select('+passwordHash');
        if (!user || user.isDeleted || !user.isActive) {
            throw new AppError('The user account associated with this token no longer exists or is inactive.', 401);
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
}
export function authorizeRoles(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(`Permission denied. Role '${req.user.role}' is not authorized to perform this action.`, 403));
        }
        next();
    };
}
