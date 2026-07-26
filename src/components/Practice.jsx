import React, { useState, useEffect } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { synth } from '../utils/soundSynth';
import { Award, Compass, RefreshCw, Star } from 'lucide-react';

const DRILLS = {
  homerow: {
    name: 'Home Row Anchor (asdf jkl;)',
    text: 'asdf jkl; asdf jkl; aassddff jjkkll;; asdfjkl; asdfjkl; fdsa lkj;'
  },
  toprow: {
    name: 'Top Row Mastery (qwertyuiop)',
    text: 'qwert yuiop qwert yuiop qwe rty uio ppp qwerty uiop qwer yuio'
  },
  javascript: {
    name: 'JavaScript Developer Code Drill',
    text: 'const numbers = [1, 2, 3]; const double = numbers.map(x => x * 2);'
  },
  python: {
    name: 'Python Function Def Drill',
    text: 'def greet_user(username): print(f"Hello, {username.title()}!")'
  }
};

export default function Practice({ onPracticeComplete, customDrillText }) {
  const [selectedDrill, setSelectedDrill] = useState('homerow');
  const [drillText, setDrillText] = useState(DRILLS.homerow.text);
  const [sessionActive, setSessionActive] = useState(false);

  // Load custom drill if passed from AI Coach
  useEffect(() => {
    if (customDrillText) {
      setDrillText(customDrillText);
      setSelectedDrill('custom');
      setSessionActive(true);
    }
  }, [customDrillText]);

  const handleComplete = ({ wpm, accuracy, keyMetrics }) => {
    synth.playVictory();
    if (onPracticeComplete) {
      const rewardedCoins = Math.round((wpm / 2) * (accuracy / 100));
      onPracticeComplete({
        wpm,
        accuracy,
        coins: rewardedCoins,
        xp: 80,
        keyMetrics
      });
    }
  };

  const {
    text,
    input,
    cursor,
    wpm,
    accuracy,
    streak,
    errorCount,
    isFinished,
    handleKeyDown,
    resetEngine
  } = useTypingEngine(sessionActive ? drillText : '', handleComplete);

  // Global key listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (sessionActive && !isFinished) {
        handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, sessionActive, isFinished]);

  const startDrill = () => {
    synth.playClick();
    setSessionActive(true);
    resetEngine(drillText);
  };

  const handleDrillChange = (key) => {
    synth.playClick();
    setSelectedDrill(key);
    setDrillText(DRILLS[key].text);
    setSessionActive(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      
      {!sessionActive && (
        <div className="bg-[#111625]/90 border border-cyan-500/20 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
          <div className="text-center">
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" /> Typing Roadmaps & Drills
            </h2>
            <p className="text-xs text-gray-400 mt-1">Select a typing anchor drill to boost raw hand motor speeds.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(DRILLS).map(([key, item]) => {
              const active = selectedDrill === key;
              return (
                <button
                  key={key}
                  onClick={() => handleDrillChange(key)}
                  className={`
                    p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer
                    ${active 
                      ? 'border-cyan-500 bg-cyan-950/20 text-white' 
                      : 'border-white/5 bg-black/30 text-gray-400 hover:border-white/10 hover:text-white'}
                  `}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">{item.name}</span>
                  <span className="text-[10px] text-gray-500 truncate block font-mono">{item.text}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={startDrill}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg cursor-pointer"
          >
            Start Drill Session
          </button>
        </div>
      )}

      {sessionActive && !isFinished && (
        <div className="bg-[#111625] border border-cyan-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs uppercase tracking-widest text-cyan-400 font-black">
            <span>Practice Drills</span>
            {selectedDrill === 'custom' && <span className="text-purple-400">AI COACH CUSTOM DRILL</span>}
          </div>

          {/* Typing Area */}
          <div className="font-mono text-lg leading-relaxed text-gray-500 select-none bg-black/40 p-5 rounded-2xl border border-white/5 text-justify">
            {text.split('').map((char, index) => {
              let charClass = '';
              if (index < cursor) {
                charClass = 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]';
              } else if (index === cursor) {
                charClass = 'text-white border-b-2 border-cyan-400 animate-pulse';
              } else {
                charClass = 'text-gray-600';
              }
              return (
                <span key={index} className={charClass}>
                  {char}
                </span>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-white/5 pt-4 text-xs text-gray-400">
            <div className="flex gap-6">
              <span>WPM: <strong className="text-white">{wpm}</strong></span>
              <span>Accuracy: <strong className="text-white">{accuracy}%</strong></span>
              <span>Streak: <strong className="text-white">{streak}</strong></span>
              <span>Mistakes: <strong className="text-rose-500">{errorCount}</strong></span>
            </div>
            <button
              onClick={() => setSessionActive(false)}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Abort Drill
            </button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="bg-[#111625]/95 border border-cyan-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
          <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/20 text-emerald-400">
            <Star className="w-12 h-12 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Drill Completed!</h2>
            <p className="text-sm text-gray-400 mt-1">Excellent motor coordination. Practice consistently to build muscle memory.</p>
          </div>

          <div className="grid grid-cols-3 gap-6 bg-black/40 border border-white/5 p-4 rounded-2xl min-w-[320px]">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">WPM</span>
              <span className="text-xl font-bold text-cyan-400">{wpm}</span>
            </div>
            <div className="border-l border-white/10"></div>
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Accuracy</span>
              <span className="text-xl font-bold text-emerald-400">{accuracy}%</span>
            </div>
            <div className="border-l border-white/10"></div>
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">Gold Coins</span>
              <span className="text-xl font-bold text-yellow-500 flex items-center justify-center gap-0.5">+{Math.round((wpm / 2) * (accuracy / 100))}</span>
            </div>
          </div>

          <button
            onClick={() => setSessionActive(false)}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg active:scale-95"
          >
            Practice More Drills
          </button>
        </div>
      )}

    </div>
  );
}
