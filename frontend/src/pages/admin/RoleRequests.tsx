import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/adminService';
import type { User } from '../../types';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

export const RoleRequests: React.FC = () => {
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const all = await AdminService.getRoleChangeRequests();
      setRequests(all);
    } catch (err) {
      console.error("Failed to load role requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (userId: number) => {
    try {
      await AdminService.approveRoleChange(userId);
      loadRequests();
      alert("Role upgrade request approved.");
    } catch (err: any) {
      alert(err.message || "Failed to approve request.");
    }
  };

  const handleDecline = async (userId: number) => {
    if (!window.confirm("Decline this role upgrade request?")) return;
    try {
      // Direct modify via service to clear requested role
      await AdminService.changeUserRole(userId, (await AdminService.getAllUsers()).find(u => u.user_id === userId)!.role);
      // Wait, we want to clear the requested role field. In adminService.ts, changeUserRole changes role, but doesn't clear requested_role.
      // Let's modify adminService.ts if needed, or in mock database we can just clear it.
      // Let's clear the requested_role field in mock DB:
      const users = (await AdminService.getAllUsers());
      const idx = users.findIndex(u => u.user_id === userId);
      if (idx !== -1) {
        users[idx].requested_role = null;
        localStorage.setItem("scn_users", JSON.stringify(users));
      }
      loadRequests();
      alert("Role upgrade request declined.");
    } catch (err: any) {
      alert(err.message || "Failed to decline request.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-655" />
            Upgrade Requests Queue
          </h1>
          <p className="text-slate-500 text-sm">Review credentials upgrades and adjust active researcher roles.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Loading request queue...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-450 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          No pending role upgrade requests in queue.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 font-semibold">
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3">Current Role</th>
                  <th className="px-6 py-3">Requested Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {requests.map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">SCN-USER-{u.user_id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{u.email}</td>
                    <td className="px-6 py-4 capitalize text-slate-500">{u.role.replace('_', ' ')}</td>
                    <td className="px-6 py-4 capitalize text-emerald-600 font-semibold">{u.requested_role?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprove(u.user_id)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900/60 border border-emerald-100 dark:border-emerald-900/20 rounded-lg text-xs font-semibold text-emerald-600 inline-flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleDecline(u.user_id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900/60 border border-red-100 dark:border-red-900/20 rounded-lg text-xs font-semibold text-red-650 inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
