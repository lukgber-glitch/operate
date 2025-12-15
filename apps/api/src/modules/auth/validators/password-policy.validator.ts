import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * SEC-012: Common passwords list (top 100 most used)
 * These are blocked to prevent weak password usage
 * Source: OWASP, Have I Been Pwned leaked password lists
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  '1234567890', 'qwerty', 'abc123', 'monkey', 'letmein', 'dragon', 'master',
  'login', 'admin', 'welcome', 'football', 'baseball', 'iloveyou', 'princess',
  'sunshine', 'shadow', 'passw0rd', 'P@ssw0rd', 'P@ssword1', 'Password1',
  'Password123', 'qwerty123', 'qwertyuiop', 'trustno1', 'mustang', 'access',
  'starwars', 'harley', 'batman', 'superman', 'michael', 'jessica', 'charlie',
  'ashley', 'daniel', 'thomas', 'andrew', 'joshua', 'matthew', 'jennifer',
  'hunter', 'killer', 'george', 'asshole', 'fuckyou', 'tigger', 'pepper',
  'buster', 'ginger', 'cookie', 'summer', 'bailey', 'soccer', 'hockey',
  'rangers', 'yankees', 'cheese', 'chicken', 'burger', 'coffee', 'thunder',
  'internet', 'computer', 'whatever', 'nothing', 'secret', 'private',
  'freedom', 'forever', 'biteme', 'enter', 'hello', 'cocacola', 'jordan',
  'diamond', 'maggie', 'mickey', 'godzilla', 'slipknot', 'guitar', 'austin',
  'london', 'berlin', 'paris', 'newyork', 'testing', 'test123', 'test1234',
  'changeme', 'default', 'temp123', 'temp1234', 'guest123', 'user123',
  'admin123', 'root123', 'pass123', 'pass1234', 'qweasd', 'zxcvbn', 'asdfgh',
  'zaq12wsx', '1qaz2wsx', 'operate', 'operate123', 'Operate123!',
]);

/**
 * SEC-007: Password Policy Configuration
 *
 * Default policy enforces:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character
 * - SEC-012: Not a common password
 */
export interface PasswordPolicyOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
  specialChars?: string;
  blockCommonPasswords?: boolean;
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
  blockCommonPasswords: true, // SEC-012: Block common passwords
};

/**
 * SEC-012: Check if password is in common passwords list
 */
export function isCommonPassword(password: string): boolean {
  // Check exact match (case-insensitive)
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowerPassword)) {
    return true;
  }

  // Check if password starts with a common pattern
  const commonPatterns = ['password', 'qwerty', 'admin', 'user', 'test', 'guest'];
  for (const pattern of commonPatterns) {
    if (lowerPassword.startsWith(pattern) && lowerPassword.length < 12) {
      return true;
    }
  }

  return false;
}

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

    // SEC-012: Check for common passwords
    if (options.blockCommonPasswords && isCommonPassword(password)) {
      return false;
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

    if (options.blockCommonPasswords) {
      requirements.push('not be a commonly used password');
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
  score: number; // 0-6
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notCommon: boolean; // SEC-012
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
    notCommon: !isCommonPassword(password), // SEC-012
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

  // SEC-012: Check for common passwords
  if (policy.blockCommonPasswords && !requirements.notCommon) {
    feedback.push('Password is too common. Please choose a more unique password');
  } else if (requirements.notCommon) {
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
