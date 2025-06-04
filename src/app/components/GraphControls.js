'use client';

import { useState, useEffect } from 'react';
import { ConnectionTypes, ConnectionConfig } from '../algorithms/ConnectionTypes';
import NetworkDefaults from '../config/defaults';

const GraphControls = ({ 
  onChange, 
  settings = {},
  isLoading = false,
  metadata = null 
}) => {
  const [localThreshold, setLocalThreshold] = useState(settings.threshold || NetworkDefaults.network.threshold);
  const [localMaxNodes, setLocalMaxNodes] = useState(settings.maxNodes || NetworkDefaults.network.maxNodes);
  const [showPhysicsControls, setShowPhysicsControls] = useState(false);

  // Physics parameters with defaults
  const [physicsParams, setPhysicsParams] = useState({
    ...NetworkDefaults.physics,
    ...settings.physicsParams
  });

  useEffect(() => {
    setLocalThreshold(settings.threshold || NetworkDefaults.network.threshold);
    setLocalMaxNodes(settings.maxNodes || NetworkDefaults.network.maxNodes);
    if (settings.physicsParams) {
      setPhysicsParams(prev => ({ ...prev, ...settings.physicsParams }));
    }
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    onChange(newSettings);
  };

  const handlePhysicsChange = (param, value) => {
    const newParams = { ...physicsParams, [param]: parseFloat(value) };
    setPhysicsParams(newParams);
    handleChange('physicsParams', newParams);
  };

  // Debounced handlers for numeric inputs
  const handleThresholdChange = (value) => {
    setLocalThreshold(value);
  };

  const handleMaxNodesChange = (value) => {
    setLocalMaxNodes(value);
  };

  // Apply changes when user finishes editing
  const applyThresholdChange = () => {
    const value = parseFloat(localThreshold);
    const { min, max } = NetworkDefaults.ranges.threshold;
    if (!isNaN(value) && value >= min && value <= max) {
      handleChange('threshold', value);
    } else {
      setLocalThreshold(NetworkDefaults.network.threshold);
    }
  };

  const applyMaxNodesChange = () => {
    const value = parseInt(localMaxNodes);
    const { min, max } = NetworkDefaults.ranges.maxNodes;
    if (!isNaN(value) && value >= min && value <= max) {
      handleChange('maxNodes', value);
    } else {
      setLocalMaxNodes(NetworkDefaults.network.maxNodes);
    }
  };

  const resetPhysicsToDefault = () => {
    const defaultParams = NetworkDefaults.physics;
    setPhysicsParams(defaultParams);
    handleChange('physicsParams', defaultParams);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      {/* Main Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Connection Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Connection Type
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
            {Object.entries(ConnectionConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => handleChange('connectionType', type)}
                className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                  settings.connectionType === type
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isLoading}
                title={config.description}
              >
                <div className="flex items-center justify-center lg:justify-start space-x-1">
                  <span>{config.icon}</span>
                  <span className="hidden lg:inline">{config.name.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Node Grouping & Settings */}
        <div className="space-y-1">
          {/* Threshold, Max Nodes, and Top Groups in compact grid */}
            <div className="space-y-1">
                <label className="text-xs text-gray-600">Strength</label>
                <input
                type="range"
                min={NetworkDefaults.ranges.threshold.min}
                max={NetworkDefaults.ranges.threshold.max}
                step={NetworkDefaults.ranges.threshold.step}
                value={localThreshold}
                onChange={(e) => handleThresholdChange(e.target.value)}
                onMouseUp={() => applyThresholdChange()}
                onTouchEnd={() => applyThresholdChange()}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
                />
                <div className="text-xs text-gray-500 text-center">{localThreshold}</div>
            </div>
            
            <div className="space-y-1">
                <label className="text-xs text-gray-600">Max Nodes</label>
                <input
                type="range"
                min={NetworkDefaults.ranges.maxNodes.min}
                max={NetworkDefaults.ranges.maxNodes.max}
                step={NetworkDefaults.ranges.maxNodes.step}
                value={localMaxNodes}
                onChange={(e) => handleMaxNodesChange(e.target.value)}
                onMouseUp={() => applyMaxNodesChange()}
                onTouchEnd={() => applyMaxNodesChange()}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
                />
                <div className="text-xs text-gray-500 text-center">{localMaxNodes}</div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-gray-600">Top Groups</label>
                <input
                type="range"
                min={NetworkDefaults.ranges.topN.min}
                max={NetworkDefaults.ranges.topN.max}
                step={NetworkDefaults.ranges.topN.step}
                value={settings.topN || NetworkDefaults.network.topN}
                onChange={(e) => handleChange('topN', parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
                title="Number of top groups to show with distinct colors"
                />
                <div className="text-xs text-gray-500 text-center">{settings.topN || NetworkDefaults.network.topN}</div>
            </div>
          
        </div>

        {/* Display Options */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Display
          </label>
          <div className="space-y-1.5">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={settings.includeIsolated || false}
                onChange={(e) => handleChange('includeIsolated', e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-xs text-gray-700">Isolated nodes</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={settings.showLabels !== false}
                onChange={(e) => handleChange('showLabels', e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-xs text-gray-700">Node labels</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={settings.enablePhysics !== false}
                onChange={(e) => handleChange('enablePhysics', e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-xs text-gray-700">Physics sim</span>
            </label>
          </div>
        </div>

        {/* Physics Controls */}
        {settings.enablePhysics !== false ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Physics Controls
              </label>
              <button
                onClick={resetPhysicsToDefault}
                className="text-xs text-gray-500 hover:text-gray-700"
                disabled={isLoading}
                title="Reset to defaults"
              >
                ↺
              </button>
            </div>
            
            <div className="space-y-2">
              {/* Force Controls */}
              <div className="grid grid-cols-2 gap-1">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Repulsion</label>
                  <input
                    type="range"
                    min={NetworkDefaults.ranges.physics.chargeStrength.min}
                    max={NetworkDefaults.ranges.physics.chargeStrength.max}
                    step={NetworkDefaults.ranges.physics.chargeStrength.step}
                    value={physicsParams.chargeStrength}
                    onChange={(e) => handlePhysicsChange('chargeStrength', e.target.value)}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    title="Node repulsion strength"
                  />
                  <div className="text-xs text-gray-500 text-center">{physicsParams.chargeStrength}</div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Link Force</label>
                  <input
                    type="range"
                    min={NetworkDefaults.ranges.physics.linkStrength.min}
                    max={NetworkDefaults.ranges.physics.linkStrength.max}
                    step={NetworkDefaults.ranges.physics.linkStrength.step}
                    value={physicsParams.linkStrength}
                    onChange={(e) => handlePhysicsChange('linkStrength', e.target.value)}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    title="Connection strength"
                  />
                  <div className="text-xs text-gray-500 text-center">{physicsParams.linkStrength}</div>
                </div>
              </div>

              {/* Distance & Damping */}
              <div className="grid grid-cols-2 gap-1">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Distance</label>
                  <input
                    type="range"
                    min={NetworkDefaults.ranges.physics.linkDistance.min}
                    max={NetworkDefaults.ranges.physics.linkDistance.max}
                    step={NetworkDefaults.ranges.physics.linkDistance.step}
                    value={physicsParams.linkDistance}
                    onChange={(e) => handlePhysicsChange('linkDistance', e.target.value)}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    title="Preferred link distance"
                  />
                  <div className="text-xs text-gray-500 text-center">{physicsParams.linkDistance}</div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Damping</label>
                  <input
                    type="range"
                    min={NetworkDefaults.ranges.physics.velocityDecay.min}
                    max={NetworkDefaults.ranges.physics.velocityDecay.max}
                    step={NetworkDefaults.ranges.physics.velocityDecay.step}
                    value={physicsParams.velocityDecay}
                    onChange={(e) => handlePhysicsChange('velocityDecay', e.target.value)}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    title="Movement damping (higher = more stable)"
                  />
                  <div className="text-xs text-gray-500 text-center">{physicsParams.velocityDecay}</div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  onClick={() => {
                    const tightParams = NetworkDefaults.physicsPresets.tight;
                    setPhysicsParams(tightParams);
                    handleChange('physicsParams', tightParams);
                  }}
                  className="px-1 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  disabled={isLoading}
                  title="Tight clustering"
                >
                  Tight
                </button>
                <button
                  onClick={() => {
                    const spreadParams = NetworkDefaults.physicsPresets.spread;
                    setPhysicsParams(spreadParams);
                    handleChange('physicsParams', spreadParams);
                  }}
                  className="px-1 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  disabled={isLoading}
                  title="Spread out layout"
                >
                  Spread
                </button>
                <button
                  onClick={() => {
                    const floatyParams = NetworkDefaults.physicsPresets.floaty;
                    setPhysicsParams(floatyParams);
                    handleChange('physicsParams', floatyParams);
                  }}
                  className="px-1 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                  disabled={isLoading}
                  title="Organic movement"
                >
                  Floaty
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Network Status
            </label>
            <div className="space-y-1 text-xs">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 animate-spin rounded-full border border-blue-500 border-t-transparent"></div>
                  <span className="text-gray-600">Generating...</span>
                </div>
              ) : metadata ? (
                <>
                  <div className="text-gray-700">
                    <span className="font-medium">{metadata.totalPeople}</span> nodes
                  </div>
                  <div className="text-gray-700">
                    <span className="font-medium">{metadata.totalConnections}</span> links
                  </div>
                  <div className="text-gray-500">
                    {metadata.averageConnections?.toFixed(1)} avg connections
                  </div>
                </>
              ) : (
                <div className="text-gray-500">Ready to generate</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Help Text */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>
            💡 {ConnectionConfig[settings.connectionType || ConnectionTypes.COMPANY]?.description}
          </span>
          {metadata && !isLoading && (
            <span>
              {metadata.totalPeople} nodes • {metadata.totalConnections} links • {((metadata.totalConnections / metadata.totalPeople) * 100).toFixed(0)}% connectivity
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphControls; 