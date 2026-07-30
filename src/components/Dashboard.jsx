import React, { useState, useEffect } from 'react';
import FingerHeatmap from './FingerHeatmap';
import { api } from '../utils/api';
import { 
  Trophy, Flame, Coins, Sparkles, User, Sword, Users, 
  ShoppingBag, ShieldAlert, Award, Star, Compass, Skull, Activity,
  Terminal, Zap
} from 'lucide-react';

const ACHIEVEMENTS = [
  { id: 'first', title: 'Odyssey Recruit', desc: 'Complete your first practice session', unlocked: true, icon: Star },
  { id: 'speed_master', title: 'Speed Master', desc: 'Reach 80 WPM typing speed', unlocked: false, icon: Award },
  { id: 'streak_30', title: 'Chronos Devotee', desc: 'Achieve a 30-key perfect streak', unlocked: true, icon: Flame },
  { id: 'perfect', title: 'Code Architect', desc: '100% accuracy on paragraph practice', unlocked: false, icon: Trophy }
];

const DAILY_MISSIONS = [
  { id: 1, desc: 'Restore any Time Architect Era', progress: '1/1', done: true },
  { id: 2, desc: 'Slay the Ancient Dragon', progress: '0/1', done: false },
  { id: 3, desc: 'Earn 300 coins in Multiplayer', progress: '120/300', done: false }
];

