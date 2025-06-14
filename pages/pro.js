// pages/pro.js
import { useState } from 'react';
import DataTable from '../components/DataTable';
import { componentDatabaseV2 } from '../lib/components';
import GearChart from '../components/GearChart';
import CompatibilityView from '../components/CompatibilityView';
import BuildSheet from '../components/BuildSheet';
import StravaIntegration from '../components/StravaIntegration';

export default function ProPage() {
  const [selectedCrankset, setSelectedCrankset] = useState(null);
  const [selectedCassette, setSelectedCassette] = useState(null);
  const [selectedDerailleur, setSelectedDerailleur] = useState(null);

  return (
    <div className="flex h-screen bg-bg text-text font-mono text-[13px] leading-[1.4]">
      
      {/* Left Panel: Component Library (400px) */}
      <div className="w-[400px] bg-surface border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide">Component Library</h2>
        </div>
        
        {/* Cranksets Section */}
        <div className="border-b border-border">
          <div className="p-3 bg-gray-50 text-xs font-bold uppercase">
            Cranksets
          </div>
          <div className="max-h-48 overflow-y-auto">
            {componentDatabaseV2.cranksets.slice(0, 10).map(crankset => (
              <div 
                key={crankset.id}
                className={`p-2 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                  selectedCrankset?.id === crankset.id ? 'bg-accent text-white' : ''
                }`}
                onClick={() => setSelectedCrankset(crankset)}
              >
                <div className="font-semibold">{crankset.model}</div>
                <div className="text-text-secondary">{crankset.variant} • {crankset.weight}g</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cassettes Section */}
        <div className="border-b border-border">
          <div className="p-3 bg-gray-50 text-xs font-bold uppercase">
            Cassettes  
          </div>
          <div className="max-h-48 overflow-y-auto">
            {componentDatabaseV2.cassettes.slice(0, 10).map(cassette => (
              <div 
                key={cassette.id}
                className={`p-2 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                  selectedCassette?.id === cassette.id ? 'bg-accent text-white' : ''
                }`}
                onClick={() => setSelectedCassette(cassette)}
              >
                <div className="font-semibold">{cassette.model}</div>
                <div className="text-text-secondary">{cassette.variant} • {cassette.weight}g</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rear Derailleurs Section */}
        <div className="border-b border-border">
          <div className="p-3 bg-gray-50 text-xs font-bold uppercase">
            Rear Derailleurs
          </div>
          <div className="max-h-48 overflow-y-auto">
            {componentDatabaseV2.rearDerailleurs.slice(0, 10).map(rd => (
              <div 
                key={rd.id}
                className={`p-2 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                  selectedDerailleur?.id === rd.id ? 'bg-accent text-white' : ''
                }`}
                onClick={() => setSelectedDerailleur(rd)}
              >
                <div className="font-semibold">{rd.model}</div>
                <div className="text-text-secondary">{rd.variant} • {rd.weight}g • Max {rd.maxCog}T</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel: Analysis Area (flex-1) */}
      <div className="flex-1 bg-surface overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide">Analysis</h2>
        </div>
        
        {/* Selected Components Summary */}
        {(selectedCrankset || selectedCassette || selectedDerailleur) && (
          <div className="p-4 bg-gray-50 border-b border-border">
            <div className="text-xs font-bold mb-2">CURRENT SELECTION:</div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-semibold">Crankset:</div>
                <div className="text-text-secondary">
                  {selectedCrankset ? `${selectedCrankset.model} ${selectedCrankset.variant}` : 'None selected'}
                </div>
              </div>
              <div>
                <div className="font-semibold">Cassette:</div>
                <div className="text-text-secondary">
                  {selectedCassette ? `${selectedCassette.model} ${selectedCassette.variant}` : 'None selected'}
                </div>
              </div>
              <div>
                <div className="font-semibold">Derailleur:</div>
                <div className="text-text-secondary">
                  {selectedDerailleur ? `${selectedDerailleur.model} ${selectedDerailleur.variant}` : 'None selected'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gear Chart */}
        {selectedCrankset && selectedCassette && (
          <div className="p-4 border-b border-border">
            <div className="text-xs font-bold mb-3 uppercase">Gear Overlap Analysis</div>
            <GearChart 
              crankset={selectedCrankset}
              cassette={selectedCassette}
              width={800}
              height={300}
            />
          </div>
        )}

        {/* Real-World Compatibility Matrix */}
        {(selectedCrankset || selectedCassette || selectedDerailleur) && (
          <div className="p-4">
            <div className="text-xs font-bold mb-3 uppercase">Real-World Compatibility</div>
            <CompatibilityView 
              selectedCrankset={selectedCrankset}
              selectedCassette={selectedCassette} 
              selectedDerailleur={selectedDerailleur}
            />
          </div>
        )}

        {/* Build Sheet Generator */}
        {selectedCrankset && selectedCassette && selectedDerailleur && (
          <div className="p-4 border-t border-border">
            <div className="text-xs font-bold mb-3 uppercase">Build Sheet Generator</div>
            <BuildSheet 
              crankset={selectedCrankset}
              cassette={selectedCassette} 
              derailleur={selectedDerailleur}
            />
          </div>
        )}

        {/* Strava Integration */}
        {(selectedCrankset || selectedCassette) && (
          <div className="p-4 border-t border-border">
            <div className="text-xs font-bold mb-3 uppercase">🚴 Strava Analysis</div>
            <StravaIntegration 
              crankset={selectedCrankset}
              cassette={selectedCassette}
            />
          </div>
        )}

        {/* Data Table */}
        <div className="p-4">
          <div className="text-xs font-bold mb-3 uppercase">Compatibility Reports</div>
          <DataTable />
        </div>
      </div>

      {/* Right Panel: Quick Stats (320px) */}
      <div className="w-[320px] bg-surface border-l border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide">Quick Stats</h2>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-bold mb-1">Database Stats</div>
            <div className="text-xs space-y-1">
              <div>Cranksets: {componentDatabaseV2.cranksets.length}</div>
              <div>Cassettes: {componentDatabaseV2.cassettes.length}</div>
              <div>Derailleurs: {componentDatabaseV2.rearDerailleurs.length}</div>
            </div>
          </div>

          {selectedCrankset && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-bold mb-1">Selected Crankset</div>
              <div className="text-xs space-y-1">
                <div>Weight: {selectedCrankset.weight}g</div>
                <div>Chainrings: {selectedCrankset.teeth.join('/')}</div>
                <div>Type: {selectedCrankset.bikeType}</div>
                <div>Speeds: {selectedCrankset.speeds}</div>
              </div>
            </div>
          )}

          {selectedCassette && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-bold mb-1">Selected Cassette</div>
              <div className="text-xs space-y-1">
                <div>Weight: {selectedCassette.weight}g</div>
                <div>Range: {selectedCassette.teeth[0]}-{selectedCassette.teeth[1]}T</div>
                <div>Speeds: {selectedCassette.speeds}</div>
              </div>
            </div>
          )}

          {selectedDerailleur && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-bold mb-1">Selected Derailleur</div>
              <div className="text-xs space-y-1">
                <div>Weight: {selectedDerailleur.weight}g</div>
                <div>Max Cog: {selectedDerailleur.maxCog}T</div>
                <div>Capacity: {selectedDerailleur.totalCapacity}T</div>
                <div>Cage: {selectedDerailleur.cageLength}</div>
                {selectedDerailleur.hasClutch && <div>✓ Clutch</div>}
                {selectedDerailleur.isElectronic && <div>⚡ Electronic</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple compatibility analysis component
function CompatibilityAnalysis({ crankset, cassette, derailleur }) {
  // Use your existing compatibility rules
  const analysis = componentDatabaseV2.compatibilityRules.validateDrivetrain(
    crankset, 
    cassette, 
    derailleur
  );

  return (
    <div className="space-y-3">
      <div className={`p-3 rounded text-xs ${
        analysis.overallCompatibility === 'compatible' 
          ? 'bg-success bg-opacity-10 border border-success' 
          : 'bg-error bg-opacity-10 border border-error'
      }`}>
        <div className="font-bold">
          {analysis.overallCompatibility === 'compatible' ? '✓ Compatible' : '✗ Incompatible'}
        </div>
      </div>

      {analysis.errors.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-error">ERRORS:</div>
          {analysis.errors.map((error, i) => (
            <div key={i} className="text-xs text-error">• {error}</div>
          ))}
        </div>
      )}

      {analysis.warnings.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-warning">WARNINGS:</div>
          {analysis.warnings.map((warning, i) => (
            <div key={i} className="text-xs text-warning">• {warning}</div>
          ))}
        </div>
      )}

      {analysis.recommendations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-accent">RECOMMENDATIONS:</div>
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="text-xs text-accent">• {rec}</div>
          ))}
        </div>
      )}

      <div className="p-3 bg-gray-50 rounded">
        <div className="text-xs font-bold mb-1">Chain Length</div>
        <div className="text-xs">
          {analysis.chainLength.links} links ({analysis.chainLength.formula})
        </div>
      </div>
    </div>
  );
}