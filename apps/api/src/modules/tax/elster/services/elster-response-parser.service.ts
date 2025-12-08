import { Injectable, Logger } from '@nestjs/common';
import {
  TigerVATResponse,
  TigerVATError,
  ParsedElsterResponse,
  ElsterError,
  ElsterWarning,
  DisplayMessage,
  SuggestedAction,
  ProcessingStatus,
  StatusCode,
  ActionType,
  ErrorCategory,
  ParserConfig,
  DisplayResponse,
  DisplayError,
  DisplayWarning,
  DisplayAction,
} from '../types/elster-response.types';
import {
  ERROR_CODE_MAP,
  DEFAULT_ERROR_METADATA,
  FIELD_LABELS,
  STATUS_MESSAGES,
} from '../constants/error-codes';

/**
 * ELSTER Response Parser Service
 *
 * Parses and interprets ELSTER responses from tigerVAT API.
 * Converts raw responses into structured, actionable information.
 *
 * Features:
 * - Parse tigerVAT responses
 * - Map error codes to meaningful messages
 * - Suggest corrective actions
 * - Generate user-friendly display messages
 * - Determine retry eligibility
 */
@Injectable()
export class ElsterResponseParserService {
  private readonly logger = new Logger(ElsterResponseParserService.name);

  /**
   * Parse a tigerVAT response into structured format
   */
  parseResponse(
    response: TigerVATResponse,
    config: ParserConfig = {},
  ): ParsedElsterResponse {
    const {
      includeRawResponse = false,
      translateMessages = true,
      includeHelpUrls = true,
      detailedErrors = true,
    } = config;

    this.logger.debug('Parsing ELSTER response', {
      success: response.success,
      errorCount: response.errors?.length || 0,
      warningCount: response.warnings?.length || 0,
    });

    // Parse errors
    const errors = this.parseErrors(
      response.errors || [],
      translateMessages,
      includeHelpUrls,
      detailedErrors,
    );

    // Parse warnings
    const warnings = this.parseWarnings(
      response.warnings || [],
      translateMessages,
    );

    // Determine processing status
    const status = this.determineStatus(response);

    // Generate summary
    const summary = this.generateSummary(response, errors, warnings);

    // Generate suggested actions
    const suggestedActions = this.getSuggestedActions(errors, status);

    // Generate display messages
    const displayMessages = this.generateDisplayMessages(
      response,
      errors,
      warnings,
      suggestedActions,
    );

    const parsed: ParsedElsterResponse = {
      success: response.success,
      transferTicket: response.transferTicket,
      elsterReference: response.elsterRequestId,
      summary,
      errors,
      warnings,
      displayMessages,
      suggestedActions,
      status,
      timestamp: response.timestamp ? new Date(response.timestamp) : new Date(),
    };

    if (includeRawResponse) {
      parsed.rawResponse = response.rawResponse || response;
    }

    return parsed;
  }

  /**
   * Parse errors from tigerVAT response
   */
  private parseErrors(
    rawErrors: TigerVATError[],
    translateMessages: boolean,
    includeHelpUrls: boolean,
    detailedErrors: boolean,
  ): ElsterError[] {
    return rawErrors.map((error) => {
      const metadata = ERROR_CODE_MAP[error.code] || DEFAULT_ERROR_METADATA;

      const parsedError: ElsterError = {
        code: error.code,
        field: error.field || metadata.field,
        fieldLabel: this.getFieldLabel(error.field || metadata.field),
        message: error.message,
        localizedMessage: translateMessages
          ? metadata.localizedMessage || error.message
          : error.message,
        isRetryable: metadata.isRetryable,
        category: metadata.category,
      };

      if (includeHelpUrls && metadata.helpUrl) {
        parsedError.helpUrl = metadata.helpUrl;
      }

      return parsedError;
    });
  }

  /**
   * Parse warnings from tigerVAT response
   */
  private parseWarnings(
    rawWarnings: any[],
    translateMessages: boolean,
  ): ElsterWarning[] {
    return rawWarnings.map((warning) => ({
      code: warning.code,
      field: warning.field,
      fieldLabel: this.getFieldLabel(warning.field),
      message: warning.message,
      localizedMessage: translateMessages ? warning.message : warning.message,
      category: warning.severity === 'info' ? 'informational' as Prisma.InputJsonValue : 'recommendation' as Prisma.InputJsonValue,
    }));
  }

