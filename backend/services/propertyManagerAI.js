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
      
      // Deterministic handling for common direct questions
      const msg = String(userMessage || '').toLowerCase();
      const nextSteps = [
        'Use the in-app "Message Host" button for specifics',
        'Tap "Request Contact Info" if you need direct details',
        'Ask me anything else about this place'
      ];
      const formatNext = (lines) => `\n\nHere are a couple of next steps:\n1) ${lines[0]}\n2) ${lines[1]}\n3) ${lines[2]}`;
      const actionSuggestions = [
        { type: 'message_host', label: 'Message Host', propertyId: String(property._id) },
        { type: 'request_contact', label: 'Request Contact Info', propertyId: String(property._id) }
      ];

      // Pet policy
      if (/\bpet|pets|dog|cat|pet[- ]?friendly\b/.test(msg)) {
        const flag = propertyKnowledge.property?.amenities?.petsAllowed;
        let response;
        if (flag === true) {
          response = `This property is **pet-friendly**. If you have specific pet types or size questions, I can help you check with the host in-app.${formatNext(nextSteps)}`;
        } else if (flag === false) {
          response = `This property **does not allow pets** based on the current listing details.${formatNext(nextSteps)}`;
        } else {
          response = `The listing **doesn’t specify** a pet policy. I can reach out to the host for you via in-app messaging and confirm.${formatNext(nextSteps)}`;
        }
        return {
          success: true,
          response: this.sanitizeOutput(response),
          propertyId: property._id,
          timestamp: new Date().toISOString(),
          source: 'property_manager_ai',
          actionSuggestions
        };
      }

      // Create strict system prompt to prevent hallucination
      const systemPrompt = this.createPropertyManagerPrompt(propertyKnowledge);
      
      // Create user prompt with context
      const userPrompt = this.createUserPrompt(user, userMessage, propertyKnowledge, isFollowUp);

      // Call OpenAI with strict instructions
      const response = await this.callOpenAI(systemPrompt, userPrompt);
      
      return {
        success: true,
        response: this.sanitizeOutput(response),
        propertyId: property._id,
        timestamp: new Date().toISOString(),
        source: 'property_manager_ai',
        actionSuggestions
      };

    } catch (error) {
      // Avoid dumping axios config/headers (which can include API keys) to logs
      this.safeLogAxiosError(error, 'Property Manager AI Error');
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
        likesCount: property.likes ? property.likes.length : 0,
        // Derived amenities and policies
        amenities: {
          // naive pet detection from tags/description
          petsAllowed: (() => {
            const text = `${(property.tags || []).join(' ').toLowerCase()} ${(property.description || property.content || '').toLowerCase()}`;
            if (!text) return null;
            if (/no\s*pets|not\s*pet[- ]?friendly|pets\s*not\s*allowed/.test(text)) return false;
            if (/pet[- ]?friendly|pets\s*ok|pets\s*allowed|cat\s*ok|dog\s*ok/.test(text)) return true;
            return null; // unknown
          })()
        }
      },
      
      // Host Information
      host: {
        name: `${host.firstName || ''} ${host.lastName || ''}`.trim() || property.contactInfo?.name || 'Property Owner',
        university: host.university || 'University',
        major: host.major || 'Student',
        // Explicitly redact contact details to adhere to privacy gating
        contactInfo: {
          name: (property.contactInfo && property.contactInfo.name) || `${host.firstName || ''} ${host.lastName || ''}`.trim() || 'Property Owner',
          phone: null,
          email: null
        }
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
6. NEVER disclose phone numbers, email addresses, or direct contact details. If contact is needed, instruct the user to use in-app "Message Host" or "Request Contact Info".
7. Do not include any strings resembling phone numbers or emails in your response. Use generic phrasing like "the host" and refer to in-app actions only.

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
 - If the question is about pets and the knowledge base has amenities.petsAllowed:
   - If true: state clearly that pets are allowed and mention any nuance if present.
   - If false: state that pets are not allowed.
   - If null: state that the pet policy isn't listed and offer to message the host via in-app tools without exposing contact details.

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
    // Retry with exponential backoff on rate limits and transient errors
    const maxAttempts = 4;
    const baseDelayMs = 600; // starting delay

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        }, {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
          validateStatus: (s) => s >= 200 && s < 300 // throw on anything else
        });
        return response.data.choices[0].message.content;
      } catch (err) {
        const status = err?.response?.status;
        const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '');
        const isRetryable = status === 429 || (status >= 500 && status < 600) || isTimeout || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';

        if (attempt >= maxAttempts || !isRetryable) {
          throw err;
        }

        // Calculate delay using Retry-After header when present
        const retryAfter = this.parseRetryAfterSeconds(err?.response?.headers?.['retry-after']);
        const backoffMs = retryAfter != null
          ? retryAfter * 1000
          : Math.min(8000, Math.round(baseDelayMs * Math.pow(2, attempt - 1)));
        const jitter = Math.floor(Math.random() * 250);
        const waitMs = backoffMs + jitter;

        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  /**
   * Sanitize AI output for privacy: mask phone numbers and emails
   */
  sanitizeOutput(text) {
    if (!text || typeof text !== 'string') return text;
    let out = text;
    // Mask emails
    out = out.replace(/([A-Z0-9._%+-])[A-Z0-9._%+-]*(@[A-Z0-9.-]+\.[A-Z]{2,})/gi, (m, first, domain) => `${first}•••••${domain}`);
    // Mask phone numbers (various formats)
    out = out.replace(/\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g, (m) => {
      // Keep last 2 digits
      const digits = m.replace(/\D/g, '');
      const masked = digits.slice(0, -2).replace(/\d/g, '•') + digits.slice(-2);
      return masked;
    });
    return out;
  }

  /**
   * Parse Retry-After header (seconds) safely
   */
  parseRetryAfterSeconds(headerValue) {
    if (!headerValue) return null;
    // numeric seconds or HTTP-date; we only support numeric here
    const seconds = parseInt(String(headerValue).trim(), 10);
    return Number.isFinite(seconds) ? seconds : null;
  }

  /**
   * Log axios errors without leaking sensitive headers
   */
  safeLogAxiosError(error, label = 'AxiosError') {
    const status = error?.response?.status;
    const message = error?.response?.data?.error?.message || error?.message;
    const requestId = error?.response?.headers?.['x-request-id'];
    const retryAfter = error?.response?.headers?.['retry-after'];
    console.error(`❌ ${label}:`, { status, message, requestId, retryAfter, code: error?.code });
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

  /**
   * Draft an initial outreach message to the host for user approval
   */
  async generateHostOutreachDraft(property, user) {
    const knowledgeBase = this.buildPropertyKnowledgeBase(property);
    const systemPrompt = `You are NewRun Property Manager AI. Draft a concise, friendly first message from a student tenant to the host about the property below. Keep it 4-6 sentences, polite, and include:
1) Brief intro (name, university)
2) Interest in the specific property
3) Move-in timing and key questions (pet policy, utilities included, tour availability)
4) Close with appreciation and preferred contact via NewRun messaging only.

Do not include phone numbers or emails. Keep it plaintext.`;
    const userPrompt = `Student: ${user.firstName || 'Student'} ${user.lastName || ''}, ${user.university || 'University'}
Property: ${knowledgeBase.property.title}, $${knowledgeBase.property.price}/month, ${knowledgeBase.location.fullAddress}
Student preferences if known: ${JSON.stringify(user.onboardingData || {}, null, 0)}

Draft the message.`;
    try {
      const response = await this.callOpenAI(systemPrompt, userPrompt);
      return { success: true, isDraft: true, response: 'I prepared a draft you can send to the host.', draft: response };
    } catch (e) {
      return { success: true, isDraft: true, response: 'Here\'s a quick draft you can send to the host.', draft: `Hi there! I\\'m interested in ${knowledgeBase.property.title}. Could you share the pet policy and whether utilities are included? I\\'m looking to schedule a tour soon—happy to coordinate here on NewRun. Thanks!` };
    }
  }
}

module.exports = new PropertyManagerAI();
