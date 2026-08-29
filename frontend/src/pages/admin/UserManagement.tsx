import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/adminService';
import type { User } from '../../types';
import { UserRole, UserStatus } from '../../types';
import { Shield, Trash2, Check, X, ShieldOff } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Edit state
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [tempRole, setTempRole] = useState<UserRole>(UserRole.RESEARCHER);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await AdminService.getAllUsers();
      setUsers(all);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleBan = async (userId: number) => {
    if (!window.confirm("Are you sure you want to ban this user? They will be unable to log in.")) return;
    try {
      await AdminService.banUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to ban user.");
    }
  };

  const handleSaveRole = async (userId: number) => {
    try {
      await AdminService.changeUserRole(userId, tempRole);
      setEditingUserId(null);
      loadUsers();
      alert("User role updated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to update role.");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm("CRITICAL: Delete this user account? This removes all associated academic structures.")) return;
    try {
      await AdminService.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-650" />
            User Management Directory
          </h1>
          <p className="text-slate-500 text-sm">Force override user roles, restrict system authorizations, or ban accounts.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Retrieving security parameters...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 font-semibold">
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3">Active Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {users.map(u => {
                  const isEditing = editingUserId === u.user_id;

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400">SCN-USER-{u.user_id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{u.email}</td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              className="px-2 py-1 border border-slate-300 rounded text-xs bg-slate-50"
                              value={tempRole}
                              onChange={e => setTempRole(e.target.value as UserRole)}
                            >
                              <option value={UserRole.RESEARCHER}>Researcher</option>
                              <option value={UserRole.REVIEWER}>Reviewer</option>
                              <option value={UserRole.INSTITUTION_ADMIN}>Institution Admin</option>
                              <option value={UserRole.SYSTEM_ADMIN}>System Admin</option>
                            </select>
                            <button onClick={() => handleSaveRole(u.user_id)} className="p-1 hover:bg-slate-100 rounded text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingUserId(null)} className="p-1 hover:bg-slate-100 rounded text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="capitalize font-semibold text-slate-700 dark:text-slate-350">{u.role.replace('_', ' ')}</span>
                            {u.role !== UserRole.SYSTEM_ADMIN && (
                              <button 
                                onClick={() => { setEditingUserId(u.user_id); setTempRole(u.role); }}
                                className="text-[10px] text-navy-500 hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          u.status === UserStatus.ACTIVE 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                            : u.status === UserStatus.PENDING
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                            : 'bg-red-50 dark:bg-red-950/20 text-red-650'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                        {u.role !== UserRole.SYSTEM_ADMIN && u.status !== UserStatus.BANNED && (
                          <button
                            onClick={() => handleBan(u.user_id)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 rounded-lg"
                            title="Ban User"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                        {u.role !== UserRole.SYSTEM_ADMIN && (
                          <button
                            onClick={() => handleDelete(u.user_id)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 rounded-lg"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
