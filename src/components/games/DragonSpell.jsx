import React, { useState, useEffect } from 'react';
import { useTypingEngine } from '../../hooks/useTypingEngine';
import { synth } from '../../utils/soundSynth';
import { Heart, Shield, Sword, Flame, Trophy } from 'lucide-react';

const SPELL_LIST = [
  'lumos', 'incendio', 'protego', 'expelliarmus', 'sectumsempra',
  'avada kedavra', 'expecto patronum', 'alohomora', 'wingardium leviosa',
  'reparo', 'stupefy', 'riddikulus', 'petrificus totalus', 'crucio'
];

export default function DragonSpell({ onGameComplete }) {
  const [spellIndex, setSpellIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [dragonHp, setDragonHp] = useState(100);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  
  // Animation states
  const [wizardAction, setWizardAction] = useState('idle'); // 'idle', 'casting', 'hit'
  const [dragonAction, setDragonAction] = useState('idle'); // 'idle', 'attacking', 'hit'
  const [activeProjectile, setActiveProjectile] = useState(null); // 'spell' or 'fireball'

  const currentSpell = SPELL_LIST[spellIndex % SPELL_LIST.length];

  const handleSpellComplete = ({ accuracy, errors }) => {
    if (gameState !== 'playing') return;

    if (errors === 0) {
      // Perfect spell! Cast huge attack
      synth.playSpellCast();
      setWizardAction('casting');
      setActiveProjectile('spell');
      
      setTimeout(() => {
        setDragonAction('hit');
        setDragonHp(prev => Math.max(0, prev - 25));
        setActiveProjectile(null);
        synth.playHit();
        
        setTimeout(() => {
          setWizardAction('idle');
          setDragonAction('idle');
        }, 500);
      }, 600);
    } else {
      // Spell had mistakes. Dragon counter-attacks!
      synth.playError();
      setDragonAction('attacking');
      setActiveProjectile('fireball');
      
      setTimeout(() => {
        setWizardAction('hit');
        setPlayerHp(prev => Math.max(0, prev - 20));
        setActiveProjectile(null);
        synth.playHit();
        
        setTimeout(() => {
          setWizardAction('idle');
          setDragonAction('idle');
        }, 500);
      }, 600);
    }

    // Move to next spell
    setSpellIndex(prev => prev + 1);
  };

  const {
    text,
    input,
    cursor,
    wpm,
    accuracy,
    streak,
    handleKeyDown,
    resetEngine
  } = useTypingEngine(currentSpell, handleSpellComplete);

  // Monitor HP status
  useEffect(() => {
    if (dragonHp <= 0 && gameState === 'playing') {
      setGameState('won');
      synth.playVictory();
      if (onGameComplete) {
        onGameComplete({ wpm, accuracy, score: 500 + playerHp * 5, won: true });
      }
    } else if (playerHp <= 0 && gameState === 'playing') {
      setGameState('lost');
      synth.playError();
      if (onGameComplete) {
        onGameComplete({ wpm, accuracy, score: 100, won: false });
      }
    }
  }, [dragonHp, playerHp, gameState, onGameComplete, wpm, accuracy]);

  // Handle typing listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (gameState === 'playing') {
        handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, gameState]);

  // Restart game
  const handleRestart = () => {
    setPlayerHp(100);
    setDragonHp(100);
    setSpellIndex(0);
    setGameState('playing');
    setWizardAction('idle');
    setDragonAction('idle');
    setActiveProjectile(null);
    resetEngine(SPELL_LIST[0]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none">
      {/* Game Screen Container */}
      <div className="relative bg-[#0d0e15] border border-cyan-500/20 rounded-3xl overflow-hidden h-[340px] shadow-2xl flex flex-col justify-between p-6">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 to-black/80 pointer-events-none z-0"></div>
        {/* Floating Sparks */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-70 animate-pulse z-0"></div>

        {/* HUD: Health Bars */}
        <div className="flex justify-between items-center z-10">
          {/* Player stats */}
          <div className="flex flex-col gap-1 w-[40%] bg-black/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> Wizard (You)</span>
              <span>{playerHp}%</span>
            </div>
            <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full" 
                style={{ width: `${playerHp}%` }}
              ></div>
            </div>
          </div>

          {/* VS badge */}
          <span className="text-cyan-400/50 font-black tracking-wider text-sm bg-cyan-950/30 px-3 py-1.5 rounded-xl border border-cyan-500/10">VS</span>

          {/* Dragon stats */}
          <div className="flex flex-col gap-1 w-[40%] bg-black/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex justify-between text-xs font-semibold text-gray-300">
              <span>{dragonHp}%</span>
              <span className="flex items-center gap-1">Dragon <Flame className="w-3.5 h-3.5 text-orange-500" /></span>
            </div>
            <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-l from-rose-600 to-amber-500 transition-all duration-300 rounded-full" 
                style={{ width: `${dragonHp}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Dynamic Battle Scene */}
        <div className="relative flex justify-between items-end h-[180px] px-10 z-10">
          
          {/* Projectiles */}
          {activeProjectile === 'spell' && (
            <div 
              className="absolute left-[20%] bottom-[45px] w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_15px_#22d3ee] animate-cast-spell"
              style={{
                animation: 'castspell 0.6s linear forwards',
              }}
            ></div>
          )}

          {activeProjectile === 'fireball' && (
            <div 
              className="absolute right-[20%] bottom-[45px] w-7 h-7 bg-gradient-to-l from-orange-500 to-red-500 rounded-full shadow-[0_0_20px_#f97316] animate-fireball"
              style={{
                animation: 'fireball 0.6s linear forwards',
              }}
            ></div>
          )}

          {/* Wizard SVG Graphic */}
          <div className={`transition-all duration-200 transform ${
            wizardAction === 'casting' ? 'scale-110' : 
            wizardAction === 'hit' ? 'translate-x-[-15px] rotate-[-10deg]' : ''
          }`}>
            <svg width="70" height="110" viewBox="0 0 70 110" className="drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              {/* Wizard Robe */}
              <path d="M15 100 L35 40 L55 100 Z" fill={wizardAction === 'hit' ? '#ef4444' : '#4f46e5'} />
              {/* Wizard Cape */}
              <path d="M20 50 L10 95 L35 70" fill="#312e81" />
              {/* Head */}
              <circle cx="35" cy="30" r="12" fill="#fed7aa" />
              {/* Wizard Hat */}
              <path d="M20 22 L35 2 L50 22 Z" fill="#312e81" />
              <path d="M15 24 L55 24" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
              {/* Wizard Staff */}
              <line x1="50" y1="95" x2="52" y2="40" stroke="#78350f" strokeWidth="4" />
              <circle 
                cx="52" 
                cy="38" 
                r={wizardAction === 'casting' ? '8' : '5'} 
                fill={wizardAction === 'casting' ? '#67e8f9' : '#06b6d4'} 
                className="transition-all duration-200 animate-pulse"
              />
            </svg>
            <div className="text-center text-[10px] uppercase font-bold tracking-wider text-cyan-400 mt-1">Wizard</div>
          </div>

          {/* Dragon SVG Graphic */}
          <div className={`transition-all duration-200 transform ${
            dragonAction === 'attacking' ? 'scale-110' : 
            dragonAction === 'hit' ? 'translate-x-[15px] rotate-[10deg]' : ''
          }`}>
            <svg width="100" height="120" viewBox="0 0 100 120" className="drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              {/* Dragon Body */}
              <path d="M40 100 C20 80 20 40 40 40 C60 40 70 80 80 100 Z" fill={dragonAction === 'hit' ? '#ef4444' : '#b91c1c'} />
              {/* Dragon Wings */}
              <path d="M30 50 L5 30 L20 70 Z" fill="#7f1d1d" />
              <path d="M70 50 L95 30 L80 70 Z" fill="#7f1d1d" />
              {/* Head */}
              <path d="M30 40 L45 20 L60 40 Z" fill={dragonAction === 'hit' ? '#f87171' : '#dc2626'} />
              {/* Horns */}
              <path d="M40 22 L35 10" stroke="#1f2937" strokeWidth="3" />
              <path d="M50 22 L55 10" stroke="#1f2937" strokeWidth="3" />
              {/* Glowing Dragon Eyes */}
              <circle cx="43" cy="30" r="2.5" fill="#facc15" className="animate-ping" />
              <circle cx="43" cy="30" r="1.5" fill="#eab308" />
              <circle cx="47" cy="30" r="2.5" fill="#facc15" className="animate-ping" />
              <circle cx="47" cy="30" r="1.5" fill="#eab308" />
              {/* Fire breath effect */}
              {dragonAction === 'attacking' && (
                <path d="M35 30 L10 35 L12 28 Z" fill="#f97316" />
              )}
            </svg>
            <div className="text-center text-[10px] uppercase font-bold tracking-wider text-rose-500 mt-1">Ancient Dragon</div>
          </div>
        </div>
      </div>

      {/* Typing & Spell Panel */}
      {gameState === 'playing' ? (
        <div className="bg-[#111625] border border-cyan-500/20 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-black">Spell Word To Cast</div>
          
          {/* Display Spell Word */}
          <div className="font-mono text-3xl font-extrabold tracking-widest py-3 px-8 bg-black/40 rounded-2xl border border-white/5 text-gray-500 select-none">
            {text.split('').map((char, index) => {
              let charClass = '';
              if (index < cursor) {
                charClass = 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]';
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

          <div className="flex gap-6 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Sword className="w-3.5 h-3.5 text-cyan-400" /> WPM: <strong className="text-white">{wpm}</strong></span>
            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-yellow-500" /> Accuracy: <strong className="text-white">{accuracy}%</strong></span>
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-purple-400" /> Combo: <strong className="text-white">{streak}</strong></span>
          </div>
        </div>
      ) : (
        /* End Screen */
        <div className="bg-[#111625]/95 border border-cyan-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
          <div className={`p-4 rounded-full ${gameState === 'won' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {gameState === 'won' ? (
              <Trophy className="w-12 h-12 animate-bounce" />
            ) : (
              <Flame className="w-12 h-12 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-wide text-white uppercase">
              {gameState === 'won' ? 'Dragon Slain!' : 'Dragon Roasted You'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {gameState === 'won' ? 'You saved the kingdom with your fast typing spelling!' : 'Try again and watch your mistakes.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 bg-black/40 border border-white/5 py-4 px-10 rounded-2xl">
            <div className="text-center">
              <span className="block text-xs text-gray-500 font-bold uppercase">WPM</span>
              <span className="text-2xl font-black text-cyan-400">{wpm}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-gray-500 font-bold uppercase">Accuracy</span>
              <span className="text-2xl font-black text-emerald-400">{accuracy}%</span>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            {gameState === 'won' ? 'Fight Another Dragon' : 'Try Again'}
          </button>
        </div>
      )}
    </div>
  );
}
