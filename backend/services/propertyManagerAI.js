/**
 * Property Manager AI Service
 * Acts as a virtual property manager for specific properties
 * Provides accurate, property-specific responses without hallucination
 */

const axios = require('axios');

class PropertyManagerAI {
  constructor() {
    this.openaiApiKey = process.env.NEWRUN_APP_OPENAI_API_KEY;
  }

  /**
   * Generate Property Manager AI response
   * Only answers from property knowledge base - no hallucination
   */
  async generatePropertyResponse(property, user, userMessage, propertyContext, isFollowUp = false) {
    try {
      console.log('🏠 Property Manager AI: Generating response for property:', property.title);

      // Build comprehensive property knowledge base
      const propertyKnowledge = this.buildPropertyKnowledgeBase(property, propertyContext);
      
      // Create strict system prompt to prevent hallucination
      const systemPrompt = this.createPropertyManagerPrompt(propertyKnowledge);
      
      // Create user prompt with context
      const userPrompt = this.createUserPrompt(user, userMessage, propertyKnowledge, isFollowUp);

      // Call OpenAI with strict instructions
      const response = await this.callOpenAI(systemPrompt, userPrompt);
      
      return {
        success: true,
        response: response,
        propertyId: property._id,
        timestamp: new Date().toISOString(),
        source: 'property_manager_ai'
      };

    } catch (error) {
      console.error('❌ Property Manager AI Error:', error);
      return {
        success: false,
        response: "I'm having trouble accessing property information right now. Please try again or contact the host directly.",
        error: error.message
      };
    }
  }

  /**
   * Build comprehensive property knowledge base
   */
  buildPropertyKnowledgeBase(property, propertyContext = {}) {
    const host = property.userId || {};
    
    return {
      // Core Property Information
      property: {
        id: property._id,
        title: property.title,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        distanceFromUniversity: property.distanceFromUniversity,
        address: property.address,
        availabilityStatus: property.availabilityStatus,
        images: property.images || [],
        description: property.description || property.content || '',
        tags: property.tags || [],
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        isFeatured: property.isFeatured || false,
        likesCount: property.likes ? property.likes.length : 0
      },
      
      // Host Information
      host: {
        name: `${host.firstName || ''} ${host.lastName || ''}`.trim() || property.contactInfo?.name || 'Property Owner',
        university: host.university || 'University',
        major: host.major || 'Student',
        contactInfo: property.contactInfo || {}
      },
      
      // Location Context
      location: {
        fullAddress: this.formatAddress(property.address),
        city: property.address?.city || '',
        state: property.address?.state || '',
        university: host.university || 'University',
        campusName: host.campusDisplayName || host.campusLabel || 'Campus'
      },
      
      // Additional Context
      context: {
        currentDate: new Date().toISOString(),
        university: host.university || 'University',
        marketData: propertyContext.marketData || {},
        similarProperties: propertyContext.similarProperties || [],
        userProfile: propertyContext.userProfile || {}
      }
    };
  }

  /**
   * Create strict system prompt to prevent hallucination
   */
  createPropertyManagerPrompt(knowledgeBase) {
    return `You are NewRun Property Manager AI, a virtual assistant for this specific property. You represent the property owner and help potential tenants with questions.

CRITICAL RULES - NEVER BREAK THESE:
1. ONLY answer questions using the property information provided below
2. NEVER make up or guess information not in the knowledge base
3. If you don't know something, say "I don't have that information, but I can connect you with the host"
4. Always be helpful, professional, and student-friendly
5. Focus on practical information that helps students make housing decisions

PROPERTY KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

CAPABILITIES:
- Answer questions about property details, pricing, location, amenities
- Provide information about the neighborhood and university proximity
- Help with tour scheduling and viewing arrangements
- Explain rental terms and availability
- Connect users with the host for complex questions

RESPONSE STYLE:
- For FIRST messages: Start with a friendly greeting using the student's first name (e.g., "Hey [Name]!" or "Hi [Name]!")
- For FOLLOW-UP messages: Do NOT repeat the greeting, just answer directly and helpfully
- Be conversational, motivating, and specific like the main NewRun AI insights
- Reference their timeline, budget, preferences, and current status when available
- Keep responses concise (120-180 words) and end with 2-3 actionable next steps
- Use **bold** formatting for important information like property names, prices, and key details
- Be encouraging and helpful, like a knowledgeable friend
- Format: For first message: "Hey [Name]! [Your helpful response] Here's what you can do next: 1. [Action 1] 2. [Action 2] 3. [Action 3]"
- Format: For follow-up: "[Your helpful response] Here's what you can do next: 1. [Action 1] 2. [Action 2] 3. [Action 3]"

Remember: You are representing this specific property. Stay within the knowledge base provided.`;
  }

