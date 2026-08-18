import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientRegistry({ onToast }) {
  const [clients, setClients] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    propertyName: '',
    contact: '',
    email: '',
    status: 'Inactive'
  });

  const fetchClients = () => {
    fetch('https://hcs-backend-jrvz.onrender.com/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error('Failed to fetch clients:', err));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://hcs-backend-jrvz.onrender.com/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to add client');
      onToast('Client registered successfully');
      setIsAdding(false);
      setFormData({ name: '', propertyName: '', contact: '', email: '', status: 'Inactive' });
      fetchClients();
    } catch (error) {
      console.error(error);
      onToast('Error registering client');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#457B9D] tracking-tight">Client Registry</h2>
          <p className="hidden sm:block text-slate-500 font-bold mt-1 text-sm">Manage enterprise clients and their properties.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#CBA36E] hover:bg-[#B5905C] text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(203,163,110,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Plus size={16} /> Register Client
        </button>
      </div>

      {isAdding ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 mb-8 flex-1 overflow-y-auto hide-scrollbar">
          <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><Building2 size={20} className="text-[#457B9D]"/> New Client Registration</h3>
          <form onSubmit={handleAddClient} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Company / Entity Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Property Name (Location)</label>
              <input type="text" required value={formData.propertyName} onChange={e => setFormData({...formData, propertyName: e.target.value})} className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Contact Person</label>
              <input type="text" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border-0 shadow-[0_4px_15px_rgb(0,0,0,0.03)] bg-[#F9F7F3] rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#CBA36E] outline-none font-bold text-slate-700 appearance-none cursor-pointer">
                <option value="Inactive">Inactive</option>
                <option value="Active">Active</option>
              </select>
            </div>
            <div className="hidden sm:block sm:col-span-1"></div>
            <div className="sm:col-span-2 flex justify-end gap-4 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="bg-[#457B9D] hover:bg-[#34617D] text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md">Register</button>
            </div>
          </form>
        </motion.div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] mb-6 flex gap-4 border border-slate-50">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F5F0E6]/50 border-0 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#CBA36E] transition-all" 
              />
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 flex-1 overflow-y-auto overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F9F7F3]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Property Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800">{client.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{client.clientId || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-600">{client.propertyName}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{client.propertyId || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{client.contact}</span>
                        <span className="text-xs text-slate-400">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        client.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {client.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
