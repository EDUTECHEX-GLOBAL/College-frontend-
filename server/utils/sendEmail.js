import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // ⚠️ DEV ONLY: allows self‑signed / intercepted certs
  tls: {
    rejectUnauthorized: false,
  },
});

// ORIGINAL FUNCTION - Keep for backward compatibility
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"College App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("📧 Email sent successfully to:", to);
    console.log("📦 SMTP info:", info);
    return { success: true, messageId: info.messageId, recipient: to };
  } catch (error) {
    console.error("❌ Email sending failed (full error):", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    return { success: false, error: error.message, recipient: to };
  }
};

// NEW: Enhanced function that supports both old and new syntax
export const sendEmailEnhanced = async (options) => {
  try {
    // Support both old (to, subject, html) and new ({to, subject, html}) syntax
    let to, subject, html, text, replyTo;
    
    if (typeof options === 'object' && options.to) {
      // New syntax: {to, subject, html, text, replyTo}
      to = options.to;
      subject = options.subject;
      html = options.html;
      text = options.text;
      replyTo = options.replyTo;
    } else {
      // Old syntax: (to, subject, html)
      to = arguments[0];
      subject = arguments[1];
      html = arguments[2];
    }

    if (!to || !subject || !html) {
      console.error('Missing required email parameters');
      return { success: false, error: 'Missing required parameters' };
    }
// In sendEmailEnhanced, add attachments to mailOptions:
const mailOptions = {
  from: `"University Admissions" <${process.env.EMAIL_USER}>`,
  to: to,
  subject: subject,
  html: html,
  text: text || html.replace(/<[^>]*>/g, ''),
  replyTo: replyTo || process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
  ...(options.attachments && { attachments: options.attachments }), // ← THIS LINE WAS MISSING
};

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);
    console.log("📦 Message ID:", info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      recipient: to,
      subject: subject
    };
  } catch (error) {
    console.error("❌ Email sending failed (full error):", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    return { 
      success: false, 
      error: error.message,
      recipient: to,
      subject: subject
    };
  }
};

/**
 * Email templates for document notifications
 */
