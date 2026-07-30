import React, { useState, useEffect, useRef } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { synth } from '../utils/soundSynth';
import { Trophy, Users, Play } from 'lucide-react';

const MULTIPLAYER_TEXTS = [
  "A swift hacker breaches the firewall, bypassing encryption protocols in mere seconds to secure the core data nodes.",
  "The cosmic explorer maneuvers the vessel through dangerous dust clouds, aiming for the stellar coordinates.",
  "Deep in the cybernetic tunnels, mechanical guardians patrol the glowing sectors looking for timeline anomalies."
];

export default function Multiplayer({ onRaceComplete }) {
  const [gameState, setGameState] = useState('lobby'); // 'lobby', 'racing', 'results'
  const [countdown, setCountdown] = useState(null);
  
  // Competitors
  const [competitors, setCompetitors] = useState([
    { name: 'CyberSpeedster', wpm: 70, progress: 0, finished: false, place: null },
    { name: 'TypingZilla', wpm: 48, progress: 0, finished: false, place: null },
    { name: 'WizardRacer', wpm: 62, progress: 0, finished: false, place: null },
    { name: 'You (Player)', wpm: 0, progress: 0, finished: false, place: null }
  ]);

  const [activeText, setActiveText] = useState('');
  const finishOrderRef = useRef([]);

  const startCountdown = () => {
    synth.playClick();
    setCountdown(3);
    setActiveText(MULTIPLAYER_TEXTS[Math.floor(Math.random() * MULTIPLAYER_TEXTS.length)]);
    finishOrderRef.current = [];
    
    // Reset competitor progresses
    setCompetitors([
      { name: 'CyberSpeedster', wpm: 60 + Math.floor(Math.random() * 20), progress: 0, finished: false, place: null },
      { name: 'TypingZilla', wpm: 40 + Math.floor(Math.random() * 15), progress: 0, finished: false, place: null },
      { name: 'WizardRacer', wpm: 50 + Math.floor(Math.random() * 18), progress: 0, finished: false, place: null },
      { name: 'You (Player)', wpm: 0, progress: 0, finished: false, place: null }
    ]);
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        synth.playClick();
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      synth.playSpellCast();
      setGameState('racing');
      setCountdown(null);
    }
  }, [countdown]);

  const handlePlayerComplete = ({ wpm, accuracy }) => {
    // Player finishes
    synth.playVictory();
    
    setCompetitors(prev => {
      const updated = prev.map(c => {
        if (c.name === 'You (Player)') {
          finishOrderRef.current.push(c.name);
          return { ...c, progress: 100, finished: true, wpm, place: finishOrderRef.current.length };
        }
        return c;
      });
      return updated;
    });

    // Short delay to show results
    setTimeout(() => {
      setGameState('results');
      if (onRaceComplete) {
        const playerPlace = finishOrderRef.current.indexOf('You (Player)') + 1;
        onRaceComplete({
          wpm,
          accuracy,
          place: playerPlace,
          coins: playerPlace === 1 ? 120 : playerPlace === 2 ? 80 : playerPlace === 3 ? 50 : 30
        });
      }
    }, 1200);
  };

  const {
    text,
    cursor,
    wpm: playerWpm,
    accuracy: playerAccuracy,
    handleKeyDown
  } = useTypingEngine(gameState === 'racing' ? activeText : '', handlePlayerComplete);

  // Keyboard typing listener during race
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (gameState === 'racing') {
        handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, gameState]);

  // Track Player's typing progress
  useEffect(() => {
    if (gameState !== 'racing') return;

    const percent = activeText.length > 0 ? Math.round((cursor / activeText.length) * 100) : 0;
    setCompetitors(prev => prev.map(c => {
      if (c.name === 'You (Player)') {
        return { ...c, progress: percent };
      }
      return c;
    }));
  }, [cursor, activeText, gameState]);

  // Simulate bots racing
  useEffect(() => {
    if (gameState !== 'racing') return;

    const interval = setInterval(() => {
      setCompetitors(prev => {
        let allFinished = true;
        const updated = prev.map(c => {
          if (c.name === 'You (Player)') {
            if (!c.finished) allFinished = false;
            return c;
          }

          if (c.finished) return c;

          // Increment progress based on bot targeted WPM
          // WPM is words per minute. Word = 5 characters.
          // Progress is percentage. Total characters = activeText.length.
          // Progress added per second = (WPM * 5) / 60 / activeText.length * 100
          const increment = (c.wpm * 5 / 60) / activeText.length * 100;
          const nextProgress = Math.min(100, c.progress + increment * 0.5); // updated every 500ms

          const isNowFinished = nextProgress >= 100;
          if (isNowFinished) {
            finishOrderRef.current.push(c.name);
          } else {
            allFinished = false;
          }

          return {
            ...c,
            progress: Math.round(nextProgress),
            finished: isNowFinished,
            place: isNowFinished ? finishOrderRef.current.length : null
          };
        });

        if (allFinished) {
          clearInterval(interval);
          setTimeout(() => setGameState('results'), 1200);
        }

        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameState, activeText]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      
      {/* Lobby / Join screen */}
      {gameState === 'lobby' && (
        <div className="bg-[#111625]/90 border border-cyan-500/20 p-8 rounded-3xl text-center flex flex-col items-center gap-6 shadow-2xl">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full animate-pulse">
            <Users className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Multiplayer Race Lobby</h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Match up against three active AI cyber-racers. The fastest typing speeds win!
            </p>
          </div>

          {countdown !== null ? (
            <div className="text-6xl font-black text-cyan-400 animate-ping my-6">{countdown === 0 ? 'GO!' : countdown}</div>
          ) : (
            <button
              onClick={startCountdown}
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg shadow-cyan-500/20 uppercase flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Find Race Match
            </button>
          )}
        </div>
      )}

      {/* Racing view */}
      {gameState === 'racing' && (
        <div className="flex flex-col gap-6">
          
          {/* Race Track */}
          <div className="bg-[#0c0d14] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-black border-b border-white/5 pb-2">Typing Odyssey Track</div>
            
            <div className="space-y-4">
              {competitors.map(competitor => {
                const isPlayer = competitor.name.includes('You');
                return (
                  <div key={competitor.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={isPlayer ? 'text-cyan-400' : 'text-gray-400'}>
                        {competitor.name} {competitor.finished && <strong className="text-yellow-400">({competitor.place}🏁)</strong>}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase">{isPlayer ? playerWpm : competitor.wpm} WPM</span>
                    </div>

                    <div className="relative h-6 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                      {/* Laser Track Progress Grid lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:10%_100%]"></div>
                      
                      {/* Track progress fill */}
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          isPlayer 
                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_12px_#06b6d4]' 
                            : 'bg-gradient-to-r from-gray-700 to-gray-500'
                        }`}
                        style={{ width: `${competitor.progress}%` }}
                      ></div>

                      {/* Racer Icon Pin */}
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300"
                        style={{ left: `calc(${competitor.progress}% - 14px)` }}
                      >
                        <span className="text-sm">{isPlayer ? '🛸' : '👾'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Typing Area */}
          <div className="bg-[#111625] border border-cyan-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="font-mono text-base leading-relaxed text-gray-500 select-none bg-black/40 p-5 rounded-2xl border border-white/5">
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

            <div className="flex gap-6 text-xs text-gray-400">
              <span>WPM: <strong className="text-white">{playerWpm}</strong></span>
              <span>Accuracy: <strong className="text-white">{playerAccuracy}%</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* Results screen */}
      {gameState === 'results' && (
        <div className="bg-[#111625]/95 border border-cyan-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center gap-6">
          <div className="p-4 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <Trophy className="w-12 h-12 animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Race Summary</h2>
            <p className="text-sm text-gray-400 mt-1">Check how your speed stacked up against the grid.</p>
          </div>

          {/* Leaderboard Placements */}
          <div className="w-full max-w-md bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2.5">
            {competitors
              .sort((a, b) => (a.place || 99) - (b.place || 99))
              .map((racer, index) => {
                const isPlayer = racer.name.includes('You');
                return (
                  <div 
                    key={racer.name} 
                    className={`flex justify-between items-center px-4 py-2.5 rounded-xl border ${
                      isPlayer 
                        ? 'bg-cyan-950/20 border-cyan-500/30 text-white' 
                        : 'bg-black/20 border-transparent text-gray-400'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-2">
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-black">#{index + 1}</span>
                      {racer.name}
                    </span>
                    <span className="text-xs font-semibold">{isPlayer ? playerWpm : racer.wpm} WPM</span>
                  </div>
                );
              })}
          </div>

          <button
            onClick={() => setGameState('lobby')}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg active:scale-95 cursor-pointer"
          >
            Find Another Match
          </button>
        </div>
      )}

    </div>
  );
}
