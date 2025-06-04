import { ConnectionTypes } from './ConnectionTypes.js';
import NetworkDefaults from '../config/defaults.js';

/**
 * Network Generator - Creates bipartite networks connecting people to groups
 * Groups can be schools, companies, locations, or skills
 */
class NetworkGenerator {
  constructor() {
    this.people = [];
  }

  /**
   * Set the people data to analyze
   */
  setPeople(people) {
    this.people = people;
  }

  /**
   * Generate bipartite network graph with specified parameters
   */
  generateNetwork(options = {}) {
    const {
      connectionType = NetworkDefaults.network.connectionType,
      maxNodes = NetworkDefaults.network.maxNodes,
      includeIsolated = NetworkDefaults.network.includeIsolated,
      topN = NetworkDefaults.network.topN
    } = options;

    console.log(`Generating bipartite network: ${connectionType}, topN: ${topN}`);

    // Cache the topN value for legend generation
    this.cachedTopN = topN;
    
    // Ensure we don't exceed our 15-color palette
    const effectiveTopN = Math.min(topN, NetworkDefaults.colors.length);
    console.log(`Using effectiveTopN: ${effectiveTopN} (requested: ${topN}, max colors: ${NetworkDefaults.colors.length})`);

    // Get subset of people to visualize
    const selectedPeople = this.selectPeople(maxNodes);
    
    // Generate color mappings for the connection type
    const groupColors = this.getGroupColors(selectedPeople, connectionType, effectiveTopN);
    
    // Get top groups for this connection type
    const topGroups = this.getTopGroupsForType(selectedPeople, connectionType, effectiveTopN);
    
    // Generate nodes - both people and group nodes
    const { peopleNodes, groupNodes } = this.generateBipartiteNodes(selectedPeople, groupColors, connectionType, effectiveTopN, topGroups);
    
    // Filter out isolated people nodes if requested (people with no top group connections)
    const finalPeopleNodes = includeIsolated ? 
      peopleNodes : 
      peopleNodes.filter(node => !node.isIsolated);
    
    const nodes = [...finalPeopleNodes, ...groupNodes];
    
    // Generate person-to-group links only for non-isolated people
    const links = this.generatePersonToGroupLinks(
      finalPeopleNodes.map(node => node.person), 
      connectionType, 
      topGroups, 
      groupColors
    );

    // Generate legend data
    const legendData = this.generateLegendData(selectedPeople, groupColors, connectionType);

    return {
      nodes,
      links,
      legendData,
      metadata: {
        connectionType,
        topN,
        effectiveTopN,
        totalPeople: finalPeopleNodes.length,
        totalGroups: topGroups.length,
        totalNodes: nodes.length,
        totalConnections: links.length,
        averageConnections: links.length / Math.max(1, finalPeopleNodes.length),
        isolatedPeople: peopleNodes.length - finalPeopleNodes.length,
        networkType: 'bipartite'
      }
    };
  }

  /**
   * Select people for visualization (can implement different strategies)
   */
  selectPeople(maxNodes) {
    if (this.people.length <= maxNodes) {
      return [...this.people];
    }

    // Strategy: Take most connected people based on their total associations
    const peopleWithConnections = this.people.map(person => ({
      person,
      connectionCount: this.estimateConnectionCount(person)
    }));

    peopleWithConnections.sort((a, b) => b.connectionCount - a.connectionCount);
    
    return peopleWithConnections
      .slice(0, maxNodes)
      .map(item => item.person);
  }

  /**
   * Estimate connection count for a person (for selection purposes)
   */
  estimateConnectionCount(person) {
    return person.companies.length + person.education.length + person.skills.length;
  }

