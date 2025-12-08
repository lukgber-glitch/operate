/**
 * GSTIN Validation Decorator for NestJS DTOs
 *
 * @description
 * Custom class-validator decorator for validating Indian GSTIN format.
 * Integrates GSTIN validation into NestJS DTOs for automatic request validation.
 *
 * @example
 * ```typescript
 * import { IsGSTIN } from '@/common/decorators/is-gstin.decorator';
 *
 * class CreateCompanyDto {
 *   @IsGSTIN()
 *   gstin: string;
 *
 *   @IsGSTIN({ message: 'Please provide a valid GSTIN for the company' })
 *   companyGSTIN: string;
 * }
 * ```
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validateGSTIN } from '@operate/shared/validation/gstin/gstin.validator';

/**
 * GSTIN validator constraint
 */
@ValidatorConstraint({ name: 'isGSTIN', async: false })
export class IsGSTINConstraint implements ValidatorConstraintInterface {
  /**
   * Validate GSTIN value
   *
   * @param value - Value to validate
   * @returns True if valid GSTIN
   */
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const result = validateGSTIN(value);
    return result.isValid;
  }

  /**
   * Get default error message
   *
   * @param args - Validation arguments
   * @returns Error message
   */
  defaultMessage(args: ValidationArguments): string {
    const value = args.value;

    if (!value) {
      return 'GSTIN is required';
    }

    if (typeof value !== 'string') {
      return 'GSTIN must be a string';
    }

    const result = validateGSTIN(value);
    return result.error || 'Invalid GSTIN format';
  }
}

/**
 * GSTIN validation decorator options
 */
export interface IsGSTINOptions extends ValidationOptions {
  /**
   * Custom error message
   */
  message?: string;
}

/**
 * Decorator to validate GSTIN format
 *
 * @param validationOptions - Validation options
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * class CreateCompanyDto {
 *   @IsGSTIN()
 *   gstin: string;
 *
 *   @IsGSTIN({ message: 'Invalid company GSTIN' })
 *   companyGSTIN: string;
 * }
 * ```
 */
export function IsGSTIN(validationOptions?: IsGSTINOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGSTIN',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsGSTINConstraint,
    });
  };
}

/**
 * Optional GSTIN decorator - only validates if value is provided
 *
 * @param validationOptions - Validation options
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * class UpdateCompanyDto {
 *   @IsOptionalGSTIN()
 *   gstin?: string; // Only validates if provided
 * }
 * ```
 */
export function IsOptionalGSTIN(validationOptions?: IsGSTINOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOptionalGSTIN',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: unknown): boolean {
          // If value is null or undefined, it's valid (optional)
          if (value === null || value === undefined || value === '') {
            return true;
          }

          // Otherwise, validate as GSTIN
          if (typeof value !== 'string') {
            return false;
          }

          const result = validateGSTIN(value);
          return result.isValid;
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;

          if (typeof value !== 'string') {
            return 'GSTIN must be a string';
          }

          const result = validateGSTIN(value);
          return result.error || 'Invalid GSTIN format';
        },
      },
    });
  };
}

/**
 * Decorator to validate GSTIN for a specific state
 *
 * @param stateCode - State code to validate against
 * @param validationOptions - Validation options
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * class MaharashtraCompanyDto {
 *   @IsGSTINForState('27')
 *   gstin: string; // Must be Maharashtra GSTIN (starts with 27)
 * }
 * ```
 */
export function IsGSTINForState(
  stateCode: string,
  validationOptions?: IsGSTINOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGSTINForState',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [stateCode],
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          const result = validateGSTIN(value);
          if (!result.isValid) {
            return false;
          }

          const expectedStateCode = args.constraints[0];
          return result.details?.stateCode === expectedStateCode;
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;
          const expectedStateCode = args.constraints[0];

          if (typeof value !== 'string') {
            return 'GSTIN must be a string';
          }

          const result = validateGSTIN(value);
          if (!result.isValid) {
            return result.error || 'Invalid GSTIN format';
          }

          return `GSTIN must be from state code ${expectedStateCode}`;
        },
      },
    });
  };
}

/**
 * Decorator to validate array of GSTINs
 *
 * @param validationOptions - Validation options
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * class BulkCompanyDto {
 *   @IsGSTINArray()
 *   gstins: string[]; // All must be valid GSTINs
 * }
 * ```
 */
export function IsGSTINArray(validationOptions?: IsGSTINOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGSTINArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: unknown): boolean {
          if (!Array.isArray(value)) {
            return false;
          }

          if (value.length === 0) {
            return false;
          }

          return value.every(item => {
            if (typeof item !== 'string') {
              return false;
            }
            const result = validateGSTIN(item);
            return result.isValid;
          });
        },
        defaultMessage(): string {
          return 'All GSTINs in the array must be valid';
        },
      },
    });
  };
}
