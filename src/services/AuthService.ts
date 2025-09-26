// Authentication Service

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { config } from '../config';

export interface AuthToken {
  token: string;
  expiresIn: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  teamId?: string;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async login(email: string, password: string): Promise<{ user: User; token: AuthToken }> {
    const user = await this.userRepo.validatePassword(email, password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    
    console.log(`✅ User logged in: ${user.email}`);
    return { user, token };
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    organizationId: string;
    teamId?: string;
  }): Promise<{ user: User; token: AuthToken }> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user (password will be hashed in repository)
    const user = await this.userRepo.create({
      ...userData,
      role: UserRole.USER // Default role for new users
    });

    const token = this.generateToken(user);
    
    console.log(`✅ New user registered: ${user.email}`);
    return { user, token };
  }

  private generateToken(user: User): AuthToken {
    const payload: TokenPayload = {
      userId: user.id!,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '24h'
    });

    return {
      token,
      expiresIn: '24h'
    };
  }

  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password!);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    const updatedUser = await this.userRepo.update(userId, { password: hashedPassword } as any);
    
    return updatedUser !== null;
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = this.verifyToken(token);
      return this.userRepo.findById(payload.userId);
    } catch {
      return null;
    }
  }
}