export const emailTemplates = {
  /**
   * Template for document correction request
   */
  documentCorrection: (data) => {
    const { studentName, documentName, documentType, reason, adminNotes, deadlineDays = 7 } = data;
    
    let reasonText, instructions, subject;
    
    switch(reason) {
      case 'incorrect_format':
        subject = `Action Required: Incorrect Format for ${documentType}`;
        reasonText = 'Incorrect document format';
        instructions = `
          <ol>
            <li>Convert your document to PDF format</li>
            <li>Re-upload the corrected document through your application portal</li>
            <li>Ensure all information is clearly readable</li>
          </ol>
        `;
        break;
        
      case 'suspicious_document':
      case 'fake_document':
        subject = `Important: Document Verification Required for ${documentType}`;
        reasonText = 'Document authenticity verification required';
        instructions = `
          <ol>
            <li>Upload a clear, authentic copy of the document</li>
            <li>Ensure all details are visible and not altered</li>
            <li>If applicable, provide additional supporting documents</li>
            <li>Re-upload through your application portal</li>
          </ol>
          <p><strong>Important:</strong> Please provide genuine documents. Submitting fraudulent documents may result in application rejection.</p>
        `;
        break;
        
      case 'blurry':
        subject = `Action Required: Unreadable Document - ${documentType}`;
        reasonText = 'Document is blurry or unreadable';
        instructions = `
          <ol>
            <li>Take a clear photo or scan of the document</li>
            <li>Ensure all text is legible</li>
            <li>Re-upload the clear version through your application portal</li>
          </ol>
        `;
        break;
        
      case 'incomplete':
        subject = `Action Required: Incomplete Document - ${documentType}`;
        reasonText = 'Document is incomplete or missing pages';
        instructions = `
          <ol>
            <li>Ensure all pages of the document are included</li>
            <li>Check that all required information is present</li>
            <li>Re-upload the complete document through your application portal</li>
          </ol>
        `;
        break;
        
      case 'wrong_document':
        subject = `Action Required: Wrong Document Uploaded - ${documentType}`;
        reasonText = 'Incorrect document type uploaded';
        instructions = `
          <ol>
            <li>Check the required document type in your application portal</li>
            <li>Upload the correct document type</li>
            <li>Ensure it meets all specified requirements</li>
          </ol>
        `;
        break;
        
      default:
        subject = `Action Required: ${documentType} Document Review`;
        reasonText = 'Document requires review and correction';
        instructions = `
          <ol>
            <li>Review the document requirements in your application portal</li>
            <li>Upload a corrected version of the document</li>
            <li>Ensure all required information is included</li>
          </ol>
        `;
    }
    
    return {
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document Correction Required</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0; text-align: center;">Document Correction Required</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>Your uploaded document has been reviewed and requires correction to proceed with your application.</p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #856404;">Document Details</h3>
                    <p><strong>Document:</strong> ${documentName}</p>
                    <p><strong>Type:</strong> ${documentType}</p>
                    <p><strong>Issue:</strong> ${reasonText}</p>
                    ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
                </div>
                
                <h3 style="color: #2c3e50;">📋 Required Actions</h3>
                ${instructions}
                
                <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <p><strong>⏰ Deadline:</strong> Please complete the correction within <strong>${deadlineDays} days</strong>.</p>
                    <p><strong>🔗 Portal:</strong> Log in to your application portal to re-upload the document.</p>
                </div>
                
                <p>If you have any questions, please contact the admissions office at <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}">${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}</a>.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d; font-size: 14px;">
                    <p>Best regards,<br>
                    <strong>Admissions Office</strong><br>
                    University Admissions System</p>
                </div>
            </div>
        </body>
        </html>
      `
    };
  },
  
  /**
   * Template for document verification confirmation
   */
  documentVerified: (data) => {
    const { studentName, documentName, documentType } = data;
    
    return {
      subject: `✅ Document Verified: ${documentType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document Verified</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0; text-align: center;">Document Verified Successfully</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>We are pleased to inform you that your document has been successfully verified and approved.</p>
                
                <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #155724;">✅ Verification Details</h3>
                    <p><strong>Document:</strong> ${documentName}</p>
                    <p><strong>Type:</strong> ${documentType}</p>
                    <p><strong>Status:</strong> Verified and Approved</p>
                    <p><strong>Verified On:</strong> ${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                </div>
                
                <p>This document is now part of your application and will be considered during the admission process.</p>
                
                <p>Thank you for your cooperation and timely submission.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d; font-size: 14px;">
                    <p>Best regards,<br>
                    <strong>Admissions Office</strong><br>
                    University Admissions System</p>
                </div>
            </div>
        </body>
        </html>
      `
    };
  },
  
  /**
   * Template for sending document link via email
   */
  sendDocumentLink: (data) => {
    const { studentName, documentName, documentType, documentUrl, status, remarks } = data;
    
    return {
      subject: `Document Shared: ${documentName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document Shared</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0; text-align: center;">Document Shared</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>Here is your requested document information:</p>
                
                <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <h3 style="margin-top: 0; color: #0056b3;">📄 Document Information</h3>
                    <p><strong>Document:</strong> ${documentName}</p>
                    <p><strong>Type:</strong> ${documentType}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
                    <p><strong>Download Link:</strong> <a href="${documentUrl}" style="color: #007bff; text-decoration: none;">Click here to download</a></p>
                </div>
                
                <p>You can also access this document through your application portal.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d; font-size: 14px;">
                    <p>Best regards,<br>
                    <strong>Admissions Office</strong><br>
                    University Admissions System</p>
                </div>
            </div>
        </body>
        </html>
      `
    };
  }
};

/**
 * Send batch emails
 */
export const sendBatchEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmailEnhanced(email);
      results.push({ 
        to: email.to, 
        success: result.success, 
        messageId: result.messageId,
        error: result.error 
      });
    } catch (error) {
      results.push({ 
        to: email.to, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
};

// Create a wrapper that uses the old function for backward compatibility
const emailService = {
  // Use old function for backward compatibility
  sendEmail: sendEmail,
  
  // New enhanced function
  sendEmailEnhanced: sendEmailEnhanced,
  
  // Email templates
  emailTemplates: emailTemplates,
  
  // Batch emails
  sendBatchEmails: sendBatchEmails
};

export default emailService;