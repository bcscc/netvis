/**
 * Person class to represent a clean, normalized employee profile
 * Extracts and structures data for network graph analysis
 */
class Person {
  constructor(rawData) {
    // Basic identification
    this.id = rawData.basic_info.public_identifier;
    this.name = rawData.basic_info.fullname;
    this.firstName = rawData.basic_info.first_name;
    this.lastName = rawData.basic_info.last_name;
    this.headline = rawData.basic_info.headline;
    this.profileUrl = rawData.profileUrl;
    this.profilePicture = rawData.basic_info.profile_picture_url;
    this.about = rawData.basic_info.about;
    
    // Location information
    this.location = this.extractLocation(rawData.basic_info.location);
    
    // Current company
    this.currentCompany = {
      name: rawData.basic_info.current_company,
      urn: rawData.basic_info.current_company_urn,
      url: rawData.basic_info.current_company_url
    };
    
    // Extract structured data for network analysis
    this.companies = this.extractCompanies(rawData.experience || []);
    this.education = this.extractEducation(rawData.education || []);
    this.skills = this.extractSkills(rawData.experience || []);
    this.careerPath = this.extractCareerPath(rawData.experience || []);
    
    // Network analysis properties
    this.connections = new Set(); // Will store connection IDs
    this.connectionStrength = {}; // person_id -> strength value
    this.clusterIds = {}; // cluster_type -> cluster_id
  }

  /**
   * Extract and normalize location data
   */
  extractLocation(locationData) {
    if (!locationData) return null;
    
    return {
      city: locationData.city || null,
      country: locationData.country || null,
      countryCode: locationData.country_code || null,
      full: locationData.full || null
    };
  }

  /**
   * Extract company information from experience
   */
  extractCompanies(experiences) {
    const companies = new Map();
    
    experiences.forEach(exp => {
      if (!exp.company) return;
      
      const companyKey = this.normalizeCompanyName(exp.company);
      const existing = companies.get(companyKey);
      
      if (!existing) {
        companies.set(companyKey, {
          name: exp.company,
          normalizedName: companyKey,
          positions: [{
            title: exp.title,
            duration: exp.duration,
            startDate: exp.start_date,
            endDate: exp.end_date,
            isCurrent: exp.is_current,
            location: exp.location
          }],
          totalDuration: this.calculateDuration(exp.start_date, exp.end_date),
          logo: exp.company_logo_url,
          linkedinUrl: exp.company_linkedin_url,
          companyId: exp.company_id
        });
      } else {
        existing.positions.push({
          title: exp.title,
          duration: exp.duration,
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: exp.is_current,
          location: exp.location
        });
        existing.totalDuration += this.calculateDuration(exp.start_date, exp.end_date);
      }
    });
    
    return Array.from(companies.values());
  }

  /**
   * Extract education information
   */
  extractEducation(educationData) {
    return educationData.map(edu => ({
      school: edu.school,
      normalizedSchool: this.normalizeSchoolName(edu.school),
      degree: edu.degree || null,
      duration: edu.duration || null,
      startDate: edu.start_date,
      endDate: edu.end_date,
      activities: edu.activities || null,
      logo: edu.school_logo_url,
      linkedinUrl: edu.school_linkedin_url,
      schoolId: edu.school_id
    }));
  }

  /**
   * Extract skills from experience
   */
  extractSkills(experiences) {
    const skillsSet = new Set();
    
    experiences.forEach(exp => {
      if (exp.skills && Array.isArray(exp.skills)) {
        exp.skills.forEach(skill => {
          // Clean up skill names (remove things like "+1 skill")
          const cleanSkill = skill.replace(/\s+and\s+\+\d+\s+skill.*$/i, '').trim();
          if (cleanSkill) {
            skillsSet.add(cleanSkill);
          }
        });
      }
    });
    
    return Array.from(skillsSet);
  }

  /**
   * Extract career progression path
   */
  extractCareerPath(experiences) {
    // Sort experiences by start date
    const sortedExperiences = [...experiences].sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0;
      if (a.start_date.year !== b.start_date.year) {
        return (a.start_date.year || 0) - (b.start_date.year || 0);
      }
      return (this.monthToNumber(a.start_date.month) || 0) - (this.monthToNumber(b.start_date.month) || 0);
    });

    return sortedExperiences.map((exp, index) => ({
      order: index,
      company: exp.company,
      title: exp.title,
      startDate: exp.start_date,
      endDate: exp.end_date,
      isCurrent: exp.is_current,
      isInternship: this.isInternship(exp.title),
      seniorityLevel: this.determineSeniorityLevel(exp.title)
    }));
  }

  /**
   * Utility methods for data processing
   */
  normalizeCompanyName(companyName) {
    if (!companyName) return '';
    return companyName
      .toLowerCase()
      .replace(/\s+inc\.?$/i, '')
      .replace(/\s+llc\.?$/i, '')
      .replace(/\s+corp\.?$/i, '')
      .replace(/\s+ltd\.?$/i, '')
      .replace(/\s+co\.?$/i, '')
      .trim();
  }

  normalizeSchoolName(schoolName) {
    if (!schoolName) return '';
    return schoolName
      .toLowerCase()
      .replace(/\s+university$/i, '')
      .replace(/\s+college$/i, '')
      .replace(/\s+institute$/i, '')
      .trim();
  }

  calculateDuration(startDate, endDate) {
    if (!startDate) return 0;
    
    const start = new Date(startDate.year || 2000, this.monthToNumber(startDate.month) || 0);
    const end = endDate ? 
      new Date(endDate.year || 2000, this.monthToNumber(endDate.month) || 0) : 
      new Date();
    
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))); // months
  }

  monthToNumber(monthStr) {
    if (!monthStr) return 0;
    const months = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    return months[monthStr.toLowerCase().substring(0, 3)] || 0;
  }

  isInternship(title) {
    if (!title) return false;
    return /intern/i.test(title);
  }

  determineSeniorityLevel(title) {
    if (!title) return 0;
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('intern')) return 1;
    if (lowerTitle.includes('junior') || lowerTitle.includes('associate')) return 2;
    if (lowerTitle.includes('senior') || lowerTitle.includes('lead')) return 4;
    if (lowerTitle.includes('principal') || lowerTitle.includes('staff')) return 5;
    if (lowerTitle.includes('director') || lowerTitle.includes('vp') || lowerTitle.includes('head')) return 6;
    if (lowerTitle.includes('cto') || lowerTitle.includes('ceo') || lowerTitle.includes('founder')) return 7;
    
    return 3; // Default mid-level
  }

  /**
   * Get companies where this person has worked, for connection analysis
   */
  getCompanyNames() {
    return this.companies.map(comp => comp.normalizedName);
  }

  /**
   * Get schools where this person studied, for connection analysis
   */
  getSchoolNames() {
    return this.education.map(edu => edu.normalizedSchool);
  }

  /**
   * Get location key for connection analysis
   */
  getLocationKey() {
    if (!this.location) return null;
    return `${this.location.city || ''}_${this.location.country || ''}`.toLowerCase();
  }

  /**
   * Generate a summary for display
   */
  getDisplaySummary() {
    return {
      name: this.name,
      title: this.headline,
      currentCompany: this.currentCompany.name,
      location: this.location?.full,
      totalCompanies: this.companies.length,
      totalSchools: this.education.length,
      totalSkills: this.skills.length
    };
  }
}

export default Person; 