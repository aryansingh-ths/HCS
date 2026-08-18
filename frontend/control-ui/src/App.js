import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Users, CheckCircle2, Activity, Menu, X } from 'lucide-react';
import ActivationQueue from './components/ActivationQueue';
import LicenseVault from './components/LicenseVault';
import ClientRegistry from './components/ClientRegistry';

function MissionControl() {
  const [activeTab, setActiveTab] = useState('queue');
  const [toastMessage, setToastMessage] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const fetchCount = () => {
      fetch('https://hcs-backend-jrvz.onrender.com/api/activation-requests')
        .then(res => res.json())
        .then(data => setPendingCount(data.length))
        .catch(err => console.error('Failed to fetch queue count:', err));
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* ─── TOP GLOBAL HEADER ─── */}
      <header className="bg-white px-4 md:px-8 py-3 flex items-center justify-between shadow-[0_4px_30px_rgb(0,0,0,0.03)] z-20 border-b border-slate-100 relative">
        <div className="flex items-center gap-3 md:gap-6">
          <img src="/techhansa-logo.png" alt="Company Logo" className="h-12 md:h-20 w-auto object-contain drop-shadow-sm" />
          <div className="border-l-2 border-slate-100 pl-3 md:pl-6">
            <h1 className="text-lg md:text-2xl font-black text-[#8B5E3C] tracking-tight leading-none">Pragati Control System</h1>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#457B9D] mt-1">Enterprise Administration</p>
          </div>
        </div>

        {/* Hamburger Menu Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
        
        {/* ─── LEFT SIDEBAR ─── */}
        <div className={`${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 translate-x-0' : 'fixed inset-y-0 left-0 z-40 -translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 w-72 shrink-0 bg-[#F9F7F3] m-0 lg:m-5 rounded-r-[2rem] lg:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col overflow-hidden border border-slate-50 h-full lg:h-auto`}>
          
          <div className="p-6 flex items-center gap-3 border-b border-slate-100/50 bg-white/50">
            <div className="w-10 h-10 rounded-xl bg-[#457B9D] flex items-center justify-center text-white shadow-inner">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-slate-800 font-black tracking-tight text-lg leading-tight">Mission Control</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Cloud Online</p>
              </div>
            </div>
          </div>

          <nav className="p-4 flex flex-col gap-2 mt-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2">Core Hub</p>
            
            <button onClick={() => { setActiveTab('queue'); setIsMobileMenuOpen(false); }} className={`flex justify-between items-center px-5 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'queue' ? 'bg-[#CBA36E] text-white shadow-lg shadow-[#CBA36E]/30' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}>
              <span className="flex items-center gap-3"><Activity size={16} /> Activation Queue</span>
              {activeTab !== 'queue' && pendingCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{pendingCount}</span>}
            </button>
            
            <button onClick={() => { setActiveTab('vault'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'vault' ? 'bg-[#CBA36E] text-white shadow-lg shadow-[#CBA36E]/30' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}>
              <Key size={16} /> License Vault
            </button>
            
            <button onClick={() => { setActiveTab('registry'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'registry' ? 'bg-[#CBA36E] text-white shadow-lg shadow-[#CBA36E]/30' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}>
              <Users size={16} /> Client Registry
            </button>

          </nav>
        </div>

        {/* ─── MAIN CANVAS ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F5F0E6] relative">
          
          <AnimatePresence mode="wait">
            {activeTab === 'queue' && (
              <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0">
                <ActivationQueue onToast={showToast} />
              </motion.div>
            )}
            {activeTab === 'vault' && (
              <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0">
                <LicenseVault onToast={showToast} />
              </motion.div>
            )}
            {activeTab === 'registry' && (
              <motion.div key="registry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0">
                <ClientRegistry onToast={showToast} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 font-bold text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <MissionControl />;
}