import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, CheckCircle2, ShieldAlert, X, ChevronRight, Activity, Globe } from 'lucide-react';



const availableModules = [
  { id: 'FRONT_DESK', label: 'Front Desk & CRM' },
  { id: 'DINING', label: 'Dining & POS' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping Automation' },
  { id: 'FINANCE', label: 'Finance & Ledgers' }
];

export default function ActivationQueue({ onToast }) {
  const [pending, setPending] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  const [clients, setClients] = useState([]);

  // Drawer state
  const [formData, setFormData] = useState({ clientId: '', modules: ['FRONT_DESK'], duration: '1 Year' });

  // Fetch pending requests
  React.useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        if (data.length > 0) {
            setFormData(prev => ({ ...prev, clientId: data[0]._id }));
        }
      })
      .catch(err => console.error('Failed to fetch clients:', err));

    fetch('/api/activation-requests')
      .then(res => res.json())
      .then(data => {
        setPending(data.map(req => ({
          ...req,
          id: req._id,
          time: new Date(req.createdAt).toLocaleString(),
          mac: req.hardwareId,
          ip: `${req.networkInfo?.city || 'Unknown'}, ${req.networkInfo?.country || ''} — ${req.networkInfo?.publicIp || '0.0.0.0'}`
        })));
      })
      .catch(err => {
        console.error('Failed to fetch activation requests:', err);
        onToast('Failed to load activation queue');
      });
  }, [onToast]);



  const handleApprove = async () => {
    setIsApproving(true);
    
    try {
      if (!formData.clientId) {
          throw new Error('Please select a client first');
      }

      const durationMap = { '1 Year': 12, '3 Years': 36, 'Lifetime': 1200 };
      
      const payload = {
        clientId: formData.clientId,
        validMonths: durationMap[formData.duration] || 12,
        modules: formData.modules
      };

      const response = await fetch(`/api/activation-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Generation failed');

      setPending(prev => prev.filter(req => req.id !== selectedRequest.id));
      setIsApproving(false);
      setSelectedRequest(null);
      onToast(`License generated and transmitted to ${selectedRequest.hostname}`);
    } catch (error) {
      console.error(error);
      setIsApproving(false);
      onToast('Error generating license key');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-[#457B9D] tracking-tight">Activation Queue</h2>
            <p className="hidden sm:block text-slate-500 font-bold mt-1 text-sm">Servers actively polling for cryptographic handshake.</p>
          </div>
          <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {pending.length} Pending Requests
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 min-h-[400px]">
             <div className="w-24 h-24 bg-[#F5F0E6] rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
               <ShieldAlert size={40} className="text-[#CBA36E] opacity-60" />
             </div>
             <h3 className="text-2xl font-black text-slate-700 tracking-tight mb-2">Queue is Empty</h3>
             <p className="text-slate-500 font-medium leading-relaxed">No hotel servers are currently awaiting activation.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F9F7F3]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hostname</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">MAC / Hardware ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {pending.map(req => (
                    <motion.tr 
                      key={req.id}
                      initial={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50, backgroundColor: '#F0FDF4' }}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-5 text-sm font-bold text-slate-500">{req.time}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F5F0E6] flex items-center justify-center text-[#CBA36E]">
                            <Server size={14} />
                          </div>
                          <span className="font-black text-slate-800">{req.hostname}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-mono font-bold text-slate-600">{req.mac}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <Globe size={14} className="text-[#457B9D]" /> {req.ip}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="bg-[#CBA36E] hover:bg-[#B5905C] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 ml-auto shadow-[0_4px_15px_rgb(203,163,110,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
                        >
                          Review <ChevronRight size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up Modal Overlay */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col rounded-[2rem] border border-slate-100 relative z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F9F7F3]">
                <h3 className="font-black text-xl text-slate-800">Approve Server</h3>
                <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 shadow-sm flex items-center justify-center transition-colors"><X size={16}/></button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="bg-[#457B9D] p-5 rounded-2xl text-white mb-6 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10"><Activity size={100} className="-mt-4 -mr-4" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#F5F0E6] mb-1">Target Server</p>
                  <p className="font-mono font-bold text-lg">{selectedRequest.mac}</p>
                  <p className="text-sm mt-1 text-[#F5F0E6]">{selectedRequest.hostname}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign to Client</label>
                    <select 
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700 appearance-none cursor-pointer">
                      {clients.length === 0 && <option value="">-- No Clients Available --</option>}
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Duration</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['1 Year', '3 Years', 'Lifetime'].map(dur => (
                        <button key={dur} onClick={() => setFormData({...formData, duration: dur})} className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${formData.duration === dur ? 'bg-[#CBA36E] text-white border-[#CBA36E] shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Licensed Modules</label>
                    <div className="grid grid-cols-1 gap-3">
                      {availableModules.map(mod => (
                        <label key={mod.id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${formData.modules.includes(mod.id) ? 'bg-white shadow-[0_4px_15px_rgb(0,0,0,0.05)] border border-[#CBA36E]/40' : 'bg-[#F9F7F3] border border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${formData.modules.includes(mod.id) ? 'bg-[#CBA36E] border-[#CBA36E]' : 'bg-white border-slate-300'}`}>
                            {formData.modules.includes(mod.id) && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <span className={`text-sm font-bold ${formData.modules.includes(mod.id) ? 'text-slate-800' : 'text-slate-500'}`}>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-[#F9F7F3]">
                <button 
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full bg-[#457B9D] hover:bg-[#34617D] text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgb(69,123,157,0.3)] tracking-widest uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isApproving ? 'Generating Key...' : 'Sign & Transmit Key'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
