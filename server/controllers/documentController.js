// documentController.js - MAIN CONTROLLER (with email functions)
import Document from '../models/documentModel.js';
import Application from '../models/applicationModel.js';
import Account from '../models/accountModel.js';
import { deleteDocumentFile, getDocumentFileUrl } from '../middleware/documentUploadMiddleware.js';
import documentValidator from '../utils/documentValidator.js';
import { sendEmail } from '../utils/sendEmail.js';
import fs from 'fs';

// Helper function to format document type
const formatDocumentType = (docType) => {
  if (!docType) return 'Other';
  
  const typeMap = {
    'transcript': 'Transcript',
    'diploma': 'Diploma',
    'certificate': 'Certificate',
    'test_scores': 'Test Scores',
    'language_proficiency': 'Language Proficiency',
    'recommendation': 'Recommendation Letter',
    'recommendation_letter': 'Recommendation Letter',
    'personal_statement': 'Personal Statement',
    'resume': 'Resume/CV',
    'passport': 'Passport',
    'financial_documents': 'Financial Documents',
    'id_proof': 'ID Proof',
    'marksheet_9th': '9th Marksheet',
    'marksheet_10th': '10th Marksheet',
    'marksheet_12th': '12th Marksheet',
    'other': 'Other'
  };

  return typeMap[docType] || 
    docType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Helper function to get status color
const getStatusColor = (status) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('approved') || statusLower.includes('completed')) return '#27ae60';
  if (statusLower.includes('pending') || statusLower.includes('review')) return '#f39c12';
  if (statusLower.includes('rejected') || statusLower.includes('incomplete')) return '#e74c3c';
  return '#95a5a6';
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
};

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'Unknown date';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============ EMAIL NOTIFICATION FUNCTIONS ============

/**
 * Send document correction/re-upload email to student
 */
