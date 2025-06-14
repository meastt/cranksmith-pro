// components/CompatibilityView.js
import { useState, useEffect } from 'react';
import { componentDatabaseV2 } from '../lib/components';

export default function CompatibilityView({ selectedCrankset, selectedCassette, selectedDerailleur }) {
  const [compatibilityReports, setCompatibilityReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [newReport, setNewReport] = useState({
    works: true,
    requirements: [],
    shiftQuality: 85,
    notes: ''
  });

  useEffect(() => {
    if (selectedCrankset && selectedCassette && selectedDerailleur) {
      loadCompatibilityData();
    }
  }, [selectedCrankset, selectedCassette, selectedDerailleur]);

  const loadCompatibilityData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/compatibility/list');
      const allReports = await response.json();
      
      // Filter reports for this specific combination
      const filtered = allReports.filter(report => 
        report.crankset_id === selectedCrankset.id &&
        report.cassette_id === selectedCassette.id &&
        report.derailleur_id === selectedDerailleur.id
      );
      
      setCompatibilityReports(filtered);
    } catch (error) {
      console.error('Failed to load compatibility data:', error);
    }
    setLoading(false);
  };

  const submitReport = async () => {
    try {
      const response = await fetch('/api/compatibility/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'temp-user-123', // In real app, get from auth
          crankset_id: selectedCrankset.id,
          cassette_id: selectedCassette.id,
          derailleur_id: selectedDerailleur.id,
          is_compatible: newReport.works
        })
      });
      
      if (response.ok) {
        setShowSubmissionForm(false);
        setNewReport({ works: true, requirements: [], shiftQuality: 85, notes: '' });
        loadCompatibilityData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const calculateOverallCompatibility = () => {
    if (compatibilityReports.length === 0) {
      return { status: 'unknown', confidence: 0 };
    }
    
    const compatibleReports = compatibilityReports.filter(r => r.is_compatible);
    const compatibilityRate = compatibleReports.length / compatibilityReports.length;
    
    if (compatibilityRate >= 0.8) return { status: 'compatible', confidence: compatibilityRate };
    if (compatibilityRate >= 0.5) return { status: 'conditional', confidence: compatibilityRate };
    return { status: 'incompatible', confidence: compatibilityRate };
  };

  const getSourceCredibilityScore = (userId) => {
    // In real app, this would check user reputation
    if (userId.includes('verified')) return 1.0;
    if (userId.includes('shop')) return 0.9;
    if (userId.includes('pro')) return 0.95;
    return 0.7; // Regular user
  };

  const compatibility = calculateOverallCompatibility();

  if (!selectedCrankset || !selectedCassette || !selectedDerailleur) {
    return (
      <div className="p-4 text-center text-text-secondary text-xs">
        Select all three components to see real-world compatibility data
      </div>
    );
  }

  return (
    <div className="compatibility-view">
      {/* Compatibility Summary */}
      <div className={`p-4 rounded border-2 mb-4 ${
        compatibility.status === 'compatible' ? 'bg-success bg-opacity-10 border-success' :
        compatibility.status === 'conditional' ? 'bg-warning bg-opacity-10 border-warning' :
        compatibility.status === 'incompatible' ? 'bg-error bg-opacity-10 border-error' :
        'bg-gray-50 border-gray-300'
      }`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-sm font-bold">
              {compatibility.status === 'compatible' && '✅ CONFIRMED COMPATIBLE'}
              {compatibility.status === 'conditional' && '⚠️ WORKS WITH CAVEATS'}
              {compatibility.status === 'incompatible' && '❌ INCOMPATIBLE'}
              {compatibility.status === 'unknown' && '❓ NO DATA YET'}
            </div>
            <div className="text-xs text-text-secondary">
              {compatibilityReports.length > 0 ? 
                `Based on ${compatibilityReports.length} real-world report${compatibilityReports.length !== 1 ? 's' : ''}` :
                'Be the first to report on this combination'
              }
            </div>
          </div>
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="px-3 py-1 bg-accent text-white text-xs rounded hover:bg-opacity-80"
          >
            Add Report
          </button>
        </div>
        
        {compatibility.status !== 'unknown' && (
          <div className="text-xs">
            <div className="flex justify-between mb-1">
              <span>Confidence Level:</span>
              <span className="font-mono">{Math.round(compatibility.confidence * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  compatibility.confidence >= 0.8 ? 'bg-success' :
                  compatibility.confidence >= 0.5 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${compatibility.confidence * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Real-World Reports Table */}
      {loading ? (
        <div className="text-center py-4 text-xs">Loading compatibility data...</div>
      ) : compatibilityReports.length > 0 ? (
        <div className="border border-border rounded">
          <div className="bg-gray-50 p-2 border-b border-border">
            <div className="text-xs font-bold uppercase">Real-World Reports</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left border-b">Works?</th>
                  <th className="p-2 text-left border-b">Source</th>
                  <th className="p-2 text-left border-b">Credibility</th>
                  <th className="p-2 text-left border-b">Date</th>
                  <th className="p-2 text-left border-b">Details</th>
                </tr>
              </thead>
              <tbody>
                {compatibilityReports.map((report, i) => {
                  const credibility = getSourceCredibilityScore(report.user_id);
                  return (
                    <tr key={report.id || i} className="hover:bg-gray-50">
                      <td className="p-2 border-b">
                        {report.is_compatible ? '✅ Yes' : '❌ No'}
                      </td>
                      <td className="p-2 border-b font-mono">
                        {report.user_id.replace('temp-user-', 'User #')}
                      </td>
                      <td className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-1">
                            <div 
                              className="h-1 rounded-full bg-accent"
                              style={{ width: `${credibility * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-text-secondary">
                            {Math.round(credibility * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-b text-text-secondary">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2 border-b">
                        <button className="text-accent hover:underline">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          <div className="text-xs mb-2">No real-world data for this combination yet</div>
          <div className="text-xs">Be the first to contribute!</div>
        </div>
      )}

      {/* Theoretical Analysis */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <div className="text-xs font-bold mb-2 uppercase">Theoretical Analysis</div>
        <TheoreticalCompatibility 
          crankset={selectedCrankset}
          cassette={selectedCassette}
          derailleur={selectedDerailleur}
        />
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-sm font-bold mb-4">Report Real-World Experience</div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Does this combination work?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewReport({...newReport, works: true})}
                    className={`px-3 py-2 text-xs rounded ${
                      newReport.works ? 'bg-success text-white' : 'bg-gray-200'
                    }`}
                  >
                    ✅ Yes, it works
                  </button>
                  <button
                    onClick={() => setNewReport({...newReport, works: false})}
                    className={`px-3 py-2 text-xs rounded ${
                      !newReport.works ? 'bg-error text-white' : 'bg-gray-200'
                    }`}
                  >
                    ❌ No, incompatible
                  </button>
                </div>
              </div>

              {newReport.works && (
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Shift Quality (1-100): {newReport.shiftQuality}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={newReport.shiftQuality}
                    onChange={(e) => setNewReport({...newReport, shiftQuality: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">Notes (optional)</label>
                <textarea
                  value={newReport.notes}
                  onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                  placeholder="Required spacers, B-tension adjustments, etc."
                  className="w-full p-2 border rounded text-xs"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={submitReport}
                className="flex-1 px-4 py-2 bg-accent text-white text-xs rounded hover:bg-opacity-80"
              >
                Submit Report
              </button>
              <button
                onClick={() => setShowSubmissionForm(false)}
                className="px-4 py-2 bg-gray-200 text-xs rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Theoretical compatibility analysis using your existing rules
function TheoreticalCompatibility({ crankset, cassette, derailleur }) {
  const analysis = componentDatabaseV2.compatibilityRules.validateDrivetrain(
    crankset, 
    cassette, 
    derailleur
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="font-semibold">Speed Compatibility:</div>
          <div className={`${
            parseInt(derailleur.speeds) === parseInt(cassette.speeds) ? 'text-success' : 'text-error'
          }`}>
            {parseInt(derailleur.speeds) === parseInt(cassette.speeds) ? '✓ Match' : '✗ Mismatch'}
          </div>
        </div>
        <div>
          <div className="font-semibold">Max Cog Support:</div>
          <div className={`${
            derailleur.maxCog >= Math.max(...cassette.teeth) ? 'text-success' : 'text-error'
          }`}>
            {derailleur.maxCog >= Math.max(...cassette.teeth) ? '✓ Supported' : '✗ Too Large'}
          </div>
        </div>
        <div>
          <div className="font-semibold">Chain Length:</div>
          <div className="text-text-secondary">{analysis.chainLength.links} links</div>
        </div>
        <div>
          <div className="font-semibold">Setup Difficulty:</div>
          <div className={`${
            analysis.setupDifficulty.level === 'easy' ? 'text-success' :
            analysis.setupDifficulty.level === 'moderate' ? 'text-warning' : 'text-error'
          }`}>
            {analysis.setupDifficulty.level.toUpperCase()}
          </div>
        </div>
      </div>
      
      {analysis.systemIssues.length > 0 && (
        <div className="mt-2">
          <div className="font-semibold text-xs">System Issues:</div>
          {analysis.systemIssues.map((issue, i) => (
            <div key={i} className="text-xs text-warning">• {issue}</div>
          ))}
        </div>
      )}
    </div>
  );
}