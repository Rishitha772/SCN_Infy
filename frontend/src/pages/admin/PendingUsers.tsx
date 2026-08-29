import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/adminService';
import type { User } from '../../types';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const PendingUsers: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    setLoading(true);
    try {
      const pending = await AdminService.getPendingUsers();
      setPendingUsers(pending);
    } catch (err) {
      console.error("Failed to load pending users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (userId: number) => {
    try {
      await AdminService.approveUser(userId);
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      alert("User registration approved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to approve user.");
    }
  };

  const handleReject = async (userId: number) => {
    if (!window.confirm("Reject this registration application?")) return;
    try {
      await AdminService.rejectUser(userId);
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      alert("User registration rejected.");
    } catch (err: any) {
      alert(err.message || "Failed to reject user.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="w-8 h-8 text-amber-500" />
            Pending Approvals
          </h1>
          <p className="text-slate-500 text-sm">Review registration domains and grant access privileges to SCN.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-550 text-sm font-semibold">Scanning registration logs...</span>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-450 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          No pending user registrations awaiting approval.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 font-semibold">
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Institutional Email</th>
                  <th className="px-6 py-3">Requested Role</th>
                  <th className="px-6 py-3">Email Verified</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {pendingUsers.map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">SCN-USER-{u.user_id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{u.email}</td>
                    <td className="px-6 py-4 capitalize text-slate-500 font-semibold">{u.requested_role || u.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.is_verified 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                          : 'bg-red-50 dark:bg-red-950/20 text-red-600'
                      }`}>
                        {u.is_verified ? 'Verified' : 'Pending OTP'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprove(u.user_id)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900/60 border border-emerald-100 dark:border-emerald-900/20 rounded-lg text-xs font-semibold text-emerald-600 inline-flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(u.user_id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900/60 border border-red-100 dark:border-red-900/20 rounded-lg text-xs font-semibold text-red-650 inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
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
