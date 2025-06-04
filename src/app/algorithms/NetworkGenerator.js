import { ConnectionTypes, ConnectionConfig } from './ConnectionTypes.js';
import NetworkDefaults from '../config/defaults.js';

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
      connectionType = NetworkDefaults.network.connectionType,
      threshold = NetworkDefaults.network.threshold,
      maxNodes = NetworkDefaults.network.maxNodes,
      includeIsolated = NetworkDefaults.network.includeIsolated,
      topN = NetworkDefaults.network.topN
    } = options;

    console.log(`Generating network: ${connectionType}, threshold: ${threshold}, topN: ${topN}`);

    // Cache the topN value for legend generation
    this.cachedTopN = topN;
    
    // Ensure we don't exceed our 15-color palette
    const effectiveTopN = Math.min(topN, NetworkDefaults.colors.length);
    console.log(`Using effectiveTopN: ${effectiveTopN} (requested: ${topN}, max colors: ${NetworkDefaults.colors.length})`);

    // Get subset of people to visualize
    const selectedPeople = this.selectPeople(maxNodes);
    
    // Generate connections based on type
    const connections = this.generateConnections(selectedPeople, connectionType, threshold);
    
    // Filter out isolated nodes if requested
    const filteredPeople = includeIsolated ? 
      selectedPeople : 
      this.filterConnectedPeople(selectedPeople, connections);

    // Generate color mappings for the connection type - use top N logic for all types
    const groupColors = this.getGroupColors(filteredPeople, connectionType, effectiveTopN);
    
    // Get top groups for this connection type
    const topGroups = this.getTopGroupsForType(filteredPeople, connectionType, effectiveTopN);
    
    // Generate nodes - both people and group nodes
    const { peopleNodes, groupNodes } = this.generateBipartiteNodes(filteredPeople, groupColors, connectionType, effectiveTopN, topGroups);
    
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
    const legendData = this.generateLegendData(filteredPeople, groupColors, connectionType);

    return {
      nodes,
      links,
      legendData,
      metadata: {
        connectionType,
        threshold,
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

        const sharedSchools = this.getPersonEducationSchools(person1).filter(schoolId => 
          this.getPersonEducationSchools(person2).includes(schoolId)
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
  generateNodes(people, groupColors, connectionType, topN, connections) {
    // Get top N items for the connection type
    let topItems, getPersonItems;
    
    switch (connectionType) {
      case ConnectionTypes.EDUCATION:
        topItems = this.getTopSchools(people, topN);
        getPersonItems = (person) => this.getPersonEducationSchools(person);
        break;
      case ConnectionTypes.COMPANY:
        topItems = this.getTopCompanies(people, topN);
        getPersonItems = (person) => this.getPersonCompanies(person);
        break;
      case ConnectionTypes.SKILLS:
        topItems = this.getTopSkills(people, topN);
        getPersonItems = (person) => this.getPersonSkills(person);
        break;
      case ConnectionTypes.LOCATION:
        // For location, just use the person's city as a single item
        topItems = this.getTopLocations(people, topN);
        getPersonItems = (person) => [person.location?.city || 'Unknown'];
        break;
      default:
        topItems = this.getTopSchools(people, topN);
        getPersonItems = (person) => this.getPersonEducationSchools(person);
    }
    
    return people.map(person => {
      const groupInfo = this.getPersonGroup(person, connectionType);
      
      // Get all items for this person that are in the top N
      const personItems = getPersonItems(person);
      const personTopItems = personItems.filter(item => 
        topItems.some(topItem => topItem.key === item)
      );
      
      // Create multi-color information
      let nodeColor;
      let multiColors = null;
      
      if (personTopItems.length === 0) {
        // No top N items - use gray
        nodeColor = NetworkDefaults.otherColor;
      } else if (personTopItems.length === 1) {
        // Single top N item - use its color
        nodeColor = groupColors.get(personTopItems[0]) || NetworkDefaults.otherColor;
      } else {
        // Multiple top N items - create multi-colored node
        multiColors = personTopItems.map(item => 
          groupColors.get(item) || NetworkDefaults.otherColor
        );
        nodeColor = multiColors[0]; // Primary color for fallback
      }
      
      return {
        id: person.id,
        label: person.firstName || person.name.split(' ')[0],
        fullName: person.name,
        size: this.calculateNodeSize(person, connections),
        color: nodeColor,
        multiColors: multiColors, // Array of colors for multi-colored rendering
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
   * Generate legend data for the current grouping (updated for bipartite network)
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
   * Calculate node size based on number of connections in the network
   */
  calculateNodeSize(person, connections) {
    const { baseSize, connectionMultiplier, minSize, maxSize } = NetworkDefaults.nodeSize;
    
    // Count actual connections for this person in the network
    const connectionCount = connections.filter(conn => 
      conn.source === person.id || conn.target === person.id
    ).length;
    
    // Scale size based on connection count
    // Use logarithmic scaling to avoid nodes becoming too large
    const connectionBonus = connectionCount > 0 ? 
      Math.log(connectionCount + 1) * connectionMultiplier : 0;
    
    const calculatedSize = baseSize + connectionBonus;
    
    // Clamp between min and max sizes
    return Math.max(minSize, Math.min(maxSize, calculatedSize));
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
   * Get all company names for a person (reverting to names for consistency)
   */
  getPersonCompanies(person) {
    return person.companies?.map(company => company.name || 'unknown').filter(Boolean) || [];
  }

  /**
   * Helper function to find the actual company name for a given company name (for consistency with education pattern)
   */
  getCompanyNameById(person, companyName) {
    // Since we're using names as keys, just return the name
    return companyName;
  }

  /**
   * Get all skills for a person
   */
  getPersonSkills(person) {
    return person.skills?.filter(Boolean) || [];
  }

  /**
   * Get top N most frequent schools across all people - consolidated helper
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
   * Helper function to find the highest-ranking item from a person's items that appears in the top items list
   */
  getBestRankingItem(personItems, topItemsList) {
    let bestItem = null;
    let bestRank = Infinity;
    
    personItems.forEach(item => {
      const rank = topItemsList.findIndex(topItem => topItem.key === item);
      if (rank !== -1 && rank < bestRank) {
        bestRank = rank;
        bestItem = item;
      }
    });
    
    return bestItem;
  }

  getPersonGroup(person, connectionType) {
    switch (connectionType) {
      case ConnectionTypes.EDUCATION:
        // For education, find the highest-ranked top school this person attended
        const personSchools = this.getPersonEducationSchools(person);
        const globalTopSchools = this.cachedTopSchools || [];
        const bestSchoolId = this.getBestRankingItem(personSchools, globalTopSchools);
        
        // Fallback to most recent education if no top school found
        if (bestSchoolId) {
          // Find the actual school name for this ID
          const schoolName = this.getSchoolNameById(person, bestSchoolId);
          return {
            key: bestSchoolId,
            label: schoolName || bestSchoolId
          };
        } else {
          const mostRecentEducation = this.getMostRecentEducation(person);
          return {
            key: mostRecentEducation.schoolId || 'Unknown',
            label: mostRecentEducation.school || 'Unknown School'
          };
        }
      case ConnectionTypes.COMPANY:
        // For companies, find the highest-ranked top company this person has worked at
        const personCompanies = this.getPersonCompanies(person);
        const globalTopCompanies = this.cachedTopCompanies || [];
        const bestCompanyName = this.getBestRankingItem(personCompanies, globalTopCompanies);
        
        return {
          key: bestCompanyName || 'Unknown',
          label: bestCompanyName || 'Unknown Company'
        };
      case ConnectionTypes.LOCATION:
        return {
          key: person.location?.city || 'Unknown',
          label: person.location?.full || 'Unknown Location'
        };
      case ConnectionTypes.SKILLS:
        // For skills, find the highest-ranked top skill this person has
        const personSkills = this.getPersonSkills(person);
        const globalTopSkills = this.cachedTopSkills || [];
        const bestSkill = this.getBestRankingItem(personSkills, globalTopSkills);
        
        return {
          key: bestSkill || 'Unknown',
          label: bestSkill || 'No Skills Listed'
        };
      default:
        return { key: 'default', label: 'Default' };
    }
  }

  /**
   * Get most recent education entry for a person - optimized version
   */
  getMostRecentEducation(person) {
    if (!person.education?.length) {
      return { school: 'No Education Listed', schoolId: 'none' };
    }

    // Find most recent education by end date (current education has no end date)
    const mostRecent = person.education.reduce((latest, current) => {
      // No end date means current/most recent
      if (!current.endDate) return current;
      if (!latest.endDate) return latest;
      
      // Compare years, then months if same year
      const currentYear = current.endDate?.year || parseInt(current.endDate) || 0;
      const latestYear = latest.endDate?.year || parseInt(latest.endDate) || 0;
      
      if (currentYear !== latestYear) {
        return currentYear > latestYear ? current : latest;
      }
      
      // Same year - compare months if available
      const currentMonth = this.monthNameToNumber(current.endDate?.month) || 12;
      const latestMonth = this.monthNameToNumber(latest.endDate?.month) || 12;
      
      return currentMonth > latestMonth ? current : latest;
    });

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

  /**
   * Get primary skill for a person (first skill or most relevant)
   */
  getPrimarySkill(person) {
    if (!person.skills?.length) return null;
    // For now, just return the first skill. Could be enhanced to find most relevant/common skill
    return person.skills[0];
  }

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