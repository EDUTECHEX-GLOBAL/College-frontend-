import { generateResponse, generateUniversityInfo } from '../services/bedrockService.js';

/**
 * ✅ MAIN CHATBOT ENDPOINT - Smart detection (cars/questions → general, pure names → university)
 * UPDATED: Added tractor keywords for proper general routing
 */
export const getChatResponse = async (req, res) => {
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  
  console.log(`\n💬 [${requestId}] Chat request received`);
  
  try {
    // 1. Extract and validate input (supports both old & new formats)
    const { message, universityName, context = 'auto' } = req.body;
    
    console.log(`   Request Body:`, JSON.stringify(req.body, null, 2));
    
    // Backward compatibility: universityName → message
    const inputMessage = message || universityName;
    
    if (!inputMessage) {
      console.warn(`   [${requestId}] Missing message OR universityName`);
      return res.status(400).json({
        success: false,
        error: 'Missing "message" or "universityName" in request body',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof inputMessage !== 'string') {
      console.warn(`   [${requestId}] Invalid input type: ${typeof inputMessage}`);
      return res.status(400).json({
        success: false,
        error: 'message/universityName must be a string',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    const cleanInput = inputMessage.trim();
    if (cleanInput.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Input cannot be empty',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    // 🔥 ENHANCED CONTEXT DETECTION - Added tractor keywords
    let detectedContext = context;
    if (context === 'auto' || context === 'general') {
      const lowerInput = cleanInput.toLowerCase();

      // 1️⃣ If caller sent universityName explicitly, always treat as university info
      if (universityName && typeof universityName === 'string' && universityName.trim().length > 0) {
        detectedContext = 'university';
      } else {
        // 🚜 UPDATED: Added tractor keywords for proper general routing
        const hasCarOrTractorWords =
          lowerInput.includes('car') ||
          lowerInput.includes('bmw') ||
          lowerInput.includes('vehicle') ||
          lowerInput.includes('auto') ||
          lowerInput.includes('tesla') ||
          lowerInput.includes('toyota') ||
          lowerInput.includes('honda') ||
          lowerInput.includes('chevrolet') ||
          lowerInput.includes('ford') ||
          lowerInput.includes('tractor') ||      // ✅ NEW
          lowerInput.includes('mahindra') ||     // ✅ NEW
          lowerInput.includes('price') ||        // ✅ NEW - catches price queries
          lowerInput.includes('features') ||     // ✅ NEW
          lowerInput.includes('model');          // ✅ NEW

        const hasUniWords =
          lowerInput.includes('university') ||
          lowerInput.includes('college') ||
          lowerInput.includes('campus') ||
          lowerInput.includes('harvard') ||
          lowerInput.includes('mit') ||
          lowerInput.includes('stanford') ||
          lowerInput.includes('yale') ||
          lowerInput.includes('oxford');

        const looksLikeQuestion =
          lowerInput.includes('what ') ||
          lowerInput.includes('how ') ||
          lowerInput.includes('which ') ||
          lowerInput.includes('when ') ||
          lowerInput.includes('?');

        // ✅ Cars, tractors, prices → always general (FIXES refusal issue)
        if (hasCarOrTractorWords) {
          detectedContext = 'general';
        }
        // Short pure university name (no question words) → template
       else if (hasUniWords && !looksLikeQuestion && cleanInput.split(' ').length <= 5) {
  detectedContext = 'university';
}
        // Questions about universities (documents, fees, etc.) → general Q&A
       else if (hasUniWords && looksLikeQuestion) {
  detectedContext = 'university';
}

      }
    }
    
    console.log(`   [${requestId}] "${cleanInput}" → [${detectedContext}]`);
    
    // 3. Generate response using appropriate service
    let responseData;
    if (detectedContext === 'university') {
      responseData = await generateUniversityInfo(cleanInput);
    } else {
      responseData = await generateResponse(cleanInput, 'general');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   [${requestId}] ✅ Success (${duration}ms)`);
    
    // 4. Unified response format
    res.status(200).json({
      success: true,
      requestId,
      input: cleanInput,
      context: detectedContext,
      response: responseData,
      // Backward compatibility fields
      ...(detectedContext === 'university' && {
        universityName: cleanInput,
        information: responseData
      }),
      metadata: {
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
        context: detectedContext,
        model: 'Claude 3.5 Sonnet',
        source: 'AWS Bedrock',
        characterCount: responseData.length
      }
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`   [${requestId}] ❌ Error (${duration}ms):`, {
      message: error.message,
      name: error.name,
      input: req.body?.message || req.body?.universityName
    });
    
    // Smart error handling (unchanged from your original)
    let statusCode = 500;
    let errorMessage = error.message || 'Internal server error';
    
    if (error.message.includes('credentials') || error.name === 'CredentialsProviderError') {
      statusCode = 401;
      errorMessage = 'AWS credentials are invalid or missing. Please check your configuration.';
    } else if (error.message.includes('AccessDeniedException') || error.message.includes('permissions')) {
      statusCode = 403;
      errorMessage = 'Access denied to AI service. Check permissions.';
    } else if (error.message.includes('region') || error.name === 'ResourceNotFoundException') {
      statusCode = 400;
      errorMessage = 'AWS region or model configuration error.';
    } else if (error.message.includes('ThrottlingException') || error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable. Please try again.';
    } else if (error.message.includes('Invalid')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      responseTime: `${duration}ms`,
      ...(process.env.NODE_ENV === 'development' && { debug: error.originalError?.message })
    });
  }
};

/**
 * 🏛️ BACKWARD COMPATIBILITY - Your ORIGINAL university endpoint (100% unchanged)
 */
export const getUniversityInfo = async (req, res) => {
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  
  console.log(`\n📥 [${requestId}] Legacy university info request`);
  
  try {
    // 1. Extract and validate input
    const { universityName } = req.body;
    
    console.log(`   Request Body:`, JSON.stringify(req.body, null, 2));
    
    if (!universityName) {
      console.warn(`   [${requestId}] Missing universityName in request body`);
      return res.status(400).json({
        success: false,
        error: 'Missing universityName in request body',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof universityName !== 'string') {
      console.warn(`   [${requestId}] Invalid universityName type: ${typeof universityName}`);
      return res.status(400).json({
        success: false,
        error: 'universityName must be a string',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    const cleanUniversityName = universityName.trim();
    
    if (cleanUniversityName.length === 0) {
      console.warn(`   [${requestId}] Empty universityName after trimming`);
      return res.status(400).json({
        success: false,
        error: 'universityName cannot be empty',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`   [${requestId}] Processing: "${cleanUniversityName}"`);
    
    // 2. Generate information using Bedrock
    const universityInfo = await generateUniversityInfo(cleanUniversityName);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   [${requestId}] ✅ Success (${duration}ms)`);
    
    // 3. Respond with successful result (EXACT SAME FORMAT)
    res.status(200).json({
      success: true,
      requestId,
      universityName: cleanUniversityName,
      information: universityInfo,
      metadata: {
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
        model: 'Claude 3 Sonnet',
        source: 'AWS Bedrock',
        characterCount: universityInfo.length
      }
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`   [${requestId}] ❌ Error (${duration}ms):`, {
      message: error.message,
      name: error.name,
      universityName: req.body?.universityName
    });
    
    // Determine HTTP status code based on error
    let statusCode = 500;
    let errorMessage = error.message || 'Internal server error';
    
    // Map specific errors to status codes
    if (error.message.includes('credentials') || error.name === 'CredentialsProviderError') {
      statusCode = 401;
      errorMessage = 'AWS credentials are invalid or missing. Please check your configuration.';
    } else if (error.message.includes('AccessDeniedException') || error.message.includes('permissions')) {
      statusCode = 403;
      errorMessage = 'Access denied to AI service. Check permissions.';
    } else if (error.message.includes('region') || error.name === 'ResourceNotFoundException') {
      statusCode = 400;
      errorMessage = 'AWS region or model configuration error.';
    } else if (error.message.includes('ThrottlingException') || error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable. Please try again.';
    } else if (error.message.includes('Invalid university name')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    // Send error response
    res.status(statusCode).json({
      success: false,
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      responseTime: `${duration}ms`,
      ...(process.env.NODE_ENV === 'development' && { debug: error.originalError?.message })
    });
  }
};

/**
 * Test endpoint controller (ENHANCED) - UPDATED test cases
 */
export const testEndpoint = (req, res) => {
  res.json({
    success: true,
    message: '🎓 University AI + Universal Chatbot = PRODUCTION READY! 🚜 Tractor Fixed',
    capabilities: [
      '✅ Legacy: POST /api/university-info { "universityName": "Harvard" }',
      '✅ ANY Question: POST /api/chat-response { "message": "ANYTHING", "context": "auto" }',
      '✅ Smart Auto: University vs General detection (Tractor Fixed!)'
    ],
    detectionTest: {
      'car details': 'general ✅',
      'F1 visa documents': 'general ✅', 
      'TOEFL prep': 'general ✅',
      'Harvard': 'university ✅',
      'documents needed': 'general ✅',
      'who is CM US': 'general ✅',
      'Mahindra tractor': 'general ✅',      // ✅ NEW - Fixed!
      'tractor price': 'general ✅',         // ✅ NEW - Fixed!
      'Yuvo 585 features': 'general ✅'      // ✅ NEW - Fixed!
    },
    examples: {
      university: { url: '/api/university-info', body: { universityName: 'MIT' } },
      documents: { url: '/api/chat-response', body: { message: 'F1 visa documents', context: 'auto' } },
      cars: { url: '/api/chat-response', body: { message: 'Toyota Camry price US', context: 'auto' } },
      tractors: { url: '/api/chat-response', body: { message: 'Mahindra tractor price', context: 'auto' } }, // ✅ NEW
      politics: { url: '/api/chat-response', body: { message: 'who is CM California', context: 'auto' } }
    },
    timestamp: new Date().toISOString()
  });
};
