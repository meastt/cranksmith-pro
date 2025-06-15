// components/ComponentSelector.js
import { useState, useMemo } from 'react';

export default function ComponentSelector({ 
  components, 
  selectedComponent, 
  onSelect, 
  type // 'crankset', 'cassette', or 'derailleur'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterSpeeds, setFilterSpeeds] = useState('all');
  const [filterBikeType, setFilterBikeType] = useState('all');
  const [showAll, setShowAll] = useState(false);

  // Extract unique brands and speeds for filters
  const brands = useMemo(() => {
    const brandSet = new Set(components.map(c => c.model.split(' ')[0]));
    return ['all', ...Array.from(brandSet).sort()];
  }, [components]);

  const speeds = useMemo(() => {
    const speedSet = new Set(components.map(c => c.speeds));
    return ['all', ...Array.from(speedSet).sort()];
  }, [components]);

  const bikeTypes = useMemo(() => {
    const typeSet = new Set(components.map(c => c.bikeType));
    return ['all', ...Array.from(typeSet).sort()];
  }, [components]);

  // Filter components based on search and filters
  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          component.model.toLowerCase().includes(search) ||
          component.variant.toLowerCase().includes(search) ||
          component.id.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Brand filter
      if (filterBrand !== 'all') {
        const componentBrand = component.model.split(' ')[0];
        if (componentBrand !== filterBrand) return false;
      }

      // Speeds filter
      if (filterSpeeds !== 'all' && component.speeds !== filterSpeeds) {
        return false;
      }

      // Bike type filter
      if (filterBikeType !== 'all' && component.bikeType !== filterBikeType) {
        return false;
      }

      return true;
    });
  }, [components, searchTerm, filterBrand, filterSpeeds, filterBikeType]);

  // Limit display unless "show all" is clicked
  const displayedComponents = showAll ? filteredComponents : filteredComponents.slice(0, 15);
  const hasMore = filteredComponents.length > displayedComponents.length;

  // Get title based on type
  const getTitle = () => {
    switch(type) {
      case 'crankset': return 'Cranksets';
      case 'cassette': return 'Cassettes';
      case 'derailleur': return 'Rear Derailleurs';
      default: return 'Components';
    }
  };

  return (
    <div className="border-b border-border">
      <div className="p-3 bg-gray-50 text-xs font-bold uppercase">
        {getTitle()} ({filteredComponents.length})
      </div>
      
      {/* Search and Filters */}
      <div className="p-2 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:border-accent"
        />
        
        <div className="grid grid-cols-3 gap-1">
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-1 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-accent"
          >
            {brands.map(brand => (
              <option key={brand} value={brand}>
                {brand === 'all' ? 'All Brands' : brand}
              </option>
            ))}
          </select>
          
          <select
            value={filterSpeeds}
            onChange={(e) => setFilterSpeeds(e.target.value)}
            className="px-1 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-accent"
          >
            {speeds.map(speed => (
              <option key={speed} value={speed}>
                {speed === 'all' ? 'All Speeds' : speed}
              </option>
            ))}
          </select>
          
          <select
            value={filterBikeType}
            onChange={(e) => setFilterBikeType(e.target.value)}
            className="px-1 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-accent"
          >
            {bikeTypes.map(bikeType => (
              <option key={bikeType} value={bikeType}>
                {bikeType === 'all' ? 'All Types' : bikeType.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Component List */}
      <div className="max-h-64 overflow-y-auto">
        {displayedComponents.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-secondary">
            No components match your filters
          </div>
        ) : (
          displayedComponents.map(component => (
            <div 
              key={component.id}
              className={`p-2 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                selectedComponent?.id === component.id ? 'bg-accent text-white' : ''
              }`}
              onClick={() => onSelect(component)}
            >
              <div className="font-semibold">{component.model}</div>
              <div className={`${selectedComponent?.id === component.id ? 'text-white opacity-90' : 'text-text-secondary'}`}>
                {component.variant} • {component.weight}g
                {type === 'derailleur' && ` • Max ${component.maxCog}T`}
              </div>
            </div>
          ))
        )}
        
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full p-2 text-xs text-accent hover:bg-gray-50"
          >
            {showAll ? '▲ Show Less' : `▼ Show All (${filteredComponents.length - displayedComponents.length} more)`}
          </button>
        )}
      </div>
    </div>
  );
}