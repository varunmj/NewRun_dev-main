/**
 * Property Data Transformer
 * Transforms raw property data into beautiful, structured format for AI drawer
 * CEO-level data formatting for premium UX
 */

class PropertyDataTransformer {
  /**
   * Transform raw property data into AI drawer format
   */
  static transformPropertyForAI(property) {
    return {
      id: property._id || property.id,
      title: property.title || property.name || 'Property',
      price: property.price || property.rent || 0,
      bedrooms: property.bedrooms || property.beds || 0,
      bathrooms: property.bathrooms || property.baths || 0,
      address: this.formatAddress(property),
      distanceFromUniversity: this.calculateDistance(property),
      furnished: property.furnished || false,
      contactName: property.contactName || property.ownerName || 'Contact',
      contactPhone: property.contactPhone || property.phone || '',
      contactEmail: property.contactEmail || property.email || '',
      recommendation: this.generateRecommendation(property),
      image: property.image || property.images?.[0] || null,
      availability: property.availabilityStatus || 'available',
      rating: this.calculateRating(property),
      amenities: this.extractAmenities(property),
      description: property.description || '',
      location: {
        latitude: property.latitude,
        longitude: property.longitude,
        city: property.city,
        state: property.state
      }
    };
  }

  /**
   * Transform multiple properties for AI drawer
   */
  static transformPropertiesForAI(properties) {
    if (!Array.isArray(properties)) return [];
    
    return properties.map(property => this.transformPropertyForAI(property))
      .sort((a, b) => {
        // Sort by recommendation score, then by price
        const scoreA = this.calculateRecommendationScore(a);
        const scoreB = this.calculateRecommendationScore(b);
        return scoreB - scoreA;
      });
  }

  /**
   * Format address string
   */
  static formatAddress(property) {
    const parts = [
      property.address,
      property.city,
      property.state,
      property.zipCode
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not available';
  }

  /**
   * Calculate distance from university (mock calculation)
   */
  static calculateDistance(property) {
    // Mock distance calculation - in real app, use geolocation
    const baseDistance = Math.random() * 5 + 0.5; // 0.5 to 5.5 miles
    return Math.round(baseDistance * 10) / 10;
  }

  /**
   * Generate AI recommendation text
   */
  static generateRecommendation(property) {
    const price = property.price || 0;
    const bedrooms = property.bedrooms || 0;
    const distance = this.calculateDistance(property);
    
    let recommendation = '';
    
    if (price < 500) {
      recommendation += '💰 Excellent value for money! ';
    } else if (price < 800) {
      recommendation += '💵 Great price point! ';
    }
    
    if (distance < 1) {
      recommendation += '🚶‍♂️ Walking distance to campus! ';
    } else if (distance < 2) {
      recommendation += '🚲 Short bike ride to campus! ';
    }
    
    if (bedrooms >= 2) {
      recommendation += '🏠 Perfect for sharing with roommates! ';
    }
    
    if (property.furnished) {
      recommendation += '🛏️ Fully furnished - move in ready! ';
    }
    
    return recommendation.trim() || 'Great option for your needs!';
  }

  /**
   * Calculate property rating
   */
  static calculateRating(property) {
    // Mock rating calculation based on property features
    let rating = 3.5; // Base rating
    
    if (property.furnished) rating += 0.5;
    if (property.price < 600) rating += 0.3;
    if (property.bedrooms >= 2) rating += 0.2;
    
    return Math.min(5, Math.round(rating * 10) / 10);
  }

  /**
   * Extract amenities from property
   */
  static extractAmenities(property) {
    const amenities = [];
    
    if (property.furnished) amenities.push('Furnished');
    if (property.parking) amenities.push('Parking');
    if (property.laundry) amenities.push('Laundry');
    if (property.airConditioning) amenities.push('A/C');
    if (property.heating) amenities.push('Heating');
    if (property.internet) amenities.push('Internet');
    if (property.petFriendly) amenities.push('Pet Friendly');
    if (property.gym) amenities.push('Gym');
    if (property.pool) amenities.push('Pool');
    
    return amenities;
  }

  /**
   * Calculate recommendation score for sorting
   */
  static calculateRecommendationScore(property) {
    let score = 0;
    
    // Price score (lower is better)
    if (property.price < 500) score += 30;
    else if (property.price < 700) score += 20;
    else if (property.price < 1000) score += 10;
    
    // Distance score (closer is better)
    if (property.distanceFromUniversity < 1) score += 25;
    else if (property.distanceFromUniversity < 2) score += 15;
    else if (property.distanceFromUniversity < 3) score += 10;
    
    // Amenities score
    if (property.furnished) score += 15;
    if (property.bedrooms >= 2) score += 10;
    if (property.amenities?.length > 3) score += 10;
    
    // Availability score
    if (property.availability === 'available') score += 20;
    
    return score;
  }

  /**
   * Transform roommate data for AI drawer
   */
  static transformRoommateForAI(roommate) {
    return {
      id: roommate._id || roommate.id,
      firstName: roommate.firstName || 'Student',
      lastName: roommate.lastName || '',
      major: roommate.major || 'Undeclared',
      university: roommate.university || 'University',
      compatibilityScore: this.calculateCompatibilityScore(roommate),
      budgetRange: roommate.onboardingData?.budgetRange || { min: 0, max: 1000 },
      languageMatch: roommate.languageMatch || false,
      recommendation: this.generateRoommateRecommendation(roommate),
      interests: roommate.interests || [],
      lifestyle: roommate.lifestyle || {},
      avatar: roommate.avatar || null
    };
  }

  /**
   * Calculate compatibility score
   */
  static calculateCompatibilityScore(roommate) {
    let score = 50; // Base score
    
    // Budget compatibility
    if (roommate.onboardingData?.budgetRange) {
      const budget = roommate.onboardingData.budgetRange;
      if (budget.min && budget.max) {
        const avgBudget = (budget.min + budget.max) / 2;
        if (avgBudget > 600) score += 10;
        else if (avgBudget > 400) score += 15;
      }
    }
    
    // Language match
    if (roommate.languageMatch) score += 20;
    
    // University match
    if (roommate.university) score += 10;
    
    // Major compatibility
    if (roommate.major) score += 5;
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Generate roommate recommendation
   */
  static generateRoommateRecommendation(roommate) {
    let recommendation = '';
    
    if (roommate.compatibilityScore > 80) {
      recommendation = '🎯 Perfect match! High compatibility and similar interests.';
    } else if (roommate.compatibilityScore > 60) {
      recommendation = '👍 Great potential! Good compatibility and shared values.';
    } else {
      recommendation = '🤝 Good option! Compatible lifestyle and budget.';
    }
    
    if (roommate.languageMatch) {
      recommendation += ' 🗣️ Same language - easy communication!';
    }
    
    return recommendation;
  }
}

module.exports = PropertyDataTransformer;
