import React, { useState, useEffect } from 'react';
import { useTypingEngine } from '../../hooks/useTypingEngine';
import { synth } from '../../utils/soundSynth';
import { ShieldAlert, Compass, Coins, Sparkles, AlertTriangle } from 'lucide-react';

const ERAS = {
  prehistoric: {
    name: 'Prehistoric Dinosaur Age',
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
    accentColor: '#10b981',
    text: 'Deep within the prehistoric jungle, massive herbivores graze on giant ferns while velociraptors stalk through the damp undergrowth. Volcanic ash drifts across a sky ruled by pterodactyls, where the earth vibrates with the heavy footsteps of a colossal tyrannosaurus rex.',
    elements: ['🌋 Volcano', '🦕 Diplodocus', '🌴 Fern Trees', '🦖 T-Rex', '☄️ Meteor']
  },
  egypt: {
    name: 'Ancient Egypt',
    color: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
    accentColor: '#f59e0b',
    text: 'Under the baking desert sun, thousands of builders align heavy limestone blocks to construct the great pyramids. Pharaonic power is carved into towering obelisks along the fertile banks of the Nile, where golden tombs store treasures for eternity.',
    elements: ['📐 Pyramids', '🦁 Sphinx', '🌾 Nile Palm', '🐪 Camel Caravan', '👑 Golden Mask']
  },
  cyberpunk: {
    name: 'Cyberpunk Future',
    color: 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-950/20',
    accentColor: '#d946ef',
    text: 'Neon signs flicker in the eternal rain as flying transports navigate between sky-scraping megastructures. Street vendors sell synthetic noodles beneath holographic billboards, where cybernetically enhanced hackers jack into the global net grid.',
    elements: ['🏢 Megacity Towers', '🛸 Flying Cars', '💿 Holograms', '🤖 Drones', '🔋 Power Nodes']
  }
};

