import React from 'react';

export default function MusicalityTheory({ onClose }) {
  return (
    <div className="theory-overlay animate-fade-in" onClick={onClose}>
      <div className="theory-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="theory-header">
          <h2>🎓 Académie de la Bachata</h2>
          <p>Comprendre la musique pour mieux anticiper tes mouvements.</p>
        </div>

        <div className="theory-content">
          <section className="theory-section">
            <h3 className="section-title"><span className="emoji">🕰️</span> La Règle des 8 Temps</h3>
            <p>La bachata s'écoute et se danse sur des "blocs" (phrases) de 8 temps, divisés en deux mesures de 4 temps :</p>
            <div className="rhythm-visualizer">
              <div className="measure">
                <span className="beat">1</span><span className="beat">2</span><span className="beat">3</span><span className="beat tap">4 (Tap)</span>
              </div>
              <div className="measure">
                <span className="beat">5</span><span className="beat">6</span><span className="beat">7</span><span className="beat tap">8 (Tap)</span>
              </div>
            </div>
            <p className="hint">Si la musique monte en énergie, prépare-toi : le <strong>Break</strong> a souvent lieu sur le 4, le 8 ou le 1 suivant !</p>
          </section>

          <section className="theory-section">
            <h3 className="section-title"><span className="emoji">🎸</span> Les 3 Phases de la Bachata</h3>
            <div className="cards-grid">
              <div className="theory-card derecho">
                <h4>1. Derecho</h4>
                <p><strong>C'est quoi ?</strong> La base. Le rythme métronomique classique, souvent dans les couplets.</p>
                <p><strong>Le Feeling :</strong> Tranquille, chill. Le Bongo fait "Tiki-Tiki-Pah" de façon régulière.</p>
                <div className="dance-tip">💃 <strong>En danse :</strong> Mouvements basics, steps en ligne, connexion calme.</div>
              </div>
              <div className="theory-card majao">
                <h4>2. Majao</h4>
                <p><strong>C'est quoi ?</strong> L'explosion d'énergie ! Le moment du refrain où tout s'accélère.</p>
                <p><strong>Le Feeling :</strong> Énergique, le bongo tape fort sur tous les temps "Tac-Tac-Tac".</p>
                <div className="dance-tip">🔥 <strong>En danse :</strong> Sensualité profonde, mouvements amples, tours, passion.</div>
              </div>
              <div className="theory-card mambo">
                <h4>3. Mambo</h4>
                <p><strong>C'est quoi ?</strong> L'improvisation des instruments (guitare qui s'emballe).</p>
                <p><strong>Le Feeling :</strong> Très libre, syncopé, complexe.</p>
                <div className="dance-tip">👣 <strong>En danse :</strong> Footwork (jeux de jambes dominicains), musicalité libre.</div>
              </div>
            </div>
          </section>

          <section className="theory-section">
            <h3 className="section-title"><span className="emoji">🥁</span> Reconnaître les Instruments</h3>
            <div className="instruments-list">
              <div className="instrument-row">
                <div className="inst-icon" style={{ background: '#3b82f6' }}>🥁</div>
                <div className="inst-info">
                  <h4>Le Bongo</h4>
                  <p>Le battement de cœur. Il marque les temps forts. Le <span style={{color: '#a855f7', fontWeight: 'bold'}}>Roll</span> (🌀) est le moment où le frappeur accélère : c'est le signal qu'un changement d'énergie arrive !</p>
                </div>
              </div>
              <div className="instrument-row">
                <div className="inst-icon" style={{ background: '#10b981' }}>🥄</div>
                <div className="inst-info">
                  <h4>La Güira</h4>
                  <p>Le son du "sable frotté". C'est elle qui donne la vitesse et le relief. Si elle accélère, le Majao approche.</p>
                </div>
              </div>
              <div className="instrument-row">
                <div className="inst-icon" style={{ background: '#ef4444' }}>⚡</div>
                <div className="inst-info">
                  <h4>Le Break</h4>
                  <p>Le silence soudain. Tous les instruments s'arrêtent. Si tu arrives à t'arrêter pile sur le Break en dansant : c'est l'effet "Wow" garanti.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .theory-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .theory-modal {
          background: #111;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          color: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        
        .theory-modal::-webkit-scrollbar { width: 8px; }
        .theory-modal::-webkit-scrollbar-track { background: transparent; }
        .theory-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

        .close-btn {
          position: absolute;
          top: 20px; right: 20px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 36px; height: 36px;
          border-radius: 50%;
          font-size: 1.2rem;
          cursor: pointer;
          transition: 0.2s;
          display: flex; justify-content: center; align-items: center;
        }
        .close-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }

        .theory-header {
          padding: 40px 40px 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          text-align: center;
        }
        .theory-header h2 { font-size: 2rem; font-weight: 900; margin: 0; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; color: transparent; }
        .theory-header p { color: rgba(255,255,255,0.6); margin-top: 10px; font-size: 1.1rem; }

        .theory-content {
          padding: 30px 40px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .theory-section { display: flex; flex-direction: column; gap: 16px; }
        .section-title { font-size: 1.4rem; font-weight: 800; display: flex; align-items: center; gap: 10px; margin: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
        
        .rhythm-visualizer {
          display: flex;
          gap: 20px;
          background: rgba(255,255,255,0.03);
          padding: 20px;
          border-radius: 16px;
          flex-wrap: wrap;
          justify-content: center;
          margin: 10px 0;
        }
        .measure {
          display: flex;
          gap: 8px;
        }
        .beat {
          width: 40px; height: 40px;
          display: flex; justify-content: center; align-items: center;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          font-weight: 800;
        }
        .beat.tap {
          background: var(--accent); color: white; width: auto; padding: 0 16px;
        }

        .hint {
          font-size: 0.9rem; color: #f59e0b; font-style: italic; background: rgba(245, 158, 11, 0.1); padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f59e0b;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .theory-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .theory-card h4 { font-size: 1.2rem; font-weight: 800; margin: 0; }
        .theory-card p { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.5; }
        
        .derecho h4 { color: #3b82f6; }
        .majao h4 { color: #ec4899; }
        .mambo h4 { color: #10b981; }

        .dance-tip {
          margin-top: auto;
          background: rgba(255,255,255,0.05);
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          color: white;
        }

        .instruments-list {
          display: flex; flex-direction: column; gap: 16px;
        }
        .instrument-row {
          display: flex; gap: 16px; align-items: center;
          background: rgba(255,255,255,0.02);
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .inst-icon {
          width: 50px; height: 50px; flex-shrink: 0;
          display: flex; justify-content: center; align-items: center;
          font-size: 1.5rem; border-radius: 12px;
        }
        .inst-info h4 { margin: 0 0 4px 0; font-size: 1.1rem; }
        .inst-info p { margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.4; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }

        @media(max-width: 600px) {
          .theory-content, .theory-header { padding: 20px; }
          .rhythm-visualizer { flex-direction: column; align-items: center; }
        }
      `}</style>
    </div>
  );
}
