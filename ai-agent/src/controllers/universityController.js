import { generateUniversityInfo } from '../services/bedrockService.js';

/**
 * Controller to handle university information requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUniversityInfo = async (req, res) => {
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  
  console.log(`\n📥 [${requestId}] New university info request`);
  
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
    
    // 3. Respond with successful result
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
 * Test endpoint controller
 */
export const testEndpoint = (req, res) => {
  res.json({
    success: true,
    message: 'University controller is working',
    timestamp: new Date().toISOString()
  });
};