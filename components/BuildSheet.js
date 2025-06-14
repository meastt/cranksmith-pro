// components/BuildSheet.js
import { useState } from 'react';
import { componentDatabaseV2 } from '../lib/components';

export default function BuildSheet({ crankset, cassette, derailleur }) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    bikeModel: '',
    frameSize: '',
    ridingStyle: ''
  });
  const [shopInfo, setShopInfo] = useState({
    name: 'Your Bike Shop',
    address: '123 Main St, Your City',
    phone: '(555) 123-4567',
    email: 'info@yourshop.com'
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBuildSheet = async () => {
    if (!crankset || !cassette || !derailleur) {
      alert('Please select all components first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Calculate comprehensive build data
      const buildData = calculateBuildData(crankset, cassette, derailleur);
      
      // Generate PDF via API
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerInfo,
          shop: shopInfo,
          components: { crankset, cassette, derailleur },
          buildData,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `build-sheet-${customerInfo.name || 'customer'}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate build sheet. Please try again.');
    }
    
    setIsGenerating(false);
  };

  const buildData = crankset && cassette && derailleur ? 
    calculateBuildData(crankset, cassette, derailleur) : null;

  if (!crankset || !cassette || !derailleur) {
    return (
      <div className="p-4 text-center text-text-secondary text-xs">
        Select all components to generate build sheet
      </div>
    );
  }

  return (
    <div className="build-sheet">
      {/* Build Summary */}
      <div className="p-4 bg-gray-50 rounded border mb-4">
        <div className="text-sm font-bold mb-3">BUILD SUMMARY</div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold">Total Weight:</div>
            <div>{buildData.totalWeight}g</div>
          </div>
          <div>
            <div className="font-semibold">Estimated Labor:</div>
            <div>{buildData.laborTime}</div>
          </div>
          <div>
            <div className="font-semibold">Gear Range:</div>
            <div>{buildData.gearRange}</div>
          </div>
          <div>
            <div className="font-semibold">Chain Length:</div>
            <div>{buildData.chainLength} links</div>
          </div>
        </div>
      </div>

      {/* Complete Parts List */}
      <div className="border border-border rounded mb-4">
        <div className="bg-gray-50 p-3 border-b border-border">
          <div className="text-xs font-bold uppercase">Complete Parts List</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left border-b">Component</th>
                <th className="p-2 text-left border-b">Part Number</th>
                <th className="p-2 text-left border-b">Qty</th>
                <th className="p-2 text-left border-b">Weight</th>
                <th className="p-2 text-left border-b">Notes</th>
              </tr>
            </thead>
            <tbody>
              {buildData.partsList.map((part, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border-b font-semibold">{part.name}</td>
                  <td className="p-2 border-b font-mono">{part.partNumber}</td>
                  <td className="p-2 border-b">{part.quantity}</td>
                  <td className="p-2 border-b">{part.weight}</td>
                  <td className="p-2 border-b text-text-secondary">{part.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="border border-border rounded mb-4">
        <div className="bg-gray-50 p-3 border-b border-border">
          <div className="text-xs font-bold uppercase">Installation & Torque Specs</div>
        </div>
        <div className="p-3 space-y-3">
          {buildData.installationSteps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs">{step.title}</div>
                <div className="text-xs text-text-secondary mt-1">{step.description}</div>
                {step.torque && (
                  <div className="text-xs font-mono mt-1 text-accent">
                    Torque: {step.torque}
                  </div>
                )}
                {step.specialTools && (
                  <div className="text-xs mt-1 text-warning">
                    ⚠️ Requires: {step.specialTools}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility Warnings */}
      {buildData.warnings.length > 0 && (
        <div className="border border-warning bg-warning bg-opacity-10 rounded mb-4">
          <div className="p-3 border-b border-warning">
            <div className="text-xs font-bold uppercase text-warning">⚠️ Installation Warnings</div>
          </div>
          <div className="p-3">
            {buildData.warnings.map((warning, i) => (
              <div key={i} className="text-xs text-warning mb-1">• {warning}</div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Information Form */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="text-sm font-bold mb-4">Customer & Shop Information</div>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="text-xs font-bold mb-2 uppercase">Customer Info</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="p-2 border rounded text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="p-2 border rounded text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="p-2 border rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Bike Model"
                    value={customerInfo.bikeModel}
                    onChange={(e) => setCustomerInfo({...customerInfo, bikeModel: e.target.value})}
                    className="p-2 border rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-bold mb-2 uppercase">Shop Info</div>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Shop Name"
                    value={shopInfo.name}
                    onChange={(e) => setShopInfo({...shopInfo, name: e.target.value})}
                    className="p-2 border rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Shop Address"
                    value={shopInfo.address}
                    onChange={(e) => setShopInfo({...shopInfo, address: e.target.value})}
                    className="p-2 border rounded text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCustomerForm(false);
                  generateBuildSheet();
                }}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-accent text-white text-xs rounded hover:bg-opacity-80 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
              <button
                onClick={() => setShowCustomerForm(false)}
                className="px-4 py-2 bg-gray-200 text-xs rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCustomerForm(true)}
          disabled={isGenerating}
          className="flex-1 px-4 py-3 bg-accent text-white text-sm font-semibold rounded hover:bg-opacity-80 disabled:opacity-50"
        >
          📄 Generate Build Sheet PDF
        </button>
        <button
          onClick={() => {
            // Copy build data to clipboard
            const buildText = formatBuildForClipboard(buildData, crankset, cassette, derailleur);
            navigator.clipboard.writeText(buildText);
            alert('Build data copied to clipboard!');
          }}
          className="px-4 py-3 bg-gray-200 text-sm rounded hover:bg-gray-300"
        >
          📋 Copy
        </button>
      </div>
    </div>
  );
}

// Helper functions
function calculateBuildData(crankset, cassette, derailleur) {
  const compatibility = componentDatabaseV2.compatibilityRules.validateDrivetrain(
    crankset, cassette, derailleur
  );

  const totalWeight = crankset.weight + cassette.weight + derailleur.weight;
  const minCog = Math.min(...cassette.teeth);
  const maxCog = Math.max(...cassette.teeth);
  const gearRange = `${minCog}-${maxCog}T (${Math.round((maxCog/minCog) * 100)}% range)`;

  // Generate comprehensive parts list
  const partsList = [
    {
      name: crankset.model,
      partNumber: crankset.id.toUpperCase().replace(/-/g, ''),
      quantity: '1x',
      weight: `${crankset.weight}g`,
      notes: crankset.variant
    },
    {
      name: cassette.model,
      partNumber: cassette.id.toUpperCase().replace(/-/g, ''),
      quantity: '1x',
      weight: `${cassette.weight}g`,
      notes: cassette.variant
    },
    {
      name: derailleur.model,
      partNumber: derailleur.id.toUpperCase().replace(/-/g, ''),
      quantity: '1x',
      weight: `${derailleur.weight}g`,
      notes: derailleur.variant
    },
    {
      name: 'Chain',
      partNumber: 'CHAIN-' + cassette.speeds.split('-')[0],
      quantity: '1x',
      weight: '250g',
      notes: `${compatibility.chainLength.links} links`
    },
    {
      name: 'Derailleur Hanger',
      partNumber: 'HANGER-CHECK',
      quantity: '1x',
      weight: '15g',
      notes: 'Frame-specific'
    }
  ];

  // Add cables/housing for mechanical systems
  if (!derailleur.isElectronic) {
    partsList.push({
      name: 'Shift Cable & Housing',
      partNumber: 'CABLE-SHIFT',
      quantity: '1 set',
      weight: '85g',
      notes: 'Stainless steel'
    });
  }

  // Add electronic components
  if (derailleur.isElectronic) {
    partsList.push({
      name: 'Di2 Battery',
      partNumber: 'BT-DN110',
      quantity: '1x',
      weight: '50g',
      notes: 'Internal or external mount'
    });
    if (!derailleur.isWireless) {
      partsList.push({
        name: 'Di2 E-Tube Wires',
        partNumber: 'EW-SD300',
        quantity: '2-3x',
        weight: '30g',
        notes: 'Various lengths needed'
      });
    }
  }

  // Installation steps with torque specs
  const installationSteps = [
    {
      title: 'Remove Old Drivetrain',
      description: 'Remove existing crankset, cassette, and derailleur',
      torque: null,
      specialTools: 'Chain whip, cassette tool, crank puller'
    },
    {
      title: 'Install Bottom Bracket',
      description: 'Clean threads and install with proper torque',
      torque: '35-50 Nm',
      specialTools: 'BB tool specific to frame'
    },
    {
      title: 'Install Crankset',
      description: 'Mount crankset ensuring proper chainline',
      torque: crankset.model.includes('Shimano') ? '12-15 Nm' : '40-50 Nm',
      specialTools: null
    },
    {
      title: 'Install Cassette',
      description: 'Thread onto freehub with lockring',
      torque: '40 Nm',
      specialTools: 'Chain whip, cassette tool'
    },
    {
      title: 'Mount Rear Derailleur',
      description: 'Attach to derailleur hanger and set B-tension',
      torque: '8-10 Nm',
      specialTools: derailleur.isDirectMount ? 'UDH tool' : null
    },
    {
      title: 'Install Chain',
      description: `Size chain to ${compatibility.chainLength.links} links and connect`,
      torque: null,
      specialTools: 'Chain tool'
    },
    {
      title: 'Cable/Wiring',
      description: derailleur.isElectronic ? 
        'Route electronic wires and pair components' : 
        'Install shift cables and housing',
      torque: null,
      specialTools: derailleur.isElectronic ? 'E-Tube software' : null
    },
    {
      title: 'Adjustment & Testing',
      description: 'Set limit screws, indexing, and test all gears',
      torque: null,
      specialTools: 'Bike stand, barrel adjusters'
    }
  ];

  // Collect warnings
  const warnings = [
    ...compatibility.systemIssues,
    ...compatibility.warnings
  ];

  if (derailleur.isElectronic) {
    warnings.push('Electronic components require firmware updates and pairing');
  }

  if (compatibility.setupDifficulty.level === 'advanced') {
    warnings.push('Advanced installation - recommend professional mechanic');
  }

  // Labor time estimation
  let laborMinutes = 90; // Base time
  if (derailleur.isElectronic) laborMinutes += 30;
  if (derailleur.isWireless) laborMinutes += 15;
  if (compatibility.setupDifficulty.level === 'advanced') laborMinutes += 30;
  
  const laborTime = `${Math.round(laborMinutes / 60 * 10) / 10} hours`;

  return {
    totalWeight,
    gearRange,
    chainLength: compatibility.chainLength.links,
    laborTime,
    partsList,
    installationSteps,
    warnings,
    compatibility
  };
}

function formatBuildForClipboard(buildData, crankset, cassette, derailleur) {
  return `
DRIVETRAIN BUILD SHEET
Generated: ${new Date().toLocaleString()}

COMPONENTS:
• Crankset: ${crankset.model} ${crankset.variant}
• Cassette: ${cassette.model} ${cassette.variant}  
• Derailleur: ${derailleur.model} ${derailleur.variant}

SPECIFICATIONS:
• Total Weight: ${buildData.totalWeight}g
• Gear Range: ${buildData.gearRange}
• Chain Length: ${buildData.chainLength} links
• Labor Estimate: ${buildData.laborTime}

PARTS LIST:
${buildData.partsList.map(p => `• ${p.name} (${p.partNumber}) - ${p.quantity}`).join('\n')}

Generated by CrankSmith Pro
`.trim();
}