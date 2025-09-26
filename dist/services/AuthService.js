"use strict";
// Authentication Service
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const UserRepository_1 = require("../repositories/UserRepository");
const config_1 = require("../config");
class AuthService {
    constructor() {
        this.userRepo = new UserRepository_1.UserRepository();
    }
    async login(email, password) {
        const user = await this.userRepo.validatePassword(email, password);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const token = this.generateToken(user);
        console.log(`✅ User logged in: ${user.email}`);
        return { user, token };
    }
    async register(userData) {
        // Check if user already exists
        const existingUser = await this.userRepo.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Create new user (password will be hashed in repository)
        const user = await this.userRepo.create({
            ...userData,
            role: User_1.UserRole.USER // Default role for new users
        });
        const token = this.generateToken(user);
        console.log(`✅ New user registered: ${user.email}`);
        return { user, token };
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            teamId: user.teamId
        };
        const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
            expiresIn: '24h'
        });
        return {
            token,
            expiresIn: '24h'
        };
    }
    verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
            return payload;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Verify old password
        const isValidPassword = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user's password
        const updatedUser = await this.userRepo.update(userId, { password: hashedPassword });
        return updatedUser !== null;
    }
    async getUserFromToken(token) {
        try {
            const payload = this.verifyToken(token);
            return this.userRepo.findById(payload.userId);
        }
        catch {
            return null;
        }
    }
}
exports.AuthService = AuthService;