  /**
   * Determine processing status from response
   */
  private determineStatus(response: TigerVATResponse): ProcessingStatus {
    let statusCode: StatusCode;

    if (response.success && response.transferTicket) {
      statusCode = StatusCode.SUCCESS;
    } else if (response.status?.code) {
      // Map tigerVAT status to our status codes
      statusCode = this.mapStatusCode(response.status.code);
    } else if (response.errors && response.errors.length > 0) {
      // Determine status based on error types
      const hasCertError = response.errors.some((e) =>
        e.code.startsWith('ELSTER_CERT'),
      );
      const hasValError = response.errors.some((e) =>
        e.code.startsWith('ELSTER_VAL'),
      );

      if (hasCertError) {
        statusCode = StatusCode.CERTIFICATE_ERROR;
      } else if (hasValError) {
        statusCode = StatusCode.VALIDATION_ERROR;
      } else {
        statusCode = StatusCode.TECHNICAL_ERROR;
      }
    } else {
      statusCode = StatusCode.UNKNOWN;
    }

    const statusInfo = STATUS_MESSAGES[statusCode] || STATUS_MESSAGES.UNKNOWN;

    return {
      code: statusCode,
      message: statusInfo.message,
      isRetryable: statusInfo.isRetryable,
      isFinal: statusInfo.isFinal,
    };
  }

