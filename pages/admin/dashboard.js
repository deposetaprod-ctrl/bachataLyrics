import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setIsAuthenticated(true);
      } else {
        setError('Mot de passe incorrect.');
      }
    } catch (err) {
      setError('Erreur de connexion serveur.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <Head>
          <title>Admin Login - Tracker</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="login-card">
          <h1>Admin Dashboard</h1>
          <p>Entrez le mot de passe pour accéder aux statistiques de connexions.</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
        <style jsx>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1e1e2f, #151522);
            font-family: 'Inter', system-ui, sans-serif;
          }
          .login-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            width: 100%;
            max-width: 400px;
            color: #fff;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          }
          h1 {
            margin-top: 0;
            font-size: 24px;
            margin-bottom: 8px;
          }
          p {
            color: #aaa;
            font-size: 14px;
            margin-bottom: 24px;
          }
          input {
            width: 100%;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.2);
            color: #fff;
            margin-bottom: 16px;
            font-size: 16px;
            box-sizing: border-box;
          }
          input:focus {
            outline: none;
            border-color: #3b82f6;
          }
          button {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            background: #3b82f6;
            color: white;
            border: none;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover:not(:disabled) {
            background: #2563eb;
          }
          button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .error {
            color: #ef4444;
            font-size: 14px;
            margin-bottom: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Head>
        <title>Admin Dashboard - Users Tracking</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <header>
        <h1>Statistiques des Connexions</h1>
        <div className="stats">
          <div className="stat-card">
            <span>Sessions Totales</span>
            <strong>{sessions.length}</strong>
          </div>
        </div>
      </header>
      
      <main>
        {sessions.length === 0 ? (
          <div className="empty-state">Aucune connexion enregistrée pour le moment.</div>
        ) : (
          <div className="sessions-list">
            {sessions.map(session => (
              <div key={session.sessionId} className={`session-item ${expandedSession === session.sessionId ? 'expanded' : ''}`}>
                <div className="session-header" onClick={() => toggleSession(session.sessionId)}>
                  <div className="session-info">
                    <span className="session-id">{session.sessionId}</span>
                    <span className="session-date">Dernière activité: {formatDate(session.lastSeen)}</span>
                  </div>
                  <div className="session-actions">
                    <span className="event-count">{session.events.length} actions</span>
                    <svg className="chevron" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
                
                {expandedSession === session.sessionId && (
                  <div className="session-timeline">
                    <h4>Parcours utilisateur :</h4>
                    <div className="timeline">
                      {session.events.map((ev, index) => (
                        <div key={index} className="timeline-event">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <div className="event-time">{formatDate(ev.timestamp)}</div>
                            {ev.type === 'page_view' ? (
                              <div className="event-type page-view">
                                <span className="badge badge-blue">Page Visitée</span>
                                <span className="path">{ev.data.path}</span>
                              </div>
                            ) : (
                              <div className="event-type click">
                                <span className="badge badge-purple">Clic</span>
                                <span className="click-details">
                                  {ev.data.text ? <strong>"{ev.data.text}"</strong> : <em>(Élément sans texte)</em>} 
                                  {ev.data.tagName && <span className="tag-name"> [{ev.data.tagName.toLowerCase()}]</span>}
                                  {ev.data.href && <span className="href"> -> {ev.data.href}</span>}
                                </span>
                              </div>
                            )}
                            <div className="event-url">{ev.url}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #0f111a;
          color: #e2e8f0;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 40px;
        }
        header {
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stats {
          display: flex;
          gap: 20px;
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 24px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }
        .stat-card span {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .stat-card strong {
          font-size: 24px;
          color: #fff;
        }
        .empty-state {
          text-align: center;
          padding: 60px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .session-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .session-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .session-item.expanded {
          border-color: rgba(96, 165, 250, 0.5);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .session-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .session-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .session-id {
          font-weight: 600;
          font-family: monospace;
          color: #e2e8f0;
          font-size: 16px;
        }
        .session-date {
          font-size: 14px;
          color: #94a3b8;
        }
        .session-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .event-count {
          background: rgba(96, 165, 250, 0.1);
          color: #60a5fa;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .chevron {
          transition: transform 0.3s;
          color: #94a3b8;
        }
        .expanded .chevron {
          transform: rotate(180deg);
          color: #60a5fa;
        }
        .session-timeline {
          padding: 0 20px 20px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: 10px;
          padding-top: 20px;
        }
        h4 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #f8fafc;
        }
        .timeline {
          position: relative;
          padding-left: 20px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.1);
        }
        .timeline-event {
          position: relative;
          margin-bottom: 24px;
        }
        .timeline-event:last-child {
          margin-bottom: 0;
        }
        .timeline-marker {
          position: absolute;
          left: -20px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #60a5fa;
          border: 3px solid #0f111a;
        }
        .timeline-content {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .event-time {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .event-type {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .badge {
          font-size: 11px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 700;
        }
        .badge-blue {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }
        .badge-purple {
          background: rgba(167, 139, 250, 0.15);
          color: #a78bfa;
        }
        .path {
          font-family: monospace;
          color: #f1f5f9;
        }
        .click-details {
          color: #f1f5f9;
        }
        .click-details strong {
          color: #cbd5e1;
        }
        .tag-name {
          color: #64748b;
          font-size: 13px;
        }
        .href {
          color: #38bdf8;
          font-size: 13px;
        }
        .event-url {
          font-size: 11px;
          color: #475569;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}
