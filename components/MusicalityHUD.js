import { useState, useEffect } from 'react';

export default function MusicalityHUD({ upcomingMarker, currentTime }) {
  if (!upcomingMarker) return null;

  const timeToEvent = upcomingMarker.time - currentTime;
  const isWarning = timeToEvent <= 5 && timeToEvent > 0;

  if (!isWarning) return null;

  const colors = {
    bongo: '#3b82f6', // blue
    roll: '#a855f7',  // purple
    break: '#ef4444', // red
    guira: '#10b981'  // green
  };

  const backgroundColor = colors[upcomingMarker.type] || 'var(--accent)';

  return (
    <div className="musicality-hud">
      <div className="warning-label">ATTENTION !</div>
      <div className="event-info" style={{ backgroundColor }}>
        <span className="event-icon">
          {upcomingMarker.type === 'bongo' && '🥁'}
          {upcomingMarker.type === 'roll' && '🌀'}
          {upcomingMarker.type === 'break' && '⚡'}
          {upcomingMarker.type === 'guira' && '🥄'}
        </span>
        <span className="event-name">{upcomingMarker.label || upcomingMarker.type}</span>
      </div>
      <div className="countdown">{timeToEvent.toFixed(1)}s</div>

      <style jsx>{`
        .musicality-hud {
          position: fixed;
          top: 100px;
          right: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
          min-width: 180px;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .warning-label {
          font-weight: 900;
          font-size: 0.8rem;
          color: #facc15;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .event-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-radius: 16px;
          color: white;
          font-weight: 700;
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5);
          width: 100%;
          justify-content: center;
        }

        .event-icon {
          font-size: 1.5rem;
        }

        .event-name {
          text-transform: capitalize;
          font-size: 1.1rem;
        }

        .countdown {
          font-size: 2.5rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
