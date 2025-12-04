/**
 * GoBD Index XML Interface
 * Defines structure for GDPdU-compliant index.xml
 */

/**
 * Data supplier information
 */
export interface DataSupplier {
  /** Company name */
  name: string;
  /** Company location/address */
  location: string;
  /** Contact information */
  contact?: string;
  /** Comment about the export */
  comment?: string;
}

/**
 * Variable column definition
 */
export interface VariableColumn {
  /** Column name (machine-readable) */
  name: string;
  /** Column description (human-readable, German) */
  description: string;
  /** Data type */
  dataType?: 'Numeric' | 'AlphaNumeric' | 'Date';
  /** Numeric format information */
  numeric?: {
    /** Number of decimal places */
    accuracy?: number;
  };
  /** Date format (e.g., DD.MM.YYYY) */
  format?: string;
  /** Map to account number (for financial columns) */
  map?: string;
}

/**
 * Foreign key definition
 */
export interface ForeignKey {
  /** Name of the foreign key */
  name: string;
  /** Referenced table name */
  referencedTable: string;
  /** Referenced column name */
  referencedColumn: string;
}

/**
 * Table definition for index.xml
 */
export interface TableDefinition {
  /** Table name */
  name: string;
  /** URL/path to the data file */
  url: string;
  /** Description of the table */
  description?: string;
  /** Decimal symbol (default: ,) */
  decimalSymbol?: string;
  /** Digit grouping symbol (default: .) */
  digitGroupingSymbol?: string;
  /** Column delimiter (default: ;) */
  columnDelimiter?: string;
  /** Text encapsulator (default: ") */
  textEncapsulator?: string;
  /** Record delimiter (default: newline) */
  recordDelimiter?: string;
  /** Primary key column(s) */
  primaryKey: string[];
  /** Column definitions */
  columns: VariableColumn[];
  /** Foreign keys */
  foreignKeys?: ForeignKey[];
  /** Range information */
  range?: {
    from: string;
    to: string;
  };
}

/**
 * Media definition (export package)
 */
export interface MediaDefinition {
  /** Media name */
  name: string;
  /** Tables included in this media */
  tables: TableDefinition[];
}

/**
 * Complete index structure
 */
export interface GobdIndex {
  /** Version of the GDPdU specification */
  version: string;
  /** Data supplier information */
  dataSupplier: DataSupplier;
  /** Media definition */
  media: MediaDefinition;
  /** Export creation date */
  createdAt: Date;
  /** Date range of the data */
  dateRange: {
    from: Date;
    to: Date;
  };
}

/**
 * Command line options for IDEA/ACL import
 */
export interface CommandLineOptions {
  /** Character set (default: UTF-8) */
  charset?: string;
  /** Version */
  version?: string;
  /** Description */
  description?: string;
}
