import type { User, UserUpdateRequest } from '../types';
import { UserRole } from '../types';
import { getStoredUsers, saveStoredUsers } from '../data/mockData';
import { AuthService } from './authService';

export class UserService {
  static async getMe(): Promise<User> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");
    return currentUser;
  }

  static async updateMe(data: UserUpdateRequest): Promise<User> {
    const currentUser = await this.getMe();
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.user_id === currentUser.user_id);

    if (userIndex === -1) throw new Error("User profile not found");

    if (data.password) {
      localStorage.setItem(`pwd_${currentUser.email}`, String(data.password));
    }

    const updatedUser = {
      ...users[userIndex]
    };

    users[userIndex] = updatedUser;
    saveStoredUsers(users);

    return updatedUser;
  }

  static async deleteMe(): Promise<void> {
    const currentUser = await this.getMe();
    const users = getStoredUsers();
    const filteredUsers = users.filter(u => u.user_id !== currentUser.user_id);
    saveStoredUsers(filteredUsers);
    await AuthService.logout({ refresh_token: "" });
  }

  static async requestRoleChange(requestedRole: UserRole): Promise<{ message: string }> {
    const currentUser = await this.getMe();
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.user_id === currentUser.user_id);

    if (userIndex === -1) throw new Error("User not found");

    if (requestedRole === UserRole.SYSTEM_ADMIN) {
      throw new Error("System admin role cannot be self-declared");
    }

    users[userIndex].requested_role = requestedRole;
    saveStoredUsers(users);

    return { message: `Requested role upgrade to ${requestedRole.toUpperCase()} submitted for admin approval.` };
  }
}
