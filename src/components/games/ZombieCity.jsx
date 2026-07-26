import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/soundSynth';
import { Shield, Skull, Heart, Trophy } from 'lucide-react';

const ZOMBIE_WORDS = [
  'undead', 'zombie', 'brains', 'apocalypse', 'infect', 'graveyard',
  'mutant', 'swarming', 'ghoul', 'decay', 'toxic', 'biohazard',
  'horde', 'outbreak', 'survival', 'screamer', 'barricade', 'virus'
];

export default function ZombieCity({ onGameComplete }) {
  const [zombies, setZombies] = useState([]);
  const [gateHp, setGateHp] = useState(100);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [kills, setKills] = useState(0);
  const [targetId, setTargetId] = useState(null);
  const [typedChars, setTypedChars] = useState('');
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  
  const totalPressesRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const startTimeRef = useRef(null);

  const REQUIRED_KILLS = wave * 5 + 2; // e.g. Wave 1 needs 7 kills, Wave 2 needs 12

  // Spawn loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!startTimeRef.current) startTimeRef.current = performance.now();

    const interval = setInterval(() => {
      setZombies(prev => {
        // Limit zombie count on screen
        if (prev.length >= 4) return prev;

        const newWord = ZOMBIE_WORDS[Math.floor(Math.random() * ZOMBIE_WORDS.length)];
        const y = 20 + Math.random() * 55; // Vertical tracks

        return [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          word: newWord,
          x: 100, // Starts at right boundary
          y,
          speed: 0.4 + (wave * 0.15) + Math.random() * 0.3
        }];
      });
    }, 2400 - Math.min(1000, wave * 250)); // Spawns faster as waves progress

    return () => clearInterval(interval);
  }, [gameState, wave]);

  // Movement loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setZombies(prev => {
        const updated = [];
        let gateDamage = 0;

        prev.forEach(zom => {
          const nextX = zom.x - zom.speed;
          if (nextX <= 15) {
            // Zombie reached the city gate!
            gateDamage += 15;
            synth.playHit();
            if (zom.id === targetId) {
              setTargetId(null);
              setTypedChars('');
            }
          } else {
            updated.push({ ...zom, x: nextX });
          }
        });

        if (gateDamage > 0) {
          setGateHp(hp => {
            const nextHp = Math.max(0, hp - gateDamage);
            if (nextHp <= 0) {
              setGameState('lost');
              synth.playExplosion();
              if (onGameComplete) {
                onGameComplete({ wpm: 45, accuracy: 90, score, won: false });
              }
            }
            return nextHp;
          });
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, targetId, score, onGameComplete]);

  // Typing listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key.length !== 1) return;
      const key = e.key.toLowerCase();

      totalPressesRef.current += 1;

      if (targetId === null) {
        // Target closest zombie starting with 'key'
        const matches = zombies.filter(z => z.word.startsWith(key));
        if (matches.length > 0) {
          // Sort by position (lowest x is closest to gate)
          matches.sort((a, b) => a.x - b.x);
          const closest = matches[0];
          synth.playClick();
          setTargetId(closest.id);
          setTypedChars(key);
        } else {
          synth.playError();
          totalErrorsRef.current += 1;
        }
      } else {
        const targetZom = zombies.find(z => z.id === targetId);
        if (!targetZom) {
          setTargetId(null);
          setTypedChars('');
          return;
        }

        const nextIndex = typedChars.length;
        if (key === targetZom.word[nextIndex]) {
          synth.playClick();
          const nextTyped = typedChars + key;
          setTypedChars(nextTyped);

          if (nextTyped === targetZom.word) {
            // Zombie killed!
            synth.playExplosion();
            setZombies(prev => prev.filter(z => z.id !== targetId));
            setTargetId(null);
            setTypedChars('');
            setScore(s => s + 120);
            
            setKills(k => {
              const nextKills = k + 1;
              if (nextKills >= REQUIRED_KILLS) {
                // Wave completed!
                if (wave >= 3) {
                  // Beat all waves!
                  setGameState('won');
                  synth.playVictory();
                  if (onGameComplete) {
                    const time = (performance.now() - startTimeRef.current) / 60000;
                    const calculatedWpm = Math.round((totalPressesRef.current / 5) / (time || 0.001));
                    const calculatedAcc = Math.round(((totalPressesRef.current - totalErrorsRef.current) / totalPressesRef.current) * 100);
                    onGameComplete({ wpm: calculatedWpm, accuracy: calculatedAcc, score: score + 500, won: true, coins: 150 });
                  }
                } else {
                  // Advance to next wave
                  synth.playVictory();
                  setWave(w => w + 1);
                  setKills(0);
                  setZombies([]);
                }
              }
              return nextKills;
            });
          }
        } else {
          synth.playError();
          totalErrorsRef.current += 1;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zombies, targetId, typedChars, gameState, wave, score, REQUIRED_KILLS, onGameComplete]);

  const handleRestart = () => {
    setZombies([]);
    setGateHp(100);
    setScore(0);
    setWave(1);
    setKills(0);
    setTargetId(null);
    setTypedChars('');
    setGameState('playing');
    totalPressesRef.current = 0;
    totalErrorsRef.current = 0;
    startTimeRef.current = performance.now();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      {/* City Screen Board */}
      <div className="relative bg-[#090b0e] border border-cyan-500/20 rounded-3xl h-[380px] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/15 via-black to-black pointer-events-none"></div>

        {/* HUD Info */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3 bg-black/60 border border-white/5 p-2 rounded-xl backdrop-blur-sm">
            <Shield className="w-4 h-4 text-rose-500" />
            <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${gateHp}%` }}></div>
            </div>
            <span className="text-[10px] text-rose-400 font-bold">{gateHp}% GATE HP</span>
          </div>

          <div className="flex items-center gap-4 bg-black/60 border border-white/5 py-1.5 px-4 rounded-xl text-xs font-bold text-gray-400">
            <span>WAVE: <strong className="text-red-500">{wave}/3</strong></span>
            <span>KILLS: <strong className="text-white">{kills}/{REQUIRED_KILLS}</strong></span>
            <span>SCORE: <strong className="text-white">{score}</strong></span>
          </div>
        </div>

        {gameState === 'playing' ? (
          <>
            {/* Gate Barricade Visual Line */}
            <div 
              className="absolute left-[15%] top-0 bottom-0 w-2.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-800 shadow-[0_0_10px_#ef4444]"
              style={{ opacity: gateHp / 100 }}
            ></div>

            {/* Spawned zombies */}
            {zombies.map(zom => {
              const isTargeted = zom.id === targetId;
              return (
                <div
                  key={zom.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-75"
                  style={{
                    left: `${zom.x}%`,
                    top: `${zom.y}%`
                  }}
                >
                  {/* Zombie SVG details */}
                  <div className={`text-3xl ${isTargeted ? 'scale-110 drop-shadow-[0_0_12px_#3b82f6]' : 'animate-pulse'}`}>
                    🧟
                  </div>
                  
                  {/* Word Bubble */}
                  <div 
                    className={`
                      mt-1 px-2.5 py-0.5 rounded border text-[10px] font-black tracking-wider transition-all select-none
                      ${isTargeted 
                        ? 'bg-blue-950/90 border-blue-400 text-white' 
                        : 'bg-black/80 border-white/10 text-gray-400'}
                    `}
                  >
                    {isTargeted ? (
                      <>
                        <span className="text-blue-400">{typedChars}</span>
                        <span className="text-white/60">{zom.word.substring(typedChars.length)}</span>
                      </>
                    ) : (
                      zom.word
                    )}
                  </div>
                </div>
              );
            })}

            {/* City Defenders Graphic behind gate */}
            <div className="absolute left-[5%] bottom-6 flex flex-col items-center text-xs text-cyan-400 font-bold uppercase animate-pulse">
              🛡️ Defender Gates
            </div>
          </>
        ) : (
          /* Game Over / Win Screens */
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 gap-6">
            <div className={`p-4 rounded-full ${gameState === 'won' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {gameState === 'won' ? <Trophy className="w-12 h-12 animate-bounce" /> : <Skull className="w-12 h-12 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                {gameState === 'won' ? 'City Saved!' : 'City Gates Collapsed'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {gameState === 'won' ? 'You held off all the undead hordes!' : 'Zombies breached the gates and overrun the survivors.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 bg-white/5 border border-white/5 py-4 px-10 rounded-2xl">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">SCORE</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">WAVES COMPLETED</span>
                <span className="text-xl font-bold text-red-500">{gameState === 'won' ? 3 : wave - 1}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg active:scale-95 cursor-pointer"
            >
              {gameState === 'won' ? 'Hold Again' : 'Respawn Defence'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
