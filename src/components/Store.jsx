import React from 'react';
import { synth } from '../utils/soundSynth';
import { api } from '../utils/api';
import { ShoppingBag, Coins, Check, Zap } from 'lucide-react';

const STORE_ITEMS = [
  // Sound Profiles
  { id: 'sound_laser', category: 'sound', name: 'Laser Beam Clack', price: 150, profileName: 'laser', desc: 'Futuristic sci-fi laser chirps on key press.' },
  { id: 'sound_magic', category: 'sound', name: 'Mystic Runes chime', price: 200, profileName: 'magic', desc: 'Bell-like harmonic chimes fit for a wizard.' },
  { id: 'sound_retro', category: 'sound', name: 'Retro 8-Bit Synth', price: 100, profileName: 'retro', desc: 'Chunky retro bleeps reminiscent of old arcade consoles.' },

  // Themes
  { id: 'theme_lava', category: 'theme', name: 'Lava Fracture', price: 300, themeClass: 'theme-lava', desc: 'Ripped orange/red details and ember glows.' },
  { id: 'theme_matrix', category: 'theme', name: 'Digital Rain matrix', price: 250, themeClass: 'theme-matrix', desc: 'Monochromatic retro terminal green grids.' },
  { id: 'theme_royal', category: 'theme', name: 'Imperial Violet', price: 350, themeClass: 'theme-royal', desc: 'Premium royal violet gradients with gold accents.' }
];

export default function Store({ 
  coins = 0, 
  setCoins, 
  purchasedItems = [], 
  setPurchasedItems,
  activeSound = 'mechanical',
  setActiveSound,
  activeTheme = 'cyberpunk',
  setActiveTheme
}) {

  const handlePurchase = async (item) => {
    if (coins < item.price) {
      synth.playError();
      alert("Insufficient coins! Earn more by restoring timelines or slaying dragons.");
      return;
    }

    if (api.isAuthenticated()) {
      try {
        const response = await api.purchaseCosmetic(item.id, item.price);
        setCoins(response.coins);
        setPurchasedItems(response.purchased_items);
        synth.playVictory();
      } catch (err) {
        console.error("Purchase failed:", err);
        synth.playError();
        alert(err.message || "Purchase failed.");
      }
    } else {
      setCoins(prev => prev - item.price);
      setPurchasedItems(prev => [...prev, item.id]);
      synth.playVictory();
    }
  };

  const handleEquip = async (item) => {
    synth.playClick();
    const isSound = item.category === 'sound';
    
    if (api.isAuthenticated()) {
      try {
        const updateData = isSound ? { active_sound: item.profileName } : { active_theme: item.themeClass };
        const user = await api.updateProfile(updateData);
        const profile = user.profile || {};
        
        if (isSound) {
          setActiveSound(profile.active_sound);
          synth.setSoundProfile(profile.active_sound);
        } else {
          setActiveTheme(profile.active_theme);
        }
      } catch (err) {
        console.error("Failed to equip item:", err);
      }
    } else {
      if (isSound) {
        setActiveSound(item.profileName);
        synth.setSoundProfile(item.profileName);
      } else {
        setActiveTheme(item.themeClass);
      }
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-mono">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#111625]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-yellow-500 to-amber-500 p-2.5 rounded-xl text-black">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Cosmetic Store</h2>
            <p className="text-xs text-gray-400">Unlock custom themes and key sounds using coins.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-5 py-2.5 rounded-2xl text-yellow-400 font-bold text-lg">
          <Coins className="w-5 h-5 text-yellow-500 animate-pulse" />
          <span>{coins} COINS</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STORE_ITEMS.map(item => {
          const isPurchased = purchasedItems.includes(item.id);
          const isEquipped = item.category === 'sound' 
            ? activeSound === item.profileName 
            : activeTheme === item.themeClass;

          return (
            <div 
              key={item.id} 
              className={`
                p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 bg-black/40
                ${isEquipped 
                  ? 'border-cyan-500 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-white/5 hover:border-white/10'}
              `}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    item.category === 'sound' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                  }`}>
                    {item.category}
                  </span>
                  
                  {!isPurchased && (
                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {item.price}
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm font-black text-white mt-2 uppercase tracking-wide">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <div className="flex items-center gap-3">
                {isPurchased ? (
                  isEquipped ? (
                    <div className="w-full flex items-center justify-center gap-1 py-2 bg-cyan-500/20 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-500/30">
                      <Check className="w-4 h-4" /> Active Equipped
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEquip(item)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 hover:text-white transition-all text-gray-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                    >
                      Equip Customization
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 transition-all font-bold text-xs tracking-widest text-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" /> Unlock for {item.price} Coins
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
