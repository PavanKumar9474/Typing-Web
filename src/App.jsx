import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Practice from './components/Practice';
import Multiplayer from './components/Multiplayer';
import Store from './components/Store';
import DragonSpell from './components/games/DragonSpell';
import SpaceSurvival from './components/games/SpaceSurvival';
import TimeArchitect from './components/games/TimeArchitect';
import ZombieCity from './components/games/ZombieCity';
import NinjaEscape from './components/games/NinjaEscape';
import CyberHacker from './components/games/CyberHacker';
import NeonDrift from './components/games/NeonDrift';
import AICoach from './components/AICoach';
import { synth } from './utils/soundSynth';
import { api } from './utils/api';
import { 
  Trophy, Coins, LogOut, LayoutDashboard, Brain, 
  Gamepad2, Volume2, VolumeX, ShoppingBag, Terminal 
} from 'lucide-react';

export default function App() {
  const [page, setPage] = useState('landing');
  const [username, setUsername] = useState('Guest');
  const [coins, setCoins] = useState(120);
  const [xp, setXp] = useState(150);
  const [avgWpm, setAvgWpm] = useState(65);
  const [avgAccuracy, setAvgAccuracy] = useState(97);
  const [keyMetrics, setKeyMetrics] = useState({});
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [activeSound, setActiveSound] = useState('mechanical');
  const [activeTheme, setActiveTheme] = useState('cyberpunk');
  const [muted, setMuted] = useState(false);
  
  // Drill text state passed from AI Coach to Practice Mode
  const [customDrillText, setCustomDrillText] = useState('');

  // Load user profile if authenticated on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (api.isAuthenticated()) {
        try {
          const user = await api.getProfile();
          setUsername(user.username);
          const profile = user.profile || {};
          setCoins(profile.coins ?? 120);
          setXp(profile.xp ?? 150);
          setAvgWpm(profile.avg_wpm ?? 65);
          setAvgAccuracy(profile.avg_accuracy ?? 97);
          setKeyMetrics(profile.key_metrics ?? {});
          setPurchasedItems(profile.purchased_items ?? []);
          setActiveSound(profile.active_sound ?? 'mechanical');
          setActiveTheme(profile.active_theme ?? 'cyberpunk');
          if (profile.active_sound) {
            synth.setSoundProfile(profile.active_sound);
          }
          setPage('dashboard');
        } catch (err) {
          console.error("Failed to load profile", err);
          api.clearToken();
        }
      }
    };
    loadProfile();
  }, []);

  const handleAuthSuccess = (user) => {
    setUsername(user.username);
    const profile = user.profile || {};
    setCoins(profile.coins ?? 120);
    setXp(profile.xp ?? 150);
    setAvgWpm(profile.avg_wpm ?? 65);
    setAvgAccuracy(profile.avg_accuracy ?? 97);
    setKeyMetrics(profile.key_metrics ?? {});
    setPurchasedItems(profile.purchased_items ?? []);
    setActiveSound(profile.active_sound ?? 'mechanical');
    setActiveTheme(profile.active_theme ?? 'cyberpunk');
    if (profile.active_sound) {
      synth.setSoundProfile(profile.active_sound);
    }
    setPage('dashboard');
  };

  // Handle completed games or practice sessions
  const handleSessionFinished = async (results) => {
    // Local updates first
    let nextCoins = coins;
    let nextXp = xp;
    let nextWpm = avgWpm;
    let nextAcc = avgAccuracy;
    let nextMetrics = { ...keyMetrics };

    if (results.coins) nextCoins += results.coins;
    if (results.xp) nextXp += results.xp;

    // Merge key metrics
    if (results.keyMetrics) {
      Object.entries(results.keyMetrics).forEach(([key, stats]) => {
        if (!nextMetrics[key]) {
          nextMetrics[key] = { total: 0, errors: 0, latencies: [] };
        }
        nextMetrics[key].total += stats.total;
        nextMetrics[key].errors += stats.errors;
        nextMetrics[key].latencies = [...nextMetrics[key].latencies, ...stats.latencies].slice(-15);
      });
    }

    // Update averages
    if (results.wpm) {
      nextWpm = Math.round((avgWpm * 2 + results.wpm) / 3);
    }
    if (results.accuracy) {
      nextAcc = Math.round((avgAccuracy * 2 + results.accuracy) / 3);
    }

    setCoins(nextCoins);
    setXp(nextXp);
    setAvgWpm(nextWpm);
    setAvgAccuracy(nextAcc);
    setKeyMetrics(nextMetrics);

    // Sync to backend if logged in
    if (api.isAuthenticated()) {
      try {
        const response = await api.submitSession({
          game_type: results.gameType || page,
          wpm: results.wpm || 0,
          accuracy: results.accuracy || 0,
          score: results.score || 0,
          coins_earned: results.coins || 0,
          xp_earned: results.xp || 0,
          key_metrics: results.keyMetrics || {}
        });

        // Override local state with accurate database state
        setCoins(response.coins);
        setXp(response.xp);
        setAvgWpm(response.avg_wpm);
        setAvgAccuracy(response.avg_accuracy);
        setKeyMetrics(response.key_metrics);
      } catch (err) {
        console.error("Session sync failed:", err);
      }
    }
  };

  const handleMuteToggle = () => {
    const nextMute = synth.toggleMute();
    setMuted(nextMute);
  };

  const handleNavigate = (targetPage) => {
    synth.playClick();
    setPage(targetPage);
    setCustomDrillText(''); // Clear drill load on manual navigates
  };

  const handleLoadCustomDrill = (drillText) => {
    synth.playSpellCast();
    setCustomDrillText(drillText);
    setPage('practice');
  };

  const handleLogout = () => {
    synth.playClick();
    api.clearToken();
    setUsername('Guest');
    setCoins(120);
    setXp(150);
    setAvgWpm(65);
    setAvgAccuracy(97);
    setKeyMetrics({});
    setPurchasedItems([]);
    setActiveSound('mechanical');
    setActiveTheme('cyberpunk');
    synth.setSoundProfile('mechanical');
    setPage('landing');
  };

  // Render Page Content
  const renderPageContent = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard 
            username={username}
            coins={coins}
            xp={xp}
            wpm={avgWpm}
            accuracy={avgAccuracy}
            keyMetrics={keyMetrics}
            onNavigate={handleNavigate}
          />
        );
      case 'practice':
        return (
          <Practice 
            customDrillText={customDrillText}
            onPracticeComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'practice' });
              setPage('dashboard');
            }}
          />
        );
      case 'multiplayer':
        return (
          <Multiplayer 
            onRaceComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'multiplayer' });
              setPage('dashboard');
            }}
          />
        );
      case 'store':
        return (
          <Store 
            coins={coins}
            setCoins={setCoins}
            purchasedItems={purchasedItems}
            setPurchasedItems={setPurchasedItems}
            activeSound={activeSound}
            setActiveSound={setActiveSound}
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
          />
        );
      case 'game_time_architect':
        return (
          <TimeArchitect 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_time_architect' });
              setPage('dashboard');
            }}
          />
        );
      case 'game_dragon_spell':
        return (
          <DragonSpell 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_dragon_spell' });
              setPage('dashboard');
            }}
          />
        );
      case 'game_space_survival':
        return (
          <SpaceSurvival 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_space_survival' });
              setPage('dashboard');
            }}
          />
        );
      case 'game_zombie_city':
        return (
          <ZombieCity 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_zombie_city' });
              setPage('dashboard');
            }}
          />
        );
      case 'game_ninja_escape':
        return (
          <NinjaEscape 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_ninja_escape' });
              setPage('dashboard');
            }}
          />
        );
      case 'game_cyber_hacker':
        return (
          <CyberHacker 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_cyber_hacker' });
              setPage('dashboard');
            }}
          />
        );
      case 'game_neon_drift':
        return (
          <NeonDrift 
            onGameComplete={(results) => {
              handleSessionFinished({ ...results, gameType: 'game_neon_drift' });
              setPage('dashboard');
            }}
          />
        );
      default:
        return <div className="text-white text-center py-10 font-bold">Node under reconstruction.</div>;
    }
  };

  // Base Landing Page
  if (page === 'landing') {
    return <LandingPage onStartGuest={() => setPage('dashboard')} onAuthSuccess={handleAuthSuccess} />;
  }

  // Active theme layout class mapping
  const getThemeLayoutClass = () => {
    if (activeTheme === 'theme-lava') return 'from-[#1a0f0f] via-[#0d0707] to-black text-rose-100 border-rose-500/20';
    if (activeTheme === 'theme-matrix') return 'from-[#051105] via-[#020502] to-black text-emerald-100 border-emerald-500/20';
    if (activeTheme === 'theme-royal') return 'from-[#11051c] via-[#06020c] to-black text-purple-100 border-purple-500/20';
    return 'from-[#080b11] via-[#040609] to-black text-cyan-100 border-cyan-500/20';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeLayoutClass()} flex flex-col font-mono relative overflow-hidden transition-all duration-500`}>
      
      {/* Glow Rings */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Header navigation */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center select-none">
        
        {/* Brand */}
        <div 
          onClick={() => handleNavigate('dashboard')} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2 rounded-xl text-white shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:scale-105 transition-all">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-white uppercase group-hover:text-cyan-400 transition-colors">
              Typing Odyssey
            </h1>
            <span className="text-[9px] text-cyan-400/80 font-bold block">Beta v1.0.2</span>
          </div>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase">
          <button 
            onClick={() => handleNavigate('dashboard')} 
            className={`flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors ${page === 'dashboard' ? 'text-cyan-400' : 'text-gray-400'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button 
            onClick={() => handleNavigate('practice')} 
            className={`flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors ${page === 'practice' ? 'text-cyan-400' : 'text-gray-400'}`}
          >
            <Brain className="w-4 h-4" /> Practice Drills
          </button>
          <button 
            onClick={() => handleNavigate('multiplayer')} 
            className={`flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors ${page === 'multiplayer' ? 'text-cyan-400' : 'text-gray-400'}`}
          >
            <Gamepad2 className="w-4 h-4" /> Multiplayer Race
          </button>
          <button 
            onClick={() => handleNavigate('store')} 
            className={`flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors ${page === 'store' ? 'text-cyan-400' : 'text-gray-400'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Cosmetics Store
          </button>
        </nav>

        {/* Global indicators */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl text-yellow-400">
            <Coins className="w-3.5 h-3.5" />
            <span>{coins}</span>
          </div>

          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>{avgWpm} WPM</span>
          </div>

          <button
            onClick={handleMuteToggle}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white transition-all text-gray-400 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-400 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Play Area */}
        <div className="lg:col-span-3">
          {renderPageContent()}
        </div>

        {/* Sidebar: AI Coach & Live Diagnostic stats */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <AICoach 
              keyMetrics={keyMetrics} 
              onSelectDrill={handleLoadCustomDrill} 
            />
            
            <div className="bg-[#111625]/60 border border-white/5 p-5 rounded-2xl text-[10px] text-gray-500 space-y-2">
              <div className="font-bold text-gray-400 uppercase text-[11px] mb-2 tracking-wider">SYSTEM DIAGNOSTICS</div>
              <div className="flex justify-between">
                <span>Player Identity:</span>
                <span className="text-cyan-400 font-bold uppercase truncate max-w-[120px]">{username}</span>
              </div>
              <div className="flex justify-between">
                <span>Sound Mode:</span>
                <span className="text-cyan-400 font-bold uppercase">{activeSound}</span>
              </div>
              <div className="flex justify-between">
                <span>Visual Theme:</span>
                <span className="text-purple-400 font-bold uppercase">{activeTheme.replace('theme-', '')}</span>
              </div>
              <div className="flex justify-between">
                <span>Client Audio API:</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
              <div className="flex justify-between">
                <span>Timeline Status:</span>
                <span className="text-amber-400 font-bold">STABLE</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 text-center py-6 text-xs text-gray-600 font-bold uppercase">
        Typing Odyssey — Cast spells, rebuild history, survive space.
      </footer>

    </div>
  );
}
