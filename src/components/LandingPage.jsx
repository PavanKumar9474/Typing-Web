import React, { useState } from 'react';
import { synth } from '../utils/soundSynth';
import { api } from '../utils/api';
import { 
  Compass, Sparkles, Play, Shield, Cpu, Moon, 
  Lock, User, AlertCircle, LogIn, UserPlus 
} from 'lucide-react';

export default function LandingPage({ onStartGuest, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      synth.playError();
      return;
    }
    setError('');
    setLoading(true);
    synth.playClick();

    try {
      let user;
      if (mode === 'login') {
        user = await api.login(username, password);
      } else {
        user = await api.register(username, password);
      }
      synth.playSpellCast();
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
      synth.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleStartGuest = () => {
    synth.playSpellCast();
    onStartGuest();
  };

  return (
    <div className="w-full min-h-screen bg-[#05060f] flex flex-col items-center justify-center p-6 text-center select-none font-mono relative overflow-hidden">
      
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="max-w-3xl z-10 space-y-8 w-full">
        
        {/* Floating badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/40 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-black uppercase tracking-widest animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Typing Adventure
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 tracking-wider uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            Typing Odyssey
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Slay ancient dragons, reconstruct timeline fractures across history, shoot lasers at falling asteroids, and build custom worlds—all through the speed and precision of your typing.
          </p>
        </div>

        {/* Authentication Card */}
        <div className="max-w-md mx-auto bg-[#111625]/90 border border-white/5 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative w-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 blur-xl rounded-full"></div>
          
          <div className="flex border-b border-white/5 mb-6">
            <button
              onClick={() => { synth.playClick(); setMode('login'); setError(''); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'login' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { synth.playClick(); setMode('register'); setError(''); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'register' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-cyan-500/50 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-cyan-500/50 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all font-black text-xs tracking-widest text-white rounded-xl shadow-md uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Loading...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Profile
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            onClick={handleStartGuest}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 transition-all font-bold text-xs tracking-widest text-cyan-400 border border-cyan-500/10 rounded-xl uppercase cursor-pointer"
          >
            Play as Guest (Offline)
          </button>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 max-w-2xl mx-auto">
          <div className="bg-[#111625]/60 border border-white/5 p-5 rounded-2xl">
            <Cpu className="w-6 h-6 text-cyan-400 mx-auto mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Coaching</h3>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Real-time stroke latency diagnostics and custom key suggestions.</p>
          </div>

          <div className="bg-[#111625]/60 border border-white/5 p-5 rounded-2xl">
            <Compass className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Time Architect</h3>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Rebuild Egyptian pyramids, Dinosaur terrain and Cyberpunk structures.</p>
          </div>

          <div className="bg-[#111625]/60 border border-white/5 p-5 rounded-2xl">
            <Shield className="w-6 h-6 text-emerald-400 mx-auto mb-2 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cosmetics Store</h3>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Spend earned gold coins on keyboard sound clickers and UI themes.</p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[10px] text-gray-600 border-t border-white/5 pt-4">
        <span>© 2026 TYPING ODYSSEY CORP.</span>
        <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> SECURE WEB CLIENT CONNECTION ACTIVE</span>
      </div>

    </div>
  );
}
