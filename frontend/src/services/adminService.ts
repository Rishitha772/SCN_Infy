import type { User, Institution, InstitutionRequest, InstitutionUpdateRequest } from '../types';
import { UserRole, UserStatus } from '../types';
import { getStoredUsers, saveStoredUsers, getStoredInstitutions, saveStoredInstitutions } from '../data/mockData';

export class AdminService {
  // --- User Administration ---
  static async getPendingUsers(): Promise<User[]> {
    const users = getStoredUsers();
    return users.filter(u => u.status === UserStatus.PENDING || !u.is_verified);
  }

  static async getAllUsers(): Promise<User[]> {
    return getStoredUsers();
  }

  static async approveUser(userId: number): Promise<User> {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.user_id === userId);
    
    if (index === -1) throw new Error("User not found.");
    
    users[index].status = UserStatus.ACTIVE;
    users[index].is_verified = true; // Auto verify if approved
    
    saveStoredUsers(users);
    return users[index];
  }

  static async rejectUser(userId: number): Promise<User> {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.user_id === userId);
    
    if (index === -1) throw new Error("User not found.");
    
    users[index].status = UserStatus.REJECTED;
    saveStoredUsers(users);
    return users[index];
  }

  static async banUser(userId: number): Promise<User> {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.user_id === userId);
    
    if (index === -1) throw new Error("User not found.");
    
    users[index].status = UserStatus.BANNED;
    saveStoredUsers(users);
    return users[index];
  }

  static async changeUserRole(userId: number, newRole: UserRole): Promise<User> {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.user_id === userId);
    
    if (index === -1) throw new Error("User not found.");
    
    users[index].role = newRole;
    saveStoredUsers(users);
    return users[index];
  }

  static async deleteUser(userId: number): Promise<void> {
    const users = getStoredUsers();
    const filtered = users.filter(u => u.user_id !== userId);
    saveStoredUsers(filtered);
  }

  static async getRoleChangeRequests(): Promise<User[]> {
    const users = getStoredUsers();
    return users.filter(u => u.requested_role && u.requested_role !== u.role);
  }

  static async approveRoleChange(userId: number): Promise<User> {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.user_id === userId);
    
    if (index === -1) throw new Error("User not found.");
    
    const request = users[index];
    if (!request.requested_role) throw new Error("No pending role change request.");
    
    users[index].role = request.requested_role;
    users[index].requested_role = null;
    
    saveStoredUsers(users);
    return users[index];
  }

  // --- Institution Management ---
  static async getAllInstitutions(): Promise<Institution[]> {
    return getStoredInstitutions();
  }

  static async getInstitutionById(id: number): Promise<Institution> {
    const insts = getStoredInstitutions();
    const inst = insts.find(i => i.institution_id === id);
    if (!inst) throw new Error("Institution not found.");
    return inst;
  }

  static async createInstitution(data: InstitutionRequest): Promise<Institution> {
    const insts = getStoredInstitutions();
    
    const exists = insts.some(i => i.name.toLowerCase() === data.name.toLowerCase());
    if (exists) throw new Error("An institution with this name already exists.");

    const newInst: Institution = {
      institution_id: insts.length > 0 ? Math.max(...insts.map(i => i.institution_id)) + 1 : 1,
      name: data.name,
      city: data.city || "",
      country: data.country,
      type: data.type,
      website: data.website ? String(data.website) : null
    };

    insts.push(newInst);
    saveStoredInstitutions(insts);
    return newInst;
  }

  static async updateInstitution(id: number, data: InstitutionUpdateRequest): Promise<Institution> {
    const insts = getStoredInstitutions();
    const index = insts.findIndex(i => i.institution_id === id);

    if (index === -1) throw new Error("Institution not found.");

    const updated = {
      ...insts[index],
      ...(data.name !== undefined && data.name !== null ? { name: data.name } : {}),
      ...(data.city !== undefined ? { city: data.city || "" } : {}),
      ...(data.country !== undefined && data.country !== null ? { country: data.country } : {}),
      ...(data.type !== undefined && data.type !== null ? { type: data.type } : {}),
      ...(data.website !== undefined ? { website: data.website ? String(data.website) : null } : {})
    };

    insts[index] = updated;
    saveStoredInstitutions(insts);
    return updated;
  }

  static async deleteInstitution(id: number): Promise<void> {
    const insts = getStoredInstitutions();
    const filtered = insts.filter(i => i.institution_id !== id);
    saveStoredInstitutions(filtered);
  }
}
