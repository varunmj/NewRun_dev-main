/**
 * Property Text Parser
 * Automatically detects property information from AI text and converts to property cards
 * CEO-level UX transformation from paragraphs to beautiful cards
 */

class PropertyTextParser {
  /**
   * Parse AI text and extract property information
   */
  static parsePropertiesFromText(text) {
    if (!text) return [];

    // Clean the text first - remove S3 URLs and markdown artifacts
    const cleanText = text
      .replace(/https:\/\/newrun-property-images\.s3\.us-east-1\.amazonaws\.com\/[^\s\)]+/g, '')
      .replace(/\[Check it out here\.\]/g, '')
      .replace(/\[See the image\.\]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*Title:\s*"(.*?)"\*/g, '$1')
      .replace(/\*Priority:\*\*/g, '')
      .replace(/\*Message:\*\*/g, '')
      .replace(/\*Action:\*\*/g, '');

    const properties = [];
    
    // Pattern to match property listings in AI text
    const propertyPatterns = [
      // Pattern 1: "1. Sathya Keshav's Apt: At just $300/month..."
      /(\d+)\.\s*([^:]+):\s*At just \$(\d+)\/month[^.]*?(\d+(?:\.\d+)?)\s*miles? from campus[^.]*?([^.]*)/gi,
      
      // Pattern 2: "Sathya Keshav's Apt: $300/month, 4-bedroom..."
      /([^:]+):\s*\$(\d+)\/month[^.]*?(\d+)\s*bedroom[^.]*?(\d+(?:\.\d+)?)\s*miles?[^.]*?([^.]*)/gi,
      
      // Pattern 3: "For $350/month, this 2-bedroom..."
      /For \$(\d+)\/month[^.]*?(\d+)\s*bedroom[^.]*?(\d+(?:\.\d+)?)\s*miles?[^.]*?([^.]*)/gi
    ];

    let match;
    let propertyIndex = 0;

    // Try each pattern with cleaned text
    for (const pattern of propertyPatterns) {
      while ((match = pattern.exec(cleanText)) !== null) {
        const property = this.extractPropertyFromMatch(match, propertyIndex++);
        if (property) {
          properties.push(property);
        }
      }
    }

    // If no patterns matched, try to extract from common property mentions
    if (properties.length === 0) {
      properties.push(...this.extractFromCommonMentions(cleanText));
    }

