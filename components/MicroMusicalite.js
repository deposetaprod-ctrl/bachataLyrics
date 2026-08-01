import React, { useState, useEffect } from 'react';

export default function MicroMusicalite({ 
  youtubeId, 
  youtubePlayer, 
  currentTime, 
  isPlaying, 
  togglePlay,
  handleInstrumentClick,
  markers
}) {
  const [speed, setSpeed] = useState(1);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(10);
  const [duration, setDuration] = useState(300);

  // Initialize loop duration once youtube player is ready
  useEffect(() => {
    if (youtubePlayer && youtubePlayer.getDuration) {
      const dur = youtubePlayer.getDuration();
      if (dur > 0) {
        setDuration(dur);
        if (loopEnd === 10 && dur > 10) {
          setLoopEnd(10);
        }
      }
    }
  }, [youtubePlayer, currentTime]);

  // Logic for Looping
  useEffect(() => {
    if (isPlaying && youtubePlayer && currentTime >= loopEnd) {
      youtubePlayer.seekTo(loopStart, true);
    }
  }, [currentTime, isPlaying, youtubePlayer, loopStart, loopEnd]);

  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    if (youtubePlayer && youtubePlayer.setPlaybackRate) {
      youtubePlayer.setPlaybackRate(newSpeed);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  };

  const handleStartChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value < loopEnd - 1) { // 1 second minimum gap
      setLoopStart(value);
      if (youtubePlayer && youtubePlayer.seekTo && !isPlaying) {
        youtubePlayer.seekTo(value, true);
      }
    }
  };

  const handleEndChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > loopStart + 1) {
      setLoopEnd(value);
    }
  };

  const loopDuration = loopEnd - loopStart;
  const progressPercent = loopDuration > 0 ? Math.max(0, Math.min(100, ((currentTime - loopStart) / loopDuration) * 100)) : 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl mt-8">
      {/* SÉLECTEUR DE BOUCLE (Double Slider) */}
      <div className="p-6 border-b border-neutral-800 bg-neutral-950/50">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-6">1. Sélectionner l'extrait (La Boucle)</h3>
        
        <div className="relative h-12 flex items-center px-2">
          {/* Track background */}
          <div className="absolute left-2 right-2 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 bottom-0 bg-indigo-500/50"
              style={{ 
                left: `${(loopStart / duration) * 100}%`, 
                width: `${((loopEnd - loopStart) / duration) * 100}%` 
              }}
            ></div>
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
          
          {/* Double Range Slider Magic */}
          <input 
            type="range" 
            min={0} 
            max={duration} 
            step={0.1}
            value={loopStart} 
            onChange={handleStartChange}
            className="absolute left-0 right-0 w-full h-2 appearance-none bg-transparent pointer-events-none z-20"
            style={{ 
              '--webkit-slider-thumb': 'pointer-events-auto w-4 h-4 bg-indigo-400 rounded-full cursor-grab shadow',
            }}
          />
          <input 
            type="range" 
            min={0} 
            max={duration} 
            step={0.1}
            value={loopEnd} 
            onChange={handleEndChange}
            className="absolute left-0 right-0 w-full h-2 appearance-none bg-transparent pointer-events-none z-30"
            style={{ 
              '--webkit-slider-thumb': 'pointer-events-auto w-4 h-4 bg-indigo-500 rounded-full cursor-grab shadow',
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-neutral-400 font-mono mt-2">
          <span>Début: {formatTime(loopStart)}</span>
          <span>Fin: {formatTime(loopEnd)}</span>
        </div>
      </div>

      {/* TIMELINE GRID (Vue Zoomée de la boucle) */}
      <div className="p-6 border-b border-neutral-800 relative">
        <div className="flex justify-between text-xs text-neutral-500 mb-2 font-mono">
          <span>{formatTime(loopStart)}</span>
          <span className="text-indigo-400 font-bold">LOUPE RYTHMIQUE</span>
          <span>{formatTime(loopEnd)}</span>
        </div>
        
        {/* Grille Rythmique */}
        <div className="relative h-32 md:h-48 bg-neutral-950 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 flex justify-between px-4 pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((beat, i) => (
              <div key={i} className="h-full border-l border-neutral-800/50 flex flex-col justify-between items-center relative group">
                <span className="text-xs text-neutral-600 font-mono mt-1">{beat}</span>
                <div className="absolute left-1/2 top-0 h-full w-px bg-neutral-800/30 hidden md:block"></div>
              </div>
            ))}
          </div>

          <div className="relative z-10 w-full h-full pt-8">
            {/* Draw markers inside the loop */}
            {markers && markers.map((m) => {
              if (m.time >= loopStart && m.time <= loopEnd) {
                const posPercent = ((m.time - loopStart) / loopDuration) * 100;
                return (
                  <div 
                    key={m.id} 
                    className="absolute top-0 bottom-0 w-0.5 z-10" 
                    style={{ left: `${posPercent}%`, backgroundColor: m.color }}
                  >
                    <div 
                      className="absolute -top-4 -translate-x-1/2 rounded px-1 py-0.5 text-[10px] font-bold text-neutral-900 whitespace-nowrap shadow-md"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.emoji || m.label.charAt(0)}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {currentTime >= loopStart && currentTime <= loopEnd && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] z-20 transition-all duration-75" 
                style={{ left: `${progressPercent}%` }}
              >
                <div className="w-3 h-3 bg-indigo-500 rounded-full absolute -top-1.5 -left-[5px]"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contrôles de lecture */}
      <div className="p-6 bg-neutral-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <span className="font-bold">||</span>
            ) : (
              <span className="font-bold ml-1">▶</span>
            )}
          </button>

          <div className="flex bg-neutral-800 rounded-lg p-1 border border-neutral-700 w-full md:w-auto overflow-x-auto">
            {[1, 0.75, 0.5, 0.25].map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex-1 md:flex-none whitespace-nowrap ${speed === s ? "bg-indigo-500 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700"}`}
              >
                {s * 100}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
            Sauvegarder la boucle
          </button>
        </div>
      </div>

      {/* Outils d'Annotation */}
      <div className="p-6">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">2. Annoter la rythmique</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'guira', label: "Güira (G)", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", hex: "#10b981", emoji: "🥄" },
            { id: 'bongo', label: "Bongo (B)", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", hex: "#3b82f6", emoji: "🥁" },
            { id: 'requinto', label: "Requinto (R)", color: "text-green-400 bg-green-500/10 border-green-500/20", hex: "#84cc16", emoji: "🎸" },
            { id: 'break', label: "Break (X)", color: "text-red-400 bg-red-500/10 border-red-500/20", hex: "#ef4444", emoji: "⚡" },
          ].map((tool, i) => (
            <button 
              key={i} 
              onClick={() => handleInstrumentClick && handleInstrumentClick(tool.id, tool.label.split(' ')[0], tool.hex, tool.emoji)}
              className="p-3 md:p-4 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center gap-2 hover:bg-neutral-800 transition-all group"
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold ${tool.color} text-lg md:text-2xl`}>
                {tool.emoji}
              </div>
              <span className="text-xs md:text-sm font-medium text-neutral-400 whitespace-nowrap">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Adding custom CSS for double slider thumb for webkit and mozilla */}
      <style dangerouslySetInnerHTML={{__html: `
        input[type=range]::-webkit-slider-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          -webkit-appearance: none;
          background-color: #6366f1;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          border: none;
          background-color: #6366f1;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
      `}} />
    </div>
  );
}
