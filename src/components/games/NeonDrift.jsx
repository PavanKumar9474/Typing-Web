import React, { useState, useEffect, useRef, useCallback } from 'react';
import { synth } from '../../utils/soundSynth';
import { Shield, Zap, Trophy, Gauge, Flag, AlertCircle, ArrowLeftRight } from 'lucide-react';

const SPEED_WORDS = [
  'turbo', 'nitro', 'drift', 'velocity', 'acceleration', 'hyperdrive',
  'engine', 'boost', 'shift', 'gasoline', 'clutch', 'exhaust',
  'handling', 'tachometer', 'ignition', 'cybercar', 'highway', 'overdrive'
];

const MANEUVER_WORDS = {
  left: ['left', 'port', 'steerleft', 'shiftleft'],
  right: ['right', 'starboard', 'steerright', 'shiftright'],
  shield: ['shield', 'defend', 'absorb', 'barrier']
};

export default function NeonDrift({ onGameComplete }) {
  const [carLane, setCarLane] = useState(1); // 0 = Left, 1 = Center, 2 = Right
  const [shield, setShield] = useState(100);
  const [speed, setSpeed] = useState(120); // km/h
  const [distance, setDistance] = useState(0); // meters
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  
  // Obstacles state
  // Obstacle format: { id, lane, y: 0 to 100, name, speed }
  const [obstacles, setObstacles] = useState([]);
  
  // Typing state
  const [currentWord, setCurrentWord] = useState('');
  const [typedChars, setTypedChars] = useState('');
  const [steerTarget, setSteerTarget] = useState(null); // 'left', 'right', 'shield' or null
  const [steerWord, setSteerWord] = useState('');

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Performance tracking refs
  const totalPressesRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const startTimeRef = useRef(null);
  const lastKeyTimeRef = useRef(null);
  const keyMetricsRef = useRef({});

  // Initialize
  useEffect(() => {
    startTimeRef.current = performance.now();
    lastKeyTimeRef.current = performance.now();
    setCurrentWord(getRandomSpeedWord());
  }, []);

  const getRandomSpeedWord = () => {
    return SPEED_WORDS[Math.floor(Math.random() * SPEED_WORDS.length)];
  };

  const getSteerWord = (direction) => {
    const list = MANEUVER_WORDS[direction];
    return list[Math.floor(Math.random() * list.length)];
  };

  const triggerGameComplete = useCallback((won, finalShield) => {
    const timeMinutes = (performance.now() - startTimeRef.current) / 60000;
    const finalWpm = Math.round((totalPressesRef.current / 5) / (timeMinutes || 0.001));
    const finalAcc = totalPressesRef.current > 0
      ? Math.round(((totalPressesRef.current - totalErrorsRef.current) / totalPressesRef.current) * 100)
      : 100;

    const coinsEarned = won ? Math.round(150 + finalShield) : Math.round(distance * 0.1);
    const xpEarned = won ? 200 : 50;

    if (onGameComplete) {
      onGameComplete({
        wpm: finalWpm,
        accuracy: finalAcc,
        score: score + (won ? 800 : 0),
        won,
        coins: coinsEarned,
        xp: xpEarned,
        keyMetrics: keyMetricsRef.current
      });
    }
  }, [score, distance, onGameComplete]);


  // Game loop ticks (Distance tracker)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setDistance(d => {
        const nextDist = d + Math.round(speed / 15);
        if (nextDist >= 1000) {
          setGameState('won');
          synth.playVictory();
          triggerGameComplete(true, shield);
        }
        return nextDist;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, speed, shield, triggerGameComplete]);

  // Obstacle Spawner Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      setObstacles(prev => {
        if (prev.length >= 3) return prev; // limit count
        
        // Spawn obstacle in a random lane
        const lane = Math.floor(Math.random() * 3);
        const obstacleTypes = [
          { name: 'Debris Grid', speed: 1.2 },
          { name: 'Spike Barrier', speed: 1.5 },
          { name: 'Police Drone', speed: 1.8 }
        ];
        const chosen = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

        return [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          lane,
          y: 0,
          name: chosen.name,
          speed: chosen.speed
        }];
      });
    }, 3200);

    return () => clearInterval(spawnInterval);
  }, [gameState]);

  // Handle Steering prompt triggers based on obstacle distance
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check if an obstacle in our lane is getting close (y > 45) and we aren't already steering
    const closeObstacle = obstacles.find(obs => obs.lane === carLane && obs.y > 45 && obs.y < 85);
    
    if (closeObstacle && !steerTarget) {
      // Suggest moving to an empty lane or shielding
      let action = 'shield';
      if (carLane === 0) action = 'right';
      else if (carLane === 2) action = 'left';
      else action = Math.random() > 0.5 ? 'left' : 'right';

      setSteerTarget(action);
      setSteerWord(getSteerWord(action));
      setTypedChars('');
    }
  }, [obstacles, carLane, steerTarget, gameState]);

  // Obstacle Motion loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveInterval = setInterval(() => {
      setObstacles(prev => {
        const updated = [];
        let hit = false;

        prev.forEach(obs => {
          const nextY = obs.y + obs.speed;
          
          if (nextY >= 90) {
            // Reached bottom
            if (obs.lane === carLane) {
              // Crash!
              hit = true;
              synth.playHit();
            }
            // Clear steer target since obstacle is gone
            setSteerTarget(null);
            setSteerWord('');
          } else {
            updated.push({ ...obs, y: nextY });
          }
        });

        if (hit) {
          setShield(s => {
            const nextShield = Math.max(0, s - 25);
            if (nextShield <= 0) {
              setGameState('lost');
              synth.playExplosion();
              triggerGameComplete(false, 0);
            }
            return nextShield;
          });
          // Reduce speed
          setSpeed(prev => Math.max(50, prev - 40));
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameState, carLane, triggerGameComplete]);

  // Typing inputs handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key.length !== 1) return;

      const key = e.key.toLowerCase();
      const activeTarget = steerTarget ? steerWord : currentWord;
      const targetChar = activeTarget[typedChars.length];

      totalPressesRef.current += 1;
      const now = performance.now();
      const latency = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Track keyboard diagnostics
      const cleanKey = (targetChar || key).toLowerCase();
      if (!keyMetricsRef.current[cleanKey]) {
        keyMetricsRef.current[cleanKey] = { total: 0, errors: 0, latencies: [] };
      }
      keyMetricsRef.current[cleanKey].total += 1;
      keyMetricsRef.current[cleanKey].latencies = [...keyMetricsRef.current[cleanKey].latencies, latency].slice(-15);

      if (key === targetChar) {
        synth.playClick();
        const nextTyped = typedChars + e.key;
        setTypedChars(nextTyped);

        if (nextTyped === activeTarget) {
          // Word finished!
          synth.playSpellCast();

          if (steerTarget) {
            // Apply lane change or shield
            if (steerTarget === 'left') {
              setCarLane(c => Math.max(0, c - 1));
            } else if (steerTarget === 'right') {
              setCarLane(c => Math.min(2, c + 1));
            } else if (steerTarget === 'shield') {
              // Temporary invulnerability / absorb obstacle
              setShield(s => Math.min(100, s + 10));
            }
            // Clear obstacles in current lane that were dodged
            setObstacles(prev => prev.filter(obs => obs.lane === carLane && obs.y > 60 ? false : true));
            setSteerTarget(null);
            setSteerWord('');
            setScore(s => s + 150);
          } else {
            // Regular speed word completed
            setScore(s => s + 80);
            setSpeed(prev => Math.min(280, prev + 15));
            setCurrentWord(getRandomSpeedWord());
          }
          setTypedChars('');
        }
      } else {
        // Typo
        synth.playError();
        totalErrorsRef.current += 1;
        keyMetricsRef.current[cleanKey].errors += 1;
        // Penality: Reduce speed slightly on typos
        setSpeed(prev => Math.max(60, prev - 10));
      }

      // WPM / ACC calculation
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
  }, [currentWord, typedChars, gameState, steerTarget, steerWord, carLane, triggerGameComplete]);



  const handleRestart = () => {
    setCarLane(1);
    setShield(100);
    setSpeed(120);
    setDistance(0);
    setScore(0);
    setObstacles([]);
    setCurrentWord(getRandomSpeedWord());
    setTypedChars('');
    setSteerTarget(null);
    setSteerWord('');
    setWpm(0);
    setAccuracy(100);
    totalPressesRef.current = 0;
    totalErrorsRef.current = 0;
    startTimeRef.current = performance.now();
    lastKeyTimeRef.current = performance.now();
    setGameState('playing');
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      <div className="relative bg-[#05000f] border border-purple-500/20 rounded-3xl h-[420px] overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Neon Highway Scrolling Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Horizon */}
            <line x1="0" y1="40" x2="100" y2="40" stroke="#a21caf" strokeWidth="0.5" />
            {/* Lanes perspective */}
            <line x1="15" y1="100" x2="40" y2="40" stroke="#6b21a8" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="85" y1="100" x2="60" y2="40" stroke="#6b21a8" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="38" y1="100" x2="47" y2="40" stroke="#4a044e" strokeWidth="0.5" />
            <line x1="62" y1="100" x2="53" y2="40" stroke="#4a044e" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Speed dust lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-[10%] w-0.5 h-16 bg-purple-500/25 rotate-[30deg] animate-pulse"></div>
          <div className="absolute top-2/3 left-[85%] w-0.5 h-16 bg-pink-500/25 -rotate-[30deg] animate-pulse"></div>
        </div>

        {/* HUD Stats */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3 bg-black/60 border border-purple-500/20 px-3 py-1.5 rounded-xl backdrop-blur-sm text-xs font-bold text-purple-300">
            <Shield className="w-4 h-4 text-pink-400" />
            <div className="w-20 h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300" style={{ width: `${shield}%` }}></div>
            </div>
            <span>{shield}% SHIELD</span>
          </div>

          <div className="flex items-center gap-4 bg-black/60 border border-purple-500/20 px-4 py-1.5 rounded-xl backdrop-blur-sm text-[11px] font-bold text-gray-400">
            <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-purple-400" /> {speed} KM/H</span>
            <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5 text-pink-400" /> {distance}m / 1000m</span>
            <span>SCORE: <strong className="text-white">{score}</strong></span>
          </div>
        </div>

        {gameState === 'playing' ? (
          <>
            {/* Upper Sky Glow */}
            <div className="absolute top-[40px] left-0 right-0 h-[80px] bg-gradient-to-b from-[#120024] to-transparent pointer-events-none"></div>

            {/* Obstacles container */}
            <div className="absolute inset-0 pointer-events-none">
              {obstacles.map(obs => (
                <div 
                  key={obs.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-75`}
                  style={{
                    left: `${15 + obs.lane * 35}%`,
                    top: `${40 + (obs.y / 100) * 50}%`,
                    transform: `translate(-50%, -50%) scale(${0.3 + (obs.y / 100) * 0.7})`
                  }}
                >
                  {/* Obstacle box */}
                  <div className="p-3 bg-red-950/90 border border-red-500 text-red-400 rounded-xl text-lg font-black shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-bounce">
                    ⚠️
                  </div>
                  <span className="text-[7px] text-red-400 uppercase font-black tracking-widest mt-1 bg-black/80 px-1 py-0.5 rounded border border-red-500/20">
                    {obs.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Main Steering Alert Overlay */}
            {steerTarget && (
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
                <div className="px-4 py-1 bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg text-[9px] font-extrabold flex items-center gap-1.5 uppercase animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> Collision Imminent: Type to Steer
                </div>
                <div className="px-4 py-2 bg-[#1b002c]/90 border-2 border-pink-500 text-pink-400 font-extrabold text-sm rounded-xl tracking-widest select-none shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  <span className="text-pink-100">{typedChars}</span>
                  <span className="text-pink-500/40">{steerWord.substring(typedChars.length)}</span>
                </div>
              </div>
            )}

            {/* Bottom Cyber Car */}
            <div 
              className={`absolute bottom-[30px] transform -translate-x-1/2 transition-all duration-300 flex flex-col items-center z-10 ${
                carLane === 0 ? 'left-[22%]' : carLane === 2 ? 'left-[78%]' : 'left-[50%]'
              }`}
            >
              {/* Retro Futuristic Car SVG */}
              <svg width="70" height="40" viewBox="0 0 70 40" className="drop-shadow-[0_0_15px_#d946ef]">
                {/* Neon Underglow */}
                <ellipse cx="35" cy="35" rx="25" ry="4" fill="#d946ef" className="animate-pulse opacity-85" />
                {/* Wheels */}
                <rect x="10" y="30" width="10" height="8" rx="2" fill="#1e1b4b" />
                <rect x="50" y="30" width="10" height="8" rx="2" fill="#1e1b4b" />
                {/* Body chassis */}
                <path d="M5 25 L15 15 L55 15 L65 25 L62 33 L8 33 Z" fill="#0f052d" stroke="#d946ef" strokeWidth="2.5" />
                {/* Cockpit glass */}
                <path d="M22 15 L30 8 L42 8 L48 15 Z" fill="#f472b6" opacity="0.8" />
                {/* Tail lights */}
                <rect x="6" y="22" width="6" height="3" fill="#ef4444" />
                <rect x="58" y="22" width="6" height="3" fill="#ef4444" />
              </svg>
              {steerTarget ? (
                <span className="text-[7px] text-pink-400 font-extrabold uppercase mt-1.5 flex items-center gap-1 bg-black/80 border border-pink-500/20 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                  <ArrowLeftRight className="w-2.5 h-2.5" /> Shifting...
                </span>
              ) : (
                <span className="text-[7px] text-purple-400 font-extrabold uppercase mt-1.5 flex items-center gap-1 bg-black/80 border border-purple-500/20 px-1.5 py-0.5 rounded tracking-widest">
                  <Zap className="w-2.5 h-2.5" /> Cruise active
                </span>
              )}
            </div>

            {/* Standard speed word typing board at bottom */}
            {!steerTarget && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-[280px] bg-black/90 border border-purple-500/30 py-3 px-4 rounded-2xl flex flex-col items-center gap-1 shadow-lg">
                <span className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">Speed Vector Injector</span>
                
                {/* Typing Word Display */}
                <div className="text-xs font-black tracking-widest text-purple-300">
                  <span className="text-purple-100">{typedChars}</span>
                  <span className="text-purple-600">{currentWord.substring(typedChars.length)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Finished Screens */
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 gap-6">
            
            {gameState === 'won' ? (
              <>
                <div className="p-4 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500">
                  <Trophy className="w-12 h-12 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">Race Completed</h2>
                  <p className="text-sm text-purple-300 mt-1 font-bold">Successfully cruised 1000m on the neon grid highway!</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <AlertCircle className="w-12 h-12 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">Chassis Destroyed</h2>
                  <p className="text-sm text-gray-400 mt-1">Car shield depleted after collision impact with highway blockades.</p>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl min-w-[340px]">
              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase">SCORE</span>
                <span className="text-lg font-bold text-white">{score}</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase">DISTANCE</span>
                <span className="text-lg font-bold text-purple-400">{distance}m</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase">SPEED</span>
                <span className="text-lg font-bold text-emerald-400">{wpm} WPM</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[9px] text-gray-500 font-bold uppercase">ACCURACY</span>
                <span className="text-lg font-bold text-teal-400">{accuracy}%</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 transition-all font-bold text-xs tracking-widest text-white rounded-xl shadow-lg active:scale-95 cursor-pointer uppercase"
              >
                Drive Again
              </button>
              
              <button
                onClick={() => triggerGameComplete(gameState === 'won', shield)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs tracking-widest text-gray-300 rounded-xl active:scale-95 cursor-pointer uppercase"
              >
                Return to Nodes Map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
