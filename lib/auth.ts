// Client-side authentication utilities
import { User } from '@/types';

const USER_STORAGE_KEY = 'currentUser';

export function getCurrentUser(): Omit<User, 'password'> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr) as Omit<User, 'password'>;
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    return null;
  }
}

export function setCurrentUser(user: Omit<User, 'password'>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

