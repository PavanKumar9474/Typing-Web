import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/soundSynth';
import { Heart, Activity, Trophy } from 'lucide-react';

const OBSTACLES = [
  { word: 'jump', action: 'jump', name: 'Spike Pit' },
  { word: 'slide', action: 'slide', name: 'Low Gate' },
  { word: 'slice', action: 'slice', name: 'Robo Sentry' },
  { word: 'dodge', action: 'dodge', name: 'Flying Saw' },
  { word: 'leap', action: 'jump', name: 'Canyon Gap' },
  { word: 'duck', action: 'slide', name: 'Iron Grill' },
  { word: 'strike', action: 'slice', name: 'Spike Dagger' }
];

export default function NinjaEscape({ onGameComplete }) {
  const [activeObstacle, setActiveObstacle] = useState(null);
  const [ninjaHp, setNinjaHp] = useState(100);
  const [score, setScore] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  const [gameState, setGameState] = useState('playing'); // 'playing', 'lost'
  
  // Ninja animation state
  const [ninjaAction, setNinjaAction] = useState('run'); // 'run', 'jump', 'slide', 'slice', 'hit'

  const totalPressesRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const startTimeRef = useRef(null);

  // Spawn Obstacles loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!startTimeRef.current) startTimeRef.current = performance.now();

    const spawnInterval = setInterval(() => {
      setActiveObstacle(prev => {
        if (prev) return prev; // Keep active obstacle if already spawned

        const randomObs = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
        return {
          ...randomObs,
          x: 100, // Spawn from right side
          speed: 1.5 + Math.random() * 1.5
        };
      });
    }, 2500);

    return () => clearInterval(spawnInterval);
  }, [gameState]);

  // Movement loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveInterval = setInterval(() => {
      setActiveObstacle(prev => {
        if (!prev) return null;

        const nextX = prev.x - prev.speed;
        if (nextX <= 25) {
          // Collision with ninja!
          synth.playHit();
          setNinjaAction('hit');
          setNinjaHp(hp => {
            const nextHp = Math.max(0, hp - 25);
            if (nextHp <= 0) {
              setGameState('lost');
              synth.playExplosion();
              if (onGameComplete) {
                onGameComplete({ wpm: 50, accuracy: 92, score, won: false });
              }
            }
            return nextHp;
          });

          // Reset ninja back to running after visual feedback
          setTimeout(() => setNinjaAction('run'), 400);

          setTypedChars('');
          return null; // Delete obstacle
        }

        return { ...prev, x: nextX };
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameState, score, onGameComplete]);

  // Typing inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || !activeObstacle) return;
      if (e.key.length !== 1) return;
      const key = e.key.toLowerCase();

      totalPressesRef.current += 1;

      const nextCharIndex = typedChars.length;
      const expectedChar = activeObstacle.word[nextCharIndex];

      if (key === expectedChar) {
        synth.playClick();
        const nextTyped = typedChars + key;
        setTypedChars(nextTyped);

        if (nextTyped === activeObstacle.word) {
          // Obstacle cleared! Perform ninja action
          synth.playSpellCast();
          setNinjaAction(activeObstacle.action);

          setTimeout(() => {
            setNinjaAction('run');
          }, 500);

          setActiveObstacle(null);
          setTypedChars('');
          setScore(s => s + 150);
        }
      } else {
        synth.playError();
        totalErrorsRef.current += 1;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeObstacle, typedChars, gameState]);

  const handleRestart = () => {
    setActiveObstacle(null);
    setNinjaHp(100);
    setScore(0);
    setTypedChars('');
    setNinjaAction('run');
    setGameState('playing');
    totalPressesRef.current = 0;
    totalErrorsRef.current = 0;
    startTimeRef.current = performance.now();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      {/* Side Scroller Screen */}
      <div className="relative bg-[#06090e] border border-cyan-500/20 rounded-3xl h-[320px] overflow-hidden shadow-2xl">
        {/* Dynamic scroll background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.25)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(18,24,38,0.25)_1px,_transparent_1px)] bg-[size:40px_40px] pointer-events-none animate-grid-scroll"></div>

        {/* HUD Info */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3 bg-black/60 border border-white/5 p-2 rounded-xl backdrop-blur-sm">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${ninjaHp}%` }}></div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">{ninjaHp}% HP</span>
          </div>

          <div className="flex items-center gap-4 bg-black/60 border border-white/5 py-1.5 px-4 rounded-xl text-xs font-bold text-gray-400">
            <span>SCORE: <strong className="text-white">{score}</strong></span>
          </div>
        </div>

        {gameState === 'playing' ? (
          <>
            {/* Ninja Character Graphic */}
            <div 
              className={`absolute left-[20%] bottom-[45px] transition-all duration-150 transform -translate-x-1/2 flex flex-col items-center ${
                ninjaAction === 'jump' ? 'bottom-[120px] scale-y-95 rotate-[15deg]' :
                ninjaAction === 'slide' ? 'bottom-[25px] scale-x-110 scale-y-[0.7]' :
                ninjaAction === 'slice' ? 'translate-x-[15px] scale-110 rotate-[-10deg]' :
                ninjaAction === 'hit' ? 'translate-x-[-15px] rotate-[-20deg] scale-95' : 'animate-bounce'
              }`}
              style={{ animationDuration: '0.8s' }}
            >
              <svg width="45" height="70" viewBox="0 0 45 70" className="drop-shadow-[0_0_10px_#10b981]">
                {/* Ninja Suit */}
                <rect x="12" y="25" width="20" height="35" rx="5" fill={ninjaAction === 'hit' ? '#ef4444' : '#0f172a'} stroke="#10b981" strokeWidth="2" />
                {/* Ninja Head */}
                <circle cx="22" cy="15" r="10" fill={ninjaAction === 'hit' ? '#ef4444' : '#1e293b'} />
                {/* Headband tail */}
                <path d="M12 15 L2 18 L12 21" fill="#ef4444" />
                {/* Glowing Eyes mask */}
                <rect x="16" y="11" width="12" height="4" fill="#ef4444" />
                <circle cx="19" cy="13" r="1" fill="#ffffff" />
                <circle cx="25" cy="13" r="1" fill="#ffffff" />
                {/* Ninja Katana sword */}
                {ninjaAction === 'slice' && (
                  <line x1="32" y1="35" x2="48" y2="15" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                )}
              </svg>
              <div className="text-[9px] uppercase font-bold text-emerald-400 mt-1">Ninja</div>
            </div>

            {/* Spawned obstacle */}
            {activeObstacle && (
              <div
                className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${activeObstacle.x}%`,
                  bottom: '45px'
                }}
              >
                {/* Obstacle Graphic */}
                <div className="text-3xl animate-pulse">
                  {activeObstacle.action === 'jump' ? '🚧' : activeObstacle.action === 'slide' ? '🕸️' : '🤖'}
                </div>

                {/* Word box */}
                <div className="mt-1 px-2.5 py-0.5 rounded border text-[10px] font-black tracking-widest bg-black/90 border-cyan-400/40 text-cyan-400">
                  <span className="text-white bg-cyan-950 px-1 rounded mr-1">{activeObstacle.name}</span>
                  <span className="text-emerald-400">{typedChars}</span>
                  <span className="text-white/60">{activeObstacle.word.substring(typedChars.length)}</span>
                </div>
              </div>
            )}
            
            {/* Ground Line */}
            <div className="absolute bottom-[40px] left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_10px_#10b981]"></div>
          </>
        ) : (
          /* Game Over Screen */
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 gap-6">
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Activity className="w-12 h-12 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Ninja Defeated</h2>
              <p className="text-sm text-gray-400 mt-1">Lethal barriers breached the ninja's health armor.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 bg-white/5 border border-white/5 py-4 px-10 rounded-2xl min-w-[280px]">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">SCORE</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">SPEED RATING</span>
                <span className="text-xl font-bold text-emerald-400">FAST</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg active:scale-95 cursor-pointer"
            >
              Restart Run
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