export default function Dashboard({ 
  username = 'Guest',
  coins = 0, 
  xp = 0, 
  wpm = 65, 
  accuracy = 97, 
  keyMetrics = {},
  onNavigate 
}) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        if (active) {
          setLeaderboard(data);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        if (active) {
          setLeaderboard([
            { rank: 1, username: 'TypingGod', xp: 1800, avg_wpm: 85, level: 4 },
            { rank: 2, username: 'NekoTyper', xp: 1200, avg_wpm: 72, level: 3 },
            { rank: 3, username: 'SpellSlinger', xp: 600, avg_wpm: 58, level: 2 },
          ]);
        }
      }
    };
    fetchLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  const level = Math.floor(xp / 500) + 1;
  const currentRank = level >= 4 ? 'Grandmaster Architect' : level >= 2 ? 'Spell Initiate' : 'Time Novice';

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none font-mono">
      {/* Upper Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* User Card */}
        <div className="bg-[#111625]/90 border border-cyan-500/20 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-3 rounded-2xl text-white">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase tracking-wider">{username}</div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase mt-0.5">{currentRank}</div>
            <div className="text-xs text-gray-400 mt-1">Level {level}</div>
          </div>
        </div>

        {/* Level & XP */}
        <div className="bg-[#111625]/90 border border-indigo-500/20 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
            <span>XP Progress</span>
            <span>{xp % 500} / 500 XP</span>
          </div>
          <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5 mt-2">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((xp % 500) / 500) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Coins info */}
        <div className="bg-[#111625]/90 border border-yellow-500/20 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <span className="block text-xs text-gray-400 uppercase font-bold">Gold Coins</span>
            <span className="text-2xl font-black text-yellow-400 mt-1">{coins}</span>
          </div>
          <Coins className="w-8 h-8 text-yellow-500/80 animate-pulse" />
        </div>

        {/* Typing metrics */}
        <div className="bg-[#111625]/90 border border-emerald-500/20 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <span className="block text-xs text-gray-400 uppercase font-bold">Avg Speed / Acc</span>
            <span className="text-xl font-black text-white mt-1">
              <strong className="text-emerald-400">{wpm}</strong> WPM <span className="text-gray-500">|</span> <strong className="text-teal-400">{accuracy}%</strong>
            </span>
          </div>
          <Trophy className="w-8 h-8 text-emerald-400/80" />
        </div>
      </div>

      {/* Main Grid: Game Selection, Achievements, Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Game Navigation / Adventure node select */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#111625]/90 border border-cyan-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full"></div>
            
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-cyan-500/10 pb-3">
              <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" /> Adventure Nodes Map
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Game 1 */}
              <button 
                onClick={() => onNavigate('game_time_architect')}
                className="group border border-cyan-500/10 hover:border-cyan-500/40 bg-black/40 hover:bg-cyan-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:scale-110 transition-all text-cyan-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Time Architect</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Rebuild civilizations by typing historical eras.</p>
                </div>
              </button>

              {/* Game 2 */}
              <button 
                onClick={() => onNavigate('game_dragon_spell')}
                className="group border border-rose-500/10 hover:border-rose-500/40 bg-black/40 hover:bg-rose-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-rose-500/10 rounded-xl group-hover:scale-110 transition-all text-rose-500">
                  <Sword className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Dragon Spell</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Fight magical beasts with high-speed spelling runes.</p>
                </div>
              </button>

              {/* Game 3 */}
              <button 
                onClick={() => onNavigate('game_space_survival')}
                className="group border border-indigo-500/10 hover:border-indigo-500/40 bg-black/40 hover:bg-indigo-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-all text-indigo-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Space Survival</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Blast falling asteroids before they collide.</p>
                </div>
              </button>

              {/* Game 4: Zombie City */}
              <button 
                onClick={() => onNavigate('game_zombie_city')}
                className="group border border-red-500/10 hover:border-red-500/40 bg-black/40 hover:bg-red-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-all text-red-500">
                  <Skull className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Zombie City</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Defend gates from walking zombie hordes.</p>
                </div>
              </button>

              {/* Game 5: Ninja Escape */}
              <button 
                onClick={() => onNavigate('game_ninja_escape')}
                className="group border border-emerald-500/10 hover:border-emerald-500/40 bg-black/40 hover:bg-emerald-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-all text-emerald-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Ninja Escape</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Dodge obstacles and slice traps at speed.</p>
                </div>
              </button>

              {/* Game: Cyber Hacker */}
              <button 
                onClick={() => onNavigate('game_cyber_hacker')}
                className="group border border-emerald-500/10 hover:border-emerald-500/40 bg-black/40 hover:bg-emerald-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-all text-emerald-400">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Cyber Hacker</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Breach mainframes and bypass firewall code sweepers.</p>
                </div>
              </button>

              {/* Game: Neon Drift */}
              <button 
                onClick={() => onNavigate('game_neon_drift')}
                className="group border border-purple-500/10 hover:border-purple-500/40 bg-black/40 hover:bg-purple-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-all text-purple-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Neon Drift</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Type at velocity to drift past highway blockades.</p>
                </div>
              </button>

              {/* Multiplayer node */}
              <button 
                onClick={() => onNavigate('multiplayer')}
                className="group border border-blue-500/10 hover:border-blue-500/40 bg-black/40 hover:bg-blue-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-all text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Race Arena</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Test speeds live in multiplayer speed runs.</p>
                </div>
              </button>

              {/* Customization Store node */}
              <button 
                onClick={() => onNavigate('store')}
                className="group border border-yellow-500/10 hover:border-yellow-500/40 bg-black/40 hover:bg-yellow-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:scale-110 transition-all text-yellow-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Cosmetic Store</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Spend coins to customize click sounds and styles.</p>
                </div>
              </button>

              {/* AI drills tutor */}
              <button 
                onClick={() => onNavigate('practice')}
                className="group border border-emerald-500/10 hover:border-emerald-500/40 bg-black/40 hover:bg-emerald-950/10 p-5 rounded-2xl text-center transition-all flex flex-col items-center gap-3 cursor-pointer text-gray-400 hover:text-white"
              >
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-all text-emerald-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Practice Drills</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Drill characters, words, lines and code templates.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Cyberpunk WPM History Chart */}
          <div className="bg-[#111625]/90 border border-cyan-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full"></div>
            
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-cyan-500/10 pb-3">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" /> Speed Velocity Over Time (WPM)
            </h2>

            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                <defs>
                  <linearGradient id="cyberpunkChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="1" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="1" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1.5" />

                {/* Line graph */}
                {(() => {
                  const sessions = [
                    { x: 60, y: 110, wpm: 48, name: "S1" },
                    { x: 130, y: 80, wpm: 62, name: "S2" },
                    { x: 200, y: 90, wpm: 55, name: "S3" },
                    { x: 270, y: 55, wpm: 75, name: "S4" },
                    { x: 340, y: 68, wpm: 66, name: "S5" },
                    { x: 410, y: 40, wpm: 82, name: "S6" }
                  ];

                  const dPath = sessions.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ');
                  const dArea = `${dPath} L 410 120 L 60 120 Z`;

                  return (
                    <g>
                      <path d={dArea} fill="url(#cyberpunkChartGrad)" />
                      <path d={dPath} fill="none" stroke="url(#cyberLineGrad)" strokeWidth="3" />
                      <defs>
                        <linearGradient id="cyberLineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      {sessions.map((s, i) => (
                        <g key={i}>
                          <circle cx={s.x} cy={s.y} r="5" fill="#090d16" stroke="#06b6d4" strokeWidth="2.5" />
                          <text x={s.x} y={s.y - 12} fill="#22d3ee" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{s.wpm} WPM</text>
                          <text x={s.x} y="140" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{s.name}</text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Keyboard Heatmap Row */}
          <FingerHeatmap keyMetrics={keyMetrics} />
        </div>

        {/* Right Pane: Achievements, Missions, Friends */}
        <div className="flex flex-col gap-6">
          
          {/* Achievements */}
          <div className="bg-[#111625]/90 border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2.5 mb-3.5">
              Achievements
            </h3>
            <div className="space-y-3">
              {ACHIEVEMENTS.map(ach => {
                const IconComponent = ach.icon;
                return (
                  <div key={ach.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                    ach.unlocked ? 'border-cyan-500/20 bg-cyan-950/10 text-white' : 'border-white/5 bg-black/20 text-gray-500'
                  }`}>
                    <IconComponent className={`w-5 h-5 shrink-0 ${ach.unlocked ? 'text-yellow-400' : 'text-gray-600'}`} />
                    <div>
                      <h4 className="text-xs font-bold uppercase">{ach.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Missions */}
          <div className="bg-[#111625]/90 border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2.5 mb-3.5">
              Daily Missions
            </h3>
            <div className="space-y-3">
              {DAILY_MISSIONS.map(mis => (
                <div key={mis.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-3 rounded-xl text-xs">
                  <span className={`text-justify ${mis.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{mis.desc}</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    mis.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'
                  }`}>
                    {mis.progress}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Global Leaderboard */}
          <div className="bg-[#111625]/90 border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2.5 mb-3.5">
              Global Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map(user => (
                <div key={user.username} className="flex justify-between items-center bg-black/20 border border-white/5 p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">#{user.rank}</span>
                    <span className="font-bold text-gray-300 truncate max-w-[100px]">{user.username}</span>
                  </div>
                  <span className="font-medium text-[9px] uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                    Lvl {user.level} | {user.avg_wpm} WPM
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
