import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Key, UserPlus, LogIn, AlertTriangle, UserMinus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    apiFetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  };

  const getActionConfig = (action) => {
    switch (action) {
      case 'LOGIN_SUCCESS': return { icon: <LogIn size={18} />, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Login' };
      case 'LOGIN_FAILED': return { icon: <AlertTriangle size={18} />, bg: 'bg-rose-100', text: 'text-rose-700', label: 'Failed Login' };
      case 'CLIENT_CREATED': return { icon: <UserPlus size={18} />, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Client Created' };
      case 'CLIENT_UPDATED': return { icon: <Activity size={18} />, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Client Updated' };
      case 'CLIENT_DELETED': return { icon: <UserMinus size={18} />, bg: 'bg-rose-100', text: 'text-rose-700', label: 'Client Deleted' };
      case 'LICENSE_GENERATED': return { icon: <Key size={18} />, bg: 'bg-purple-100', text: 'text-purple-700', label: 'License Generated' };
      case 'LICENSE_REVOKED': return { icon: <ShieldAlert size={18} />, bg: 'bg-rose-100', text: 'text-rose-700', label: 'License Revoked' };
      case 'ACTIVATION_APPROVED': return { icon: <ShieldCheck size={18} />, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Activation Approved' };
      default: return { icon: <Activity size={18} />, bg: 'bg-slate-100', text: 'text-slate-700', label: action };
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#457B9D]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative p-4 md:p-8 overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-[#457B9D] tracking-tight">System Audit Log</h2>
          <p className="text-slate-500 font-bold mt-1 text-sm">A permanent record of all administrative actions.</p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
        >
          Refresh Log
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 p-2 md:p-6 flex-1">
        {logs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No audit logs found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => {
              const config = getActionConfig(log.action);
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={log._id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl bg-[#F9F7F3] border border-slate-100 hover:border-[#457B9D]/30 transition-colors"
                >
                  <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${config.bg} ${config.text}`}>
                    {config.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{log.details}</p>
                  </div>
                  
                  <div className="shrink-0 md:text-right mt-2 md:mt-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Admin User</p>
                    <p className="text-sm font-bold text-[#457B9D] flex items-center md:justify-end gap-1.5">
                      <UserPlus size={14} className="opacity-50" /> {log.user}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