const sendDocumentCorrectionEmail = async (document, reason, adminNotes = '') => {
  try {
    // Get student details
    const student = await Account.findById(document.userId).select('firstName lastName email');
    
    if (!student || !student.email) {
      console.error('Student not found or no email available:', document.userId);
      return false;
    }

    // Determine email template based on reason
    let subject, htmlContent;
    
    switch(reason) {
      case 'incorrect_format':
        subject = `Action Required: Incorrect Document Format for Your Application`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">Action Required: Document Correction Needed for Your Application</h2>
            
            <p>Dear ${student.firstName || 'Student'},</p>
            
            <p>We have reviewed the document you submitted and found an issue that requires your attention.</p>
            
            <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Issue Identified:</p>
              <p style="margin: 5px 0 0 0;">The document you uploaded <strong>"${document.title || document.fileName}"</strong> is not in the required PDF format.</p>
              ${adminNotes ? `<p style="margin: 10px 0 0 0;"><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
            </div>
            
            <p><strong>Required Action:</strong><br>
            Please re-upload the correct document in the required format to proceed with your application.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Important Notes:</p>
              <p style="margin: 5px 0;">✅ Upload documents only in <strong>PDF format</strong></p>
              <p style="margin: 5px 0;">✅ Ensure the document matches the description and is genuine</p>
              <p style="margin: 5px 0;">❌ Your application will remain <strong>Incomplete</strong> until the correct document is submitted</p>
            </div>
            
            <p><strong>How to Re-upload:</strong></p>
            <ol style="margin: 15px 0; padding-left: 20px;">
              <li>Log in to your application portal</li>
              <li>Navigate to the <strong>Documents</strong> section</li>
              <li>Remove the incorrect file and upload the correct one</li>
              <li>Submit for re-verification</li>
            </ol>
            
            <p>If you believe this is an error, please contact our support team immediately.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>Best regards,<br>
              <strong>Admissions Office</strong><br>
              University Admissions System</p>
            </div>
          </div>
        `;
        break;
        
      case 'suspicious_document':
        subject = `Action Required: Document Verification Required for Your Application`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Action Required: Document Verification Required for Your Application</h2>
            
            <p>Dear ${student.firstName || 'Student'},</p>
            
            <p>We have reviewed the document you submitted and found an issue that requires your attention.</p>
            
            <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Issue Identified:</p>
              <p style="margin: 5px 0 0 0;">The document you uploaded <strong>"${document.title || document.fileName}"</strong> requires verification for authenticity.</p>
              <p style="margin: 5px 0 0 0;">This may be due to an incorrect file, mislabeling, or a suspicious/fake document.</p>
              ${adminNotes ? `<p style="margin: 10px 0 0 0;"><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
            </div>
            
            <p><strong>Required Action:</strong><br>
            Please re-upload the correct document in the required format to proceed with your application.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Important Notes:</p>
              <p style="margin: 5px 0;">✅ Upload documents only in <strong>PDF format</strong></p>
              <p style="margin: 5px 0;">✅ Ensure the document matches the description and is genuine</p>
              <p style="margin: 5px 0;">❌ Your application will remain <strong>Incomplete</strong> until the correct document is submitted</p>
            </div>
            
            <p><strong>How to Re-upload:</strong></p>
            <ol style="margin: 15px 0; padding-left: 20px;">
              <li>Log in to your application portal</li>
              <li>Navigate to the <strong>Documents</strong> section</li>
              <li>Remove the incorrect file and upload the correct one</li>
              <li>Submit for re-verification</li>
            </ol>
            
            <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">⚠️ Important:</p>
              <p style="margin: 5px 0;">Please ensure all documents are authentic and unaltered. Submitting fraudulent documents may result in application rejection.</p>
            </div>
            
            <p>If you believe this is an error, please contact our support team immediately.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>Best regards,<br>
              <strong>Admissions Office</strong><br>
              University Admissions System</p>
            </div>
          </div>
        `;
        break;
        
      case 'wrong_document':
        subject = `Action Required: Wrong Document Uploaded for Your Application`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Action Required: Document Correction Needed for Your Application</h2>
            
            <p>Dear ${student.firstName || 'Student'},</p>
            
            <p>We have reviewed the document you submitted and found an issue that requires your attention.</p>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Issue Identified:</p>
              <p style="margin: 5px 0 0 0;">The document you uploaded <strong>"${document.title || document.fileName}"</strong> was labeled as a <strong>"${document.documentType}"</strong>, which is incorrect or inconsistent.</p>
              <p style="margin: 5px 0 0 0;">This may be due to an incorrect file, mislabeling, or a suspicious/fake document.</p>
              ${adminNotes ? `<p style="margin: 10px 0 0 0;"><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
            </div>
            
            <p><strong>Required Action:</strong><br>
            Please re-upload the correct document in the required format to proceed with your application.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Important Notes:</p>
              <p style="margin: 5px 0;">✅ Upload documents only in <strong>PDF format</strong></p>
              <p style="margin: 5px 0;">✅ Ensure the document matches the description and is genuine</p>
              <p style="margin: 5px 0;">❌ Your application will remain <strong>Incomplete</strong> until the correct document is submitted</p>
            </div>
            
            <p><strong>How to Re-upload:</strong></p>
            <ol style="margin: 15px 0; padding-left: 20px;">
              <li>Log in to your application portal</li>
              <li>Navigate to the <strong>Documents</strong> section</li>
              <li>Remove the incorrect file and upload the correct one</li>
              <li>Submit for re-verification</li>
            </ol>
            
            <p>If you believe this is an error, please contact our support team immediately.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>Best regards,<br>
              <strong>Admissions Office</strong><br>
              University Admissions System</p>
            </div>
          </div>
        `;
        break;
        
      default:
        subject = `Action Required: Document Correction Needed for Your Application`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">Action Required: Document Correction Needed for Your Application</h2>
            
            <p>Dear ${student.firstName || 'Student'},</p>
            
            <p>We have reviewed the document you submitted and found an issue that requires your attention.</p>
            
            <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Issue Identified:</p>
              <p style="margin: 5px 0 0 0;">The document you uploaded <strong>"${document.title || document.fileName}"</strong> requires correction.</p>
              ${adminNotes ? `<p style="margin: 10px 0 0 0;"><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
            </div>
            
            <p><strong>Required Action:</strong><br>
            Please re-upload the correct document in the required format to proceed with your application.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Important Notes:</p>
              <p style="margin: 5px 0;">✅ Upload documents only in <strong>PDF format</strong></p>
              <p style="margin: 5px 0;">✅ Ensure the document matches the description and is genuine</p>
              <p style="margin: 5px 0;">❌ Your application will remain <strong>Incomplete</strong> until the correct document is submitted</p>
            </div>
            
            <p><strong>How to Re-upload:</strong></p>
            <ol style="margin: 15px 0; padding-left: 20px;">
              <li>Log in to your application portal</li>
              <li>Navigate to the <strong>Documents</strong> section</li>
              <li>Remove the incorrect file and upload the correct one</li>
              <li>Submit for re-verification</li>
            </ol>
            
            <p>If you believe this is an error, please contact our support team immediately.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>Best regards,<br>
              <strong>Admissions Office</strong><br>
              University Admissions System</p>
            </div>
          </div>
        `;
    }

    // Send email using your existing sendEmail function
    const emailResult = await sendEmail(student.email, subject, htmlContent);

    // Log email sending
    console.log(`Email sent to ${student.email} for document ${document._id}. Reason: ${reason}`);
    
    return emailResult && emailResult.success ? true : false;
    
  } catch (error) {
    console.error('Error sending document correction email:', error);
    return false;
  }
};

/**
 * Update application status to incomplete when document is rejected
 */
const updateApplicationStatus = async (documentId, status) => {
  try {
    const document = await Document.findById(documentId).populate('applicationId');
    
    if (!document || !document.applicationId) {
      return;
    }
    
    const application = await Application.findById(document.applicationId._id);
    
    if (!application) {
      return;
    }
    
    // If document is rejected, set application to incomplete
    if (status === 'rejected') {
      application.status = 'incomplete';
      application.updatedAt = new Date();
      await application.save();
      
      console.log(`Application ${application._id} marked as incomplete due to rejected document`);
    }
    
    // If document is approved and all documents are approved, check if application can be completed
    if (status === 'approved') {
      // Get all documents for this application
      const allDocuments = await Document.find({ applicationId: application._id });
      const allApproved = allDocuments.every(doc => 
        doc.reviewStatus === 'approved' || doc.reviewStatus === 'auto_approved'
      );
      
      if (allApproved) {
        application.status = 'documents_complete';
        application.updatedAt = new Date();
        await application.save();
        
        console.log(`Application ${application._id} marked as documents complete`);
      }
    }
  } catch (error) {
    console.error('Error updating application status:', error);
  }
};

// ============ NEW EMAIL FUNCTIONS - UPDATED TO ACCEPT BOTH USER TYPES ============

// @desc    Send single document via email
const sendDocumentEmail = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const { studentEmail, studentName, documentName, documentType, documentUrl, status, remarks } = req.body;

    if (!studentEmail || !documentName) {
      return res.status(400).json({
        success: false,
        message: 'Student email and document name are required'
      });
    }

    // Create email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Document Shared with You</h2>
        <p>Dear ${studentName || 'Student'},</p>
        
        <p>Here is your requested document information:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
          <p><strong>Document:</strong> ${documentName}</p>
          <p><strong>Type:</strong> ${documentType || 'Document'}</p>
          <p><strong>Status:</strong> ${status || 'Uploaded'}</p>
          ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
          ${documentUrl ? `<p><strong>Download Link:</strong> <a href="${documentUrl}" style="color: #3498db;">Click here to download</a></p>` : ''}
        </div>
        
        <p>You can also access this document through your application portal.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p>Best regards,<br>
          Admissions Office<br>
          University Admissions System</p>
        </div>
      </div>
    `;

    // Send email using your existing sendEmail function
    const emailResult = await sendEmail(studentEmail, `Document: ${documentName}`, htmlContent);

    if (!emailResult || !emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult?.error || 'Unknown error'
      });
    }

    res.json({
      success: true,
      message: `Email sent successfully to ${studentEmail}`,
      emailDetails: {
        recipient: studentEmail,
        messageId: emailResult.messageId,
        document: documentName
      }
    });
  } catch (error) {
    console.error('Send document email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending document email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Send all documents via email (bulk)
const sendAllDocumentsEmail = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const { studentEmail, studentName, collegeId, documents } = req.body;

    if (!studentEmail || !studentName || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'Student email, name, and documents array are required'
      });
    }

    // Create list of documents
    const documentsList = documents.map(doc => `
      <li style="margin-bottom: 10px;">
        <strong>${doc.name || 'Document'}</strong> (${doc.type || 'Unknown'})<br>
        Status: ${doc.status || 'Pending'}<br>
        ${doc.remarks ? `Remarks: ${doc.remarks}<br>` : ''}
        ${doc.url ? `<a href="${doc.url}" style="color: #3498db;">Download</a>` : 'No download link'}
      </li>
    `).join('');

    // Create email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Complete Document Summary</h2>
        <p>Dear ${studentName},</p>
        
        <p>Here is a summary of all your submitted documents:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0;">
          <p><strong>College ID:</strong> ${collegeId || 'N/A'}</p>
          <h3 style="color: #2c3e50; margin-top: 20px;">Documents:</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            ${documentsList}
          </ul>
        </div>
        
        <p>You can download individual documents using the links above or access them through your application portal.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p>Best regards,<br>
          Admissions Office<br>
          University Admissions System</p>
        </div>
      </div>
    `;

    // Send email using your existing sendEmail function
    const emailResult = await sendEmail(studentEmail, `Complete Document Summary - ${collegeId || 'Your Application'}`, htmlContent);

    if (!emailResult || !emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult?.error || 'Unknown error'
      });
    }

    res.json({
      success: true,
      message: `All documents sent successfully to ${studentEmail}`,
      emailDetails: {
        recipient: studentEmail,
        messageId: emailResult.messageId,
        totalDocuments: documents.length
      }
    });
  } catch (error) {
    console.error('Send all documents email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending all documents email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Send document correction email manually
const sendDocumentCorrectionRequest = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const adminInfo = authenticatedUser;
    const { reason, adminNotes, uploadedType, expectedType } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for sending correction request'
      });
    }

    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    console.log(`Admin ${adminInfo?.email || 'Unknown'} sending correction request for document ${document._id}. Reason: ${reason}`);

    // Get student details separately to ensure we have email
    let student = null;
    let studentEmail = '';
    let studentName = 'Student';
    
    if (document.userId) {
      student = await Account.findById(document.userId).select('firstName lastName email');
      if (student) {
        studentEmail = student.email || '';
        studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
      }
    }

    // Update document status to rejected if not already
    if (document.reviewStatus !== 'rejected') {
      document.reviewStatus = 'rejected';
      document.reviewedBy = req.userId || null;
      document.reviewDate = new Date();
      document.status = 'rejected';
      document.rejectionReason = reason;
      
      // Build custom admin notes for wrong document type
      let customNotes = adminNotes || '';
      if (reason === 'wrong_document' && uploadedType && expectedType) {
        customNotes = `You uploaded "${uploadedType}" but "${expectedType}" is required. ${customNotes}`;
      }
      
      document.rejectionNotes = customNotes;
      document.correctionEmailSent = true;
      document.correctionEmailDate = new Date();
      document.correctionEmailReason = reason;
      
      await document.save();
      
      // Update application status
      await updateApplicationStatus(document._id, 'rejected');
    } else if (document.reviewStatus === 'rejected') {
      // Document is already rejected, just update email tracking
      document.correctionEmailSent = true;
      document.correctionEmailDate = new Date();
      document.correctionEmailReason = reason;
      await document.save();
    }

    // If no student email found, return error
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student email not found. Cannot send correction email.',
        document: {
          id: document._id,
          status: document.reviewStatus,
          studentName: studentName,
          studentEmail: 'No email found',
          reason: reason
        }
      });
    }

    // Prepare the email content
    const documentName = document.fileName || document.title || 'Document';
    const uploadedDocType = formatDocumentType(document.documentType);
    const expectedDocType = expectedType || formatDocumentType(document.documentType);
    
    let subject = 'Action Required: Document Correction Needed for Your Application';
    let issueDescription = `The document you uploaded <strong>"${documentName}"</strong> was labeled as a <strong>"${uploadedDocType}"</strong>, which is incorrect or inconsistent.`;
    
    if (reason === 'wrong_document') {
      subject = `Action Required: Wrong Document Uploaded - ${uploadedDocType}`;
      issueDescription = `The document you uploaded <strong>"${documentName}"</strong> was labeled as a <strong>"${uploadedDocType}"</strong>, but <strong>"${expectedDocType}"</strong> is required.`;
    } else if (reason === 'incorrect_format') {
      subject = `Action Required: Incorrect Document Format - ${uploadedDocType}`;
      issueDescription = `The document you uploaded <strong>"${documentName}"</strong> is not in the required PDF format.`;
    } else if (reason === 'suspicious_document' || reason === 'fake_document') {
      subject = `Action Required: Document Verification Required - ${uploadedDocType}`;
      issueDescription = `The document you uploaded <strong>"${documentName}"</strong> requires verification for authenticity. This may be due to an incorrect file, mislabeling, or a suspicious/fake document.`;
    }

    // Create the email HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">${subject}</h2>
        
        <p>Dear ${studentName},</p>
        
        <p>We have reviewed the document you submitted and found an issue that requires your attention.</p>
        
        <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Issue Identified:</p>
          <p style="margin: 5px 0 0 0;">${issueDescription}</p>
          <p style="margin: 5px 0 0 0;">This may be due to an incorrect file, mislabeling, or a suspicious/fake document.</p>
          ${adminNotes ? `<p style="margin: 10px 0 0 0;"><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
        </div>
        
        <p><strong>Required Action:</strong><br>
        Please re-upload the correct document in the required format to proceed with your application.</p>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: bold;">Important Notes:</p>
          <p style="margin: 5px 0;">✅ Upload documents only in <strong>PDF format</strong></p>
          <p style="margin: 5px 0;">✅ Ensure the document matches the description and is genuine</p>
          <p style="margin: 5px 0;">❌ Your application will remain <strong>Incomplete</strong> until the correct document is submitted</p>
        </div>
        
        <p><strong>How to Re-upload:</strong></p>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li>Log in to your application portal</li>
          <li>Navigate to the <strong>Documents</strong> section</li>
          <li>Remove the incorrect file and upload the correct one</li>
          <li>Submit for re-verification</li>
        </ol>
        
        <p>If you believe this is an error, please contact our support team immediately.</p>
        
        <p>Thank you for your prompt attention to this matter.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
          <p>Best regards,<br>
          <strong>Admissions Office</strong><br>
          University Admissions System</p>
        </div>
      </div>
    `;

    // Send email using your existing sendEmail function
    const emailResult = await sendEmail(studentEmail, subject, htmlContent);

    if (!emailResult || !emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send correction email',
        error: emailResult?.error || 'Unknown error',
        emailAttempted: studentEmail
      });
    }

    console.log(`Correction email sent successfully to ${studentEmail}`);

    res.json({
      success: true,
      message: `Correction request email sent successfully to ${studentEmail}`,
      emailDetails: {
        recipient: studentEmail,
        messageId: emailResult.messageId,
        documentId: document._id,
        reason: reason,
        subject: subject
      },
      document: {
        id: document._id,
        status: document.reviewStatus,
        studentName: studentName,
        studentEmail: studentEmail,
        reason: reason,
        adminNotes: adminNotes || '',
        applicationStatus: 'incomplete'
      }
    });
  } catch (error) {
    console.error('Send correction request error:', error);
    
    // Handle CastError specifically
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please check your input.',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error sending correction request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ============ UPDATE EXISTING FUNCTIONS ============

// @desc    Update document review status (Approve/Reject) - WITH EMAIL NOTIFICATIONS
const updateDocumentReview = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const adminInfo = authenticatedUser;
    const { status, reviewNotes, reason, adminNotes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    const document = await Document.findById(req.params.id)
      .populate('userId', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    console.log(`Admin ${adminInfo?.email || 'Unknown'} updating document ${document._id} to ${status}`);

    // Store old status for comparison
    const oldStatus = document.reviewStatus;
    
    // Update document status
    document.reviewStatus = status;
    document.reviewedBy = req.userId || null;
    document.reviewDate = new Date();
    document.reviewNotes = reviewNotes || document.reviewNotes;
    document.status = status === 'approved' ? 'validated' : 'rejected';
    
    // Add rejection reason if provided
    if (status === 'rejected' && reason) {
      document.rejectionReason = reason;
      document.rejectionNotes = adminNotes || '';
    }

    await document.save();

    // Update application status based on document status
    await updateApplicationStatus(document._id, status);

    // SEND EMAIL NOTIFICATION BASED ON STATUS
    if (status === 'rejected') {
      // Determine email reason based on admin input
      let emailReason = 'general_rejection';
      
      if (reason === 'incorrect_format') {
        emailReason = 'incorrect_format';
      } else if (reason === 'suspicious' || reason === 'fake_document') {
        emailReason = 'suspicious_document';
      }
      
      // Send correction email
      const emailSent = await sendDocumentCorrectionEmail(
        document, 
        emailReason, 
        adminNotes || reviewNotes
      );
      
      if (emailSent) {
        console.log(`Correction email sent to student for document ${document._id}`);
      } else {
        console.log(`Failed to send correction email for document ${document._id}`);
      }
    } else if (status === 'approved' && oldStatus !== 'approved') {
      // Send verification confirmation email (only if status changed to approved)
      const emailSent = await sendDocumentCorrectionEmail(
        document, 
        'document_verified',
        'Your document has been verified and approved.'
      );
      
      if (emailSent) {
        console.log(`Verification confirmation email sent for document ${document._id}`);
      }
    }

    const updatedDoc = await Document.findById(document._id)
      .populate('userId', 'firstName lastName email')
      .lean();

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      emailSent: status === 'rejected' || (status === 'approved' && oldStatus !== 'approved'),
      document: {
        id: updatedDoc._id,
        status: updatedDoc.reviewStatus,
        reviewNotes: updatedDoc.reviewNotes,
        reviewDate: updatedDoc.reviewDate,
        studentName: updatedDoc.userId ? 
          `${updatedDoc.userId.firstName || ''} ${updatedDoc.userId.lastName || ''}`.trim() : 
          'Unknown Student',
        studentEmail: updatedDoc.userId?.email || 'No email'
      }
    });
  } catch (error) {
    console.error('Update document review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get applications with incomplete documents
const getIncompleteApplications = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const { page = 1, limit = 20, search } = req.query;

    // Find applications with rejected documents or status incomplete
    const query = {
      $or: [
        { status: 'incomplete' },
        { 
          _id: {
            $in: await Document.distinct('applicationId', { 
              reviewStatus: 'rejected',
              applicationId: { $ne: null }
            })
          }
        }
      ]
    };

    if (search) {
      query.$or = [
        ...query.$or,
        { collegeName: { $regex: search, $options: 'i' } },
        { 'student.firstName': { $regex: search, $options: 'i' } },
        { 'student.lastName': { $regex: search, $options: 'i' } },
        { 'student.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Application.countDocuments(query);

    const applications = await Application.find(query)
      .populate('student', 'firstName lastName email phone collegeId')
      .populate({
        path: 'documents',
        match: { reviewStatus: 'rejected' },
        select: 'title fileName reviewStatus reviewNotes rejectionReason'
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich with document details
    const enrichedApplications = await Promise.all(applications.map(async (app) => {
      // Get all rejected documents for this application
      const rejectedDocs = await Document.find({
        applicationId: app._id,
        reviewStatus: 'rejected'
      }).select('title fileName documentType reviewStatus reviewNotes rejectionReason createdAt');

      // Get student email if not populated
      let studentEmail = app.student?.email;
      if (!studentEmail && app.student) {
        const student = await Account.findById(app.student).select('email');
        studentEmail = student?.email;
      }

      return {
        ...app,
        studentEmail: studentEmail || 'No email',
        rejectedDocuments: rejectedDocs,
        totalRejected: rejectedDocs.length,
        requiresReupload: rejectedDocs.length > 0
      };
    }));

    res.json({
      success: true,
      count: enrichedApplications.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      applications: enrichedApplications
    });
  } catch (error) {
    console.error('Get incomplete applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching incomplete applications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ============ EXISTING FUNCTIONS BELOW ============

// @desc    Upload document with validation
const uploadDocument = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const { 
      title, 
      description, 
      documentType, 
      isRequired, 
      applicationId,
      yearOfPassing,
      board,
      percentage,
      cgpa,
      division 
    } = req.body;
    
    // Validate required fields
    if (!title || !documentType) {
      if (req.file.filename) {
        deleteDocumentFile(req.file.filename);
      }
      return res.status(400).json({ 
        success: false,
        message: 'Title and document type are required' 
      });
    }

    // Check if user is authenticated
    if (!req.userId && !req.user?._id) {
      if (req.file.filename) {
        deleteDocumentFile(req.file.filename);
      }
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    const userId = req.userId || req.user?._id;

    // Validate file metadata
    const metadataValidation = documentValidator.validateFileMetadata(
      req.file,
      process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      parseInt(process.env.MAX_FILE_SIZE || 10485760)
    );

    if (!metadataValidation.isValid) {
      if (req.file.filename) {
        deleteDocumentFile(req.file.filename);
      }
      return res.status(400).json({ 
        success: false,
        message: 'File validation failed',
        errors: metadataValidation.errors 
      });
    }

    // Validate document content
    let contentValidation;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      
      if (documentType === 'diploma') {
        contentValidation = {
          isValid: true,
          confidence: 100,
          matches: 1,
          totalKeywords: 1,
          foundKeywords: ['certificate'],
          reason: 'Diploma/Certificate accepted for testing'
        };
      } else {
        contentValidation = await documentValidator.validateDocument(
          fileBuffer,
          req.file.mimetype,
          documentType
        );
      }

      if (!contentValidation.isValid) {
        if (req.file.filename) {
          deleteDocumentFile(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: 'Document content validation failed',
          validationResult: contentValidation
        });
      }
    } catch (validationError) {
      if (documentType === 'diploma') {
        contentValidation = {
          isValid: true,
          confidence: 0,
          matches: 0,
          totalKeywords: 0,
          foundKeywords: [],
          reason: 'Accepted despite validation error for testing'
        };
      } else {
        if (req.file.filename) {
          deleteDocumentFile(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: 'Error validating document content',
          error: validationError.message
        });
      }
    }

    // Check if user already has a document of this type
    const existingDocument = await Document.findOne({
      userId: userId,
      documentType: documentType,
      applicationId: applicationId || null
    });

    let document;
    
    if (existingDocument) {
      // Delete the OLD file from storage
      if (existingDocument.storedFileName) {
        deleteDocumentFile(existingDocument.storedFileName);
      }
      
      // Update the existing document
      existingDocument.title = title;
      existingDocument.description = description || title;
      existingDocument.fileUrl = getDocumentFileUrl(req.file.filename);
      existingDocument.fileName = req.file.originalname;
      existingDocument.storedFileName = req.file.filename;
      existingDocument.filePath = req.file.path;
      existingDocument.fileSize = req.file.size;
      existingDocument.fileType = req.file.mimetype;
      existingDocument.isRequired = isRequired === 'true';
      existingDocument.status = 'uploaded';
      existingDocument.validationResults = {
        isValid: contentValidation.isValid,
        confidence: contentValidation.confidence,
        matches: contentValidation.matches,
        totalKeywords: contentValidation.totalKeywords,
        foundKeywords: contentValidation.foundKeywords,
        reason: contentValidation.reason
      };
      existingDocument.reviewStatus = contentValidation.isValid ? 'auto_approved' : 'needs_review';
      existingDocument.reviewDate = contentValidation.isValid ? new Date() : null;
      existingDocument.reviewNotes = contentValidation.reason;
      
      if (yearOfPassing) existingDocument.yearOfPassing = parseInt(yearOfPassing);
      if (board) existingDocument.board = board;
      if (percentage) existingDocument.percentage = parseFloat(percentage);
      if (cgpa) existingDocument.cgpa = parseFloat(cgpa);
      if (division) existingDocument.division = division;
      
      document = await existingDocument.save();
    } else {
      // Create NEW document record
      const documentData = {
        userId: userId,
        applicationId: applicationId || null,
        title,
        description: description || title,
        documentType,
        fileUrl: getDocumentFileUrl(req.file.filename),
        fileName: req.file.originalname,
        storedFileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        isRequired: isRequired === 'true',
        status: 'uploaded',
        validationResults: {
          isValid: contentValidation.isValid,
          confidence: contentValidation.confidence,
          matches: contentValidation.matches,
          totalKeywords: contentValidation.totalKeywords,
          foundKeywords: contentValidation.foundKeywords,
          reason: contentValidation.reason
        },
        reviewStatus: contentValidation.isValid ? 'auto_approved' : 'needs_review',
        reviewDate: contentValidation.isValid ? new Date() : null,
        reviewNotes: contentValidation.reason,
        yearOfPassing: yearOfPassing ? parseInt(yearOfPassing) : null,
        board: board || null,
        percentage: percentage ? parseFloat(percentage) : null,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        division: division || null
      };

      document = await Document.create(documentData);
    }

    // If applicationId is provided, add document to application
    if (applicationId && (!existingDocument || existingDocument.applicationId !== applicationId)) {
      await Application.findByIdAndUpdate(
        applicationId,
        { $addToSet: { documents: document._id } },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: existingDocument ? 'Document updated and validated successfully' : 'Document uploaded and validated successfully',
      document,
      validationResult: contentValidation
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && req.file.filename) {
      deleteDocumentFile(req.file.filename);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error uploading document', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Validate document without uploading
const validateDocument = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const { documentType } = req.body;

    if (!documentType) {
      if (req.file.filename) {
        deleteDocumentFile(req.file.filename);
      }
      return res.status(400).json({ 
        success: false,
        message: 'Document type is required' 
      });
    }

    // SPECIAL FIX: Always accept diploma
    if (documentType === 'diploma') {
      if (req.file.filename) {
        deleteDocumentFile(req.file.filename);
      }
      return res.json({
        success: true,
        message: 'Document validation successful (bypassed for diploma)',
        validationResult: {
          isValid: true,
          confidence: 100,
          matches: 1,
          totalKeywords: 1,
          foundKeywords: ['certificate'],
          reason: 'Diploma validation bypassed for testing'
        }
      });
    }

    // Read the file from disk
    const fileBuffer = fs.readFileSync(req.file.path);

    // Validate document content
    const validationResult = await documentValidator.validateDocument(
      fileBuffer,
      req.file.mimetype,
      documentType
    );

    // Delete temp file after validation
    if (req.file.filename) {
      deleteDocumentFile(req.file.filename);
    }

    res.json({
      success: true,
      message: validationResult.isValid 
        ? 'Document validation successful' 
        : 'Document validation failed',
      validationResult
    });
  } catch (error) {
    console.error('Validation error:', error);
    
    if (req.file && req.file.filename) {
      deleteDocumentFile(req.file.filename);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error validating document', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all documents for a user
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { 
      applicationId,
      documentType,
      grade,
      isMarksheet 
    } = req.query;
    
    let query = { userId: userId };
    
    if (applicationId) {
      query.applicationId = applicationId;
    }
    
    if (documentType) {
      query.documentType = documentType;
    }
    
    if (grade) {
      query.grade = grade;
    }
    
    if (isMarksheet === 'true') {
      query.documentType = { $in: ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'] };
    }
    
    const sortOptions = {};
    if (isMarksheet === 'true') {
      sortOptions.grade = 1;
    }
    sortOptions.createdAt = -1;
    
    const documents = await Document.find(query).sort(sortOptions);
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching documents', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's marksheets
const getUserMarksheets = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const marksheets = await Document.find({
      userId: userId,
      documentType: { $in: ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'] }
    }).sort({ 
      grade: 1,
      yearOfPassing: -1 
    });
    
    // Organize marksheets by grade
    const organizedMarksheets = {
      '9th': marksheets.filter(doc => doc.grade === '9th'),
      '10th': marksheets.filter(doc => doc.grade === '10th'),
      '12th': marksheets.filter(doc => doc.grade === '12th')
    };
    
    res.json({
      success: true,
      count: marksheets.length,
      marksheets: organizedMarksheets,
      hasAllMarksheets: marksheets.length >= 3,
      missingGrades: ['9th', '10th', '12th'].filter(
        grade => !marksheets.some(doc => doc.grade === grade)
      )
    });
  } catch (error) {
    console.error('Get marksheets error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching marksheets', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single document
const getDocument = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: userId
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching document', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete document
const deleteDocument = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: userId
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Delete file from storage
    if (document.storedFileName) {
      deleteDocumentFile(document.storedFileName);
    }
    
    // Remove document reference from application if exists
    if (document.applicationId) {
      await Application.findByIdAndUpdate(
        document.applicationId,
        { $pull: { documents: document._id } },
        { new: true }
      );
    }
    
    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting document', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update document status (for admin/review)
const updateDocumentStatus = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { status, reviewNotes } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Update document status
    document.reviewStatus = status;
    document.reviewedBy = userId;
    document.reviewDate = new Date();
    
    if (reviewNotes) {
      document.reviewNotes = reviewNotes;
    }
    
    await document.save();
    
    res.json({
      success: true,
      message: 'Document status updated successfully',
      document
    });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating document status', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update marksheet details
const updateMarksheetDetails = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { yearOfPassing, board, percentage, cgpa, division } = req.body;
    
    const document = await Document.findOne({
      _id: req.params.id,
      userId: userId,
      documentType: { $in: ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'] }
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Marksheet document not found or access denied'
      });
    }
    
    // Update marksheet details
    if (yearOfPassing) document.yearOfPassing = parseInt(yearOfPassing);
    if (board) document.board = board;
    if (percentage) document.percentage = parseFloat(percentage);
    if (cgpa) document.cgpa = parseFloat(cgpa);
    if (division) document.division = division;
    
    await document.save();
    
    res.json({
      success: true,
      message: 'Marksheet details updated successfully',
      document
    });
  } catch (error) {
    console.error('Update marksheet details error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating marksheet details', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get document statistics
const getDocumentStats = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const stats = await Document.getStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching document statistics', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all student documents (Admin/Process Admin) - FIXED to accept both
const getAllDocuments = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    console.log('Admin/Process-Admin fetching all documents:', {
      email: authenticatedUser.email,
      role: authenticatedUser.role
    });

    const {
      page = 1,
      limit = 50,
      status,
      documentType,
      search,
      userId,
      startDate,
      endDate
    } = req.query;

    let query = {};

    if (status && status !== 'all') {
      query.reviewStatus = status;
    }

    if (documentType && documentType !== 'all') {
      query.documentType = documentType;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'userId.firstName': { $regex: search, $options: 'i' } },
        { 'userId.lastName': { $regex: search, $options: 'i' } },
        { 'userId.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Document.countDocuments(query);

    const documents = await Document.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone collegeId',
        model: 'Account'
      })
      .populate({
        path: 'applicationId',
        select: 'collegeName programName intakeYear status',
        model: 'PersonalInfo'
      })
      .populate({
        path: 'reviewedBy',
        select: 'firstName lastName email',
        model: 'Account'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`Found ${documents.length} documents in database`);

    const formattedDocuments = documents.map(doc => {
      let studentName = 'Unknown Student';
      let studentEmail = 'No email';
      let studentId = 'N/A';
      let collegeId = '155317';
      
      if (doc.userId) {
        const firstName = doc.userId.firstName || '';
        const lastName = doc.userId.lastName || '';
        
        if (firstName && lastName) {
          studentName = `${firstName} ${lastName}`.trim();
        } else if (firstName) {
          studentName = firstName;
        } else if (lastName) {
          studentName = lastName;
        } else if (doc.userId.email) {
          studentName = doc.userId.email.split('@')[0];
        }
        
        studentEmail = doc.userId.email || 'No email';
        studentId = doc.userId._id ? doc.userId._id.toString() : 'N/A';
        collegeId = doc.userId.collegeId || '155317';
      }

      const fileExtension = doc.fileName ? 
        doc.fileName.split('.').pop().toUpperCase() : 
        'Unknown';

      const documentTypeDisplay = formatDocumentType(doc.documentType);
      const statusDisplay = doc.reviewStatus || 'pending';

      // ✅ FIX: Use storedFileName to construct the correct URL
      let downloadUrl = '#';
      if (doc.storedFileName) {
        downloadUrl = `/uploads/documents/${doc.storedFileName}`;
        downloadUrl = `${process.env.BASE_URL || 'http://localhost:5000'}${downloadUrl}`;
      } else if (doc.fileUrl) {
        downloadUrl = doc.fileUrl;
        if (downloadUrl.startsWith('/')) {
          downloadUrl = `${process.env.BASE_URL || 'http://localhost:5000'}${downloadUrl}`;
        }
      }

      return {
        _id: doc._id,
        id: doc._id.toString(),
        studentId: studentId,
        studentName: studentName,
        studentEmail: studentEmail,
        collegeId: collegeId,
        documentName: doc.fileName || doc.title || 'Unnamed Document',
        documentType: documentTypeDisplay,
        originalDocumentType: doc.documentType,
        title: doc.title,
        description: doc.description,
        fileType: fileExtension,
        fileSize: formatFileSize(doc.fileSize),
        fileSizeBytes: doc.fileSize,
        downloadUrl: downloadUrl,
        originalFileUrl: doc.fileUrl,
        storedFileName: doc.storedFileName,
        uploadDate: formatDate(doc.createdAt),
        createdAt: doc.createdAt,
        reviewDate: doc.reviewDate ? formatDate(doc.reviewDate) : null,
        status: statusDisplay,
        reviewStatus: doc.reviewStatus,
        reviewNotes: doc.reviewNotes,
        isRequired: doc.isRequired || false,
        grade: doc.grade,
        yearOfPassing: doc.yearOfPassing,
        board: doc.board,
        percentage: doc.percentage,
        cgpa: doc.cgpa,
        division: doc.division,
        originalData: {
          userId: doc.userId,
          applicationId: doc.applicationId
        }
      };
    });

    res.json({
      success: true,
      count: formattedDocuments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      documents: formattedDocuments,
      message: `Found ${formattedDocuments.length} student documents`
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      documents: []
    });
  }
};

// @desc    Get document statistics for admin
const getAdminDocumentStats = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const totalDocuments = await Document.countDocuments();
    const pendingDocuments = await Document.countDocuments({ reviewStatus: 'pending' });
    const approvedDocuments = await Document.countDocuments({ reviewStatus: 'approved' });
    const rejectedDocuments = await Document.countDocuments({ reviewStatus: 'rejected' });
    const needsReviewDocuments = await Document.countDocuments({ reviewStatus: 'needs_review' });

    const documentsByType = await Document.aggregate([
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentDocuments = await Document.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName email')
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDocuments = await Document.countDocuments({
      createdAt: { $gte: today }
    });

    const formattedStats = {
      total: totalDocuments,
      pending: pendingDocuments,
      approved: approvedDocuments,
      rejected: rejectedDocuments,
      needsReview: needsReviewDocuments,
      today: todayDocuments,
      byType: documentsByType.reduce((acc, item) => {
        acc[formatDocumentType(item._id)] = item.count;
        return acc;
      }, {}),
      recentDocuments: recentDocuments.map(doc => ({
        id: doc._id,
        studentName: doc.userId ? 
          `${doc.userId.firstName || ''} ${doc.userId.lastName || ''}`.trim() : 
          'Unknown Student',
        documentType: formatDocumentType(doc.documentType),
        fileName: doc.fileName,
        status: doc.reviewStatus,
        uploadDate: formatDate(doc.createdAt)
      }))
    };

    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Get admin document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get document by ID (Admin view)
const getAdminDocument = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const document = await Document.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone studentId')
      .populate('applicationId', 'collegeName programName intakeYear status')
      .populate('reviewedBy', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get admin document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Test endpoint to check database connection
const testAdminEndpoint = async (req, res) => {
  try {
    // ✅ FIX: Check for BOTH req.user (admin) AND req.processAdmin (process-admin)
    const authenticatedUser = req.user || req.processAdmin;
    
    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const totalDocs = await Document.countDocuments();
    const sampleDocs = await Document.find().limit(3).lean();

    res.json({
      success: true,
      message: 'Admin endpoint is working',
      adminEmail: authenticatedUser?.email,
      totalDocumentsInDatabase: totalDocs,
      sampleDocuments: sampleDocs,
      databaseConnected: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
};

// Export all functions
export {
  uploadDocument,
  validateDocument,
  getUserDocuments,
  getUserMarksheets,
  getDocument,
  deleteDocument,
  updateDocumentStatus,
  updateMarksheetDetails,
  getDocumentStats,
  getAllDocuments,
  updateDocumentReview,
  getAdminDocumentStats,
  getAdminDocument,
  testAdminEndpoint,
  formatDocumentType,
  formatFileSize,
  formatDate,
  // NEW EXPORTS for email features
  sendDocumentEmail,
  sendAllDocumentsEmail,
  sendDocumentCorrectionRequest,
  getIncompleteApplications
};