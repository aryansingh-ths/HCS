import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, ShieldCheck, ShieldAlert, Clock, ChevronRight } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function DashboardOverview({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingRequests: 0,
    activeLicenses: 0,
    revokedLicenses: 0,
    expiringSoon: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch analytics:', err);
        setLoading(false);
      });
  }, []);

  const statCards = [
    { title: 'Total Clients', value: stats.totalClients, icon: <Users size={24} className="text-[#457B9D]" />, bg: 'bg-[#457B9D]/10', action: () => setActiveTab('clients') },
    { title: 'Active Licenses', value: stats.activeLicenses, icon: <ShieldCheck size={24} className="text-emerald-600" />, bg: 'bg-emerald-50', action: () => setActiveTab('vault') },
    { title: 'Pending Activations', value: stats.pendingRequests, icon: <Activity size={24} className="text-amber-600" />, bg: 'bg-amber-50', action: () => setActiveTab('queue') },
    { title: 'Revoked Licenses', value: stats.revokedLicenses, icon: <ShieldAlert size={24} className="text-rose-600" />, bg: 'bg-rose-50', action: () => setActiveTab('vault') }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#457B9D]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#457B9D] tracking-tight">System Overview</h2>
        <p className="text-slate-500 font-bold mt-1 text-sm">Real-time metrics and system health monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-6 flex-1 min-h-0 pb-8">
        {statCards.map((card, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={card.title}
            onClick={card.action}
            className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 cursor-pointer hover:shadow-[0_8px_30px_rgb(69,123,157,0.1)] transition-all group flex flex-col justify-center items-center text-center"
          >
            <div className={`p-4 rounded-2xl ${card.bg} mb-4 transition-transform group-hover:scale-110`}>
              {React.cloneElement(card.icon, { size: 32 })}
            </div>
            <div>
              <h3 className="text-5xl font-black text-slate-800 mb-2">{card.value}</h3>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>


    </div>
  );
}
