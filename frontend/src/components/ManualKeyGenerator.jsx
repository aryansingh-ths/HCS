import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Key, Copy, CheckCircle2, Loader2, Server, Globe } from 'lucide-react';
import { apiFetch } from '../utils/api';

const availableModules = [
  { id: 'FRONT_DESK', label: 'Front Desk' },
  { id: 'DINING', label: 'Dining' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping' },
  { id: 'SALES', label: 'Sales' },
  { id: 'TRAVELS', label: 'Travels' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'ADMIN', label: 'Admin' }
];

export default function ManualKeyGenerator({ onClose, onToast }) {
  const [step, setStep] = useState(1); // 1: client, 2: telemetry & config, 3: generating, 4: success
  const [generatedKey, setGeneratedKey] = useState('');
  const [clients, setClients] = useState([]);
  
  const [selectedClientId, setSelectedClientId] = useState('');

  // Step 2 State
  const [formData, setFormData] = useState({
    hardwareId: '',
    hostname: '',
    publicIp: '0.0.0.0',
    localIp: '0.0.0.0',
    city: 'Offline',
    country: 'Offline',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: ['FRONT_DESK']
  });

  useEffect(() => {
    apiFetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0]._id);
        }
      })
      .catch(err => console.error('Failed to fetch clients:', err));
  }, []);

  const handleToggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId]
    }));
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (!selectedClientId) {
        onToast('Please select a client profile.');
        return;
    }
    setStep(2);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (formData.modules.length === 0) {
        onToast('Please select at least one module.');
        return;
    }

    setStep(3);

    try {
      const response = await apiFetch('/api/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          machineId: formData.hardwareId,
          expiresAt: formData.expiresAt,
          modules: formData.modules,
          hostname: formData.hostname || "Offline-Generated-Server",
          networkInfo: {
            publicIp: formData.publicIp,
            localIp: formData.localIp,
            city: formData.city,
            country: formData.country
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate key');
      
      const data = await response.json();
      setGeneratedKey(data.licenseKey);
      setStep(4);
    } catch (error) {
      console.error(error);
      onToast('Error generating license key');
      setStep(2);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    onToast('Offline Key copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto py-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col border border-slate-100 relative my-auto"
      >
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-[#F9F7F3] rounded-t-[2rem]">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#457B9D] text-white rounded-xl flex items-center justify-center shadow-inner">
              <Key size={18} />
            </div>
            Manual Key Generator <span className="text-sm font-bold text-slate-400">Step {step > 2 ? 2 : step} of 2</span>
          </h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-slate-700 shadow-sm flex items-center justify-center transition-colors"><X size={20}/></button>
        </div>

        <div className="p-8">
          
          {/* STEP 1: CLIENT SELECTION / REGISTRATION */}
          {step === 1 && (
            <form onSubmit={handleClientSubmit} className="space-y-6">
              <div className="mb-8">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Assign Client Profile</label>
                <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700 appearance-none cursor-pointer">
                  {clients.length === 0 && <option value="">-- No Clients Available --</option>}
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full bg-[#457B9D] hover:bg-[#34617D] text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgb(69,123,157,0.3)] tracking-widest uppercase text-sm flex items-center justify-center gap-2">
                Continue to Telemetry
              </button>
            </form>
          )}

          {/* STEP 2: TELEMETRY & CONFIG */}
          {step === 2 && (
            <form onSubmit={handleGenerate} className="space-y-8">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm">
                <strong>AIR-GAPPED FALLBACK:</strong> Collect these details manually from the deployment engineer. All fields are required to correctly cryptographically sign the license payload.
              </div>

              {/* Telemetry Section */}
              <section>
                <h4 className="text-[11px] font-black text-[#457B9D] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><Server size={14}/> Server Telemetry</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Hardware ID (MAC)</label>
                    <input type="text" required placeholder="e.g. TAJ-MAC-8842-B7" value={formData.hardwareId} onChange={e => setFormData({...formData, hardwareId: e.target.value.toUpperCase()})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-mono font-bold text-slate-700 uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Hostname</label>
                    <input type="text" required placeholder="e.g. SRV-FRONTDESK-01" value={formData.hostname} onChange={e => setFormData({...formData, hostname: e.target.value})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Public IP</label>
                    <input type="text" required placeholder="0.0.0.0" value={formData.publicIp} onChange={e => setFormData({...formData, publicIp: e.target.value})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-mono text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Local IP</label>
                    <input type="text" required placeholder="192.168.1.100" value={formData.localIp} onChange={e => setFormData({...formData, localIp: e.target.value})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-mono text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">City</label>
                    <input type="text" required placeholder="Mumbai" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Country</label>
                    <input type="text" required placeholder="India" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
                  </div>
                </div>
              </section>

              {/* Approval Section */}
              <section>
                <h4 className="text-[11px] font-black text-[#457B9D] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><Globe size={14}/> License Configuration</h4>
                
                <div className="mb-5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">License Expiry Date</label>
                    <div className="grid grid-cols-1 gap-3">
                      <input type="date" required value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full border-0 shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Active Modules</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableModules.map(mod => (
                        <label key={mod.id} className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${formData.modules.includes(mod.id) ? 'bg-white shadow-[0_4px_15px_rgb(0,0,0,0.05)] border border-[#CBA36E]/40' : 'bg-[#F9F7F3] border border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${formData.modules.includes(mod.id) ? 'bg-[#CBA36E] border-[#CBA36E]' : 'bg-white border-slate-300'}`}>
                            {formData.modules.includes(mod.id) && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <span className={`text-sm font-bold ${formData.modules.includes(mod.id) ? 'text-slate-800' : 'text-slate-500'}`}>{mod.label}</span>
                          <input type="checkbox" className="hidden" checked={formData.modules.includes(mod.id)} onChange={() => handleToggleModule(mod.id)} />
                        </label>
                      ))}
                    </div>
                </div>
              </section>

              <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Back
                  </button>
                  <button type="submit" className="flex-1 bg-[#457B9D] hover:bg-[#34617D] text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgb(69,123,157,0.3)] tracking-widest uppercase text-sm flex items-center justify-center gap-2">
                    <Key size={18} /> Generate Encrypted Payload
                  </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 size={48} className="text-[#457B9D] animate-spin mb-6" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Generating RS256 Token...</h3>
              <p className="text-slate-500 font-bold mt-2">Signing hardware fingerprint mathematically.</p>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Key Generated Successfully</h3>
              <p className="text-sm font-bold text-slate-500 mb-8 max-w-md">Provide this encrypted string to the deployment engineer. It can be pasted directly into the locked server UI.</p>
              
              <div className="w-full bg-[#F9F7F3] border-2 border-dashed border-[#CBA36E]/40 rounded-2xl p-6 relative group mb-8 shadow-inner">
                <p className="font-mono text-sm font-bold text-slate-700 break-all text-left pr-12 leading-relaxed">{generatedKey}</p>
                <button onClick={copyToClipboard} className="absolute top-4 right-4 bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-slate-500 hover:text-[#CBA36E] hover:border-[#CBA36E] transition-all hover:shadow-md">
                  <Copy size={20} />
                </button>
              </div>

              <button onClick={onClose} className="text-[11px] font-black text-slate-400 hover:text-slate-700 tracking-widest uppercase bg-slate-50 hover:bg-slate-100 px-6 py-3 rounded-xl transition-colors">
                Close Window
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
