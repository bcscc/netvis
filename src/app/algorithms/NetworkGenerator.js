import { ConnectionTypes, ConnectionConfig, NodeGroupings, GroupingConfig } from './ConnectionTypes.js';

/**
 * Network Generator - Creates nodes and links for network visualization
 * Implements different connection algorithms for various relationship types
 */
class NetworkGenerator {
  constructor() {
    this.people = [];
    this.connections = new Map(); // Cache computed connections
  }

  /**
   * Set the people data to analyze
   */
  setPeople(people) {
    this.people = people;
    this.connections.clear();
  }

  /**
   * Generate network graph with specified parameters
   */
  generateNetwork(options = {}) {
    const {
      connectionType = ConnectionTypes.COMPANY,
      nodeGrouping = NodeGroupings.CURRENT_COMPANY,
      threshold = 0.3,
      maxNodes = 50,
      includeIsolated = false
    } = options;

    console.log(`Generating network: ${connectionType}, ${nodeGrouping}, threshold: ${threshold}`);

    // Get subset of people to visualize
    const selectedPeople = this.selectPeople(maxNodes);
    
    // Generate connections based on type
    const connections = this.generateConnections(selectedPeople, connectionType, threshold);
    
    // Filter out isolated nodes if requested
    const filteredPeople = includeIsolated ? 
      selectedPeople : 
      this.filterConnectedPeople(selectedPeople, connections);

    // Generate color mappings for grouping
    const groupColors = this.getGroupColors(filteredPeople, nodeGrouping);
    
    // Generate nodes
    const nodes = this.generateNodes(filteredPeople, nodeGrouping, groupColors);
    
    // Generate links
    const links = this.generateLinks(connections, connectionType);

    // Generate legend data
    const legendData = this.generateLegendData(filteredPeople, nodeGrouping, groupColors);

    return {
      nodes,
      links,
      legendData,
      metadata: {
        connectionType,
        nodeGrouping,
        threshold,
        totalPeople: filteredPeople.length,
        totalConnections: connections.length,
        averageConnections: connections.length / filteredPeople.length
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

    // Strategy: Take most connected people
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
   * Generate connections based on connection type
   */
  generateConnections(people, connectionType, threshold) {
    const cacheKey = `${connectionType}_${threshold}_${people.length}`;
    
    if (this.connections.has(cacheKey)) {
      return this.connections.get(cacheKey);
    }

    let connections = [];

    switch (connectionType) {
      case ConnectionTypes.EDUCATION:
        connections = this.generateEducationConnections(people, threshold);
        break;
      case ConnectionTypes.COMPANY:
        connections = this.generateCompanyConnections(people, threshold);
        break;
      case ConnectionTypes.LOCATION:
        connections = this.generateLocationConnections(people, threshold);
        break;
      case ConnectionTypes.SKILLS:
        connections = this.generateSkillsConnections(people, threshold);
        break;
      default:
        connections = this.generateEducationConnections(people, threshold);
    }

    this.connections.set(cacheKey, connections);
    return connections;
  }

  /**
   * Education-based connections
   */
  generateEducationConnections(people, threshold) {
    const connections = [];

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const person1 = people[i];
        const person2 = people[j];

        const sharedSchools = person1.getSchoolNames().filter(school => 
          person2.getSchoolNames().includes(school)
        );

        if (sharedSchools.length > 0) {
          const strength = this.calculateEducationStrength(person1, person2, sharedSchools);
          
          if (strength >= threshold) {
            connections.push({
              source: person1.id,
              target: person2.id,
              strength,
              type: ConnectionTypes.EDUCATION,
              sharedItems: sharedSchools,
              metadata: {
                schools: sharedSchools,
                person1Education: person1.education,
                person2Education: person2.education
              }
            });
          }
        }
      }
    }

    return connections;
  }

  /**
   * Company-based connections
   */
  generateCompanyConnections(people, threshold) {
    const connections = [];

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const person1 = people[i];
        const person2 = people[j];

        const sharedCompanies = person1.getCompanyNames().filter(company => 
          person2.getCompanyNames().includes(company)
        );

        if (sharedCompanies.length > 0) {
          const strength = this.calculateCompanyStrength(person1, person2, sharedCompanies);
          
          if (strength >= threshold) {
            connections.push({
              source: person1.id,
              target: person2.id,
              strength,
              type: ConnectionTypes.COMPANY,
              sharedItems: sharedCompanies,
              metadata: {
                companies: sharedCompanies,
                person1Companies: person1.companies,
                person2Companies: person2.companies
              }
            });
          }
        }
      }
    }

