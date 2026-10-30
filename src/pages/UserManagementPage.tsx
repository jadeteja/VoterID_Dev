import React, { useState } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import type { UserProfile, UserRole } from '@/types';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([
    {
      id: 'usr-1',
      display_name: 'Ward 81 Election Officer',
      role: 'admin',
      active: true,
      created_at: '2026-09-22T08:00:00Z',
    },
    {
      id: 'usr-2',
      display_name: 'Booth Agent 81/1',
      role: 'search_user',
      active: true,
      created_at: '2026-09-23T10:30:00Z',
    },
    {
      id: 'usr-3',
      display_name: 'Booth Agent 81/2',
      role: 'search_user',
      active: true,
      created_at: '2026-09-23T10:35:00Z',
    },
  ]);

  const toggleUserStatus = (id: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  };

  const changeRole = (id: string, newRole: UserRole) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          User Access Management / వినియోగదారుల నిర్వహణ
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-telugu mt-0.5">
          పాత్రలు మరియు అనుమతుల కేటాయింపు (RBAC)
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-700">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm">Authorized Operators</h3>
          </div>
          <span className="text-xs text-slate-500">{users.length} accounts configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.display_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                      className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="admin">Administrator</option>
                      <option value="search_user">Search User</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        u.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`p-1.5 rounded-lg border transition ${
                        u.active
                          ? 'text-red-600 hover:bg-red-50 border-red-200'
                          : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                      }`}
                      title={u.active ? 'Disable Access' : 'Enable Access'}
                    >
                      {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
