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
    name: 'Education',
    description: 'Connect people who attended the same schools',
    icon: '🎓'
  },
  [ConnectionTypes.COMPANY]: {
    name: 'Company',
    description: 'Connect people who worked at the same companies',
    icon: '🏢'
  },
  [ConnectionTypes.LOCATION]: {
    name: 'Location',
    description: 'Connect people from the same cities/regions',
    icon: '📍'
  },
  [ConnectionTypes.SKILLS]: {
    name: 'Skills',
    description: 'Connect people with similar skill sets',
    icon: '💼'
  },
};