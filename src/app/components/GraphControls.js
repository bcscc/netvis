'use client';

import { useState, useEffect } from 'react';
import { ConnectionTypes, ConnectionConfig, NodeGroupings, GroupingConfig } from '../algorithms/ConnectionTypes';

const GraphControls = ({ 
  onChange, 
  settings = {},
  isLoading = false,
  metadata = null 
}) => {
  const [localThreshold, setLocalThreshold] = useState(settings.threshold || 0.1);
  const [localMaxNodes, setLocalMaxNodes] = useState(settings.maxNodes || 100);
  const [showPhysicsControls, setShowPhysicsControls] = useState(false);

  // Physics parameters with defaults
  const [physicsParams, setPhysicsParams] = useState({
    chargeStrength: settings.physicsParams?.chargeStrength || -120,
    linkStrength: settings.physicsParams?.linkStrength || 0.3,
    linkDistance: settings.physicsParams?.linkDistance || 80,
    collisionRadius: settings.physicsParams?.collisionRadius || 1.2,
    velocityDecay: settings.physicsParams?.velocityDecay || 0.9,
    alphaDecay: settings.physicsParams?.alphaDecay || 0.03,
    centeringStrength: settings.physicsParams?.centeringStrength || 0.05
  });

  useEffect(() => {
    setLocalThreshold(settings.threshold || 0.1);
    setLocalMaxNodes(settings.maxNodes || 100);
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
    if (!isNaN(value) && value >= 0.1 && value <= 1.0) {
      handleChange('threshold', value);
    } else {
      setLocalThreshold(settings.threshold || 0.1);
    }
  };

  const applyMaxNodesChange = () => {
    const value = parseInt(localMaxNodes);
    if (!isNaN(value) && value >= 10 && value <= 100) {
      handleChange('maxNodes', value);
    } else {
      setLocalMaxNodes(settings.maxNodes || 100);
    }
  };

  const resetPhysicsToDefault = () => {
    const defaultParams = {
      chargeStrength: -120,
      linkStrength: 0.3,
      linkDistance: 80,
      collisionRadius: 1.2,
      velocityDecay: 0.9,
      alphaDecay: 0.03,
      centeringStrength: 0.05
    };
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
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Group By
            </label>
            <select
              value={settings.nodeGrouping || NodeGroupings.CURRENT_COMPANY}
              onChange={(e) => handleChange('nodeGrouping', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {Object.entries(GroupingConfig).map(([grouping, config]) => (
                <option key={grouping} value={grouping}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold & Max Nodes in compact row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Strength</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
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
                min="10"
                max="100"
                step="10"
                value={localMaxNodes}
                onChange={(e) => handleMaxNodesChange(e.target.value)}
                onMouseUp={() => applyMaxNodesChange()}
                onTouchEnd={() => applyMaxNodesChange()}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500 text-center">{localMaxNodes}</div>
            </div>
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
          <div className="space-y-2">
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
                    min="-300"
                    max="-50"
                    step="10"
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
                    min="0.1"
                    max="1.0"
                    step="0.05"
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
                    min="30"
                    max="150"
                    step="5"
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
                    min="0.7"
                    max="0.95"
                    step="0.01"
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
                    const tightParams = {
                      chargeStrength: -80,
                      linkStrength: 0.6,
                      linkDistance: 50,
                      collisionRadius: 1.1,
                      velocityDecay: 0.9,
                      alphaDecay: 0.03,
                      centeringStrength: 0.1
                    };
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
                    const spreadParams = {
                      chargeStrength: -200,
                      linkStrength: 0.2,
                      linkDistance: 120,
                      collisionRadius: 1.5,
                      velocityDecay: 0.85,
                      alphaDecay: 0.02,
                      centeringStrength: 0.02
                    };
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
                    const floatyParams = {
                      chargeStrength: -100,
                      linkStrength: 0.1,
                      linkDistance: 100,
                      collisionRadius: 2.0,
                      velocityDecay: 0.7,
                      alphaDecay: 0.01,
                      centeringStrength: 0.01
                    };
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