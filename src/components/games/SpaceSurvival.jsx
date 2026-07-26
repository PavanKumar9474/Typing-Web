import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/soundSynth';
import { Shield, Target, Trophy, Flame } from 'lucide-react';

const WORD_BANK = [
  'nebula', 'asteroid', 'galaxy', 'quantum', 'supernova', 'pulsar',
  'orbit', 'cosmos', 'gravity', 'rocket', 'comet', 'eclipse',
  'satellite', 'universe', 'spaceship', 'meteor', 'planet', 'laser'
];

export default function SpaceSurvival({ onGameComplete }) {
  const [asteroids, setAsteroids] = useState([]);
  const [shield, setShield] = useState(100);
  const [score, setScore] = useState(0);
  const [targetId, setTargetId] = useState(null);
  const [typedChars, setTypedChars] = useState('');
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'lost'

  // Refs for tracking totals for calculations
  const totalPressesRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const startTimeRef = useRef(null);

  // Ship laser animation state
  const [laserShoot, setLaserShoot] = useState(null); // { x: 0, targetX: 0, targetY: 0 }

  // Game loop tick
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const interval = setInterval(() => {
      // Spawn asteroid
      setAsteroids(prev => {
        // Limit max active asteroids
        if (prev.length >= 5) return prev;

        const newWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
        // Random horizontal position (15% to 85% to avoid edges)
        const x = 15 + Math.random() * 70;
        
        return [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          word: newWord,
          x,
          y: 0,
          speed: 0.6 + Math.random() * 0.8
        }];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Update positions loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setAsteroids(prev => {
        const updated = [];
        let damage = 0;

        prev.forEach(ast => {
          const nextY = ast.y + ast.speed;
          if (nextY >= 85) {
            // Reached ship
            damage += 20;
            synth.playHit();
            // If we were targeting this, clear target
            if (ast.id === targetId) {
              setTargetId(null);
              setTypedChars('');
            }
          } else {
            updated.push({ ...ast, y: nextY });
          }
        });

        if (damage > 0) {
          setShield(s => {
            const nextShield = Math.max(0, s - damage);
            if (nextShield <= 0) {
              setGameState('lost');
              synth.playExplosion();
              if (onGameComplete) {
                // Calculate final metrics
                const timeMinutes = (performance.now() - startTimeRef.current) / 60000;
                const calculatedWpm = Math.round((totalPressesRef.current / 5) / (timeMinutes || 0.001));
                const calculatedAcc = totalPressesRef.current > 0 
                  ? Math.round(((totalPressesRef.current - totalErrorsRef.current) / totalPressesRef.current) * 100) 
                  : 100;
                onGameComplete({ wpm: calculatedWpm, accuracy: calculatedAcc, score, won: false });
              }
            }
            return nextShield;
          });
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, targetId, score, onGameComplete]);

  // Handle typing inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      // Handle normal key presses (only single letters)
      if (e.key.length !== 1) return;
      const key = e.key.toLowerCase();

      totalPressesRef.current += 1;

      // If no current target, find one matching the pressed key
      if (targetId === null) {
        const match = asteroids.find(ast => ast.word.startsWith(key));
        if (match) {
          synth.playClick();
          setTargetId(match.id);
          setTypedChars(key);
        } else {
          synth.playError();
          totalErrorsRef.current += 1;
        }
      } else {
        // We have a target
        const currentTarget = asteroids.find(ast => ast.id === targetId);
        if (!currentTarget) {
          setTargetId(null);
          setTypedChars('');
          return;
        }

        const nextCharIndex = typedChars.length;
        const expectedChar = currentTarget.word[nextCharIndex];

        if (key === expectedChar) {
          synth.playClick();
          const nextTyped = typedChars + key;
          setTypedChars(nextTyped);

          // Check if completed
          if (nextTyped === currentTarget.word) {
            // Blast asteroid!
            synth.playExplosion();
            
            // Trigger laser shoot animation
            setLaserShoot({
              startX: 50, // Ship is in center (50%)
              startY: 90,
              targetX: currentTarget.x,
              targetY: currentTarget.y
            });

            setTimeout(() => setLaserShoot(null), 200);

            setAsteroids(prev => prev.filter(ast => ast.id !== targetId));
            setScore(s => s + 100);
            setTargetId(null);
            setTypedChars('');
          }
        } else {
          synth.playError();
          totalErrorsRef.current += 1;
        }
      }

      // Update real-time WPM & accuracy
      const timeMinutes = (performance.now() - startTimeRef.current) / 60000;
      const calculatedWpm = Math.round((totalPressesRef.current / 5) / (timeMinutes || 0.001));
      const calculatedAcc = totalPressesRef.current > 0 
        ? Math.round(((totalPressesRef.current - totalErrorsRef.current) / totalPressesRef.current) * 100) 
        : 100;
      
      setWpm(isNaN(calculatedWpm) || calculatedWpm === Infinity ? 0 : Math.min(200, calculatedWpm));
      setAccuracy(Math.max(0, calculatedAcc));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asteroids, targetId, typedChars, gameState, score]);

  const handleRestart = () => {
    setAsteroids([]);
    setShield(100);
    setScore(0);
    setTargetId(null);
    setTypedChars('');
    setWpm(0);
    setAccuracy(100);
    setGameState('playing');
    totalPressesRef.current = 0;
    totalErrorsRef.current = 0;
    startTimeRef.current = performance.now();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      
      {/* Game Board (Space Canvas simulator in SVG/CSS) */}
      <div className="relative bg-[#05050d] border border-cyan-500/20 rounded-3xl h-[420px] overflow-hidden shadow-2xl">
        {/* Space Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.2)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(18,24,38,0.2)_1px,_transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 via-black to-black pointer-events-none"></div>

        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-4 bg-black/60 border border-white/5 p-2 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-1.5 px-1">
              <Shield className="w-4 h-4 text-cyan-400" />
              <div className="w-24 h-2.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${shield}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400">{shield}%</span>
          </div>

          <div className="flex items-center gap-4 bg-black/60 border border-white/5 py-2 px-4 rounded-2xl backdrop-blur-sm text-xs font-bold">
            <span className="text-gray-400">SCORE: <strong className="text-white">{score}</strong></span>
            <span className="text-gray-400">WPM: <strong className="text-cyan-400">{wpm}</strong></span>
            <span className="text-gray-400">ACC: <strong className="text-emerald-400">{accuracy}%</strong></span>
          </div>
        </div>

        {gameState === 'playing' ? (
          <>
            {/* Draw Asteroids */}
            {asteroids.map(ast => {
              const isTargeted = ast.id === targetId;
              
              return (
                <div
                  key={ast.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 flex flex-col items-center"
                  style={{
                    left: `${ast.x}%`,
                    top: `${ast.y}%`,
                  }}
                >
                  {/* Asteroid Visual Shape */}
                  <svg 
                    width="44" 
                    height="44" 
                    viewBox="0 0 44 44" 
                    className={`
                      animate-spin-slow 
                      ${isTargeted ? 'drop-shadow-[0_0_12px_#22d3ee]' : 'drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]'}
                    `}
                    style={{ animationDuration: '15s' }}
                  >
                    <path 
                      d="M12 6 L28 4 L38 12 L40 28 L30 40 L12 38 L4 26 L6 14 Z" 
                      fill="#262529" 
                      stroke={isTargeted ? '#22d3ee' : '#4b5563'} 
                      strokeWidth="2.5" 
                    />
                    {/* Asteroid details */}
                    <circle cx="15" cy="15" r="3" fill="#18171a" />
                    <circle cx="28" cy="25" r="4.5" fill="#18171a" />
                    <circle cx="20" cy="30" r="2" fill="#18171a" />
                  </svg>

                  {/* Typing Word Bubble */}
                  <div 
                    className={`
                      mt-1.5 px-3 py-1 rounded-lg text-xs font-black tracking-widest border transition-all select-none
                      ${isTargeted 
                        ? 'bg-cyan-950/90 border-cyan-400 text-white' 
                        : 'bg-black/80 border-white/10 text-gray-400'}
                    `}
                  >
                    {isTargeted ? (
                      <>
                        <span className="text-cyan-400">{typedChars}</span>
                        <span className="text-white/60">{ast.word.substring(typedChars.length)}</span>
                      </>
                    ) : (
                      ast.word
                    )}
                  </div>
                </div>
              );
            })}

            {/* Laser Line */}
            {laserShoot && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line 
                  x1={`${laserShoot.startX}%`} 
                  y1={`${laserShoot.startY}%`} 
                  x2={`${laserShoot.targetX}%`} 
                  y2={`${laserShoot.targetY}%`} 
                  stroke="#22d3ee" 
                  strokeWidth="3.5"
                  className="animate-pulse"
                  strokeLinecap="round"
                />
                <line 
                  x1={`${laserShoot.startX}%`} 
                  y1={`${laserShoot.startY}%`} 
                  x2={`${laserShoot.targetX}%`} 
                  y2={`${laserShoot.targetY}%`} 
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Spaceship Graphic at Bottom */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
              <svg width="60" height="40" viewBox="0 0 60 40" className="drop-shadow-[0_0_12px_#22d3ee]">
                {/* Ship Wings */}
                <path d="M10 35 L0 25 L15 20 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <path d="M50 35 L60 25 L45 20 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                {/* Ship Body */}
                <path d="M15 35 L30 5 L45 35 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
                {/* Cockpit */}
                <ellipse cx="30" cy="22" rx="6" ry="8" fill="#38bdf8" />
                {/* Engine Thruster Flame */}
                <path d="M25 35 L30 42 L35 35 Z" fill="#f97316" className="animate-pulse" />
              </svg>
              {targetId && (
                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest mt-1 flex items-center gap-1 animate-pulse">
                  <Target className="w-3 h-3" /> Locked On
                </div>
              )}
            </div>
          </>
        ) : (
          /* Game Over Screen */
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 gap-6">
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Flame className="w-12 h-12 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Spaceship Destroyed</h2>
              <p className="text-sm text-gray-400 mt-1">Shields collapsed under heavy asteroid bombardment.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 bg-white/5 border border-white/5 p-4 rounded-2xl min-w-[320px]">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">SCORE</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">WPM</span>
                <span className="text-xl font-bold text-cyan-400">{wpm}</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">Accuracy</span>
                <span className="text-xl font-bold text-emerald-400">{accuracy}%</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg active:scale-95"
            >
              Relaunch Mission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
