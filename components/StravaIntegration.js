// components/StravaIntegration.js
import { useState, useEffect } from 'react';

export default function StravaIntegration({ crankset, cassette }) {
  const [isConnected, setIsConnected] = useState(false);
  const [athleteName, setAthleteName] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, disconnected, connected, error

  useEffect(() => {
    initializeStravaConnection();
  }, []);

  const initializeStravaConnection = async () => {
    try {
      // First check for stored credentials
      const storedToken = localStorage.getItem('cranksmith_strava_token');
      const storedAthlete = localStorage.getItem('cranksmith_strava_athlete');
      const storedExpiry = localStorage.getItem('cranksmith_strava_expiry');

      if (storedToken && storedAthlete) {
        // Check if token is still valid (Strava tokens expire)
        const isExpired = storedExpiry && Date.now() > parseInt(storedExpiry);
        
        if (!isExpired) {
          setIsConnected(true);
          setAthleteName(storedAthlete);
          setAccessToken(storedToken);
          setConnectionStatus('connected');
          return;
        } else {
          // Clean up expired tokens
          clearStoredCredentials();
        }
      }

      // Check URL params for new auth
      const urlParams = new URLSearchParams(window.location.search);
      const connected = urlParams.get('strava_connected');
      const athlete = urlParams.get('athlete');
      const token = urlParams.get('access_token');
      const error = urlParams.get('strava_error');

      if (connected === 'true' && athlete && token) {
        const decodedAthlete = decodeURIComponent(athlete);
        const decodedToken = decodeURIComponent(token);
        
        setIsConnected(true);
        setAthleteName(decodedAthlete);
        setAccessToken(decodedToken);
        setConnectionStatus('connected');
        
        // Store credentials securely (expires in 6 hours for security)
        const expiry = Date.now() + (6 * 60 * 60 * 1000);
        localStorage.setItem('cranksmith_strava_token', decodedToken);
        localStorage.setItem('cranksmith_strava_athlete', decodedAthlete);
        localStorage.setItem('cranksmith_strava_expiry', expiry.toString());
        
        // Clean URL immediately for security
        window.history.replaceState({}, '', '/pro');
      } else if (error) {
        setConnectionStatus('error');
        console.error('Strava connection error:', error);
        window.history.replaceState({}, '', '/pro');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Strava initialization error:', error);
      setConnectionStatus('error');
    }
  };

  const clearStoredCredentials = () => {
    localStorage.removeItem('cranksmith_strava_token');
    localStorage.removeItem('cranksmith_strava_athlete');
    localStorage.removeItem('cranksmith_strava_expiry');
  };

  // FIXED: Proper OAuth flow initiation
  const connectStrava = () => {
    setConnectionStatus('connecting');
    // Redirect to our auth endpoint, which will handle the OAuth flow
    window.location.href = '/api/strava/auth';
  };

  const disconnect = () => {
    setIsConnected(false);
    setAthleteName('');
    setAccessToken(null);
    setAnalysis(null);
    setConnectionStatus('disconnected');
    clearStoredCredentials();
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'checking':
        return {
          icon: '⟳',
          title: 'Checking Strava Connection...',
          subtitle: 'Verifying stored credentials',
          className: 'bg-gray-100 border-gray-300 animate-pulse'
        };
      case 'connecting':
        return {
          icon: '⟳',
          title: 'Connecting to Strava...',
          subtitle: 'Redirecting for authorization',
          className: 'bg-blue-50 border-blue-300 animate-pulse'
        };
      case 'connected':
        return {
          icon: '🚴',
          title: `Connected to Strava - ${athleteName}`,
          subtitle: 'Real-time access to your riding data',
          className: 'bg-success bg-opacity-10 border-success'
        };
      case 'error':
        return {
          icon: '⚠️',
          title: 'Connection Error',
          subtitle: 'Unable to connect to Strava. Please try again.',
          className: 'bg-error bg-opacity-10 border-error'
        };
      default:
        return {
          icon: '🚴',
          title: 'Connect to Strava',
          subtitle: 'Unlock personalized gear analysis from your real rides',
          className: 'bg-gray-50 border-gray-300'
        };
    }
  };

  const analyzeRides = async () => {
    if (!accessToken || !crankset || !cassette) return;

    setLoading(true);
    try {
      const response = await fetch('/api/strava/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          crankset,
          cassette
        })
      });

      const data = await response.json();
      
      if (data && data.gearAnalysis) {
        setAnalysis(data);
      } else {
        throw new Error('Invalid analysis data received');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      // Don't use alert in pro software
      setConnectionStatus('error');
    }
    setLoading(false);
  };

  if (!crankset || !cassette) {
    return (
      <div className="p-4 text-center text-text-secondary text-xs">
        Select crankset and cassette to analyze Strava data
      </div>
    );
  }

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <div className="strava-integration">
      {/* Professional Connection Status */}
      <div className={`p-4 rounded border-2 mb-4 transition-all duration-300 ${statusDisplay.className}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span className="text-orange-500">{statusDisplay.icon}</span>
              {statusDisplay.title}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {statusDisplay.subtitle}
            </div>
          </div>
          <div className="flex gap-2">
            {connectionStatus === 'connected' ? (
              <>
                <button
                  onClick={analyzeRides}
                  disabled={loading}
                  className="px-3 py-2 bg-accent text-white text-xs rounded hover:bg-opacity-80 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">⟳</span>
                      Analyzing...
                    </span>
                  ) : (
                    '📊 Analyze Rides'
                  )}
                </button>
                <button
                  onClick={disconnect}
                  className="px-3 py-2 bg-gray-200 text-xs rounded hover:bg-gray-300 transition-all"
                >
                  Disconnect
                </button>
              </>
            ) : connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
              <button
                onClick={connectStrava}
                disabled={connectionStatus === 'connecting'}
                className="px-3 py-2 bg-orange-500 text-white text-xs rounded hover:bg-opacity-80 disabled:opacity-50 transition-all"
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : '🔗 Connect Strava'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded text-center">
              <div className="text-lg font-bold">{analysis.totalRides}</div>
              <div className="text-xs text-text-secondary">Rides Analyzed</div>
            </div>
            <div className="p-3 bg-gray-50 rounded text-center">
              <div className="text-lg font-bold">
                {Math.round(analysis.analyzedDistance / 1000)}km
              </div>
              <div className="text-xs text-text-secondary">Total Distance</div>
            </div>
            <div className="p-3 bg-gray-50 rounded text-center">
              <div className="text-lg font-bold">
                {analysis.gearAnalysis ? analysis.gearAnalysis.filter(g => g.isUnused).length : 0}
              </div>
              <div className="text-xs text-text-secondary">Unused Gears</div>
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="border border-border rounded">
              <div className="bg-gray-50 p-3 border-b border-border">
                <div className="text-xs font-bold uppercase">🎯 Recommendations</div>
              </div>
              <div className="p-3 space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className={`p-3 rounded border-l-4 ${
                    rec.priority === 'high' ? 'border-error bg-error bg-opacity-5' :
                    rec.priority === 'medium' ? 'border-warning bg-warning bg-opacity-5' :
                    'border-accent bg-accent bg-opacity-5'
                  }`}>
                    <div className="text-xs font-bold">{rec.title}</div>
                    <div className="text-xs text-text-secondary mt-1">{rec.description}</div>
                    <div className="text-xs mt-2">{rec.suggestion}</div>
                    {rec.savings && (
                      <div className="text-xs text-success mt-1">{rec.savings}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gear Usage Table */}
          <div className="border border-border rounded">
            <div className="bg-gray-50 p-3 border-b border-border">
              <div className="text-xs font-bold uppercase">Gear Usage Analysis</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left border-b">Gear</th>
                    <th className="p-2 text-left border-b">Usage %</th>
                    <th className="p-2 text-left border-b">Time</th>
                    <th className="p-2 text-left border-b">Distance</th>
                    <th className="p-2 text-left border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.gearAnalysis && analysis.gearAnalysis.slice(0, 10).map((gear, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border-b font-mono">{gear.gearCombo}</td>
                      <td className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-accent"
                              style={{ width: `${Math.min(gear.usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span>{gear.usagePercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-2 border-b">{gear.timeUsed}min</td>
                      <td className="p-2 border-b">{gear.distanceUsed}km</td>
                      <td className="p-2 border-b">
                        {gear.isUnused ? (
                          <span className="text-error">❌ Never used</span>
                        ) : gear.isRarelyUsed ? (
                          <span className="text-warning">⚠️ Rarely used</span>
                        ) : (
                          <span className="text-success">✅ Regular use</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-text-secondary text-center">
            Last analyzed: {new Date(analysis.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}