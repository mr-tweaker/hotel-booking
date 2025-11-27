// Authentication service - handles user authentication logic
import User from '@/models/User';
import connectDB from '@/lib/db';
import bcrypt from 'bcryptjs';
import { User as IUser, AuthResponse } from '@/types';

export class AuthService {
  async signup(data: {
    phone: string;
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      await connectDB();

      const { phone, name, email, password } = data;

      if (!phone || !name || !email || !password) {
        return {
          success: false,
          error: 'phone/name/email/password required',
        };
      }

      // Check if user exists
      const existing = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existing) {
        return {
          success: false,
          error: 'User already exists',
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        phone,
        name,
        email,
        password: hashedPassword,
      });

      await user.save();

      // Return user without password
      const userResponse: Omit<IUser, 'password'> = {
        _id: user._id?.toString(),
        phone: user.phone,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      };

      return {
        success: true,
        message: 'Signup successful',
        user: userResponse,
      };
    } catch (error: unknown) {
      console.error('Signup error:', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return {
          success: false,
          error: 'User already exists',
        };
      }
      return {
        success: false,
        error: 'Signup failed',
      };
    }
  }

  async login(credentials: {
    user: string;
    pass: string;
  }): Promise<AuthResponse> {
    try {
      await connectDB();

      const { user: userInput, pass } = credentials;

      if (!userInput || !pass) {
        return {
          success: false,
          error: 'Email/phone and password are required',
        };
      }

      // Find user by email or phone
      const foundUser = await User.findOne({
        $or: [{ email: userInput }, { phone: userInput }],
      });

      if (!foundUser) {
        console.log('User not found:', userInput);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      if (!foundUser.password) {
        console.log('User has no password set');
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = foundUser.password.startsWith('$2');
      
      let isValidPassword = false;
      
      if (isHashed) {
        // Password is hashed, use bcrypt.compare
        isValidPassword = await bcrypt.compare(pass, foundUser.password);
      } else {
        // Legacy plain text password (for migration purposes)
        isValidPassword = foundUser.password === pass;
        
        // If login succeeds with plain text, hash it for future use
        if (isValidPassword) {
          const hashedPassword = await bcrypt.hash(pass, 10);
          foundUser.password = hashedPassword;
          await foundUser.save();
        }
      }

      if (!isValidPassword) {
        console.log('Password mismatch for user:', userInput);
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Return user without password
      const userResponse: Omit<IUser, 'password'> = {
        _id: foundUser._id?.toString(),
        phone: foundUser.phone,
        name: foundUser.name,
        email: foundUser.email,
        createdAt: foundUser.createdAt,
      };

      return {
        success: true,
        user: userResponse,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }
}

export const authService = new AuthService();

