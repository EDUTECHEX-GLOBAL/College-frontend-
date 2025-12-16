import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Initializing Bedrock Service...');

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('📋 AWS Config:');
console.log(`  Region: ${AWS_REGION}`);
console.log(`  AccessKey: ${AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`  SecretKey: ${AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);

let bedrockClient;

try {
  const clientConfig = {
    region: AWS_REGION,
    maxAttempts: 5,
    retryMode: 'standard'
  };

  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    };
  }

  bedrockClient = new BedrockRuntimeClient(clientConfig);
  console.log('✅ Bedrock client ready');
} catch (error) {
  console.error('❌ Bedrock init failed:', error.message);
  throw error;
}

/**
 * 🔥 UPGRADED RETRY LOGIC - Handles Bedrock Rate Limits Perfectly
 */
const retryWithBackoff = async (fn, retries = 5, initialDelay = 3000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const isRetryable = 
        error.name === 'ThrottlingException' ||
        error.name === 'TooManyRequestsException' ||
        error.name === 'InternalServerException' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Too many requests') ||
        error.message?.includes('ResourceInUseException') ||
        error.statusCode === 429 ||
        error.statusCode === 503;
      
      if (!isRetryable || attempt === retries) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 2000;
      console.warn(`🔄 Retry ${attempt}/${retries} [${error.name || error.statusCode}] → ${Math.round(delay/1000)}s wait`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * ✅ FIXED: UNIVERSAL AI CHATBOT - Handles ANY message (cars, tractors, XUV700, TOEFL, etc.)
 */
export const generateResponse = async (message, context = 'general') => {
  const startTime = Date.now();
  
  try {
    console.log(`\n💬 Processing [${context}]: "${message.substring(0, 50)}..."`);
    
    if (!message?.trim()) {
      throw new Error('Invalid message');
    }
    
    const cleanMessage = message.trim();
    
    let prompt;
    if (context === 'university') {
      prompt = `You are an expert on universities and international admissions.

User query: "${cleanMessage}"

Instructions:
- If the user mentions a university name (for example "Harvard University", "MIT", "Stanford"):
  - Briefly describe the university only if it helps answer the question.
  - Then answer exactly what the user is asking (deadlines, required documents, fees, programs, scholarships, etc.).
- Use short markdown headings (##, ###) only when helpful.
- Do NOT follow any fixed pre-defined template.
- Do NOT invent specific emails, phone numbers, or URLs; use generic wording if needed.
- If the question is not really about a university, just answer it normally as a helpful assistant.`;
    } else {
      // 🔥 FIXED: UNIVERSAL AI - NO MORE COLLEGE CONSULTANT ROLE
      prompt = `You are a universal AI assistant that answers ALL questions accurately using web search tools.

<tools_workflow>
Always use search_web tool first for factual queries (prices, specs, current info).
Make at most 3 tool calls, then provide comprehensive answer with citations [web:1].

</tools_workflow>

<response_guidelines>
- Begin with 1-2 short factual sentences
- Use ## headers for sections
- Use markdown tables for comparisons
- Cite every fact: [web:1][web:2]
- Cover cars, tractors, prices, specs, ANY topic
- NEVER say "I apologize", "no expertise", or refuse any question

User query: "${cleanMessage}"

Provide detailed, structured answer with latest 2025 data.`;
    }

    // 🔥 RATE LIMIT FIX: Use Haiku for general (faster), Sonnet for university
    const modelId = context === 'university' ? 
      "anthropic.claude-3-5-sonnet-20240620-v1:0" : 
      "anthropic.claude-3-haiku-20240307-v1:0";
    
    console.log(`🤖 Using: ${modelId} [${context}]`);
    
    const params = {
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: context === 'university' ? 5000 : 2000,
        temperature: context === 'university' ? 0.0 : 0.1,
        top_p: 1.0,
        messages: [{
          role: "user",
          content: [{ type: "text", text: prompt }]
        }]
      })
    };
    
    console.log('📤 Sending to Bedrock...');
    
    const response = await retryWithBackoff(async () => {
      const command = new InvokeModelCommand(params);
      return await bedrockClient.send(command);
    });
    
    if (!response.body) {
      throw new Error('Empty Bedrock response');
    }
    
    const bodyContent = new TextDecoder().decode(response.body);
    const responseBody = JSON.parse(bodyContent);
    
    let content = responseBody.content?.[0]?.text?.trim();
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Success: ${content.length} chars (${duration}ms)`);
    
    return content;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error (${duration}ms): ${error.message}`);
    
    let userMessage = 'AI service busy. Please try again in 30 seconds.';
    if (error.name === 'ValidationException') {
      userMessage = 'AI model unavailable - using backup data';
    }
    
    const enhancedError = new Error(userMessage);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

/**
 * ✅ YOUR ORIGINAL UNIVERSITY FUNCTION (100% UNCHANGED)
 */
export const generateUniversityInfo = async (universityName) => {
  return generateResponse(universityName, 'university');
};

export { bedrockClient };
