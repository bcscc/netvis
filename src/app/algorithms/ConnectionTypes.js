/**
 * Connection types and configurations for network analysis
 */

export const ConnectionTypes = {
  EDUCATION: 'education',
  COMPANY: 'company',
  LOCATION: 'location', 
  SKILLS: 'skills'
};

export const ConnectionConfig = {
  [ConnectionTypes.EDUCATION]: {
    name: 'Educational Background',
    description: 'Connect people who attended the same schools',
    color: '#8B5CF6', // Purple
    minStrength: 0.3,
    maxDistance: 120,
    icon: '🎓'
  },
  [ConnectionTypes.COMPANY]: {
    name: 'Shared Companies',
    description: 'Connect people who worked at the same companies',
    color: '#10B981', // Green
    minStrength: 0.4,
    maxDistance: 100,
    icon: '🏢'
  },
  [ConnectionTypes.LOCATION]: {
    name: 'Geographic Location',
    description: 'Connect people from the same cities/regions',
    color: '#F59E0B', // Yellow
    minStrength: 0.2,
    maxDistance: 150,
    icon: '📍'
  },
  [ConnectionTypes.SKILLS]: {
    name: 'Technical Skills',
    description: 'Connect people with similar skill sets',
    color: '#EF4444', // Red
    minStrength: 0.5,
    maxDistance: 80,
    icon: '💼'
  },
};

/**
 * Node grouping strategies for visual clustering
 */
export const NodeGroupings = {
  CURRENT_COMPANY: 'current_company',
  LOCATION: 'location',
  EDUCATION: 'education',
  NONE: 'none'
};

export const GroupingConfig = {
  [NodeGroupings.CURRENT_COMPANY]: {
    name: 'Current Company',
    description: 'Group nodes by current employer',
    colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
  },
  [NodeGroupings.LOCATION]: {
    name: 'Location',
    description: 'Group by geographic location',
    colors: ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669', '#0891B2']
  },
  [NodeGroupings.EDUCATION]: {
    name: 'Education',
    description: 'Group by education level',
    colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
  },
  [NodeGroupings.NONE]: {
    name: 'No Grouping',
    description: 'Use default coloring',
    colors: ['#6B7280']
  }
};

/**
 * Layout strategies for different visualization approaches
 */
export const LayoutStrategies = {
  FORCE_DIRECTED: 'force_directed',
  CIRCULAR: 'circular',
  CLUSTERED: 'clustered'
};

export const LayoutConfig = {
  [LayoutStrategies.FORCE_DIRECTED]: {
    name: 'Force-Directed',
    description: 'Natural clustering based on connections',
    forceStrength: -300,
    linkDistance: 100,
    centerForce: 0.1
  },
  [LayoutStrategies.CIRCULAR]: {
    name: 'Circular',
    description: 'Arrange nodes in circular patterns',
    forceStrength: -200,
    linkDistance: 80,
    centerForce: 0.2
  },
  [LayoutStrategies.CLUSTERED]: {
    name: 'Clustered',
    description: 'Group similar nodes together',
    forceStrength: -400,
    linkDistance: 60,
    centerForce: 0.3
  }
}; 