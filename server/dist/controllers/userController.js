import { updateUserProfile } from '../services/userService.js';
export async function getCurrentUserProfile(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: req.user.toSafeObject(),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateCurrentUserProfile(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        // Explicitly reject forbidden parameter mutations
        const forbiddenKeys = ['role', 'passwordHash', 'password', 'isDeleted', 'deletedAt', 'isActive'];
        for (const key of forbiddenKeys) {
            if (key in req.body) {
                delete req.body[key];
            }
        }
        const updatedUser = await updateUserProfile(req.user._id.toString(), req.body);
        res.status(200).json({
            success: true,
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
}