  /**
   * Generate legend data for the current grouping
   */
  generateLegendData(people, groupColors, connectionType) {
    const groups = new Map();
    
    // Get the appropriate top items for this connection type
    const effectiveTopN = Math.min(this.cachedTopN || 12, NetworkDefaults.colors.length);
    const topGroups = this.getTopGroupsForType(people, connectionType, effectiveTopN);
    
    topGroups.forEach(group => {
      // Get the proper label for this group
      let label;
      if (connectionType === ConnectionTypes.EDUCATION) {
        const samplePerson = people.find(p => this.getPersonEducationSchools(p).includes(group.key));
        label = samplePerson ? (this.getSchoolNameById(samplePerson, group.key) || group.key) : group.key;
      } else {
        label = group.key;
      }
      
      groups.set(group.key, {
        key: group.key,
        label: label,
        color: groupColors.get(group.key) || NetworkDefaults.otherColor,
        count: group.count,
        type: 'group'
      });
    });

    // Sort by count (descending) then by label
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });

    return sortedGroups;
  }

  /**
   * Get all education school IDs for a person - consistent ID usage
   */
  getPersonEducationSchools(person) {
    return person.education?.map(edu => {
      // Prefer school ID, but fallback to normalized school name if no ID
      if (edu.schoolId) {
        return edu.schoolId;
      } else if (edu.school) {
        // Use normalized school name as fallback ID
        return `name_${edu.school.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      } else {
        return 'unknown';
      }
    }).filter(Boolean) || [];
  }

  /**
   * Get all company names for a person
   */
  getPersonCompanies(person) {
    return person.companies?.map(company => company.name || 'unknown').filter(Boolean) || [];
  }

  /**
   * Get all skills for a person
   */
  getPersonSkills(person) {
    return person.skills?.filter(Boolean) || [];
  }

  /**
   * Get top N most frequent schools across all people
   */
  getTopSchools(people, count = 12) {
    const schoolCounts = new Map();
    
    people.forEach(person => {
      this.getPersonEducationSchools(person).forEach(school => {
        if (school !== 'unknown') {
          schoolCounts.set(school, (schoolCounts.get(school) || 0) + 1);
        }
      });
    });
    
    // Sort by frequency and take top N
    return Array.from(schoolCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([school, count]) => ({ key: school, count }));
  }

  /**
   * Get top N most frequent companies across all people
   */
  getTopCompanies(people, count = 12) {
    const companyCounts = new Map();
    
    people.forEach(person => {
      this.getPersonCompanies(person).forEach(company => {
        if (company !== 'unknown') {
          companyCounts.set(company, (companyCounts.get(company) || 0) + 1);
        }
      });
    });
    
    return Array.from(companyCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([company, count]) => ({ key: company, count }));
  }

  /**
   * Get top N most frequent skills across all people
   */
  getTopSkills(people, count = 12) {
    const skillCounts = new Map();
    
    people.forEach(person => {
      this.getPersonSkills(person).forEach(skill => {
        if (skill && skill !== 'unknown') {
          skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        }
      });
    });
    
    return Array.from(skillCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([skill, count]) => ({ key: skill, count }));
  }

  /**
   * Get top N most frequent locations across all people
   */
  getTopLocations(people, count = 12) {
    const locationCounts = new Map();
    
    people.forEach(person => {
      const location = person.location?.city || 'Unknown';
      if (location !== 'Unknown') {
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
    });
    
    return Array.from(locationCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([location, count]) => ({ key: location, count }));
  }

  /**
   * Helper function to find the actual school name for a given school ID
   */
  getSchoolNameById(person, schoolId) {
    // Handle normalized name-based IDs
    if (schoolId.startsWith('name_')) {
      // Extract the original school name from our normalized ID
      const normalizedName = schoolId.replace('name_', '').replace(/_/g, ' ');
      const education = person.education?.find(edu => 
        edu.school && edu.school.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim() === normalizedName
      );
      return education?.school || null;
    }
    
    // Handle real school IDs
    const education = person.education?.find(edu => 
      (edu.schoolId === schoolId) || (edu.school === schoolId)
    );
    return education?.school || null;
  }

  /**
   * Get group colors for the connection type
   */
  getGroupColors(people, connectionType, topN) {
    // Use the unified 15-color palette for all connection types
    const colors = NetworkDefaults.colors;
    const colorMap = new Map();
    
    // Ensure topN doesn't exceed our color palette size
    const effectiveTopN = Math.min(topN, colors.length);
    
    // Get the actual top groups using the same logic as getTopGroupsForType
    const topGroups = this.getTopGroupsForType(people, connectionType, effectiveTopN);
    
    // Cache the top items for this connection type for consistent grouping
    if (connectionType === ConnectionTypes.SKILLS) {
      this.cachedTopSkills = topGroups;
    } else if (connectionType === ConnectionTypes.EDUCATION) {
      this.cachedTopSchools = topGroups;
    } else if (connectionType === ConnectionTypes.COMPANY) {
      this.cachedTopCompanies = topGroups;
    } else if (connectionType === ConnectionTypes.LOCATION) {
      this.cachedTopLocations = topGroups;
    }
    
    // Assign distinct colors to top groups (already sorted by frequency), gray to the rest
    topGroups.forEach((group, index) => {
      if (index < effectiveTopN) {
        // Top N get distinct colors from our 15-color palette
        colorMap.set(group.key, colors[index]);
        console.log(`Assigning color ${colors[index]} to group: ${group.key} (rank ${index + 1}, count: ${group.count})`);
      } else {
        // All others get gray
        colorMap.set(group.key, NetworkDefaults.otherColor);
      }
    });
    
    return colorMap;
  }

  /**
   * Get top groups for the specified connection type
   */
  getTopGroupsForType(people, connectionType, topN) {
    // Ensure topN doesn't exceed our color palette size
    const effectiveTopN = Math.min(topN, NetworkDefaults.colors.length);
    
    switch (connectionType) {
      case ConnectionTypes.EDUCATION:
        return this.getTopSchools(people, effectiveTopN);
      case ConnectionTypes.COMPANY:
        return this.getTopCompanies(people, effectiveTopN);
      case ConnectionTypes.SKILLS:
        return this.getTopSkills(people, effectiveTopN);
      case ConnectionTypes.LOCATION:
        return this.getTopLocations(people, effectiveTopN);
      default:
        return this.getTopSchools(people, effectiveTopN);
    }
  }

  /**
   * Generate bipartite nodes (people + groups)
   */
  generateBipartiteNodes(people, groupColors, connectionType, topN, topGroups) {
    // Ensure topN doesn't exceed our color palette size
    const effectiveTopN = Math.min(topN, NetworkDefaults.colors.length);
    const topGroupKeys = new Set(topGroups.map(g => g.key));
    
    // Generate people nodes with proper coloring based on group membership
    const peopleNodes = people.map(person => {
      // Get the person's items for this connection type
      let personItems;
      switch (connectionType) {
        case ConnectionTypes.EDUCATION:
          personItems = this.getPersonEducationSchools(person);
          break;
        case ConnectionTypes.COMPANY:
          personItems = this.getPersonCompanies(person);
          break;
        case ConnectionTypes.SKILLS:
          personItems = this.getPersonSkills(person);
          break;
        case ConnectionTypes.LOCATION:
          personItems = [person.location?.city || 'Unknown'];
          break;
        default:
          personItems = [];
      }

      // Find which top N groups this person belongs to
      const personTopGroups = personItems.filter(item => topGroupKeys.has(item));
      
      // Determine node color and multi-color information
      let nodeColor;
      let multiColors = null;
      
      if (personTopGroups.length === 0) {
        // No top N groups - use gray (this person will be isolated unless includeIsolated is true)
        nodeColor = NetworkDefaults.otherColor;
      } else if (personTopGroups.length === 1) {
        // Single top N group - use its color
        nodeColor = groupColors.get(personTopGroups[0]) || NetworkDefaults.otherColor;
      } else {
        // Multiple top N groups - create multi-colored node
        multiColors = personTopGroups.map(item => 
          groupColors.get(item) || NetworkDefaults.otherColor
        );
        nodeColor = multiColors[0]; // Primary color for fallback
      }

      return {
        id: person.id,
        label: person.firstName || person.name.split(' ')[0],
        fullName: person.name,
        size: NetworkDefaults.nodeSize.baseSize,
        color: nodeColor,
        multiColors: multiColors, // Array of colors for multi-colored rendering
        type: 'person',
        person: person,
        topGroups: personTopGroups, // Store which top groups this person belongs to
        isIsolated: personTopGroups.length === 0, // Mark if this person has no top group connections
        onClick: (node) => this.handleNodeClick(node)
      };
    });

    // Generate group nodes for top N groups
    const groupNodes = topGroups.map(group => {
      // Get appropriate label for this group
      let label;
      if (connectionType === ConnectionTypes.EDUCATION) {
        // For education, try to get the school name, fallback to the key
        const samplePerson = people.find(p => this.getPersonEducationSchools(p).includes(group.key));
        label = samplePerson ? (this.getSchoolNameById(samplePerson, group.key) || group.key) : group.key;
      } else {
        label = group.key;
      }

      return {
        id: `group_${group.key}`,
        label: label.length > 20 ? label.substring(0, 17) + '...' : label,
        fullName: label,
        size: Math.max(
          NetworkDefaults.nodeSize.baseSize * 1.5, 
          Math.min(NetworkDefaults.nodeSize.maxSize, NetworkDefaults.nodeSize.baseSize + Math.log(group.count + 1) * 3)
        ),
        color: groupColors.get(group.key) || NetworkDefaults.otherColor,
        type: 'group',
        groupKey: group.key,
        connectionType: connectionType,
        memberCount: group.count
      };
    });

    return { peopleNodes, groupNodes };
  }

  /**
   * Generate links between people and groups
   */
  generatePersonToGroupLinks(people, connectionType, topGroups, groupColors) {
    const links = [];
    const topGroupKeys = new Set(topGroups.map(g => g.key));

    people.forEach(person => {
      // Get the person's items for this connection type
      let personItems;
      switch (connectionType) {
        case ConnectionTypes.EDUCATION:
          personItems = this.getPersonEducationSchools(person);
          break;
        case ConnectionTypes.COMPANY:
          personItems = this.getPersonCompanies(person);
          break;
        case ConnectionTypes.SKILLS:
          personItems = this.getPersonSkills(person);
          break;
        case ConnectionTypes.LOCATION:
          personItems = [person.location?.city || 'Unknown'];
          break;
        default:
          personItems = [];
      }

      // Create links to all top groups this person belongs to
      personItems.forEach(item => {
        if (topGroupKeys.has(item)) {
          const groupColor = groupColors.get(item) || NetworkDefaults.otherColor;
          
          links.push({
            source: person.id,
            target: `group_${item}`,
            strength: 1.0, // All person-to-group connections have same strength
            color: groupColor,
            width: 2,
            opacity: 0.6,
            type: 'person-to-group',
            groupKey: item,
            connectionType: connectionType
          });
        }
      });
    });

    return links;
  }
}

export default NetworkGenerator; 