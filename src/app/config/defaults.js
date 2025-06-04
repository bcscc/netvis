import { ConnectionTypes } from '../algorithms/ConnectionTypes.js';

/**
 * Centralized default configuration for the network visualization
 */
export const NetworkDefaults = {
  // Network generation defaults
  network: {
    connectionType: ConnectionTypes.EDUCATION,
    maxNodes: 75,
    includeIsolated: false,
    topN: 8
  },

  // Physics simulation defaults
  physics: {
    chargeStrength: -180,
    linkStrength: 0.7,
    linkDistance: 40,
    collisionRadius: 1,
    velocityDecay: 0.75,
    alphaDecay: 0.03,
    centeringStrength: 0.01
  },

  // UI control defaults
  ui: {
    showLabels: true,
    enablePhysics: true
  },

  // Range limits for controls
  ranges: {
    maxNodes: { min: 10, max: 100, step: 10 },
    topN: { min: 6, max: 15, step: 1 },
    physics: {
      chargeStrength: { min: -300, max: -50, step: 10 },
      linkStrength: { min: 0.1, max: 1.0, step: 0.05 },
      linkDistance: { min: 30, max: 150, step: 5 },
      velocityDecay: { min: 0.7, max: 0.95, step: 0.01 }
    }
  },

  // Physics presets
  physicsPresets: {
    spread: {
      chargeStrength: -180,
      linkStrength: 0.7,
      linkDistance: 40,
      collisionRadius: 1,
      velocityDecay: 0.75,
      alphaDecay: 0.03,
      centeringStrength: 0.01
    },
    tight: {
      chargeStrength: -50,
      linkStrength: 0.5,
      linkDistance: 90,
      collisionRadius: 4,
      velocityDecay: 0.9,
      alphaDecay: 0.02,
      centeringStrength: 0.3
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

  // Color palette for groups - 15 distinct, well-differentiated colors
  colors: [
    '#800000', // Maroon
    '#9A6324', // Brown  
    '#469990', // Teal
    '#000075', // Navy
    '#e6194B', // Red
    '#f58231', // Orange
    '#ffe119', // Yellow
    '#3cb44b', // Green
    '#42d4f4', // Cyan
    '#4363d8', // Blue
    '#f032e6', // Magenta
    '#fabed4', // Pink
    '#fffac8', // Beige
    '#aaffc3', // Mint
    '#dcbeff'  // Lavender
  ],

  // Default gray color for "others" category
  otherColor: '#a9a9a9',

  // Node size configuration
  nodeSize: {
    baseSize: 8,
    connectionMultiplier: 4,
    minSize: 6,
    maxSize: 30
  }
};

export default NetworkDefaults; 