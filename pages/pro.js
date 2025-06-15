// pages/pro.js - Enhanced mobile-first bike shop tool
import { useState, useEffect } from 'react';
import { componentDatabaseV2 } from '../lib/components';

export default function ProPage() {
  const [selectedCrankset, setSelectedCrankset] = useState(null);
  const [selectedCassette, setSelectedCassette] = useState(null);
  const [selectedDerailleur, setSelectedDerailleur] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState('crankset');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bikeType, setBikeType] = useState('road'); // road, gravel, mtb

  // Filter components by bike type and search
  const getFilteredComponents = (components, type) => {
    let filtered = components.filter(c => {
      // Allow cross-compatibility for gravel
      const compatibleTypes = bikeType === 'gravel' 
        ? ['gravel', 'road', 'mtb'] 
        : [bikeType];
      
      return compatibleTypes.includes(c.bikeType);
    });

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.variant.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Prioritize popular/common components
    const priority = {
      road: ['shimano-105', 'shimano-ultegra', 'shimano-dura-ace'],
      gravel: ['shimano-grx', 'sram-rival', 'sram-force'],
      mtb: ['shimano-xt', 'shimano-slx', 'sram-gx', 'sram-x01']
    };

    const currentPriority = priority[bikeType] || [];
    
    return filtered.sort((a, b) => {
      const aScore = currentPriority.findIndex(p => a.id.includes(p));
      const bScore = currentPriority.findIndex(p => b.id.includes(p));
      
      if (aScore !== -1 && bScore !== -1) return aScore - bScore;
      if (aScore !== -1) return -1;
      if (bScore !== -1) return 1;
      return 0;
    }).slice(0, 15); // Limit to 15 most relevant
  };

  const cranksets = getFilteredComponents(componentDatabaseV2.cranksets, 'crankset');
  const cassettes = getFilteredComponents(componentDatabaseV2.cassettes, 'cassette');
  const derailleurs = getFilteredComponents(componentDatabaseV2.rearDerailleurs, 'derailleur');

  // Enhanced compatibility check using the existing rules
  const checkCompatibility = () => {
    if (!selectedCrankset || !selectedCassette || !selectedDerailleur) return null;
    
    try {
      const result = componentDatabaseV2.compatibilityRules.validateDrivetrain(
        selectedCrankset, 
        selectedCassette, 
        selectedDerailleur
      );
      
      if (result.overallCompatibility === 'compatible') {
        return {
          status: 'compatible',
          message: 'Perfect compatibility ✓',
          time: result.setupDifficulty.estimatedTime,
          details: result
        };
      } else if (result.systemIssues.length > 0 && result.errors?.length === 0) {
        return {
          status: 'warning',
          message: 'Compatible with notes',
          time: result.setupDifficulty.estimatedTime,
          details: result
        };
      } else {
        return {
          status: 'error',
          message: result.errors?.[0] || 'Compatibility issue',
          time: 'N/A',
          details: result
        };
      }
    } catch (error) {
      console.error('Compatibility check failed:', error);
      return {
        status: 'error',
        message: 'Unable to check compatibility',
        time: 'N/A'
      };
    }
  };

  const compatibility = checkCompatibility();
  const totalWeight = (selectedCrankset?.weight || 0) + (selectedCassette?.weight || 0) + (selectedDerailleur?.weight || 0);

  // Auto-advance to next tab when component selected
  useEffect(() => {
    if (activeTab === 'crankset' && selectedCrankset && !selectedCassette) {
      setTimeout(() => setActiveTab('cassette'), 300);
    } else if (activeTab === 'cassette' && selectedCassette && !selectedDerailleur) {
      setTimeout(() => setActiveTab('derailleur'), 300);
    }
  }, [selectedCrankset, selectedCassette, selectedDerailleur, activeTab]);

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
          totalWeight: `${totalWeight}g`,
          laborTime: compatibility?.time || 'N/A',
          gearRange: `${Math.min(...selectedCassette.teeth)}-${Math.max(...selectedCassette.teeth)}T`,
          chainLength: compatibility?.details?.chainLength?.links || 114,
          compatibility: compatibility?.message,
          partsList: [
            {
              name: selectedCrankset.model,
              partNumber: selectedCrankset.id.toUpperCase().replace(/-/g, ''),
              quantity: '1x',
              weight: `${selectedCrankset.weight}g`,
              notes: selectedCrankset.variant
            },
            {
              name: selectedCassette.model,
              partNumber: selectedCassette.id.toUpperCase().replace(/-/g, ''),
              quantity: '1x', 
              weight: `${selectedCassette.weight}g`,
              notes: selectedCassette.variant
            },
            {
              name: selectedDerailleur.model,
              partNumber: selectedDerailleur.id.toUpperCase().replace(/-/g, ''),
              quantity: '1x',
              weight: `${selectedDerailleur.weight}g`, 
              notes: selectedDerailleur.variant
            },
            {
              name: 'Chain',
              partNumber: `CHAIN-${selectedCassette.speeds.split('-')[0]}SP`,
              quantity: '1x',
              weight: '250g',
              notes: `${compatibility?.details?.chainLength?.links || 114} links`
            }
          ],
          installationSteps: [
            { title: 'Remove old drivetrain', description: 'Clean and inspect frame threads' },
            { title: 'Install bottom bracket', description: 'Torque to spec: 35-50 Nm' },
            { title: 'Mount crankset', description: `Torque: ${selectedCrankset.model.includes('Shimano') ? '12-15 Nm' : '40-50 Nm'}` },
            { title: 'Install cassette', description: 'Torque lockring: 40 Nm' },
            { title: 'Mount derailleur', description: 'Set B-tension and limits' },
            { title: 'Install chain', description: `Size to ${compatibility?.details?.chainLength?.links || 114} links` },
            { title: 'Cable/setup', description: selectedDerailleur.isElectronic ? 'Pair Di2 components' : 'Install cables and housing' },
            { title: 'Final adjustment', description: 'Index gears and test all combinations' }
          ],
          warnings: compatibility?.status === 'error' ? [compatibility.message] : 
                   compatibility?.details?.systemIssues || []
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
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate build sheet. Please try again.');
    }
    
    setIsGeneratingPDF(false);
  };

  const resetSelection = () => {
    setSelectedCrankset(null);
    setSelectedCassette(null);
    setSelectedDerailleur(null);
    setActiveTab('crankset');
    setSearchTerm('');
  };

  const ComponentCard = ({ component, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-3 border rounded-lg cursor-pointer transition-all touch-manipulation ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium text-sm">{component.model}</div>
          <div className="text-xs text-gray-500 mt-1">{component.variant}</div>
          <div className="flex gap-2 items-center mt-2">
            <span className="text-sm font-semibold text-blue-600">{component.weight}g</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{component.speeds}</span>
            {component.isElectronic && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Di2</span>
            )}
            {component.isWireless && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Wireless</span>
            )}
          </div>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center ml-2">
            ✓
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">CrankSmith Pro</h1>
          <button 
            onClick={resetSelection}
            className="text-xs bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded transition-colors"
          >
            Reset
          </button>
        </div>
        <p className="text-blue-100 text-sm mt-1">Fast drivetrain compatibility</p>
      </div>

      {/* Bike Type Selector */}
      <div className="p-4 border-b bg-gray-50">
        <div className="text-xs font-medium text-gray-600 mb-2">BIKE TYPE</div>
        <div className="flex gap-2">
          {['road', 'gravel', 'mtb'].map(type => (
            <button
              key={type}
              onClick={() => {
                setBikeType(type);
                resetSelection();
              }}
              className={`px-4 py-2 text-sm rounded-full transition-colors ${
                bikeType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
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
      <div className="flex border-b sticky top-[88px] bg-white z-10">
        {[
          { key: 'crankset', label: 'Crankset', selected: selectedCrankset, count: cranksets.length },
          { key: 'cassette', label: 'Cassette', selected: selectedCassette, count: cassettes.length },
          { key: 'derailleur', label: 'Derailleur', selected: selectedDerailleur, count: derailleurs.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 p-3 text-sm font-medium relative transition-colors ${
              activeTab === tab.key 
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-xs text-gray-400">{tab.count}</div>
            {tab.selected && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder={`Search ${activeTab}s...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Component Selection */}
      <div className="p-4 pb-32 space-y-3 max-h-96 overflow-y-auto">
        {activeTab === 'crankset' && cranksets.map(component => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={selectedCrankset?.id === component.id}
            onClick={() => setSelectedCrankset(component)}
          />
        ))}
        {activeTab === 'cassette' && cassettes.map(component => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={selectedCassette?.id === component.id}
            onClick={() => setSelectedCassette(component)}
          />
        ))}
        {activeTab === 'derailleur' && derailleurs.map(component => (
          <ComponentCard
            key={component.id}
            component={component}
            isSelected={selectedDerailleur?.id === component.id}
            onClick={() => setSelectedDerailleur(component)}
          />
        ))}
      </div>

      {/* Fixed Bottom Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-md mx-auto">
        {/* Compatibility Status */}
        {compatibility && (
          <div className="p-4">
            <div className={`p-3 rounded-lg border-l-4 ${
              compatibility.status === 'compatible' 
                ? 'bg-green-50 border-green-500' 
                : compatibility.status === 'warning'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    compatibility.status === 'compatible' ? 'bg-green-500' :
                    compatibility.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium text-sm">{compatibility.message}</span>
                </div>
                <span className="text-xs font-medium">{compatibility.time}</span>
              </div>
              {totalWeight > 0 && (
                <div className="text-xs text-gray-600 mt-1 ml-6">
                  Total weight: {totalWeight}g
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {compatibility && (
          <div className="p-4 pt-0">
            <button 
              onClick={generateBuildSheet}
              disabled={isGeneratingPDF || compatibility.status === 'error'}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-blue-700"
            >
              {isGeneratingPDF ? 'Generating PDF...' : '📄 Generate Build Sheet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}