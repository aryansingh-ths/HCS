import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('token', data.token);
        onLogin();
      } else {
        setError(data.error || 'Invalid username or password');
        setShake(prev => prev + 1); // Trigger shake animation
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
      setShake(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      
      {/* Animated Background Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#CBA36E]/20 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#457B9D]/20 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: shake > 0 ? [-10, 10, -10, 10, 0] : 0 
        }}
        transition={{ 
          x: { type: "spring", stiffness: 300, damping: 10 },
          default: { duration: 0.3 }
        }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 border border-white/50 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.img 
            src="/techhansa-logo.png" 
            alt="Company Logo"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="h-20 w-auto object-contain drop-shadow-sm mb-4 cursor-pointer"
          />
          <h2 className="text-2xl font-black text-[#8B5E3C] tracking-tight text-center leading-none">Pragati Control System</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#457B9D] mt-2">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Floating Label Username Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#CBA36E] transition-colors z-10">
              <Lock size={18} />
            </div>
            <input 
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="peer w-full pl-12 pr-4 pt-6 pb-2 bg-[#F9F7F3] border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 focus:border-[#CBA36E]/30 focus:bg-white outline-none transition-all shadow-inner"
              placeholder=" "
              required
            />
            <label 
              htmlFor="username" 
              className="absolute left-12 top-4 text-xs font-bold text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#CBA36E] peer-valid:top-1.5 peer-valid:text-[10px] uppercase tracking-wider pointer-events-none"
            >
              Username
            </label>
          </div>

          {/* Floating Label Password Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#CBA36E] transition-colors z-10">
              <Key size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full pl-12 pr-12 pt-6 pb-2 bg-[#F9F7F3] border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 focus:border-[#CBA36E]/30 focus:bg-white outline-none transition-all shadow-inner"
              placeholder=" "
              required
            />
            <label 
              htmlFor="password" 
              className="absolute left-12 top-4 text-xs font-bold text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#CBA36E] peer-valid:top-1.5 peer-valid:text-[10px] uppercase tracking-wider pointer-events-none"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: -4 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-bold text-rose-500 text-center bg-rose-50 py-2 rounded-lg border border-rose-100">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            type="submit" 
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-2 bg-gradient-to-r from-[#CBA36E] to-[#b8915b] text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-[#CBA36E]/40 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Authenticate Access'}
          </motion.button>
        </form>

      </motion.div>
    </div>
  );
}