  /**
   * Create user prompt with context
   */
  createUserPrompt(user, userMessage, knowledgeBase, isFollowUp = false) {
    return `Student Profile:
- Name: ${user.firstName || 'Student'} ${user.lastName || ''}
- University: ${user.university || 'University'}
- Major: ${user.major || 'Student'}
- Current Location: ${user.currentLocation || 'Not specified'}

Student Question: "${userMessage}"

Property Context: ${knowledgeBase.property.title} - $${knowledgeBase.property.price}/month
Location: ${knowledgeBase.location.fullAddress}
Distance from ${knowledgeBase.context.university}: ${knowledgeBase.property.distanceFromUniversity} miles

${isFollowUp ? 'This is a follow-up question in an ongoing conversation. Do NOT repeat the greeting.' : 'This is the first message in the conversation. Start with a friendly greeting.'}

Please provide a helpful response based on the property information provided.`;
  }

  /**
   * Call OpenAI API with error handling
   */
  async callOpenAI(systemPrompt, userPrompt) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  /**
   * Format address for display
   */
  formatAddress(address) {
    if (!address) return 'Address not available';
    const { street, city, state, zipCode } = address;
    return [street, city, state, zipCode].filter(Boolean).join(', ');
  }

  /**
   * Generate tour scheduling response
   */
  async generateTourSchedulingResponse(property, user, requestedDateTime) {
    const knowledgeBase = this.buildPropertyKnowledgeBase(property);
    
    const systemPrompt = `You are NewRun Property Manager AI helping with tour scheduling.

PROPERTY INFORMATION:
${JSON.stringify(knowledgeBase.property, null, 2)}

HOST CONTACT:
${JSON.stringify(knowledgeBase.host, null, 2)}

You can help schedule tours and coordinate with the host. Be helpful and professional.`;

    const userPrompt = `Student wants to schedule a tour for: ${requestedDateTime}
Student: ${user.firstName} ${user.lastName}
Email: ${user.email}

Help them schedule this tour and provide next steps.`;

    try {
      const response = await this.callOpenAI(systemPrompt, userPrompt);
      return {
        success: true,
        response: response,
        tourScheduled: true,
        nextSteps: [
          'Host will be notified of your tour request',
          'You will receive confirmation via email',
          'Host will contact you to confirm the exact time'
        ]
      };
    } catch (error) {
      return {
        success: false,
        response: "I can help you schedule a tour! Please contact the host directly to arrange a convenient time.",
        error: error.message
      };
    }
  }

  /**
   * Generate property insights and recommendations
   */
  async generatePropertyInsights(property, user) {
    const knowledgeBase = this.buildPropertyKnowledgeBase(property);
    
    const systemPrompt = `You are NewRun Property Manager AI providing property insights.

PROPERTY INFORMATION:
${JSON.stringify(knowledgeBase.property, null, 2)}

STUDENT PROFILE:
${JSON.stringify(user, null, 2)}

RESPONSE STYLE:
- ALWAYS start with a friendly greeting using the student's first name (e.g., "Hey [Name]!" or "Hi [Name]!")
- Be conversational, motivating, and specific like the main NewRun AI insights
- Reference their timeline, budget, preferences, and current status when available
- Keep responses concise (120-180 words) and end with 2-3 actionable next steps
- Use **bold** formatting for important information like property names, prices, and key details
- Be encouraging and helpful, like a knowledgeable friend
- Format: "Hey [Name]! [Your helpful insights] Here's what you can do next: 1. [Action 1] 2. [Action 2] 3. [Action 3]"

Provide helpful insights about this property for this specific student. Focus on practical information.`;

    const userPrompt = `Provide insights about this property for this student. Include:
1. Property highlights
2. Location benefits
3. Value assessment
4. Any considerations
5. Next steps

Be specific and helpful.`;

    try {
      const response = await this.callOpenAI(systemPrompt, userPrompt);
      return {
        success: true,
        insights: response,
        propertyId: property._id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        insights: "I can provide insights about this property. Please ask me specific questions!",
        error: error.message
      };
    }
  }
}

module.exports = new PropertyManagerAI();
