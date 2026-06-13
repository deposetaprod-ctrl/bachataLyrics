import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sessions'

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

  // Process data for charts
  const chartData = useMemo(() => {
    return sessions.map((session) => {
      let duration = 0;
      const firstEvent = session.events[0];
      const lastEvent = session.events[session.events.length - 1];
      if (firstEvent && lastEvent) {
        duration = Math.floor((new Date(lastEvent.timestamp) - new Date(firstEvent.timestamp)) / 1000);
      }
      const pageViews = session.events.filter(e => e.type === 'page_view').length;
      return {
        name: session.sessionId.substring(0, 5),
        duration: duration > 0 ? duration : 0,
        pageViews,
        date: new Date(session.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      };
    }).reverse(); // Chronological order
  }, [sessions]);

  // Overall Stats
  const totalDuration = chartData.reduce((acc, curr) => acc + curr.duration, 0);
  const avgDuration = sessions.length > 0 ? Math.floor(totalDuration / sessions.length) : 0;
  const totalPages = chartData.reduce((acc, curr) => acc + curr.pageViews, 0);

  const formatDuration = (secs) => {
    if (secs < 60) return `${secs} sec`;
    return `${Math.floor(secs / 60)} min ${secs % 60} s`;
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
          h1 { margin-top: 0; font-size: 24px; margin-bottom: 8px; }
          p { color: #aaa; font-size: 14px; margin-bottom: 24px; }
          input {
            width: 100%; padding: 12px 16px; border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.2);
            color: #fff; margin-bottom: 16px; font-size: 16px; box-sizing: border-box;
          }
          input:focus { outline: none; border-color: #3b82f6; }
          button {
            width: 100%; padding: 12px; border-radius: 8px; background: #3b82f6;
            color: white; border: none; font-size: 16px; font-weight: bold; cursor: pointer;
            transition: background 0.2s;
          }
          button:hover:not(:disabled) { background: #2563eb; }
          button:disabled { opacity: 0.7; cursor: not-allowed; }
          .error { color: #ef4444; font-size: 14px; margin-bottom: 16px; }
        `}</style>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="overview">
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Temps passé par utilisateur (secondes)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Line type="monotone" dataKey="duration" name="Durée (s)" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Pages consultées par utilisateur</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#a78bfa' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="pageViews" name="Pages visitées" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overview { display: flex; flex-direction: column; gap: 24px; }
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .chart-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
        }
        .chart-card h3 { margin-top: 0; color: #f8fafc; font-size: 16px; font-weight: 600; margin-bottom: 20px; }
        .chart-wrapper { height: 300px; width: 100%; }
        @media (max-width: 1024px) {
          .charts-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );

  const renderSessions = () => (
    <div className="sessions-list">
      {sessions.map(session => (
        <div key={session.sessionId} className={`session-item ${expandedSession === session.sessionId ? 'expanded' : ''}`}>
          <div className="session-header" onClick={() => toggleSession(session.sessionId)}>
            <div className="session-info">
              <span className="session-id" title={session.sessionId}>{session.sessionId.split('-')[0]}...</span>
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
                {session.events.map((ev, index) => {
                  const nextEv = session.events[index + 1];
                  let durationStr = '';
                  if (nextEv) {
                    const diff = new Date(nextEv.timestamp) - new Date(ev.timestamp);
                    const secs = Math.floor(diff / 1000);
                    if (secs > 0) {
                      durationStr = formatDuration(secs);
                    }
                  } else if (ev.type !== 'visibility_hidden') {
                     // Calculate total session time for last visible event based on last_seen
                     const diff = new Date(session.lastSeen) - new Date(ev.timestamp);
                     const secs = Math.floor(diff / 1000);
                     if (secs > 0) {
                        durationStr = formatDuration(secs) + " (jusqu'au départ)";
                     }
                  }

                  let clickText = ev.data?.text || '';
                  if (ev.type === 'click' && clickText) {
                    if (clickText === 'X' || clickText === '×' || clickText === '✖' || clickText.toLowerCase() === 'fermer') {
                      clickText = "Fermeture d'un Pop-up (X)";
                    }
                  }

                  return (
                    <div key={index} className="timeline-event">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="event-time">
                          {formatDate(ev.timestamp)}
                          {durationStr && <span className="event-duration"> (Temps : {durationStr})</span>}
                        </div>
                        {ev.type === 'page_view' ? (
                          <div className="event-type page-view">
                            <span className="badge badge-blue">Page Visitée</span>
                            <span className="path">{ev.data.path}</span>
                          </div>
                        ) : ev.type === 'popup_interaction' ? (
                          <div className="event-type popup">
                            <span className="badge badge-green">Boutique</span>
                            <span className="click-details">
                              Action: <strong>{ev.data.action}</strong><br/>
                              Article: <em>{ev.data.item}</em> ({ev.data.price}€)
                            </span>
                          </div>
                        ) : ev.type === 'visibility_hidden' ? (
                           <div className="event-type leave">
                            <span className="badge badge-red">Sortie du site</span>
                            <span className="click-details">L'utilisateur a quitté la page ou changé d'onglet.</span>
                          </div>
                        ) : (
                          <div className="event-type click">
                            <span className="badge badge-purple">Clic</span>
                            <span className="click-details" style={{ wordBreak: 'break-word' }}>
                              {clickText ? <strong>"{clickText}"</strong> : <em>(Élément sans texte)</em>} 
                              {ev.data.tagName && <span className="tag-name"> [{ev.data.tagName.toLowerCase()}]</span>}
                              {ev.data.href && <span className="href"> {"->"} {ev.data.href}</span>}
                            </span>
                          </div>
                        )}
                        <div className="event-url">{ev.url}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

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
          <div className="stat-card">
            <span>Temps Moyen</span>
            <strong>{formatDuration(avgDuration)}</strong>
          </div>
          <div className="stat-card">
            <span>Pages Visitées (Total)</span>
            <strong>{totalPages}</strong>
          </div>
        </div>
      </header>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Détail des Sessions
        </button>
      </div>
      
      <main>
        {sessions.length === 0 ? (
          <div className="empty-state">Aucune connexion enregistrée pour le moment.</div>
        ) : (
          activeTab === 'overview' ? renderOverview() : renderSessions()
        )}
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh; background: #0f111a; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; padding: 40px;
        }
        header { margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        h1 { margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(90deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stats { display: flex; gap: 20px; }
        .stat-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px 24px; border-radius: 12px; display: flex; flex-direction: column; }
        .stat-card span { font-size: 14px; color: #94a3b8; margin-bottom: 4px; }
        .stat-card strong { font-size: 24px; color: #fff; }
        
        .tabs-container {
          display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;
        }
        .tab-btn {
          background: transparent; border: none; color: #94a3b8; font-size: 16px; font-weight: 600; padding: 8px 16px; cursor: pointer; border-radius: 8px; transition: all 0.2s;
        }
        .tab-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
        .tab-btn.active { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }

        .empty-state { text-align: center; padding: 60px; background: rgba(255, 255, 255, 0.02); border-radius: 12px; border: 1px dashed rgba(255, 255, 255, 0.1); color: #94a3b8; }
        .sessions-list { display: flex; flex-direction: column; gap: 16px; }
        .session-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; transition: all 0.2s; }
        .session-item:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.15); }
        .session-item.expanded { border-color: rgba(96, 165, 250, 0.5); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); }
        .session-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .session-info { display: flex; flex-direction: column; gap: 4px; }
        .session-id { font-weight: 600; font-family: monospace; color: #e2e8f0; font-size: 16px; }
        .session-date { font-size: 14px; color: #94a3b8; }
        .session-actions { display: flex; align-items: center; gap: 16px; }
        .event-count { background: rgba(96, 165, 250, 0.1); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        .chevron { transition: transform 0.3s; color: #94a3b8; }
        .expanded .chevron { transform: rotate(180deg); color: #60a5fa; }
        .session-timeline { padding: 0 20px 20px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 10px; padding-top: 20px; }
        h4 { margin-top: 0; margin-bottom: 20px; color: #f8fafc; }
        .timeline { position: relative; padding-left: 20px; }
        .timeline::before { content: ''; position: absolute; left: 5px; top: 0; bottom: 0; width: 2px; background: rgba(255, 255, 255, 0.1); }
        .timeline-event { position: relative; margin-bottom: 24px; }
        .timeline-event:last-child { margin-bottom: 0; }
        .timeline-marker { position: absolute; left: -20px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #60a5fa; border: 3px solid #0f111a; }
        .timeline-content { background: rgba(0, 0, 0, 0.2); padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
        .event-time { font-size: 12px; color: #64748b; margin-bottom: 8px; }
        .event-duration { color: #38bdf8; font-weight: 600; margin-left: 8px; background: rgba(56, 189, 248, 0.1); padding: 2px 6px; border-radius: 4px; }
        .event-type { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .badge { font-size: 11px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; font-weight: 700; }
        .badge-blue { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
        .badge-purple { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
        .badge-green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .path { font-family: monospace; color: #f1f5f9; }
        .click-details { color: #f1f5f9; }
        .click-details strong { color: #cbd5e1; }
        .tag-name { color: #64748b; font-size: 13px; }
        .href { color: #38bdf8; font-size: 13px; }
        .event-url { font-size: 11px; color: #475569; word-break: break-all; }

        @media (max-width: 768px) {
          .dashboard-container { padding: 16px; }
          header { flex-direction: column; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
          .stats { width: 100%; flex-direction: column; }
          .stat-card { width: 100%; }
          .session-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .session-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}
