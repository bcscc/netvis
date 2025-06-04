import { ConnectionTypes } from '../algorithms/ConnectionTypes.js';

/**
 * Centralized default configuration for the network visualization
 */
export const NetworkDefaults = {
  // Network generation defaults
  network: {
    connectionType: ConnectionTypes.EDUCATION,
    threshold: 0.1,
    maxNodes: 75,
    includeIsolated: false,
    topN: 8
  },

  // Physics simulation defaults
  physics: {
    chargeStrength: -80,
    linkStrength: 0.6,
    linkDistance: 50,
    collisionRadius: 1,
    velocityDecay: 0.9,
    alphaDecay: 0.03,
    centeringStrength: 0.1
  },

  // UI control defaults
  ui: {
    showLabels: true,
    enablePhysics: true
  },

  // Range limits for controls
  ranges: {
    threshold: { min: 0.1, max: 1.0, step: 0.1 },
    maxNodes: { min: 10, max: 100, step: 10 },
    topN: { min: 6, max: 20, step: 1 },
    physics: {
      chargeStrength: { min: -300, max: -50, step: 10 },
      linkStrength: { min: 0.1, max: 1.0, step: 0.05 },
      linkDistance: { min: 30, max: 150, step: 5 },
      velocityDecay: { min: 0.7, max: 0.95, step: 0.01 }
    }
  },

  // Physics presets
  physicsPresets: {
    tight: {
      chargeStrength: -80,
      linkStrength: 0.6,
      linkDistance: 50,
      collisionRadius: 1,
      velocityDecay: 0.9,
      alphaDecay: 0.03,
      centeringStrength: 0.1
    },
    spread: {
      chargeStrength: -200,
      linkStrength: 0.2,
      linkDistance: 120,
      collisionRadius: 1.5,
      velocityDecay: 0.85,
      alphaDecay: 0.02,
      centeringStrength: 0.02
    },
    floaty: {
      chargeStrength: -100,
      linkStrength: 0.1,
      linkDistance: 100,
      collisionRadius: 3.0,
      velocityDecay: 0.7,
      alphaDecay: 0.01,
      centeringStrength: 0.01
    }
  },

  // Color palette for groups
  colors: [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1'
  ],

  // Default gray color for "others" category
  otherColor: '#9CA3AF',

  // Node size configuration
  nodeSize: {
    baseSize: 8,
    connectionMultiplier: 4,
    minSize: 6,
    maxSize: 30
  }
};

export default NetworkDefaults; 