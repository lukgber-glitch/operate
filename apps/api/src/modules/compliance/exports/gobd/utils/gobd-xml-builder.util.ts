import { GobdIndex, TableDefinition, VariableColumn } from '../interfaces/gobd-index.interface';

/**
 * GoBD XML Builder Utility
 * Generates GDPdU-compliant index.xml files
 */
export class GobdXmlBuilder {
  /**
   * Build complete index.xml content
   */
  static buildIndexXml(gobdIndex: GobdIndex): string {
    const { version, dataSupplier, media, dateRange } = gobdIndex;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE DataSet SYSTEM "gdpdu-01-09-2004.dtd">
<DataSet>
  <Version>${this.escapeXml(version)}</Version>
  ${this.buildDataSupplierXml(dataSupplier)}
  ${this.buildMediaXml(media, dateRange)}
</DataSet>`;

    return xml;
  }

  /**
   * Build DataSupplier section
   */
  private static buildDataSupplierXml(dataSupplier: any): string {
    return `<DataSupplier>
    <Name>${this.escapeXml(dataSupplier.name)}</Name>
    <Location>${this.escapeXml(dataSupplier.location)}</Location>
    ${dataSupplier.contact ? `<Contact>${this.escapeXml(dataSupplier.contact)}</Contact>` : ''}
    ${dataSupplier.comment ? `<Comment>${this.escapeXml(dataSupplier.comment)}</Comment>` : ''}
  </DataSupplier>`;
  }

  /**
   * Build Media section
   */
  private static buildMediaXml(media: any, dateRange: any): string {
    const tablesXml = media.tables.map((table: TableDefinition) =>
      this.buildTableXml(table, dateRange)
    ).join('\n    ');

    return `<Media>
    <Name>${this.escapeXml(media.name)}</Name>
    ${tablesXml}
  </Media>`;
  }

  /**
   * Build Table section
   */
  private static buildTableXml(table: TableDefinition, dateRange: any): string {
    const {
      name,
      url,
      description,
      decimalSymbol = ',',
      digitGroupingSymbol = '.',
      columnDelimiter = ';',
      textEncapsulator = '"',
      recordDelimiter = '&#10;',
      primaryKey,
      columns,
      foreignKeys,
      range,
    } = table;

    const primaryKeyXml = primaryKey.map(key =>
      `<VariablePrimaryKey>\n          <Name>${this.escapeXml(key)}</Name>\n        </VariablePrimaryKey>`
    ).join('\n        ');

    const columnsXml = columns.map(column =>
      this.buildColumnXml(column)
    ).join('\n        ');

    const foreignKeysXml = foreignKeys && foreignKeys.length > 0
      ? foreignKeys.map(fk => this.buildForeignKeyXml(fk)).join('\n        ')
      : '';

    const rangeXml = range
      ? `<Range>\n          <From>${this.escapeXml(range.from)}</From>\n          <To>${this.escapeXml(range.to)}</To>\n        </Range>`
      : `<Range>\n          <From>${this.formatDate(dateRange.from)}</From>\n          <To>${this.formatDate(dateRange.to)}</To>\n        </Range>`;

    return `<Table>
      <URL>${this.escapeXml(url)}</URL>
      <Name>${this.escapeXml(name)}</Name>
      ${description ? `<Description>${this.escapeXml(description)}</Description>` : ''}
      ${rangeXml}
      <DecimalSymbol>${this.escapeXml(decimalSymbol)}</DecimalSymbol>
      <DigitGroupingSymbol>${this.escapeXml(digitGroupingSymbol)}</DigitGroupingSymbol>
      <VariableLength>
        <ColumnDelimiter>${this.escapeXml(columnDelimiter)}</ColumnDelimiter>
        <RecordDelimiter>${recordDelimiter}</RecordDelimiter>
        <TextEncapsulator>${this.escapeXml(textEncapsulator)}</TextEncapsulator>
        ${primaryKeyXml}
        ${columnsXml}
        ${foreignKeysXml}
      </VariableLength>
    </Table>`;
  }

  /**
   * Build VariableColumn section
   */
  private static buildColumnXml(column: VariableColumn): string {
    const { name, description, dataType, numeric, format, map } = column;

    let typeXml = '';
    if (dataType === 'Numeric' && numeric) {
      typeXml = `<Numeric>\n            ${numeric.accuracy !== undefined ? `<Accuracy>${numeric.accuracy}</Accuracy>` : ''}\n          </Numeric>`;
    } else if (dataType === 'AlphaNumeric') {
      typeXml = '<AlphaNumeric/>';
    } else if (dataType === 'Date') {
      typeXml = '<Date/>';
    }

    return `<VariableColumn>
          <Name>${this.escapeXml(name)}</Name>
          <Description>${this.escapeXml(description)}</Description>
          ${typeXml}
          ${format ? `<Format>${this.escapeXml(format)}</Format>` : ''}
          ${map ? `<Map>${this.escapeXml(map)}</Map>` : ''}
        </VariableColumn>`;
  }

  /**
   * Build ForeignKey section
   */
  private static buildForeignKeyXml(foreignKey: any): string {
    return `<ForeignKey>
          <Name>${this.escapeXml(foreignKey.name)}</Name>
          <References>
            <Table>${this.escapeXml(foreignKey.referencedTable)}</Table>
            <Column>${this.escapeXml(foreignKey.referencedColumn)}</Column>
          </References>
        </ForeignKey>`;
  }

  /**
   * Build GDPdU DTD file content
   */
  static buildDtdContent(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  GDPdU DTD Version 1.0 (01-09-2004)
  Grundsätze zum Datenzugriff und zur Prüfbarkeit digitaler Unterlagen
-->

<!ELEMENT DataSet (Version, DataSupplier, (Media | Command)+)>
<!ELEMENT Version (#PCDATA)>
<!ELEMENT DataSupplier (Name, Location?, Contact?, Comment?)>
<!ELEMENT Name (#PCDATA)>
<!ELEMENT Location (#PCDATA)>
<!ELEMENT Contact (#PCDATA)>
<!ELEMENT Comment (#PCDATA)>

<!ELEMENT Media (Name, (Table | MappingDefinition)+)>
<!ELEMENT Table (URL, Name, Description?, Range?, DecimalSymbol?, DigitGroupingSymbol?, (FixedLength | VariableLength))>
<!ELEMENT URL (#PCDATA)>
<!ELEMENT Description (#PCDATA)>
<!ELEMENT Range (From, To)>
<!ELEMENT From (#PCDATA)>
<!ELEMENT To (#PCDATA)>
<!ELEMENT DecimalSymbol (#PCDATA)>
<!ELEMENT DigitGroupingSymbol (#PCDATA)>

<!ELEMENT VariableLength (ColumnDelimiter, RecordDelimiter, TextEncapsulator, (VariablePrimaryKey+)?, VariableColumn+, ForeignKey*)>
<!ELEMENT ColumnDelimiter (#PCDATA)>
<!ELEMENT RecordDelimiter (#PCDATA)>
<!ELEMENT TextEncapsulator (#PCDATA)>
<!ELEMENT VariablePrimaryKey (Name+)>
<!ELEMENT VariableColumn (Name, Description, (Numeric | AlphaNumeric | Date), Format?, Map?)>
<!ELEMENT Numeric (Accuracy?)>
<!ELEMENT Accuracy (#PCDATA)>
<!ELEMENT AlphaNumeric EMPTY>
<!ELEMENT Date EMPTY>
<!ELEMENT Format (#PCDATA)>
<!ELEMENT Map (#PCDATA)>

<!ELEMENT FixedLength (Length, RecordDelimiter, (FixedPrimaryKey+)?, FixedColumn+, ForeignKey*)>
<!ELEMENT Length (#PCDATA)>
<!ELEMENT FixedPrimaryKey (Name+)>
<!ELEMENT FixedColumn (Name, Description, (Numeric | AlphaNumeric | Date), Format?, Map?)>

<!ELEMENT ForeignKey (Name, References)>
<!ELEMENT References (Table, Column+)>
<!ELEMENT Column (#PCDATA)>

<!ELEMENT MappingDefinition (Name, Description?, Mapping+)>
<!ELEMENT Mapping (From, To, Description?)>

<!ELEMENT Command (Name, Description?, Version?, CommandLine?)>
<!ELEMENT CommandLine (#PCDATA)>
`;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(value: string): string {
    if (!value) return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Format date for XML (DD.MM.YYYY)
   */
  private static formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