  /**
   * Map tigerVAT status code to our status code
   */
  private mapStatusCode(code: string): StatusCode {
    const upperCode = code.toUpperCase();

    if (upperCode.includes('SUCCESS') || upperCode.includes('ACCEPTED')) {
      return StatusCode.ACCEPTED;
    } else if (upperCode.includes('PENDING') || upperCode.includes('PROCESSING')) {
      return StatusCode.PENDING;
    } else if (upperCode.includes('REJECT')) {
      return StatusCode.REJECTED;
    } else if (upperCode.includes('TIMEOUT')) {
      return StatusCode.TIMEOUT;
    } else if (upperCode.includes('VALIDATION')) {
      return StatusCode.VALIDATION_ERROR;
    } else if (upperCode.includes('CERTIFICATE') || upperCode.includes('CERT')) {
      return StatusCode.CERTIFICATE_ERROR;
    } else if (upperCode.includes('ERROR')) {
      return StatusCode.TECHNICAL_ERROR;
    }

    return StatusCode.UNKNOWN;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    response: TigerVATResponse,
    errors: ElsterError[],
    warnings: ElsterWarning[],
  ): string {
    if (response.success && response.transferTicket) {
      return `Successfully submitted to ELSTER. Transfer ticket: ${response.transferTicket}`;
    }

    if (errors.length > 0) {
      const errorCount = errors.length;
      const warningCount = warnings.length;

      let summary = `Submission failed with ${errorCount} error${errorCount !== 1 ? 's' : ''}`;

      if (warningCount > 0) {
        summary += ` and ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
      }

      // Add primary error message
      if (errors[0]) {
        summary += `. ${errors[0].localizedMessage}`;
      }

      return summary;
    }

    if (response.status?.message) {
      return response.status.message;
    }

    return 'Unknown response status';
  }

  /**
   * Get suggested actions based on errors
   */
  private getSuggestedActions(
    errors: ElsterError[],
    status: ProcessingStatus,
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Group errors by category
    const errorsByCategory = errors.reduce((acc, error) => {
      if (!acc[error.category]) {
        acc[error.category] = [];
      }
      acc[error.category].push(error);
      return acc;
    }, {} as Record<string, ElsterError[]>);

    // Certificate errors
    if (errorsByCategory[ErrorCategory.CERTIFICATE]) {
      actions.push({
        type: ActionType.CHECK_CERTIFICATE,
        message: 'Check and update your ELSTER certificate',
        priority: 'high',
      });
    }

    // Validation errors
    if (errorsByCategory[ErrorCategory.VALIDATION]) {
      errorsByCategory[ErrorCategory.VALIDATION].forEach((error) => {
        if (error.field) {
          const metadata = ERROR_CODE_MAP[error.code];
          actions.push({
            type: ActionType.FIX_FIELD,
            message: metadata?.suggestedFix || `Fix ${error.fieldLabel || error.field}`,
            field: error.field,
            priority: 'high',
          });
        }
      });
    }

    // Technical/Network errors - suggest retry
    if (
      errorsByCategory[ErrorCategory.TECHNICAL] ||
      errorsByCategory[ErrorCategory.NETWORK]
    ) {
      if (status.isRetryable) {
        actions.push({
          type: ActionType.RETRY,
          message: 'Try submitting again',
          priority: 'medium',
        });
      }
    }

    // If no specific actions, suggest reviewing data
    if (actions.length === 0 && errors.length > 0) {
      actions.push({
        type: ActionType.REVIEW_DATA,
        message: 'Review your data and try again',
        priority: 'medium',
      });
    }

    // Add support action for complex errors
    if (errors.length > 3 || errors.some((e) => !e.isRetryable && !e.field)) {
      actions.push({
        type: ActionType.CONTACT_SUPPORT,
        message: 'Contact support for assistance',
        priority: 'low',
      });
    }

    return actions;
  }

  /**
   * Generate display messages for UI
   */
  private generateDisplayMessages(
    response: TigerVATResponse,
    errors: ElsterError[],
    warnings: ElsterWarning[],
    actions: SuggestedAction[],
  ): DisplayMessage[] {
    const messages: DisplayMessage[] = [];

    // Success message
    if (response.success && response.transferTicket) {
      messages.push({
        type: 'success',
        title: 'Erfolgreich übermittelt',
        message: `Ihre Umsatzsteuervoranmeldung wurde erfolgreich an ELSTER übermittelt.`,
        details: `Transfer-Ticket: ${response.transferTicket}`,
      });
      return messages;
    }

    // Error messages
    errors.forEach((error, index) => {
      const action = actions.find((a) => a.field === error.field);

      messages.push({
        type: 'error',
        title: error.fieldLabel || 'Fehler',
        message: error.localizedMessage,
        details: error.helpUrl,
        field: error.field,
        action,
      });

      // Limit to first 5 errors for display
      if (index >= 4 && errors.length > 5) {
        messages.push({
          type: 'error',
          title: 'Weitere Fehler',
          message: `${errors.length - 5} weitere Fehler. Bitte überprüfen Sie alle Felder.`,
        });
        return;
      }
    });

    // Warning messages
    warnings.forEach((warning, index) => {
      // Limit to first 3 warnings
      if (index >= 3) return;

      messages.push({
        type: 'warning',
        title: warning.fieldLabel || 'Warnung',
        message: warning.localizedMessage,
        field: warning.field,
      });
    });

    return messages;
  }

  /**
   * Get human-readable error message for error code
   */
  getErrorMessage(code: string): string {
    const metadata = ERROR_CODE_MAP[code];
    return metadata?.localizedMessage || metadata?.message || 'Unknown error';
  }

  /**
   * Map error code to field name
   */
  mapErrorToField(code: string): string | null {
    const metadata = ERROR_CODE_MAP[code];
    return metadata?.field || null;
  }

  /**
   * Get field label (German)
   */
  private getFieldLabel(field?: string): string | undefined {
    if (!field) return undefined;
    return FIELD_LABELS[field];
  }

  /**
   * Get suggested fixes for errors
   */
  getSuggestedFixes(errors: TigerVATError[]): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    errors.forEach((error) => {
      const metadata = ERROR_CODE_MAP[error.code];

      if (metadata?.suggestedFix) {
        let actionType: ActionType;

        if (metadata.category === ErrorCategory.CERTIFICATE) {
          actionType = ActionType.CHECK_CERTIFICATE;
        } else if (metadata.field) {
          actionType = ActionType.FIX_FIELD;
        } else if (metadata.isRetryable) {
          actionType = ActionType.RETRY;
        } else {
          actionType = ActionType.REVIEW_DATA;
        }

        actions.push({
          type: actionType,
          message: metadata.suggestedFix,
          field: error.field || metadata.field,
          priority: metadata.isRetryable ? 'medium' : 'high',
        });
      }
    });

    return actions;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: TigerVATError): boolean {
    const metadata = ERROR_CODE_MAP[error.code];
    return metadata?.isRetryable ?? true; // Default to retryable
  }

  /**
   * Format parsed response for display
   */
  formatForDisplay(parsed: ParsedElsterResponse): DisplayResponse {
    const errors: DisplayError[] = parsed.errors.map((error) => ({
      title: error.fieldLabel || 'Error',
      message: error.localizedMessage,
      field: error.field,
      fieldLabel: error.fieldLabel,
      canRetry: error.isRetryable,
    }));

    const warnings: DisplayWarning[] = parsed.warnings.map((warning) => ({
      title: warning.fieldLabel || 'Warning',
      message: warning.localizedMessage,
      field: warning.field,
    }));

    const actions: DisplayAction[] = parsed.suggestedActions.map(
      (action, index) => ({
        label: action.message,
        type: action.type,
        field: action.field,
        description: action.value,
        isPrimary: index === 0, // First action is primary
      }),
    );

    return {
      success: parsed.success,
      title: parsed.success ? 'Erfolgreich' : 'Fehler',
      message: parsed.summary,
      transferTicket: parsed.transferTicket,
      errors,
      warnings,
      actions,
      timestamp: parsed.timestamp || new Date(),
    };
  }

  /**
   * Check if response indicates a final state
   */
  isFinalStatus(response: TigerVATResponse): boolean {
    const status = this.determineStatus(response);
    return status.isFinal;
  }

  /**
   * Check if response indicates a retryable error
   */
  canRetry(response: TigerVATResponse): boolean {
    const status = this.determineStatus(response);
    return status.isRetryable;
  }

  /**
   * Extract error codes from response
   */
  extractErrorCodes(response: TigerVATResponse): string[] {
    return (response.errors || []).map((error) => error.code);
  }

  /**
   * Check if response has specific error category
   */
  hasErrorCategory(response: TigerVATResponse, category: ErrorCategory): boolean {
    const errors = this.parseErrors(response.errors || [], false, false, false);
    return errors.some((error) => error.category === category);
  }
}
