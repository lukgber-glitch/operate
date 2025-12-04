/**
 * Document Processed Email Template
 * Notifies when document classification is complete
 */

import { baseTemplate, BaseTemplateVariables } from './base.template';

export interface DocumentProcessedVariables extends BaseTemplateVariables {
  recipientName: string;
  documentName: string;
  documentType: string;
  uploadDate: string;
  processedDate: string;
  classification: string;
  confidence: number;
  extractedFields?: Array<{ label: string; value: string }>;
  documentLink: string;
  requiresReview?: boolean;
  reviewLink?: string;
}

export const documentProcessedTemplate = (
  variables: DocumentProcessedVariables,
): string => {
  const {
    recipientName,
    documentName,
    documentType,
    uploadDate,
    processedDate,
    classification,
    confidence,
    extractedFields,
    documentLink,
    requiresReview,
    reviewLink,
  } = variables;

  const highConfidence = confidence >= 0.9;
  const statusClass = highConfidence ? 'success-box' : 'warning-box';

  const content = `
    <h2>Hello ${recipientName},</h2>

    <p>
      Your document has been successfully processed and classified by our AI system.
    </p>

    <div class="${statusClass}">
      <h3 style="margin-bottom: 12px; color: #1a202c; font-size: 18px;">
        ${highConfidence ? '✓ Processing Complete' : '⚠️ Review Recommended'}
      </h3>

      <table>
        <tr>
          <th>Document Name</th>
          <td>${documentName}</td>
        </tr>
        <tr>
          <th>Document Type</th>
          <td>${documentType}</td>
        </tr>
        <tr>
          <th>Classification</th>
          <td><strong>${classification}</strong></td>
        </tr>
        <tr>
          <th>Confidence</th>
          <td>
            <strong style="color: ${highConfidence ? '#48bb78' : '#f6ad55'};">
              ${(confidence * 100).toFixed(1)}%
            </strong>
          </td>
        </tr>
        <tr>
          <th>Uploaded</th>
          <td>${new Date(uploadDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
        <tr>
          <th>Processed</th>
          <td>${new Date(processedDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</td>
        </tr>
      </table>
    </div>

    ${extractedFields && extractedFields.length > 0 ? `
      <div style="margin: 24px 0;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #1a202c;">Extracted Information:</h3>
        <table>
          ${extractedFields.map(field => `
            <tr>
              <th>${field.label}</th>
              <td>${field.value}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    ` : ''}

    ${requiresReview ? `
      <div class="warning-box" style="margin: 24px 0;">
        <strong>⚠️ Manual Review Recommended</strong>
        <p style="margin-top: 8px; margin-bottom: 0;">
          The confidence level for this classification is below our threshold.
          We recommend reviewing the extracted data to ensure accuracy.
        </p>
      </div>
    ` : `
      <div class="success-box" style="margin: 24px 0;">
        <strong>✓ High Confidence Classification</strong>
        <p style="margin-top: 8px; margin-bottom: 0;">
          This document was classified with high confidence. The extracted data
          has been automatically processed and is ready for your review.
        </p>
      </div>
    `}

    <center>
      ${requiresReview && reviewLink ? `
        <a href="${reviewLink}" class="cta-button">Review & Approve</a>
      ` : `
        <a href="${documentLink}" class="cta-button">View Document</a>
      `}
    </center>

    <div style="margin-top: 30px; padding: 16px; background-color: #f7fafc; border-radius: 6px;">
      <h3 style="font-size: 16px; margin-bottom: 8px; color: #1a202c;">What happens next?</h3>
      <ul style="color: #4a5568; margin-left: 20px;">
        <li>The document has been stored securely in your account</li>
        <li>Extracted data is available for accounting and tax purposes</li>
        <li>You can download or share the document at any time</li>
        ${requiresReview ? '<li><strong>Please review and confirm the extracted data</strong></li>' : ''}
      </ul>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      If you notice any errors in the classification or extracted data, you can
      manually edit the information in your account dashboard.
    </p>
  `;

  return baseTemplate(content, variables);
};
