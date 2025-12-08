import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * SEC-007: Password Policy Configuration
 *
 * Default policy enforces:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character
 */
export interface PasswordPolicyOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
  specialChars?: string;
}

/**
 * Default password policy settings
 */
export const DEFAULT_PASSWORD_POLICY: Required<PasswordPolicyOptions> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '@$!%*?&#^()_+=-[]{}|;:\'",.<>/\\',
};

/**
 * SEC-007: Password Policy Validator
 *
 * Validates password complexity according to security requirements
 *
 * @example
 * ```typescript
 * @PasswordPolicy()
 * password: string;
 *
 * // Or with custom options
 * @PasswordPolicy({ minLength: 12, requireUppercase: true })
 * password: string;
 * ```
 */
@ValidatorConstraint({ name: 'passwordPolicy', async: false })
export class PasswordPolicyConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    const options: Required<PasswordPolicyOptions> = {
      ...DEFAULT_PASSWORD_POLICY,
      ...(args.constraints[0] || {}),
    };

    // Check minimum length
    if (password.length < options.minLength) {
      return false;
    }

    // Check for uppercase letter
    if (options.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    // Check for lowercase letter
    if (options.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    // Check for number
    if (options.requireNumber && !/\d/.test(password)) {
      return false;
    }

    // Check for special character
    if (options.requireSpecialChar) {
      const specialCharsRegex = new RegExp(
        `[${options.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
      );
      if (!specialCharsRegex.test(password)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const options: Required<PasswordPolicyOptions> = {
      ...DEFAULT_PASSWORD_POLICY,
      ...(args.constraints[0] || {}),
    };

    const requirements: string[] = [];

    requirements.push(`at least ${options.minLength} characters`);

    if (options.requireUppercase) {
      requirements.push('one uppercase letter');
    }

    if (options.requireLowercase) {
      requirements.push('one lowercase letter');
    }

    if (options.requireNumber) {
      requirements.push('one number');
    }

    if (options.requireSpecialChar) {
      requirements.push(`one special character (${options.specialChars})`);
    }

    return `Password must contain ${requirements.join(', ')}`;
  }
}

/**
 * SEC-007: Password Policy Decorator
 *
 * Validates password strength according to security policy
 *
 * @param options - Custom password policy options
 * @param validationOptions - class-validator options
 *
 * @example
 * ```typescript
 * // Use default policy
 * @PasswordPolicy()
 * password: string;
 *
 * // Use custom policy
 * @PasswordPolicy({
 *   minLength: 12,
 *   requireUppercase: true,
 *   requireLowercase: true,
 *   requireNumber: true,
 *   requireSpecialChar: false,
 * })
 * password: string;
 * ```
 */
export function PasswordPolicy(
  options?: PasswordPolicyOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: PasswordPolicyConstraint,
    });
  };
}

/**
 * SEC-007: Check password strength
 *
 * Returns detailed analysis of password strength
 * Useful for providing user feedback
 */
export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-5
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * SEC-007: Analyze password strength
 *
 * @param password - Password to analyze
 * @param options - Password policy options
 * @returns Detailed strength analysis
 */
export function checkPasswordStrength(
  password: string,
  options: PasswordPolicyOptions = {},
): PasswordStrengthResult {
  const policy: Required<PasswordPolicyOptions> = {
    ...DEFAULT_PASSWORD_POLICY,
    ...options,
  };

  const requirements = {
    minLength: password.length >= policy.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: new RegExp(
      `[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
    ).test(password),
  };

  const feedback: string[] = [];
  let score = 0;

  // Check each requirement
  if (!requirements.minLength) {
    feedback.push(`Password must be at least ${policy.minLength} characters`);
  } else {
    score++;
  }

  if (policy.requireUppercase && !requirements.hasUppercase) {
    feedback.push('Password must contain at least one uppercase letter');
  } else if (requirements.hasUppercase) {
    score++;
  }

  if (policy.requireLowercase && !requirements.hasLowercase) {
    feedback.push('Password must contain at least one lowercase letter');
  } else if (requirements.hasLowercase) {
    score++;
  }

  if (policy.requireNumber && !requirements.hasNumber) {
    feedback.push('Password must contain at least one number');
  } else if (requirements.hasNumber) {
    score++;
  }

  if (policy.requireSpecialChar && !requirements.hasSpecialChar) {
    feedback.push('Password must contain at least one special character');
  } else if (requirements.hasSpecialChar) {
    score++;
  }

  // Additional length bonus
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;

  const valid = feedback.length === 0;

  return {
    valid,
    score: Math.min(5, Math.floor(score)),
    feedback,
    requirements,
  };
}
