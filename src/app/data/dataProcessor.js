import Person from './PersonClass.js';

/**
 * Data processor for converting raw employee JSON into clean, structured data
 * for network graph analysis
 */
class DataProcessor {
  constructor() {
    this.people = [];
    this.processedData = null;
    this.stats = {
      totalPeople: 0,
      totalCompanies: 0,
      totalSchools: 0,
      totalSkills: 0,
      processingErrors: []
    };
  }

  /**
   * Process raw employee data and convert to Person objects
   * @param {Array} rawEmployeeData - Array of raw employee objects from JSON
   * @returns {Array} Array of processed Person objects
   */
  async processEmployeeData(rawEmployeeData) {
    if (!rawEmployeeData || !Array.isArray(rawEmployeeData)) {
      throw new Error('Invalid employee data provided');
    }

    this.reset();
    
    for (const employeeData of rawEmployeeData) {
      try {
        const person = this.processEmployeeRecord(employeeData);
        this.people.push(person);
        
        // Collect stats
        this.updateStats(person);
        
      } catch (error) {
        this.stats.processingErrors.push({
          employee: employeeData.name || 'Unknown',
          error: error.message
        });
      }
    }

    return this.people;
  }

  /**
   * Reset processor state
   */
  reset() {
    this.people = [];
    this.stats = {
      totalPeople: 0,
      totalCompanies: 0,
      totalSchools: 0,
      totalSkills: 0,
      processingErrors: []
    };
  }

  /**
   * Process a single employee record
   */
  processEmployeeRecord(rawEmployee) {
    // Validate required fields
    if (!rawEmployee.basic_info || !rawEmployee.basic_info.public_identifier) {
      throw new Error('Missing basic_info or public_identifier');
    }

    // Create Person object
    return new Person(rawEmployee);
  }

  /**
   * Update statistics with a new person
   */
  updateStats(person) {
    // This will be called for each person, but we'll calculate final stats later
    // For now, just track that we processed this person
  }

  /**
   * Generate statistics about the processed data
   */
  generateStats() {
    this.stats.totalPeople = this.people.length;
    
    // Collect unique companies, schools, and skills
    const companies = new Set();
    const schools = new Set();
    const skills = new Set();
    
    this.people.forEach(person => {
      person.getCompanyNames().forEach(company => companies.add(company));
      person.getSchoolNames().forEach(school => schools.add(school));
      person.skills.forEach(skill => skills.add(skill));
    });
    
    this.stats.totalCompanies = companies.size;
    this.stats.totalSchools = schools.size;
    this.stats.totalSkills = skills.size;
  }

  /**
   * Filter people by various criteria
   */
  filterPeople(filters = {}) {
    let filtered = [...this.people];

    // Filter by current company
    if (filters.currentCompany) {
      filtered = filtered.filter(person => 
        person.currentCompany.name && 
        person.currentCompany.name.toLowerCase().includes(filters.currentCompany.toLowerCase())
      );
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(person => 
        person.location && 
        person.location.full && 
        person.location.full.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by school
    if (filters.school) {
      filtered = filtered.filter(person => 
        person.education.some(edu => 
          edu.school.toLowerCase().includes(filters.school.toLowerCase())
        )
      );
    }

    // Filter by company (any company in history)
    if (filters.company) {
      filtered = filtered.filter(person => 
        person.companies.some(comp => 
          comp.name.toLowerCase().includes(filters.company.toLowerCase())
        )
      );
    }

    // Filter by minimum connections (will be used after network generation)
    if (filters.minConnections && typeof filters.minConnections === 'number') {
      filtered = filtered.filter(person => person.connections.size >= filters.minConnections);
    }

    return filtered;
  }

  /**
   * Get all unique companies for UI filters
   */
  getAllCompanies() {
    const companies = new Map();
    
    this.people.forEach(person => {
      person.companies.forEach(comp => {
        if (!companies.has(comp.normalizedName)) {
          companies.set(comp.normalizedName, {
            name: comp.name,
            normalizedName: comp.normalizedName,
            count: 1,
            people: [person.id]
          });
        } else {
          const existing = companies.get(comp.normalizedName);
          existing.count++;
          existing.people.push(person.id);
        }
      });
    });

    return Array.from(companies.values())
      .sort((a, b) => b.count - a.count); // Sort by popularity
  }

  /**
   * Get all unique schools for UI filters
   */
  getAllSchools() {
    const schools = new Map();
    
    this.people.forEach(person => {
      person.education.forEach(edu => {
        if (!schools.has(edu.normalizedSchool)) {
          schools.set(edu.normalizedSchool, {
            name: edu.school,
            normalizedName: edu.normalizedSchool,
            count: 1,
            people: [person.id]
          });
        } else {
          const existing = schools.get(edu.normalizedSchool);
          existing.count++;
          existing.people.push(person.id);
        }
      });
    });

    return Array.from(schools.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get all unique locations for UI filters
   */
  getAllLocations() {
    const locations = new Map();
    
    this.people.forEach(person => {
      if (person.location && person.location.full) {
        const key = person.getLocationKey();
        if (!locations.has(key)) {
          locations.set(key, {
            full: person.location.full,
            city: person.location.city,
            country: person.location.country,
            count: 1,
            people: [person.id]
          });
        } else {
          const existing = locations.get(key);
          existing.count++;
          existing.people.push(person.id);
        }
      }
    });

    return Array.from(locations.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get all unique skills for UI filters
   */
  getAllSkills() {
    const skills = new Map();
    
    this.people.forEach(person => {
      person.skills.forEach(skill => {
        if (!skills.has(skill)) {
          skills.set(skill, {
            name: skill,
            count: 1,
            people: [person.id]
          });
        } else {
          const existing = skills.get(skill);
          existing.count++;
          existing.people.push(person.id);
        }
      });
    });

    return Array.from(skills.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get a person by ID
   */
  getPersonById(id) {
    return this.people.find(person => person.id === id);
  }

  /**
   * Search people by name
   */
  searchPeople(query) {
    if (!query || query.length < 2) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return this.people.filter(person => 
      person.name.toLowerCase().includes(lowercaseQuery) ||
      person.firstName.toLowerCase().includes(lowercaseQuery) ||
      person.lastName.toLowerCase().includes(lowercaseQuery) ||
      (person.headline && person.headline.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Export processed data for saving/caching
   */
  exportProcessedData() {
    return {
      people: this.people.map(person => ({
        // Export essential data, can be reconstructed into Person objects
        id: person.id,
        name: person.name,
        firstName: person.firstName,
        lastName: person.lastName,
        headline: person.headline,
        profileUrl: person.profileUrl,
        profilePicture: person.profilePicture,
        about: person.about,
        location: person.location,
        currentCompany: person.currentCompany,
        companies: person.companies,
        education: person.education,
        skills: person.skills,
        careerPath: person.careerPath
      })),
      stats: this.stats,
      metadata: {
        processedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return this.stats;
  }

  /**
   * Get sample data for testing
   */
  getSampleData(size = 10) {
    return this.people.slice(0, size);
  }
}

export default DataProcessor; 