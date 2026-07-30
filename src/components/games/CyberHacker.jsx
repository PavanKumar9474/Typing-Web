import React, { useState, useEffect, useRef, useCallback } from 'react';
import { synth } from '../../utils/soundSynth';
import { Terminal, ShieldAlert, Cpu, Unlock, Wifi, AlertTriangle } from 'lucide-react';

const HACK_WORDS = [
  'decrypt', 'override', 'firewall', 'backdoor', 'mainframe', 'rootaccess',
  'exploit', 'spoofing', 'payload', 'handshake', 'injectsql', 'cryptokey',
  'kernel', 'cybernet', 'security', 'database', 'network', 'terminal',
  'quantum', 'firmware', 'bypassing', 'injection', 'protocols', 'sysadmin'
];

const DECOY_WORDS = [
  'decoyport', 'traceclear', 'sysreset', 'proxyroute', 'masksubnet'
];

const NETWORK_NODES = [
  { id: 'port80', name: 'HTTP Web server', status: 'secured' },
  { id: 'db_auth', name: 'SQL Database authentication', status: 'secured' },
  { id: 'ssh_gate', name: 'SSH Secure Gateway', status: 'secured' },
  { id: 'sys_logs', name: 'System Auditor log sub-chain', status: 'secured' },
  { id: 'root_ker', name: 'Secure Micro-kernel ring-0', status: 'secured' },
  { id: 'cloud_dns', name: 'Multi-region CDN / DNS cluster', status: 'secured' },
];

