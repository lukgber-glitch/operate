/**
 * @operate/shared
 * Shared types, utilities, and constants across the Operate platform
 */

// Types
export * from "./types/user.types";
export * from "./types/organization.types";
export * from "./types/hr.types";
export * from "./types/compliance.types";
export * from "./types/tax.types";
export * from "./types/tax/canada-tax.types";
export * from "./types/tax/australia-tax.types";

// Constants
export * from "./constants/countries";
export * from "./constants/spain-tax.constants";

// Tax Configurations
export * from "./tax/jp";

// Utilities
export * from "./utils/date.utils";
export * from "./utils/validation.utils";
export * from "./utils/currency.utils";
export * from "./utils/spain-tax.validator";
export * from "./types/websocket.types";

// Currency
export * from "./currency";

// Fiscal Year
export * from "./fiscal-year";

// Invoice utilities
export * from "./invoice/jp";

// Validation
export * from "./validation/gstin";

// i18n (Internationalization)
export * from "./i18n";