export default function TimeArchitect({ onGameComplete }) {
  const [selectedEra, setSelectedEra] = useState('prehistoric');
  const [timelineFractures, setTimelineFractures] = useState([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const eraData = ERAS[selectedEra];

  const handleLevelComplete = ({ wpm, accuracy }) => {
    synth.playVictory();
    if (onGameComplete) {
      // Reward coins based on accuracy, WPM
      const earnedCoins = Math.round((wpm * 2) * (accuracy / 100));
      onGameComplete({
        wpm,
        accuracy,
        score: wpm * 10 + accuracy * 5,
        won: true,
        coins: earnedCoins,
        xp: 150,
        era: selectedEra
      });
    }
  };

  const {
    text,
    cursor,
    wpm,
    accuracy,
    streak,
    errorCount,
    isFinished,
    handleKeyDown,
    resetEngine
  } = useTypingEngine(gameStarted ? eraData.text : '', handleLevelComplete);

  // Monitor mistakes to trigger timeline fractures
  useEffect(() => {
    if (errorCount > 0 && gameStarted && !isFinished) {
      setGlitchActive(true);
      synth.playHit();
      
      // Spawn an anomalous entity from a different era!
      const allEras = Object.keys(ERAS);
      const otherEras = allEras.filter(e => e !== selectedEra);
      const randomForeignEra = otherEras[Math.floor(Math.random() * otherEras.length)];
      const foreignElements = ERAS[randomForeignEra].elements;
      const randomForeignElement = foreignElements[Math.floor(Math.random() * foreignElements.length)];

      const newFracture = {
        id: Math.random().toString(36).substring(2, 9),
        element: randomForeignElement,
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 50
      };

      setTimelineFractures(prev => [...prev, newFracture].slice(-5)); // Limit to max 5 fractures

      const timer = setTimeout(() => {
        setGlitchActive(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [errorCount, gameStarted, selectedEra, isFinished]);

  // Handle typing listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (gameStarted && !isFinished) {
        handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, gameStarted, isFinished]);

  const startArchitect = () => {
    setTimelineFractures([]);
    setGameStarted(true);
    resetEngine(eraData.text);
  };

  const handleEraSelect = (key) => {
    setSelectedEra(key);
    setGameStarted(false);
  };

  // Calculate completion percentage
  const completionPercent = text.length > 0 ? Math.round((cursor / text.length) * 100) : 0;
  
  // Elements built based on typing progress
  const visibleElementsCount = Math.min(
    eraData.elements.length,
    Math.floor((completionPercent / 100) * (eraData.elements.length + 1))
  );
  const activeBuiltElements = eraData.elements.slice(0, visibleElementsCount);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      
      {/* Era Selector Tabs */}
      {!gameStarted && (
        <div className="bg-[#111625]/90 border border-white/5 p-4 rounded-3xl flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" /> Choose Era to Rebuild
            </h2>
            <p className="text-xs text-gray-400 mt-1">Select an era and type correctly to reconstruct history.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(ERAS).map(([key, data]) => {
              const active = selectedEra === key;
              return (
                <button
                  key={key}
                  onClick={() => handleEraSelect(key)}
                  className={`
                    p-6 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer
                    ${active 
                      ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white' 
                      : 'border-white/5 bg-black/30 text-gray-400 hover:border-white/20 hover:text-white'}
                  `}
                >
                  <span className="text-3xl">
                    {key === 'prehistoric' ? '🦖' : key === 'egypt' ? '🐫' : '🛸'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">{data.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={startArchitect}
            className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg shadow-cyan-500/25 uppercase cursor-pointer"
          >
            Initiate Reconstruction
          </button>
        </div>
      )}

      {/* Rebuilding Simulation Box */}
      {gameStarted && (
        <div className={`relative border rounded-3xl h-[280px] overflow-hidden shadow-2xl transition-all duration-150 ${
          glitchActive 
            ? 'border-rose-500 bg-rose-950/20 animate-shake' 
            : 'border-cyan-500/20 bg-[#070913]'
        }`}>
          {/* Glitch Overlay Effect */}
          {glitchActive && (
            <div className="absolute inset-0 bg-rose-500/10 backdrop-invert-[5%] z-20 pointer-events-none flex items-center justify-center">
              <div className="text-rose-500 text-xs font-black tracking-widest uppercase flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 animate-bounce" /> Timeline Fracture Detected!
              </div>
            </div>
          )}

          {/* Sky / Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent opacity-60"></div>
          
          {/* Timeline progress indicator */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 text-xs bg-black/40 border border-white/5 py-1.5 px-3 rounded-xl">
            <span className="text-gray-400 uppercase tracking-widest">Era: <strong className="text-white">{eraData.name}</strong></span>
            <span className="text-gray-400 uppercase tracking-widest">Reconstruction: <strong className="text-cyan-400">{completionPercent}%</strong></span>
          </div>

          {/* Built Elements (Correct typing renders these) */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full h-full">
              {activeBuiltElements.map((item, idx) => (
                <div
                  key={idx}
                  className="absolute p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-2xl text-xs font-bold shadow-md shadow-cyan-500/5 animate-fade-in"
                  style={{
                    left: `${20 + idx * 16}%`,
                    bottom: `${15 + (idx % 2) * 15}%`
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-yellow-400 animate-spin-slow" />
                  {item}
                </div>
              ))}

              {/* Spawn timeline fractures (Anachronisms) */}
              {timelineFractures.map(frac => (
                <div
                  key={frac.id}
                  className="absolute p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-black shadow-md shadow-rose-500/10 animate-bounce flex items-center gap-1"
                  style={{
                    left: `${frac.x}%`,
                    top: `${frac.y}%`
                  }}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 animate-pulse" />
                  <span>Fracture: {frac.element}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Construction Grid Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_10px_#06b6d4]"></div>
        </div>
      )}

      {/* Typing Paragraph Interface */}
      {gameStarted && !isFinished && (
        <div className="bg-[#111625] border border-cyan-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-black">Type to rebuild time</div>
          
          {/* Paragraph Box */}
          <div className="font-mono text-base sm:text-lg leading-relaxed text-gray-500 select-none bg-black/40 p-5 rounded-2xl border border-white/5 text-justify">
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

          {/* Dynamic typing metrics stats footer */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4 text-xs text-gray-400">
            <div className="flex gap-6">
              <span>WPM: <strong className="text-white">{wpm}</strong></span>
              <span>Accuracy: <strong className="text-white">{accuracy}%</strong></span>
              <span>Streak: <strong className="text-white">{streak}</strong></span>
              <span>Fractures: <strong className="text-rose-500">{errorCount}</strong></span>
            </div>
            <button
              onClick={() => setGameStarted(false)}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase transition-all"
            >
              Abort Era
            </button>
          </div>
        </div>
      )}

      {/* Completion Dialog */}
      {isFinished && (
        <div className="bg-[#111625]/95 border border-cyan-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
          <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-12 h-12 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Timeline Restored!</h2>
            <p className="text-sm text-gray-400 mt-1">You repaired fractures in the {eraData.name}.</p>
          </div>

          <div className="grid grid-cols-4 gap-6 bg-black/40 border border-white/5 p-4 rounded-2xl min-w-[400px]">
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">WPM</span>
              <span className="text-xl font-bold text-cyan-400">{wpm}</span>
            </div>
            <div className="border-l border-white/10"></div>
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">ACC</span>
              <span className="text-xl font-bold text-emerald-400">{accuracy}%</span>
            </div>
            <div className="border-l border-white/10"></div>
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">XP</span>
              <span className="text-xl font-bold text-purple-400">+150</span>
            </div>
            <div className="border-l border-white/10"></div>
            <div>
              <span className="block text-[10px] text-gray-500 font-bold uppercase">COINS</span>
              <span className="text-xl font-bold text-yellow-500 flex items-center justify-center gap-0.5"><Coins className="w-4 h-4" />+{Math.round((wpm * 2) * (accuracy / 100))}</span>
            </div>
          </div>

          <button
            onClick={() => setGameStarted(false)}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all font-bold text-sm tracking-widest text-white rounded-xl shadow-lg active:scale-95"
          >
            Select Another Era
          </button>
        </div>
      )}

    </div>
  );
}
