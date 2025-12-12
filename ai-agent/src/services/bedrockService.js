import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Initializing Bedrock Service...');

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Log AWS configuration (masking sensitive data)
console.log('📋 AWS Configuration:');
console.log(`   Region: ${AWS_REGION}`);
console.log(`   Access Key ID: ${AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Secret Access Key: ${AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials are incomplete!');
  console.error('💡 Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
}

// Create Bedrock client
let bedrockClient;

try {
  const clientConfig = {
    region: AWS_REGION
  };

  // Only add credentials if they are provided
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    };
  } else {
    console.warn('⚠️  AWS credentials not provided. Bedrock will use default AWS credentials chain.');
  }

  // Add retry configuration
  clientConfig.maxAttempts = 3;
  clientConfig.retryMode = 'standard';

  bedrockClient = new BedrockRuntimeClient(clientConfig);
  console.log('✅ Bedrock client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Bedrock client:', error.message);
  throw error;
}

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, retries = 3, initialDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = 
        error.name === 'ThrottlingException' ||
        error.name === 'TooManyRequestsException' ||
        error.name === 'InternalServerException' ||
        error.message.includes('timeout') ||
        error.message.includes('rate exceeded') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT';
      
      if (!isRetryable || attempt === retries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`⏳ Retry attempt ${attempt}/${retries} after ${Math.round(delay)}ms: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Generate university information using AWS Bedrock
 * @param {string} universityName - Name of the university
 * @returns {Promise<string>} - Generated information in markdown format
 */
export const generateUniversityInfo = async (universityName) => {
  const startTime = Date.now();
  
  try {
    console.log(`\n🎓 Processing request for university: "${universityName}"`);
    
    // Validate input
    if (!universityName || typeof universityName !== 'string' || universityName.trim().length === 0) {
      throw new Error('Invalid university name. Please provide a valid university name.');
    }
    
    const cleanUniversityName = universityName.trim();
    console.log(`✅ Cleaned input: "${cleanUniversityName}"`);
    
    // ============================================
    // UPDATED: MUCH BETTER PROMPT FOR ADMISSION DETAILS
    // ============================================
    const prompt = `You are an expert international student admissions advisor. Provide VERY SPECIFIC and ACTIONABLE admission information for ${cleanUniversityName} for Fall 2025 undergraduate intake.

CRITICAL: Provide EXACT details, numbers, dates, and specific requirements. If information is not available, provide typical requirements for similar universities in the same country.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS WITH THESE SECTIONS:

## 🎯 UNIVERSITY QUICK FACTS
- **Official Name**: 
- **Location**: 
- **Type**: (Public/Private)
- **Academic Calendar**: 
- **Current Application Cycle**: (e.g., Fall 2025)

## 📅 APPLICATION DEADLINES (MUST PROVIDE DATES)
- **Regular Decision Deadline**: (exact date or month)
- **Early Decision/Action Deadline**: (date or "Not offered")
- **International Student Deadline**: (if different)
- **Priority Deadline**: (if any)
- **Rolling Admissions**: (yes/no)
- **Important**: Mention if deadlines are "postmark" or "receipt" dates

## 💰 APPLICATION COSTS & FEES
- **Application Fee**: $[EXACT AMOUNT] USD
- **Payment Methods**: (credit card, bank transfer, etc.)
- **Fee Waiver Options**: (yes/no and conditions)
- **Enrollment Deposit**: $[AMOUNT] if required
- **SEVIS Fee**: $350 (for US F-1 visa)

## 📊 ACADEMIC REQUIREMENTS (EXACT NUMBERS)
- **Minimum GPA Requirement**: [X]/4.0 scale OR [X]% minimum
- **SAT Required**: (yes/no) • If yes: Minimum [SCORE] • Average admitted: [SCORE RANGE]
- **ACT Required**: (yes/no) • If yes: Minimum [SCORE] • Average admitted: [SCORE RANGE]
- **Class Rank**: (required/not required) • If required: Top [X]%
- **High School Curriculum**: Specific course requirements (Math, Science, etc.)

## 🌍 ENGLISH PROFICIENCY REQUIREMENTS
- **TOEFL iBT Minimum**: [SCORE] (e.g., 80, 90, 100)
- **IELTS Minimum**: [SCORE] (e.g., 6.5, 7.0)
- **Duolingo English Test**: [SCORE] if accepted
- **Exemptions**: (e.g., if studied in English-medium school for X years)
- **Conditional Admission**: Available with English program? (yes/no)

## 📑 REQUIRED DOCUMENTS CHECKLIST
1. **Official Academic Transcripts**: (original + certified English translation)
2. **Standardized Test Scores**: (SAT/ACT official reports)
3. **English Proficiency Scores**: (TOEFL/IELTS official reports)
4. **Letters of Recommendation**: [X] required (from teachers/counselors)
5. **Personal Statement/Essays**: [X] essays required, [WORD COUNT] words each
6. **Passport Copy**: (biographical page)
7. **Financial Documents**: Bank statement showing $[AMOUNT] for 1 year
8. **Certificate of Finance Form**: (if required)
9. **Portfolio**: (required for Art/Architecture programs)
10. **Additional**: Any program-specific requirements

## 🏛️ POPULAR UNDERGRADUATE PROGRAMS
List top 5 most popular majors for international students

## 💸 TUITION & COST OF ATTENDANCE (ANNUAL ESTIMATE)
- **Tuition & Fees**: $[AMOUNT]
- **Room & Board**: $[AMOUNT]
- **Books & Supplies**: $[AMOUNT]
- **Health Insurance**: $[AMOUNT]
- **Personal Expenses**: $[AMOUNT]
- **TOTAL ESTIMATED COST**: $[AMOUNT] per year

## 🎓 SCHOLARSHIPS FOR INTERNATIONAL STUDENTS
- **Merit-based Scholarships**: Available? (yes/no) • Amount: $[RANGE]
- **Need-based Aid**: Available? (yes/no)
- **Application Process**: (automatic consideration/separate application)
- **Deadline for Scholarship**: (if separate)

## 📞 IMPORTANT CONTACTS & LINKS
- **Admissions Office Email**: 
- **International Student Office Email**: 
- **Official Website**: 
- **Application Portal URL**: 
- **Phone**: 

## ⚠️ ADDITIONAL NOTES FOR INTERNATIONAL APPLICANTS
- **Visa Type Required**: (F-1 for USA, Tier 4 for UK, etc.)
- **I-20/DS-2019 Issuance Time**: (weeks after admission)
- **Health Requirements**: (vaccinations, medical exams)
- **Housing Guarantee**: (guaranteed for freshmen? yes/no)

IMPORTANT: Provide ACTUAL NUMBERS, DATES, and SPECIFIC DETAILS. If you cannot find exact information for ${cleanUniversityName}, provide typical requirements for universities of similar type and ranking in the same country. Be factual, current (2024-2025 information), and practical for students who need to apply.`;

    // Model configuration
    const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
    console.log(`🤖 Using model: ${modelId}`);
    
    // Prepare request parameters
    const params = {
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 3500,  // Increased for detailed response
        temperature: 0.1,   // Lower temperature for factual accuracy
        top_p: 0.9,
        top_k: 250,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      })
    };
    
    console.log('📤 Sending request to AWS Bedrock...');
    
    // Send request with retry logic
    const response = await retryWithBackoff(async () => {
      const command = new InvokeModelCommand(params);
      return await bedrockClient.send(command);
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Received response from Bedrock in ${duration}ms`);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Validate response structure
    if (!responseBody.content || 
        !Array.isArray(responseBody.content) || 
        responseBody.content.length === 0 ||
        !responseBody.content[0].text) {
      throw new Error('Invalid response structure from Bedrock API');
    }
    
    const content = responseBody.content[0].text.trim();
    console.log(`📄 Generated content: ${content.length} characters`);
    console.log(`✨ Successfully processed "${cleanUniversityName}"`);
    
    return content;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`\n❌ Bedrock Service Error (${duration}ms):`);
    console.error(`   Request: "${universityName}"`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Name: ${error.name}`);
    console.error(`   Code: ${error.code}`);
    
    // Enhanced error messages
    let userFriendlyMessage = 'Failed to generate university information';
    
    switch (error.name) {
      case 'CredentialsProviderError':
        userFriendlyMessage = 'AWS credentials are invalid or not configured. Please check your .env file.';
        break;
      case 'ExpiredTokenException':
        userFriendlyMessage = 'AWS security token has expired. Please refresh your credentials.';
        break;
      case 'AccessDeniedException':
        userFriendlyMessage = 'Access denied to AWS Bedrock. Check IAM permissions for Bedrock access.';
        break;
      case 'ResourceNotFoundException':
        userFriendlyMessage = 'Bedrock model not found. Please verify the model ID and region.';
        break;
      case 'ThrottlingException':
        userFriendlyMessage = 'Rate limit exceeded. Please try again in a few moments.';
        break;
      case 'ValidationException':
        userFriendlyMessage = 'Invalid request parameters sent to Bedrock.';
        break;
      default:
        if (error.message.includes('timeout')) {
          userFriendlyMessage = 'Request timeout. The service might be busy. Please try again.';
        } else if (error.message.includes('network')) {
          userFriendlyMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('region')) {
          userFriendlyMessage = 'AWS region configuration error. Please check AWS_REGION in .env file.';
        }
    }
    
    console.error(`   User Message: ${userFriendlyMessage}`);
    
    // Throw enhanced error
    const enhancedError = new Error(userFriendlyMessage);
    enhancedError.originalError = error;
    enhancedError.universityName = universityName;
    throw enhancedError;
  }
};

// Export client for testing/debugging
export { bedrockClient };