export default function CyberHacker({ onGameComplete }) {
  const [breachProgress, setBreachProgress] = useState(0);
  const [traceLevel, setTraceLevel] = useState(0);
  const [nodes, setNodes] = useState(NETWORK_NODES);
  
  // Game states
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [score, setScore] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Typing logic
  const [currentWord, setCurrentWord] = useState('');
  const [typedChars, setTypedChars] = useState('');
  const [isDecoyActive, setIsDecoyActive] = useState(false);
  const [decoyTimer, setDecoyTimer] = useState(0);

  // Console output log
  const [consoleLogs, setConsoleLogs] = useState([
    'Initializing sandbox intrusion shell...',
    'Target Host: SECURE_HOST_101.net',
    'Awaiting injection payload...'
  ]);

  // Performance/analytics refs
  const totalPressesRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const startTimeRef = useRef(null);
  const lastKeyTimeRef = useRef(null);
  const keyMetricsRef = useRef({});

  // Initialize game
  useEffect(() => {
    startTimeRef.current = performance.now();
    lastKeyTimeRef.current = performance.now();
    setCurrentWord(getRandomWord());
  }, []);

  const getRandomWord = () => {
    return HACK_WORDS[Math.floor(Math.random() * HACK_WORDS.length)];
  };

  const triggerGameComplete = useCallback((won, finalTrace) => {
    const timeMinutes = (performance.now() - startTimeRef.current) / 60000;
    const finalWpm = Math.round((totalPressesRef.current / 5) / (timeMinutes || 0.001));
    const finalAcc = totalPressesRef.current > 0
      ? Math.round(((totalPressesRef.current - totalErrorsRef.current) / totalPressesRef.current) * 100)
      : 100;

    const coinsEarned = won ? Math.round(100 + (100 - finalTrace) * 1.5) : Math.round(score * 0.1);
    const xpEarned = won ? 150 : 40;

    if (onGameComplete) {
      onGameComplete({
        wpm: finalWpm,
        accuracy: finalAcc,
        score: score + (won ? 500 : 0),
        won,
        coins: coinsEarned,
        xp: xpEarned,
        keyMetrics: keyMetricsRef.current
      });
    }
  }, [score, onGameComplete]);


  // Log message helper
  const addLog = (message) => {
    setConsoleLogs(prev => [...prev, message].slice(-7));
  };

  // Intrusion Trace game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTraceLevel(prev => {
        // IDS Scanner grows 1.8% per second
        const nextTrace = Math.min(100, prev + 1.8);
        if (nextTrace >= 100) {
          setGameState('lost');
          synth.playExplosion();
          triggerGameComplete(false, nextTrace);
        }
        return nextTrace;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, triggerGameComplete]);

  // Random Decoy alert spawner
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnDecoyInterval = setInterval(() => {
      if (!isDecoyActive && Math.random() > 0.4) {
        setIsDecoyActive(true);
        setCurrentWord(DECOY_WORDS[Math.floor(Math.random() * DECOY_WORDS.length)]);
        setTypedChars('');
        setDecoyTimer(8); // 8 seconds to clear decoy
        addLog('! IDS WARNING: High security trace sweep incoming !');
        synth.playHit();
      }
    }, 9000);

    return () => clearInterval(spawnDecoyInterval);
  }, [gameState, isDecoyActive]);

  // Decoy countdown timer
  useEffect(() => {
    if (!isDecoyActive || gameState !== 'playing') return;

    const decoyTick = setInterval(() => {
      setDecoyTimer(t => {
        if (t <= 1) {
          // Time ran out!
          setIsDecoyActive(false);
          setTraceLevel(prev => Math.min(100, prev + 15));
          addLog('! IDS sweep completed: Security trace increased !');
          setCurrentWord(getRandomWord());
          setTypedChars('');
          synth.playError();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(decoyTick);
  }, [isDecoyActive, gameState]);

  // Keystroke listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key.length !== 1) return;

      const key = e.key.toLowerCase();
      const targetChar = currentWord[typedChars.length];

      totalPressesRef.current += 1;
      const now = performance.now();
      const latency = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Log statistics for key metric mapping
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

        // Check if word completed
        if (nextTyped === currentWord) {
          synth.playSpellCast();
          
          if (isDecoyActive) {
            // Cleared decoy! Lower trace level
            setIsDecoyActive(false);
            setTraceLevel(prev => Math.max(0, prev - 25));
            addLog(`Decoy deployed. Security trace deflected!`);
            setScore(s => s + 200);
          } else {
            // Standard hack word complete
            setScore(s => s + 100);
            
            // Advance breach progress
            setBreachProgress(prev => {
              const nextBreach = Math.min(100, prev + 12.5); // 8 words to complete
              
              // Unsecure/hack a random node
              setNodes(prevNodes => {
                const securedNodes = prevNodes.filter(n => n.status === 'secured');
                if (securedNodes.length > 0) {
                  const nodeToHack = securedNodes[Math.floor(Math.random() * securedNodes.length)];
                  addLog(`Exploited node: ${nodeToHack.name} -> COMPROMISED`);
                  return prevNodes.map(n => n.id === nodeToHack.id ? { ...n, status: 'compromised' } : n);
                }
                return prevNodes;
              });

              if (nextBreach >= 100) {
                setGameState('won');
                synth.playVictory();
                if (onGameComplete) {
                  triggerGameComplete(true, traceLevel);
                }
              }
              return nextBreach;
            });
          }

          // Pick next word
          setCurrentWord(getRandomWord());
          setTypedChars('');
        }
      } else {
        // Typo
        synth.playError();
        totalErrorsRef.current += 1;
        keyMetricsRef.current[cleanKey].errors += 1;
        
        // Typo penalty: Increments IDS trace level!
        setTraceLevel(prev => Math.min(100, prev + 2.5));
        addLog(`IDS WARNING: Packet corruption anomaly detected`);
      }

      // Live WPM/ACC stats calculations
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
    }, [currentWord, typedChars, gameState, isDecoyActive, traceLevel, triggerGameComplete, onGameComplete]);



  const handleRestart = () => {
    setBreachProgress(0);
    setTraceLevel(0);
    setNodes(NETWORK_NODES.map(n => ({ ...n, status: 'secured' })));
    setScore(0);
    setWpm(0);
    setAccuracy(100);
    setCurrentWord(getRandomWord());
    setTypedChars('');
    setIsDecoyActive(false);
    setConsoleLogs([
      'Initializing sandbox intrusion shell...',
      'Target Host: SECURE_HOST_101.net',
      'Awaiting injection payload...'
    ]);
    totalPressesRef.current = 0;
    totalErrorsRef.current = 0;
    startTimeRef.current = performance.now();
    lastKeyTimeRef.current = performance.now();
    setGameState('playing');
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      <div className="relative bg-[#040909] border border-emerald-500/20 rounded-3xl p-6 min-h-[460px] overflow-hidden shadow-2xl flex flex-col gap-6">
        
        {/* Glow overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-emerald-500/5 blur-[80px] pointer-events-none"></div>

        {/* HUD top meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 z-10">
          
          {/* Mainframe System Breach progress */}
          <div className="bg-black/60 border border-emerald-500/10 p-3 rounded-2xl">
            <div className="flex justify-between items-center text-xs font-bold text-emerald-400 mb-1.5">
              <span className="flex items-center gap-1.5 uppercase">
                <Unlock className="w-3.5 h-3.5" /> Breach Progress
              </span>
              <span>{Math.round(breachProgress)}%</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-emerald-500/10">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 shadow-[0_0_10px_#10b981]"
                style={{ width: `${breachProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Security IDS Trace Progress */}
          <div className="bg-black/60 border border-rose-500/10 p-3 rounded-2xl">
            <div className="flex justify-between items-center text-xs font-bold text-rose-400 mb-1.5">
              <span className="flex items-center gap-1.5 uppercase">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> IDS Trace Status
              </span>
              <span>{Math.round(traceLevel)}%</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-rose-500/10">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300 shadow-[0_0_10px_#ef4444]"
                style={{ width: `${traceLevel}%` }}
              ></div>
            </div>
          </div>

          {/* Diagnostic WPM / ACC metrics */}
          <div className="bg-black/60 border border-emerald-500/10 p-3 rounded-2xl flex items-center justify-around text-xs font-bold text-gray-400">
            <div>
              <span className="block text-[10px] text-gray-500 uppercase">SPEED</span>
              <span className="text-sm text-emerald-400 font-extrabold">{wpm} WPM</span>
            </div>
            <div className="border-l border-emerald-500/10 h-6"></div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase">ACCURACY</span>
              <span className="text-sm text-teal-400 font-extrabold">{accuracy}%</span>
            </div>
            <div className="border-l border-emerald-500/10 h-6"></div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase">SCORE</span>
              <span className="text-sm text-white font-extrabold">{score}</span>
            </div>
          </div>
        </div>

        {gameState === 'playing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 z-10">
            
            {/* Left: Terminal output */}
            <div className="lg:col-span-1 bg-black/80 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-between h-[280px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-extrabold border-b border-emerald-500/15 pb-2 mb-2 uppercase">
                  <Terminal className="w-4 h-4" /> root@sandbox_terminal
                </div>
                <div className="space-y-1 text-[10px] text-emerald-400/80 leading-relaxed font-mono">
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} className="truncate">
                      <span className="text-emerald-600 font-extrabold">&gt; </span>{log}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-emerald-500/40 uppercase font-extrabold border-t border-emerald-500/10 pt-2 flex justify-between">
                <span>BUFFER STATUS: ACTIVE</span>
                <span>ENC: RSA-4096</span>
              </div>
            </div>

            {/* Center: System Nodes Visualization */}
            <div className="lg:col-span-1 bg-black/80 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-center gap-3">
              <div className="text-center text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Mainframe Hub Network</div>
              <div className="grid grid-cols-2 gap-3">
                {nodes.map(n => (
                  <div 
                    key={n.id} 
                    className={`flex items-center gap-2 p-2 rounded-xl border text-[9px] font-bold transition-all duration-300 ${
                      n.status === 'compromised' 
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' 
                        : 'border-white/5 bg-white/5 text-gray-500'
                    }`}
                  >
                    <Cpu className={`w-3.5 h-3.5 ${n.status === 'compromised' ? 'text-emerald-400 animate-pulse' : 'text-gray-600'}`} />
                    <div className="truncate">
                      <div className="truncate uppercase font-extrabold">{n.id}</div>
                      <div className="text-[7px] text-gray-600 uppercase truncate mt-0.5">{n.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hacking Injection Typing Core */}
            <div className="lg:col-span-1 bg-black/80 border border-emerald-500/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-6 relative">
              
              {isDecoyActive && (
                <div className="absolute top-3 left-3 right-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl py-1.5 px-3 text-[9px] font-extrabold flex justify-between items-center animate-pulse">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> DECOY SEQUENCE ACTIVE</span>
                  <span>{decoyTimer}s LEFT</span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-emerald-500/60 uppercase font-black tracking-widest block mb-1">
                  {isDecoyActive ? 'DECOY INJECTION STRING' : 'PAYLOAD STRING TO INJECT'}
                </span>
                <span className="text-[8px] text-gray-500 font-bold block mb-4 uppercase">
                  {isDecoyActive ? 'Clears trace levels' : 'Hack sub-nodes'}
                </span>
              </div>

              {/* Hacking Target Bubble */}
              <div 
                className={`w-full py-4 px-3 rounded-2xl border text-base font-black tracking-widest select-none transition-all ${
                  isDecoyActive 
                    ? 'bg-rose-950/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                    : 'bg-emerald-950/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                }`}
              >
                <span className={isDecoyActive ? 'text-rose-200' : 'text-emerald-200'}>
                  {typedChars}
                </span>
                <span className={isDecoyActive ? 'text-rose-500/40' : 'text-emerald-500/40'}>
                  {currentWord.substring(typedChars.length)}
                </span>
              </div>

              <div className="text-[9px] text-gray-600 font-bold uppercase">
                {isDecoyActive ? 'Hurry! Complete to spoof IDS tracers.' : 'Type command exactly to patch ports.'}
              </div>
            </div>

          </div>
        ) : (
          /* Game Over / Win Screens */
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 gap-6">
            
            {gameState === 'won' ? (
              <>
                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Wifi className="w-12 h-12 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">Mainframe Breached</h2>
                  <p className="text-sm text-emerald-400/80 mt-1 font-bold font-mono">Successfully decrypted all classified micro-cores.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <ShieldAlert className="w-12 h-12 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">Breach Aborted: Traced</h2>
                  <p className="text-sm text-gray-400 mt-1">Intrusion Detection System isolated and locked down sandbox ports.</p>
                </div>
              </>
            )}

            <div className="grid grid-cols-3 gap-6 bg-white/5 border border-white/5 p-4 rounded-2xl min-w-[320px]">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">FINAL SCORE</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">SPEED</span>
                <span className="text-xl font-bold text-emerald-400">{wpm} WPM</span>
              </div>
              <div className="border-l border-white/10"></div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">Accuracy</span>
                <span className="text-xl font-bold text-teal-400">{accuracy}%</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all font-bold text-xs tracking-widest text-white rounded-xl shadow-lg active:scale-95 cursor-pointer uppercase"
              >
                Infiltrate Again
              </button>
              
              <button
                onClick={() => triggerGameComplete(gameState === 'won', traceLevel)}
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
