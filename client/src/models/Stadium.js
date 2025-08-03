/**
 * Stadium Model
 * Based on stadium_food Flutter app structure
 */

export class Stadium {
  constructor({
    id,
    name,
    about = '',
    location,
    capacity,
    imageUrl = '',
    teams = [],
    color = '#3D70FF',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.name = name;
    this.about = about;
    this.location = location;
    this.capacity = capacity;
    this.imageUrl = imageUrl;
    this.teams = teams; // Array of team names
    this.color = color; // Stadium/team primary color
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Create Stadium from API response/storage data
   * @param {Object} data - Raw stadium data
   * @returns {Stadium}
   */
  static fromMap(data) {
    return new Stadium({
      id: data.id,
      name: data.name || '',
      about: data.about || '',
      location: data.location || '',
      capacity: data.capacity || 0,
      imageUrl: data.imageUrl || '',
      teams: data.teams || [],
      color: data.color || '#3D70FF',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    });
  }

  /**
   * Convert Stadium to plain object for storage/API
   * @returns {Object}
   */
  toMap() {
    return {
      id: this.id,
      name: this.name,
      about: this.about,
      location: this.location,
      capacity: this.capacity,
      imageUrl: this.imageUrl,
      teams: this.teams,
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get formatted capacity string
   * @returns {string}
   */
  getFormattedCapacity() {
    return this.capacity.toLocaleString();
  }

  /**
   * Get display name with location
   * @returns {string}
   */
  getDisplayName() {
    return `${this.name} - ${this.location}`;
  }

  /**
   * Check if stadium has specific team
   * @param {string} teamName 
   * @returns {boolean}
   */
  hasTeam(teamName) {
    return this.teams.some(team => 
      team.toLowerCase().includes(teamName.toLowerCase())
    );
  }

  /**
   * Update stadium data
   * @param {Object} updates 
   * @returns {Stadium}
   */
  update(updates) {
    return new Stadium({
      ...this.toMap(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export default Stadium;
