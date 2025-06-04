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
    topN: 12
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

  // Color palette for groups - 15 distinct, well-differentiated colors
  colors: [
    '#EF4444', // Red
    '#F97316', // Orange  
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#EC4899'  // Pink
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