"use strict";
// Authentication Middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireAdmin = exports.authenticate = void 0;
const AuthService_1 = require("../services/AuthService");
const UserRepository_1 = require("../repositories/UserRepository");
const authService = new AuthService_1.AuthService();
const userRepo = new UserRepository_1.UserRepository();
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const payload = authService.verifyToken(token);
        const user = await userRepo.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireUser = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'User access required' });
    }
    next();
};
exports.requireUser = requireUser;
