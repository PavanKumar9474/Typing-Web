import React, { useMemo } from 'react';
import { Brain, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';

export default function AICoach({ keyMetrics = {}, onSelectDrill }) {
  const analysis = useMemo(() => {
    const weakKeys = [];
    const slowKeys = [];
    let totalErrors = 0;
    let totalPresses = 0;
    
    // Left hand vs right hand tracking
    const leftHandKeys = 'qwertzasdfgvcxz';
    let leftCount = 0;
    let rightCount = 0;
    let leftErrors = 0;
    let rightErrors = 0;

    Object.entries(keyMetrics).forEach(([key, stats]) => {
      const { total, errors, latencies } = stats;
      totalErrors += errors;
      totalPresses += total;

      // Group by hand
      if (leftHandKeys.includes(key)) {
        leftCount += total;
        leftErrors += errors;
      } else {
        rightCount += total;
        rightErrors += errors;
      }

      const errorRate = total > 0 ? errors / total : 0;
      const avgLatency = latencies.length > 0 
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
        : 0;

      if (errorRate > 0.2 && total >= 3) {
        weakKeys.push({ key, errorRate });
      }
      if (avgLatency > 350 && total >= 3) {
        slowKeys.push({ key, avgLatency });
      }
    });

    // Hand balance feedback
    let handAdvice = '';
    if (leftCount > 10 && rightCount > 10) {
      const leftRatio = leftCount / (leftCount + rightCount);
      if (leftRatio > 0.65) {
        handAdvice = 'Your left hand is doing 65%+ of the work. Try to engage your right hand more.';
      } else if (leftRatio < 0.35) {
        handAdvice = 'Your right hand is doing 65%+ of the work. Practice left-hand home keys (A, S, D, F).';
      }
    }

    // Dynamic coach tips
    const tips = [];
    if (weakKeys.length > 0) {
      const list = weakKeys.map(wk => wk.key.toUpperCase()).join(', ');
      tips.push({
        type: 'danger',
        msg: `You are struggling with key accuracy for: ${list}. Take a breath and align your fingers.`
      });
    }
    if (slowKeys.length > 0) {
      const list = slowKeys.map(sk => sk.key.toUpperCase()).join(', ');
      tips.push({
        type: 'warning',
        msg: `Your response time is lagging on: ${list}. Practice home-row anchors.`
      });
    }
    if (handAdvice) {
      tips.push({ type: 'info', msg: handAdvice });
    }

    // Default tip if everything is good
    if (tips.length === 0) {
      if (totalPresses > 20) {
        tips.push({
          type: 'success',
          msg: "Fantastic balance and typing flow! You're in the zone. Keep up this rhythm!"
        });
      } else {
        tips.push({
          type: 'info',
          msg: "Start typing to let your AI Coach analyze your performance in real time."
        });
      }
    }

    // Generate Custom Practice drill based on weak keys
    let drillText = '';
    if (weakKeys.length > 0 || slowKeys.length > 0) {
      const focusKeys = [...weakKeys, ...slowKeys].map(k => k.key);
      const uniqueKeys = Array.from(new Set(focusKeys));
      // Build a drill
      const parts = [];
      for (let i = 0; i < 6; i++) {
        let word = '';
        for (let j = 0; j < 4; j++) {
          word += uniqueKeys[Math.floor(Math.random() * uniqueKeys.length)] || 'a';
        }
        parts.push(word);
      }
      drillText = parts.join(' ');
    } else {
      drillText = "asdf jkl; fdsa jkl; asdfg jkl;hj";
    }

    return { tips, drillText, totalPresses, totalErrors };
  }, [keyMetrics]);

  return (
    <div className="bg-[#111625]/90 border border-cyan-500/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full"></div>
      
      <div className="flex items-center gap-3 border-b border-cyan-500/10 pb-4 mb-4">
        <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-2 rounded-xl text-white">
          <Brain className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">AI Typing Coach</h3>
          <p className="text-xs text-cyan-400/80">Real-time performance metrics & analysis</p>
        </div>
      </div>

      <div className="space-y-4">
        {analysis.tips.map((tip, idx) => {
          let borderClass = 'border-blue-500/20 bg-blue-500/5 text-blue-400';
          if (tip.type === 'danger') borderClass = 'border-rose-500/20 bg-rose-500/5 text-rose-400';
          if (tip.type === 'warning') borderClass = 'border-amber-500/20 bg-amber-500/5 text-amber-400';
          if (tip.type === 'success') borderClass = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';

          return (
            <div key={idx} className={`p-4 rounded-xl border text-sm flex gap-3 leading-relaxed transition-all duration-300 ${borderClass}`}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{tip.msg}</span>
            </div>
          );
        })}

        {analysis.totalPresses > 0 && (
          <div className="bg-white/5 rounded-xl p-4 flex justify-around text-center text-xs border border-white/5">
            <div>
              <span className="block text-gray-400 mb-1">Keys Analyzed</span>
              <span className="text-base font-bold text-cyan-400">{analysis.totalPresses}</span>
            </div>
            <div className="border-l border-white/10"></div>
            <div>
              <span className="block text-gray-400 mb-1">Accuracy Loss</span>
              <span className="text-base font-bold text-rose-400">
                {analysis.totalPresses > 0 ? Math.round((analysis.totalErrors / analysis.totalPresses) * 100) : 0}%
              </span>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/20 rounded-xl p-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Recommended Drill
            </span>
            <button 
              onClick={() => onSelectDrill(analysis.drillText)}
              className="text-xs px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/40 hover:text-white transition-all text-purple-300 rounded-md font-medium"
            >
              Load Drill
            </button>
          </div>
          <p className="text-sm font-mono tracking-widest text-center py-2 bg-black/30 rounded border border-white/5 text-white">
            {analysis.drillText}
          </p>
        </div>
      </div>
    </div>
  );
}
