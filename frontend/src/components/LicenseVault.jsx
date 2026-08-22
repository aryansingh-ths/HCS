import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, ShieldAlert, Ban } from 'lucide-react';
import { apiFetch } from '../utils/api';
import ManualKeyGenerator from './ManualKeyGenerator';

const availableModules = [
  { id: 'FRONT_DESK', label: 'Front Desk & CRM', short: 'FD' },
  { id: 'DINING', label: 'Dining & POS', short: 'DIN' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping Automation', short: 'HSK' },
  { id: 'FINANCE', label: 'Finance & Ledgers', short: 'FIN' }
];

export default function LicenseVault({ onToast }) {
  const [licenses, setLicenses] = useState([]);
  const [isManualGeneratorOpen, setIsManualGeneratorOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const fetchLicenses = () => {
    apiFetch('/api/licenses')
      .then(res => res.json())
      .then(data => {
        setLicenses(data.map(lic => {
          let computedStatus = 'Active';
          if (lic.status === 'REVOKED') computedStatus = 'Revoked';
          else if (lic.status === 'EXPIRED') computedStatus = 'Expired';
          else if (new Date(lic.expiresAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            computedStatus = 'Expiring Soon';
          }

          return {
            ...lic,
            id: lic._id,
            client: lic.client?.name || 'Unknown',
            mac: lic.hardwareId || lic.machineId || 'Unknown',
            expiry: new Date(lic.expiresAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            status: computedStatus
          };
        }));
      })
      .catch(err => {
        console.error('Failed to fetch licenses:', err);
        onToast('Failed to load license vault');
      });
  };

  React.useEffect(() => {
    fetchLicenses();
  }, []);

  const handleRevokeLicense = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to permanently REVOKE this license? This will lock out the client machine immediately.")) return;
    try {
      const response = await apiFetch(`/api/licenses/${id}/revoke`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed to revoke');
      onToast('License revoked successfully');
      fetchLicenses();
    } catch (err) {
      console.error(err);
      onToast('Error revoking license');
    }
  };

  const filteredLicenses = licenses.filter(lic => {
    const matchesSearch = lic.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lic.mac.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-[#457B9D] tracking-tight">License Vault</h2>
            <p className="hidden sm:block text-slate-500 font-bold mt-1 text-sm">Master cryptographic ledger of all deployed hotel servers.</p>
          </div>
          <button 
            onClick={() => setIsManualGeneratorOpen(true)}
            className="bg-[#CBA36E] hover:bg-[#B5905C] text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(203,163,110,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} /> Generate Manual Key
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] mb-6 flex gap-4 border border-slate-50">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Client or Hardware ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F0E6]/50 border-0 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#CBA36E] transition-all" 
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F0E6]/50 border-0 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#CBA36E] cursor-pointer"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Expiring Soon</option>
            <option>Expired</option>
            <option>Revoked</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F9F7F3]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hardware ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Modules</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map(lic => (
                <tr key={lic.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 font-black text-slate-800">{lic.client}</td>
                  <td className="px-6 py-5 text-sm font-mono font-bold text-slate-500">{lic.mac}</td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                      {lic.modules.map(mod => {
                        const moduleData = availableModules.find(m => m.id === mod);
                        return (
                          <span key={mod} className="bg-[#457B9D]/10 text-[#457B9D] px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-[#457B9D]/20">
                            {moduleData ? moduleData.short : mod}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-600">{lic.expiry}</td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      lic.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                      lic.status === 'Revoked' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      lic.status === 'Expiring Soon' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        lic.status === 'Active' ? 'bg-emerald-500' : 
                        lic.status === 'Revoked' ? 'bg-rose-500' : 
                        lic.status === 'Expiring Soon' ? 'bg-orange-500' : 'bg-amber-500'
                      }`}></span>
                      {lic.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {(lic.status === 'Active' || lic.status === 'Expiring Soon') && (
                      <button 
                        onClick={() => handleRevokeLicense(lic.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Revoke License"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Key Generator Modal Overlay */}
      <AnimatePresence>
        {isManualGeneratorOpen && (
          <ManualKeyGenerator 
            onClose={() => setIsManualGeneratorOpen(false)} 
            onToast={onToast} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
