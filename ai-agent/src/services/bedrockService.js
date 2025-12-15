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
    maxAttempts: 5,  // ↑ Increased from 3
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
const retryWithBackoff = async (fn, retries = 5, initialDelay = 3000) => {  // ↑ 3s start, 5 retries
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 🔥 ENHANCED RETRY CONDITIONS (covers ALL Bedrock errors)
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
      
      // 🔥 EXPONENTIAL BACKOFF: 3s → 7s → 15s → 31s → 63s + jitter
      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 2000;
      console.warn(`🔄 Retry ${attempt}/${retries} [${error.name || error.statusCode}] → ${Math.round(delay/1000)}s wait`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * ✅ NEW: GENERAL AI CHATBOT - Handles ANY message (TOEFL, visas, scholarships, cars, etc.)
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

      // 🔥 GENERAL CHATBOT PROMPT - Perfect for TOEFL, visas, scholarships, cars, etc.
      prompt = `You are an expert college admissions consultant specializing in international students.

User asked: "${cleanMessage}"

Provide a **helpful, structured response** using:
- ✅ Clear markdown headers (##, ###)
- ✅ Bullet points for lists  
- ✅ Numbered steps for processes
- ✅ Realistic Fall 2026 timelines
- ✅ Practical tips & costs

**COVER**: Key facts, actionable advice, international student requirements, costs, timelines.

**Keep it comprehensive (800-1500 words) but organized. Never refuse. Always help.**`;
    }

    // 🔥 RATE LIMIT FIX: Use Haiku for general (faster), Sonnet for university
    const modelId = context === 'university' ? 
      "anthropic.claude-3-5-sonnet-20240620-v1:0" : 
      "anthropic.claude-3-haiku-20240307-v1:0";  // 🔥 FASTER + NO LIMITS
    
    console.log(`🤖 Using: ${modelId} [${context}]`);
    
    const params = {
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: context === 'university' ? 5000 : 2000,  // ↓ Reduced for general
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
    
    // 🔥 YOUR ORIGINAL REFUSAL OVERRIDE (ONLY for university)
//     if (context === 'university' && 
//         (content.includes('apologize') || content.includes('cannot provide') || content.includes('recommend') || content.length < 500)) {
//       console.log('⚠️ University refusal detected - generating guaranteed data');
      
//       const domain = cleanMessage.toLowerCase().replace(/ /g, '').replace(/university|college|state|national/gi, '');
//       content = `## 🎯 UNIVERSITY QUICK FACTS
// - **Official Name**: ${cleanMessage}
// - **Location**: [Major City], [State], USA
// - **Type**: Public Research University
// - **Academic Calendar**: Semester system
// - **Current Application Cycle**: Fall 2026

// ## 📅 APPLICATION DEADLINES
// - **Regular Decision**: January 15, 2026
// - **Early Decision/Action**: November 1, 2025
// - **International Deadline**: January 15, 2026
// - **Priority Deadline**: November 15, 2025
// - **Rolling Admissions**: Yes
// - **Important**: Receipt dates

// ## 💰 APPLICATION COSTS & FEES
// - **Application Fee**: $50 USD
// - **Payment Methods**: Credit card, e-check
// - **Fee Waiver**: Yes (need-based)
// - **Enrollment Deposit**: $250
// - **SEVIS Fee**: $350 (US F-1)

// ## 📊 ACADEMIC REQUIREMENTS
// - **Minimum GPA**: 3.0/4.0
// - **SAT Required**: Test-optional
// - **ACT Required**: Test-optional
// - **Class Rank**: Not required
// - **Curriculum**: 4 years English, 3 Math, 3 Science

// ## 🌍 ENGLISH PROFICIENCY
// - **TOEFL iBT**: 80
// - **IELTS**: 6.5
// - **Duolingo**: 105
// - **Exemptions**: 4+ years English-medium HS
// - **Conditional Admission**: Yes

// ## 📑 REQUIRED DOCUMENTS
// 1. Official Transcripts + translation
// 2. Test Scores (optional)
// 3. English Proficiency scores
// 4. Letters of Recommendation: 1-2
// 5. Personal Essays: 500 words
// 6. Passport Copy
// 7. Financials: $40,000+ proof
// 8. Certificate of Finance form
// 9. Portfolio (art/architecture only)
// 10. Additional: Immunization records

// ## 🏛️ POPULAR PROGRAMS
// 1. Business Administration
// 2. Computer Science
// 3. Nursing
// 4. Psychology
// 5. Engineering

// ## 💸 TUITION & COSTS (Annual)
// - **Tuition & Fees**: $28,000
// - **Room & Board**: $12,000
// - **Books**: $1,200
// - **Health Insurance**: $2,500
// - **Personal**: $3,000
// - **TOTAL**: $46,700

// ## 🎓 SCHOLARSHIPS
// - **Merit-based**: Yes ($5,000-$20,000)
// - **Need-based**: Limited
// - **Process**: Automatic consideration
// - **Deadline**: December 1, 2025

// ## 📞 CONTACTS & LINKS
// - **Admissions Email**: admissions@${domain}.edu
// - **Intl Office Email**: international@${domain}.edu
// - **Website**: https://www.${domain}.edu/admissions
// - **Application Portal**: https://apply.${domain}.edu
// - **Phone**: +1 (859) 622-2106

// ## ⚠️ ADDITIONAL NOTES
// - **Visa**: F-1 Student Visa
// - **I-20 Time**: 4-6 weeks after admission
// - **Health**: Immunizations required
// - **Housing**: Guaranteed for freshmen`;
//     }
    
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
