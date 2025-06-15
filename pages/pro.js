// pages/pro.js - Mobile-first bike shop tool
import { useState } from 'react';
import { componentDatabaseV2 } from '../lib/components';

export default function ProPage() {
  const [selectedCrankset, setSelectedCrankset] = useState(null);
  const [selectedCassette, setSelectedCassette] = useState(null);
  const [selectedDerailleur, setSelectedDerailleur] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState('crankset');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Get top 10 most common components for each category
  const getTopComponents = (components, count = 10) => {
    // Prioritize Shimano 105, Ultegra, GRX and SRAM Force/Rival
    const priority = ['shimano-105', 'shimano-ultegra', 'shimano-grx', 'sram-force', 'sram-rival'];
    
    return components
      .filter(c => priority.some(p => c.id.includes(p)))
      .slice(0, count);
  };

  const topCranksets = getTopComponents(componentDatabaseV2.cranksets);
  const topCassettes = getTopComponents(componentDatabaseV2.cassettes);
  const topDerailleurs = getTopComponents(componentDatabaseV2.rearDerailleurs);

  // Simple compatibility check
  const checkCompatibility = () => {
    if (!selectedCrankset || !selectedCassette || !selectedDerailleur) return null;
    
    const crankBrand = selectedCrankset.model.includes('Shimano') ? 'shimano' : 'sram';
    const cassetteBrand = selectedCassette.model.includes('Shimano') ? 'shimano' : 'sram';
    const rdBrand = selectedDerailleur.model.includes('Shimano') ? 'shimano' : 'sram';
    
    const brands = new Set([crankBrand, cassetteBrand, rdBrand]);
    
    // Check speeds compatibility
    const crankSpeed = parseInt(selectedCrankset.speeds) || 11;
    const cassetteSpeed = parseInt(selectedCassette.speeds) || 11;
    const rdSpeed = parseInt(selectedDerailleur.speeds) || 11;
    
    if (cassetteSpeed !== rdSpeed) {
      return { 
        status: 'error', 
        message: 'Speed mismatch - cassette and derailleur must match',
        time: 'N/A'
      };
    }
    
    if (brands.size === 1) {
      return { 
        status: 'compatible', 
        message: 'Perfect match - same brand ecosystem',
        time: '45 min'
      };
    } else {
      return { 
        status: 'warning', 
        message: 'Mixed brands - works but may need adjustment',
        time: '60 min'
      };
    }
  };

  const compatibility = checkCompatibility();
  const totalWeight = (selectedCrankset?.weight || 0) + (selectedCassette?.weight || 0) + (selectedDerailleur?.weight || 0);
  const laborTime = compatibility?.time || 'N/A';

  const generateBuildSheet = async () => {
    if (!selectedCrankset || !selectedCassette || !selectedDerailleur) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const buildData = {
        customer: { name: customerName || 'Customer' },
        shop: { 
          name: 'Your Bike Shop',
          address: '123 Main St, Your City',
          phone: '(555) 123-4567',
          email: 'info@yourshop.com'
        },
        components: {
          crankset: selectedCrankset,
          cassette: selectedCassette,
          derailleur: selectedDerailleur
        },
        buildData: {
          totalWeight,
          laborTime,
          compatibility: compatibility?.message,
          partsList: [
            {
              name: selectedCrankset.model,
              partNumber: selectedCrankset.id.toUpperCase(),
              quantity: '1x',
              weight: `${selectedCrankset.weight}g`,
              notes: selectedCrankset.variant
            },
            {
              name: selectedCassette.model,
              partNumber: selectedCassette.id.toUpperCase(),
              quantity: '1x', 
              weight: `${selectedCassette.weight}g`,
              notes: selectedCassette.variant
            },
            {
              name: selectedDerailleur.model,
              partNumber: selectedDerailleur.id.toUpperCase(),
              quantity: '1x',
              weight: `${selectedDerailleur.weight}g`, 
              notes: selectedDerailleur.variant
            }
          ],
          warnings: compatibility?.status === 'error' ? [compatibility.message] : []
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `build-sheet-${customerName || 'customer'}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate build sheet');
    }
    
    setIsGeneratingPDF(false);
  };

  const ComponentSelector = ({ components, selected, onSelect, type }) => (
    <div className="space-y-2">
      {components.map(component => (
        <div
          key={component.id}
          onClick={() => onSelect(component)}
          className={`p-3 border rounded-lg cursor-pointer transition-all ${
            selected?.id === component.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-sm">{component.model}</div>
          <div className="text-xs text-gray-500">{component.variant}</div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm font-semibold">{component.weight}g</span>
            <span className="text-xs text-gray-400">{component.speeds}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">CrankSmith Pro</h1>
          <div className="text-xs bg-blue-700 px-2 py-1 rounded">BETA</div>
        </div>
        <p className="text-blue-100 text-sm mt-1">Fast drivetrain compatibility</p>
      </div>

      {/* Customer Input */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Component Tabs */}
      <div className="flex border-b">
        {[
          { key: 'crankset', label: 'Crankset', selected: selectedCrankset },
          { key: 'cassette', label: 'Cassette', selected: selectedCassette },
          { key: 'derailleur', label: 'Derailleur', selected: selectedDerailleur }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 p-3 text-sm font-medium relative ${
              activeTab === tab.key 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            {tab.label}
            {tab.selected && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Component Selection */}
      <div className="p-4 h-96 overflow-y-auto">
        {activeTab === 'crankset' && (
          <ComponentSelector
            components={topCranksets}
            selected={selectedCrankset}
            onSelect={setSelectedCrankset}
            type="crankset"
          />
        )}
        {activeTab === 'cassette' && (
          <ComponentSelector
            components={topCassettes}
            selected={selectedCassette}
            onSelect={setSelectedCassette}
            type="cassette"
          />
        )}
        {activeTab === 'derailleur' && (
          <ComponentSelector
            components={topDerailleurs}
            selected={selectedDerailleur}
            onSelect={setSelectedDerailleur}
            type="derailleur"
          />
        )}
      </div>

      {/* Compatibility Status */}
      {compatibility && (
        <div className="mx-4 mb-4">
          <div className={`p-4 rounded-lg border-l-4 ${
            compatibility.status === 'compatible' 
              ? 'bg-green-50 border-green-500' 
              : compatibility.status === 'warning'
              ? 'bg-yellow-50 border-yellow-500'
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                compatibility.status === 'compatible' ? 'bg-green-500' :
                compatibility.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-sm">{compatibility.message}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 ml-6">
              Installation time: {compatibility.time}
            </div>
          </div>
        </div>
      )}

      {/* Build Summary */}
      {selectedCrankset && selectedCassette && selectedDerailleur && (
        <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm mb-3">Build Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Weight:</span>
              <div className="font-medium">{totalWeight}g</div>
            </div>
            <div>
              <span className="text-gray-500">Install Time:</span>
              <div className="font-medium">{laborTime}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {compatibility && (
        <div className="p-4 space-y-3">
          <button 
            onClick={generateBuildSheet}
            disabled={isGeneratingPDF}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-medium disabled:opacity-50"
          >
            {isGeneratingPDF ? 'Generating...' : '📄 Generate Build Sheet'}
          </button>
          
          <div className="text-center">
            <div className="text-xs text-gray-500">
              Compatibility checked in <span className="font-medium text-green-600">2 seconds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}