    return connections;
  }

  /**
   * Location-based connections
   */
  generateLocationConnections(people, threshold) {
    const connections = [];

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const person1 = people[i];
        const person2 = people[j];

        const strength = this.calculateLocationStrength(person1, person2);
        
        if (strength >= threshold) {
          connections.push({
            source: person1.id,
            target: person2.id,
            strength,
            type: ConnectionTypes.LOCATION,
            sharedItems: [person1.location?.full || 'Unknown'],
            metadata: {
              person1Location: person1.location,
              person2Location: person2.location
            }
          });
        }
      }
    }

    return connections;
  }

  /**
   * Skills-based connections
   */
  generateSkillsConnections(people, threshold) {
    const connections = [];

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const person1 = people[i];
        const person2 = people[j];

        const sharedSkills = person1.skills.filter(skill => 
          person2.skills.includes(skill)
        );

        if (sharedSkills.length > 0) {
          const strength = this.calculateSkillsStrength(person1, person2, sharedSkills);
          
          if (strength >= threshold) {
            connections.push({
              source: person1.id,
              target: person2.id,
              strength,
              type: ConnectionTypes.SKILLS,
              sharedItems: sharedSkills,
              metadata: {
                skills: sharedSkills,
                person1Skills: person1.skills,
                person2Skills: person2.skills
              }
            });
          }
        }
      }
    }

    return connections;
  }

  /**
   * Strength calculation methods
   */
  calculateEducationStrength(person1, person2, sharedSchools) {
    if (sharedSchools.length === 0) return 0;
    
    const maxSchools = Math.max(person1.education.length, person2.education.length);
    return Math.min(1, sharedSchools.length / Math.max(1, maxSchools));
  }

  calculateCompanyStrength(person1, person2, sharedCompanies) {
    if (sharedCompanies.length === 0) return 0;
    
    const maxCompanies = Math.max(person1.companies.length, person2.companies.length);
    return Math.min(1, sharedCompanies.length / Math.max(1, maxCompanies));
  }

  calculateLocationStrength(person1, person2) {
    if (!person1.location || !person2.location) return 0;
    
    // Exact city match
    if (person1.location.city === person2.location.city) return 1.0;
    
    // Same country
    if (person1.location.country === person2.location.country) return 0.3;
    
    return 0;
  }

  calculateSkillsStrength(person1, person2, sharedSkills) {
    if (sharedSkills.length === 0) return 0;
    
    const totalSkills = new Set([...person1.skills, ...person2.skills]).size;
    return Math.min(1, sharedSkills.length / Math.max(1, totalSkills));
  }

  /**
   * Filter people who have connections
   */
  filterConnectedPeople(people, connections) {
    const connectedIds = new Set();
    connections.forEach(conn => {
      connectedIds.add(conn.source);
      connectedIds.add(conn.target);
    });
    
    return people.filter(person => connectedIds.has(person.id));
  }

  /**
   * Generate nodes for visualization
   */
  generateNodes(people, grouping, groupColors) {
    return people.map(person => {
      const groupInfo = this.getPersonGroup(person, grouping);
      
      return {
        id: person.id,
        label: person.firstName || person.name.split(' ')[0],
        fullName: person.name,
        size: this.calculateNodeSize(person),
        color: groupColors.get(groupInfo.key) || '#6B7280',
        group: groupInfo.key,
        groupLabel: groupInfo.label,
        person: person, // Reference to full person object
        onClick: (node) => this.handleNodeClick(node)
      };
    });
  }

  /**
   * Generate links for visualization
   */
  generateLinks(connections, connectionType) {
    const config = ConnectionConfig[connectionType];
    
    return connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      strength: conn.strength,
      color: config.color,
      width: Math.max(1, conn.strength * 4),
      opacity: Math.max(0.3, conn.strength),
      distance: config.maxDistance,
      type: conn.type,
      metadata: conn.metadata,
    }));
  }

  /**
   * Generate legend data for the current grouping
   */
  generateLegendData(people, grouping, groupColors) {
    const groups = new Map();
    
    people.forEach(person => {
      const groupInfo = this.getPersonGroup(person, grouping);
      if (!groups.has(groupInfo.key)) {
        groups.set(groupInfo.key, {
          key: groupInfo.key,
          label: groupInfo.label,
          color: groupColors.get(groupInfo.key) || '#6B7280',
          count: 1,
          people: [person.id]
        });
      } else {
        const existing = groups.get(groupInfo.key);
        existing.count++;
        existing.people.push(person.id);
      }
    });

    // Sort by count (descending) then by label
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });

    // Special handling for education grouping - group gray-colored schools together
    if (grouping === NodeGroupings.EDUCATION) {
      console.log('Legend generation - all groups:', sortedGroups);
      
      const coloredGroups = [];
      const grayGroups = [];
      
      // Separate groups by color
      sortedGroups.forEach(group => {
        console.log(`School: ${group.label}, Color: ${group.color}, Count: ${group.count}`);
        if (group.color === '#9CA3AF') {
          // This is a gray "other" school
          console.log(`  -> Adding to gray groups: ${group.label}`);
          grayGroups.push(group);
        } else {
          // This is a top 8 school with distinct color
          console.log(`  -> Adding to colored groups: ${group.label}`);
          coloredGroups.push(group);
        }
      });

      console.log(`Colored groups: ${coloredGroups.length}, Gray groups: ${grayGroups.length}`);

      if (grayGroups.length > 0) {
        // Combine all gray schools into one "Other Schools" entry
        const otherCount = grayGroups.reduce((sum, group) => sum + group.count, 0);
        const otherPeople = grayGroups.flatMap(group => group.people);
        
        const otherEntry = {
          key: 'other_schools',
          label: `Other Schools (${grayGroups.length})`,
          color: '#9CA3AF',
          count: otherCount,
          people: otherPeople
        };

        console.log('Creating other entry:', otherEntry);

        // Return colored schools + combined other entry, sorted by count
        const finalList = [...coloredGroups, otherEntry];
        return finalList.sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return a.label.localeCompare(b.label);
        });
        
      } else {
        // No gray groups, just return the colored ones
        console.log('No gray groups found, returning colored groups:', coloredGroups);
        return coloredGroups;
      }
    }

    // For all other groupings, return sorted groups
    return sortedGroups;
  }

  /**
   * Helper methods for node generation
   */
  calculateNodeSize(person) {
    const baseSize = 8;
    const experienceBonus = person.companies.length * 1.5;
    const educationBonus = person.education.length * 1;
    const skillsBonus = Math.min(person.skills.length * 0.3, 5);
    
    return baseSize + experienceBonus + educationBonus + skillsBonus;
  }

  getPersonGroup(person, grouping) {
    switch (grouping) {
      case NodeGroupings.CURRENT_COMPANY:
        return {
          key: person.currentCompany.name || 'Unknown',
          label: person.currentCompany.name || 'Unknown Company'
        };
      case NodeGroupings.LOCATION:
        return {
          key: person.location?.city || 'Unknown',
          label: person.location?.full || 'Unknown Location'
        };
      case NodeGroupings.EDUCATION:
        const mostRecentEducation = this.getMostRecentEducation(person);
        console.log('Education grouping for', person.name, '- Key:', mostRecentEducation.schoolId, 'Label:', mostRecentEducation.school);
        return {
          key: mostRecentEducation.schoolId || 'Unknown',
          label: mostRecentEducation.school || 'Unknown School'
        };
      default:
        return { key: 'default', label: 'Default' };
    }
  }

  /**
   * Get most recent education entry for a person
   */
  getMostRecentEducation(person) {
    if (!person.education || person.education.length === 0) {
      return { school: 'No Education Listed', schoolId: 'none' };
    }

    // Debug logging
    console.log('Education data for', person.name, ':', person.education);

    // Sort education by end date (most recent first)
    // If no end date, assume it's current/most recent
    const sortedEducation = [...person.education].sort((a, b) => {
      // If one has no end date (current), it's most recent
      if (!a.endDate && b.endDate) return -1;
      if (a.endDate && !b.endDate) return 1;
      if (!a.endDate && !b.endDate) return 0;

      // Handle different date formats
      const aYear = a.endDate?.year || (typeof a.endDate === 'string' ? parseInt(a.endDate) : 0);
      const bYear = b.endDate?.year || (typeof b.endDate === 'string' ? parseInt(b.endDate) : 0);

      // Compare end dates
      if (aYear !== bYear) {
        return bYear - aYear; // Most recent first
      }
      
      // If same year, compare months (if available)
      if (a.endDate?.month && b.endDate?.month) {
        const aMonth = this.monthNameToNumber(a.endDate.month) || 0;
        const bMonth = this.monthNameToNumber(b.endDate.month) || 0;
        return bMonth - aMonth;
      }

      return 0; // Equal
    });

    const mostRecent = sortedEducation[0];
    console.log('Most recent education for', person.name, ':', mostRecent);

    return {
      school: mostRecent.school || 'Unknown School',
      schoolId: mostRecent.schoolId || mostRecent.school || 'unknown'
    };
  }

  /**
   * Convert month name to number for comparison
   */
  monthNameToNumber(monthStr) {
    if (!monthStr) return 0;
    const months = {
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    };
    return months[monthStr.toLowerCase().substring(0, 3)] || 0;
  }

  getGroupColors(people, grouping) {
    const groups = new Set(people.map(p => this.getPersonGroup(p, grouping).key));
    const colors = GroupingConfig[grouping]?.colors || ['#6B7280'];
    const colorMap = new Map();
    
    // Special handling for education grouping - only top 8 get distinct colors
    if (grouping === NodeGroupings.EDUCATION) {
      // Count frequency of each education group
      const groupCounts = new Map();
      people.forEach(person => {
        const groupInfo = this.getPersonGroup(person, grouping);
        const count = groupCounts.get(groupInfo.key) || 0;
        groupCounts.set(groupInfo.key, count + 1);
      });

      // Sort groups by count (highest to lowest)
      const sortedGroups = Array.from(groupCounts.entries())
        .sort(([,a], [,b]) => b - a);

      // Assign distinct colors to top 8, same color to the rest
      sortedGroups.forEach(([groupKey], index) => {
        if (index < 8) {
          // Top 8 get distinct colors
          colorMap.set(groupKey, colors[index % colors.length]);
        } else {
          // All others get gray
          colorMap.set(groupKey, '#9CA3AF'); // Light gray for "Others"
        }
      });
    } else {
      // Default behavior for other groupings
      Array.from(groups).forEach((group, index) => {
        colorMap.set(group, colors[index % colors.length]);
      });
    }
    
    return colorMap;
  }
}

export default NetworkGenerator; 