    return properties;
  }

  /**
   * Extract property data from regex match
   */
  static extractPropertyFromMatch(match, index) {
    try {
      // Clean and extract data based on match groups
      const title = this.cleanPropertyTitle(match[2] || match[1] || 'Property');
      const price = parseInt(match[3] || match[2] || match[1] || '0');
      const bedrooms = parseInt(match[4] || match[3] || '0');
      const distance = parseFloat(match[5] || match[4] || '0');
      const description = match[6] || match[5] || '';

      return {
        id: `property-${index}`,
        title,
        price,
        bedrooms: bedrooms || this.extractBedroomsFromText(description),
        bathrooms: this.extractBathroomsFromText(description),
        address: this.generateAddress(title),
        distanceFromUniversity: distance || this.extractDistanceFromText(description),
        furnished: this.isFurnished(description),
        contactName: this.extractContactName(title),
        contactPhone: this.generatePhoneNumber(),
        contactEmail: this.generateEmail(title),
        recommendation: description || this.generateRecommendation(price, bedrooms, distance),
        availability: 'available',
        rating: this.generateRating(price, distance),
        amenities: this.extractAmenities(description)
      };
    } catch (error) {
      console.error('Property extraction error:', error);
      return null;
    }
  }

  /**
   * Extract properties from common mentions
   */
  static extractFromCommonMentions(text) {
    const properties = [];
    
    // Look for specific property mentions
    const mentions = [
      { name: 'Sathya Keshav\'s Apt', price: 300, bedrooms: 4, bathrooms: 2.5, distance: 1.8 },
      { name: 'Stadium View II Apartment', price: 300, bedrooms: 4, bathrooms: 2, distance: 3.0 },
      { name: 'Lincolnshire West', price: 350, bedrooms: 2, bathrooms: 2, distance: 3.4 },
      { name: 'Cozy 2BHK @ Stadium View 3', price: 900, bedrooms: 2, bathrooms: 1.5, distance: 1.7 }
    ];

    mentions.forEach((mention, index) => {
      if (text.toLowerCase().includes(mention.name.toLowerCase())) {
        properties.push({
          id: `mention-${index}`,
          title: mention.name,
          price: mention.price,
          bedrooms: mention.bedrooms,
          bathrooms: mention.bathrooms,
          address: this.generateAddress(mention.name),
          distanceFromUniversity: mention.distance,
          furnished: mention.price < 400,
          contactName: this.extractContactName(mention.name),
          contactPhone: this.generatePhoneNumber(),
          contactEmail: this.generateEmail(mention.name),
          recommendation: this.generateRecommendation(mention.price, mention.bedrooms, mention.distance),
          availability: 'available',
          rating: this.generateRating(mention.price, mention.distance),
          amenities: this.generateAmenities(mention.price)
        });
      }
    });

    return properties;
  }

  /**
   * Clean property title
   */
  static cleanPropertyTitle(title) {
    return title
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/:\s*$/, '') // Remove trailing colon
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*Title:\s*"(.*?)"\*/g, '$1')
      .trim();
  }

  /**
   * Clean AI text - remove S3 URLs, markdown artifacts, and unwanted elements
   */
  static cleanAIText(text) {
    if (!text) return '';
    
    return text
      // Remove S3 URLs
      .replace(/https:\/\/newrun-property-images\.s3\.us-east-1\.amazonaws\.com\/[^\s\)]+/g, '')
      // Remove image references
      .replace(/\[Check it out here\.\]/g, '')
      .replace(/\[See the image\.\]/g, '')
      // Clean markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*Title:\s*"(.*?)"\*/g, '<strong>$1</strong>')
      .replace(/\*Priority:\*\*/g, '')
      .replace(/\*Message:\*\*/g, '')
      .replace(/\*Action:\*\*/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract bedrooms from text
   */
  static extractBedroomsFromText(text) {
    const match = text.match(/(\d+)\s*bedroom/gi);
    return match ? parseInt(match[0]) : 2;
  }

  /**
   * Extract bathrooms from text
   */
  static extractBathroomsFromText(text) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*bathroom/gi);
    return match ? parseFloat(match[0]) : 1;
  }

  /**
   * Extract distance from text
   */
  static extractDistanceFromText(text) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*miles?/gi);
    return match ? parseFloat(match[0]) : 2.0;
  }

  /**
   * Check if property is furnished
   */
  static isFurnished(text) {
    return /furnished|furniture|furnished|move.?in.?ready/gi.test(text);
  }

  /**
   * Extract contact name from title
   */
  static extractContactName(title) {
    const nameMatch = title.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    return nameMatch ? nameMatch[1] : 'Property Manager';
  }

  /**
   * Generate phone number
   */
  static generatePhoneNumber() {
    return `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  /**
   * Generate email
   */
  static generateEmail(title) {
    const name = title.toLowerCase().replace(/[^a-z]/g, '');
    return `${name}@example.com`;
  }

  /**
   * Generate address
   */
  static generateAddress(title) {
    const addresses = [
      '123 Campus Drive, DeKalb, IL 60115',
      '1315 W Lincoln Hwy, DeKalb, IL 60115',
      '456 University Ave, DeKalb, IL 60115',
      '789 Stadium View, DeKalb, IL 60115'
    ];
    return addresses[Math.floor(Math.random() * addresses.length)];
  }

  /**
   * Generate recommendation text
   */
  static generateRecommendation(price, bedrooms, distance) {
    let recommendation = '';
    
    if (price < 400) {
      recommendation += 'Excellent value for money! ';
    }
    
    if (distance < 2) {
      recommendation += 'Walking distance to campus! ';
    } else if (distance < 3) {
      recommendation += 'Short commute to campus! ';
    }
    
    if (bedrooms >= 3) {
      recommendation += 'Perfect for sharing with roommates! ';
    }
    
    return recommendation.trim() || 'Great option for your needs!';
  }

  /**
   * Generate rating based on price and distance
   */
  static generateRating(price, distance) {
    let rating = 3.5;
    
    if (price < 400) rating += 0.5;
    if (distance < 2) rating += 0.5;
    if (distance < 3) rating += 0.3;
    
    return Math.min(5, Math.round(rating * 10) / 10);
  }

  /**
   * Extract amenities from text
   */
  static extractAmenities(text) {
    const amenities = [];
    const amenityMap = {
      'furnished': 'Furnished',
      'parking': 'Parking',
      'laundry': 'Laundry',
      'ac': 'A/C',
      'internet': 'Internet',
      'gym': 'Gym',
      'pool': 'Pool'
    };

    Object.keys(amenityMap).forEach(key => {
      if (text.toLowerCase().includes(key)) {
        amenities.push(amenityMap[key]);
      }
    });

    return amenities;
  }

  /**
   * Generate amenities based on price
   */
  static generateAmenities(price) {
    const baseAmenities = ['Parking', 'Laundry'];
    
    if (price < 400) {
      return [...baseAmenities, 'A/C'];
    } else if (price < 600) {
      return [...baseAmenities, 'A/C', 'Internet'];
    } else {
      return [...baseAmenities, 'A/C', 'Internet', 'Gym', 'Pool'];
    }
  }
}

export default PropertyTextParser;
