import React from 'react';

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ['space']
];

export default function FingerHeatmap({ keyMetrics = {} }) {
  const getKeyColorClass = (key) => {
    const metrics = keyMetrics[key.toLowerCase()];
    if (!metrics || metrics.total === 0) {
      return 'bg-white/5 border-white/10 text-gray-500';
    }

    const { total, errors, latencies } = metrics;
    const errorRate = errors / total;
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;

    // Red: Error-prone
    if (errorRate >= 0.2) {
      return 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/10';
    }
    // Yellow: Slow reaction time or moderate errors
    if (avgLatency > 300 || errorRate > 0.08) {
      return 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10';
    }
    // Green: Perfect speed & accuracy
    return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10';
  };

  return (
    <div className="bg-[#111625]/90 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-indigo-500/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Finger Heatmap</h3>
          <p className="text-xs text-gray-400">Highlights error-prone or slower keys</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/50 block"></span>
            <span className="text-gray-400">Excellent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/50 block"></span>
            <span className="text-gray-400">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/50 block"></span>
            <span className="text-gray-400">Weak</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3 bg-black/40 rounded-xl border border-white/5 font-mono max-w-full overflow-x-auto">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1.5">
            {row.map((key) => {
              const colorClass = getKeyColorClass(key);
              const isSpace = key === 'space';
              return (
                <div
                  key={key}
                  className={`
                    flex items-center justify-center rounded-lg border text-sm font-semibold capitalize transition-all duration-300
                    ${isSpace ? 'w-48 h-10' : 'w-9 h-9 sm:w-10 sm:h-10'}
                    ${colorClass}
                  `}
                >
                  {isSpace ? 'Spacebar' : key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
