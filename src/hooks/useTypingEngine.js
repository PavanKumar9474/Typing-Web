import { useState, useEffect, useRef, useCallback } from 'react';
import { synth } from '../utils/soundSynth';

export const useTypingEngine = (initialText = '', onComplete = null) => {
  const [text, setText] = useState(initialText);
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Advanced metrics for Finger Heatmap and AI Coach
  // Format: { key: { total: 0, errors: 0, times: [] } }
  const [keyMetrics, setKeyMetrics] = useState({});

  const startTimeRef = useRef(null);
  const lastKeyTimeRef = useRef(null);
  const incorrectIndicesRef = useRef(new Set()); // Tracks which indices are typed incorrectly

  // Reset function
  const resetEngine = useCallback((newText = '') => {
    setText(newText);
    setInput('');
    setCursor(0);
    setWpm(0);
    setAccuracy(100);
    setStreak(0);
    setMaxStreak(0);
    setErrorCount(0);
    setIsStarted(false);
    setIsFinished(false);
    startTimeRef.current = null;
    lastKeyTimeRef.current = null;
    incorrectIndicesRef.current.clear();
  }, []);

  // Update text
  useEffect(() => {
    if (initialText) {
      resetEngine(initialText);
    }
  }, [initialText, resetEngine]);

  const handleKeyDown = useCallback((e) => {
    // Prevent common shortcuts or system keys
    if (e.key === 'Tab' || e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
      return;
    }

    // Prevent space scrolling down the page
    if (e.key === ' ' && (e.target === document.body || e.target.tagName === 'DIV')) {
      e.preventDefault();
    }

    if (isFinished) return;

    const targetChar = text[cursor];
    if (!targetChar) return;

    const now = performance.now();

    // Start timer on first keystroke
    if (!isStarted) {
      setIsStarted(true);
      startTimeRef.current = now;
      lastKeyTimeRef.current = now;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      if (cursor > 0) {
        setInput(prev => prev.slice(0, -1));
        setCursor(prev => prev - 1);
        setStreak(0);
        // We don't play error or click sound for backspace, or play a light mechanical click
        synth.playClick();
      }
      return;
    }

    // Only process single characters
    if (e.key.length !== 1) return;

    const typedChar = e.key;
    const isCorrect = typedChar === targetChar;

    // Track latency for this key
    const latency = lastKeyTimeRef.current ? (now - lastKeyTimeRef.current) : 0;
    lastKeyTimeRef.current = now;

    // Key stats tracking
    const cleanKey = targetChar.toLowerCase();
    setKeyMetrics(prev => {
      const current = prev[cleanKey] || { total: 0, errors: 0, latencies: [] };
      const updatedLatencies = [...current.latencies, latency].slice(-10); // Keep last 10 samples
      return {
        ...prev,
        [cleanKey]: {
          total: current.total + 1,
          errors: current.errors + (isCorrect ? 0 : 1),
          latencies: updatedLatencies
        }
      };
    });

    if (isCorrect) {
      synth.playClick();
      setInput(prev => prev + typedChar);
      setCursor(prev => prev + 1);
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      // Check if finished
      if (cursor + 1 === text.length) {
        setIsFinished(true);
        synth.playVictory();
        if (onComplete) {
          // Calculate final metrics to pass
          const finalMinutes = (performance.now() - startTimeRef.current) / 60000;
          const finalWpm = Math.round((text.length / 5) / (finalMinutes || 0.001));
          const finalAcc = Math.round(((text.length - errorCount) / text.length) * 100);
          onComplete({
            wpm: finalWpm,
            accuracy: finalAcc,
            errors: errorCount,
            keyMetrics
          });
        }
      }
    } else {
      // Mistake!
      synth.playError();
      setErrorCount(prev => prev + 1);
      setStreak(0);
      incorrectIndicesRef.current.add(cursor);

      // We still advance cursor to let them keep typing (common in games) or restrict?
      // In Typing Odyssey, advancing the cursor is better so they don't get stuck forever on an asteroid or boss word.
      setInput(prev => prev + typedChar);
      setCursor(prev => prev + 1);

      if (cursor + 1 === text.length) {
        setIsFinished(true);
        synth.playVictory();
        if (onComplete) {
          const finalMinutes = (performance.now() - startTimeRef.current) / 60000;
          const finalWpm = Math.round((text.length / 5) / (finalMinutes || 0.001));
          const finalAcc = Math.max(0, Math.round(((text.length - (errorCount + 1)) / text.length) * 100));
          onComplete({
            wpm: finalWpm,
            accuracy: finalAcc,
            errors: errorCount + 1,
            keyMetrics
          });
        }
      }
    }

    // Real-time calculations of WPM and Accuracy
    const timeElapsedMinutes = (now - startTimeRef.current) / 60000;
    const currentWpm = Math.round(((cursor + 1) / 5) / (timeElapsedMinutes || 0.0001));
    const currentAcc = Math.round(((cursor + 1 - (isCorrect ? errorCount : errorCount + 1)) / (cursor + 1)) * 100);

    setWpm(isNaN(currentWpm) || currentWpm === Infinity ? 0 : Math.min(250, currentWpm));
    setAccuracy(isNaN(currentAcc) ? 100 : Math.max(0, currentAcc));
  }, [text, cursor, isStarted, isFinished, streak, maxStreak, errorCount, keyMetrics, onComplete]);

  return {
    text,
    input,
    cursor,
    wpm,
    accuracy,
    streak,
    maxStreak,
    errorCount,
    isStarted,
    isFinished,
    keyMetrics,
    incorrectIndices: incorrectIndicesRef.current,
    handleKeyDown,
    resetEngine
  };
};
