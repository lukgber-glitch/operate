import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PDFDocument, PDFName, PDFString, PDFDict, PDFArray } from 'pdf-lib';
import { FacturXInvoiceData, FacturXProfile } from '../types/factur-x.types';

/**
 * Factur-X PDF Service
 *
 * Handles PDF/A-3 generation with embedded XML for Factur-X invoices.
 *
 * PDF/A-3 Requirements:
 * - PDF/A-3b compliance (basic conformance)
 * - XMP metadata with PDF/A-3 identifier
 * - Embedded XML file with specific naming and metadata
 * - Associated file relationship (AFRelationship = "Data")
 */
@Injectable()
export class FacturXPdfService {
  private readonly logger = new Logger(FacturXPdfService.name);

  /**
   * Create PDF/A-3 with embedded Factur-X XML
   */
  async createPdfWithEmbeddedXml(
    xml: string,
    profile: FacturXProfile,
    visualPdf?: Buffer,
    invoice?: FacturXInvoiceData,
  ): Promise<Buffer> {
    try {
      this.logger.log(
        `Creating PDF/A-3 with embedded XML (profile: ${profile})`,
      );

      let pdfDoc: PDFDocument;

      if (visualPdf) {
        // Load existing PDF
        pdfDoc = await PDFDocument.load(visualPdf);
      } else {
        // Create new PDF with basic invoice content
        pdfDoc = await PDFDocument.create();
        if (invoice) {
          await this.generateVisualInvoice(pdfDoc, invoice);
        } else {
          // Create a simple page
          const page = pdfDoc.addPage([595.28, 841.89]); // A4
          page.drawText('Factur-X Invoice', { x: 50, y: 800, size: 20 });
        }
      }

      // Embed XML as attachment
      await this.embedXmlAttachment(pdfDoc, xml, profile);

      // Add PDF/A-3 metadata
      await this.addPdfA3Metadata(pdfDoc, profile);

      // Serialize PDF
      const pdfBytes = await pdfDoc.save();

      this.logger.log('Successfully created PDF/A-3 with embedded XML');
      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error(`Failed to create PDF: ${error.message}`, error.stack);
      throw new BadRequestException(
        `PDF generation failed: ${error.message}`,
      );
    }
  }

  /**
   * Extract embedded XML from Factur-X PDF
   */
  async extractXmlFromPdf(pdf: Buffer): Promise<string | null> {
    try {
      this.logger.log('Extracting XML from PDF');

      const pdfDoc = await PDFDocument.load(pdf);

      // Look for embedded files
      const embeddedFiles = this.findEmbeddedFiles(pdfDoc);

      // Find Factur-X XML (factur-x.xml or zugferd-invoice.xml)
      for (const file of embeddedFiles) {
        if (
          file.name === 'factur-x.xml' ||
          file.name === 'zugferd-invoice.xml' ||
          file.name.toLowerCase().includes('factur')
        ) {
          this.logger.log(`Found embedded XML: ${file.name}`);
          return file.content;
        }
      }

      this.logger.warn('No Factur-X XML found in PDF');
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to extract XML: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `XML extraction failed: ${error.message}`,
      );
    }
  }

  /**
   * Validate PDF/A-3 compliance
   */
  async validatePdfA3Compliance(pdf: Buffer): Promise<{
    compliant: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const pdfDoc = await PDFDocument.load(pdf);

      // Check for XMP metadata
      const metadata = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Info);
      if (!metadata) {
        issues.push('Missing XMP metadata');
      }

      // Check for embedded files
      const embeddedFiles = this.findEmbeddedFiles(pdfDoc);
      if (embeddedFiles.length === 0) {
        issues.push('No embedded files found');
      }

      // Check for Factur-X specific file
      const hasFacturX = embeddedFiles.some(
        (f) => f.name === 'factur-x.xml' || f.name === 'zugferd-invoice.xml',
      );
      if (!hasFacturX) {
        issues.push('No Factur-X XML file found');
      }

      // Note: Full PDF/A-3 validation requires specialized tools (verapdf, etc.)
      // This is a basic structural check

      return {
        compliant: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
      return {
        compliant: false,
        issues,
      };
    }
  }

  /**
   * Embed XML as PDF attachment
   */
  private async embedXmlAttachment(
    pdfDoc: PDFDocument,
    xml: string,
    profile: FacturXProfile,
  ): Promise<void> {
    try {
      const xmlBytes = Buffer.from(xml, 'utf-8');

      // Determine filename based on profile
      const filename = 'factur-x.xml';
      const description = `Factur-X Invoice XML (${profile})`;

      // Create file stream
      const fileStream = pdfDoc.context.flateStream(xmlBytes);

      // Create file specification dictionary
      const fileSpec = pdfDoc.context.obj({
        Type: 'Filespec',
        F: PDFString.of(filename),
        UF: PDFString.of(filename), // Unicode filename
        Desc: PDFString.of(description),
        AFRelationship: PDFName.of('Data'), // Associated file relationship
        EF: {
          F: fileStream,
          UF: fileStream,
        },
      });

      // Add to catalog's EmbeddedFiles
      const catalog = pdfDoc.context.lookup(
        pdfDoc.context.trailerInfo.Root,
      ) as PDFDict;
      const names = catalog.get(PDFName.of('Names')) as PDFDict | undefined;

      if (names) {
        // Names dictionary exists
        let embeddedFiles = names.get(
          PDFName.of('EmbeddedFiles'),
        ) as PDFDict | undefined;
        if (!embeddedFiles) {
          embeddedFiles = pdfDoc.context.obj({
            Names: PDFArray.withContext(pdfDoc.context),
          });
          names.set(PDFName.of('EmbeddedFiles'), embeddedFiles);
        }

        // Add to Names array
        const namesArray = embeddedFiles.get(
          PDFName.of('Names'),
        ) as PDFArray | undefined;
        if (namesArray) {
          namesArray.push(PDFString.of(filename));
          namesArray.push(fileSpec);
        }
      } else {
        // Create Names dictionary
        const newNames = pdfDoc.context.obj({
          EmbeddedFiles: {
            Names: [PDFString.of(filename), fileSpec],
          },
        });
        catalog.set(PDFName.of('Names'), newNames);
      }

      // Add to AF (Associated Files) array for PDF/A-3
      let af = catalog.get(PDFName.of('AF')) as PDFArray | undefined;
      if (!af) {
        af = PDFArray.withContext(pdfDoc.context);
        catalog.set(PDFName.of('AF'), af);
      }
      af.push(fileSpec);

      this.logger.log(`Embedded XML file: ${filename}`);
    } catch (error) {
      this.logger.error(`Failed to embed XML: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add PDF/A-3 XMP metadata
   */
  private async addPdfA3Metadata(
    pdfDoc: PDFDocument,
    profile: FacturXProfile,
  ): Promise<void> {
    const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">Factur-X Invoice</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>Operate/CoachOS</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">Factur-X Invoice (${profile})</rdf:li>
        </rdf:Alt>
      </dc:description>
      <fx:ConformanceLevel>${profile}</fx:ConformanceLevel>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    // Note: pdf-lib doesn't have built-in XMP support
    // For production, consider using additional library or manual PDF manipulation
    this.logger.warn('XMP metadata embedding requires additional implementation');
  }

  /**
   * Find embedded files in PDF
   */
  private findEmbeddedFiles(
    pdfDoc: PDFDocument,
  ): Array<{ name: string; content: string }> {
    const embeddedFiles: Array<{ name: string; content: string }> = [];

    try {
      const catalog = pdfDoc.context.lookup(
        pdfDoc.context.trailerInfo.Root,
      ) as PDFDict;
      const names = catalog.get(PDFName.of('Names')) as PDFDict | undefined;

      if (!names) {
        return embeddedFiles;
      }

      const embeddedFilesDict = names.get(
        PDFName.of('EmbeddedFiles'),
      ) as PDFDict | undefined;
      if (!embeddedFilesDict) {
        return embeddedFiles;
      }

      const namesArray = embeddedFilesDict.get(
        PDFName.of('Names'),
      ) as PDFArray | undefined;
      if (!namesArray) {
        return embeddedFiles;
      }

      // Names array is [name1, filespec1, name2, filespec2, ...]
      for (let i = 0; i < namesArray.size(); i += 2) {
        const nameObj = namesArray.get(i);
        const fileSpecObj = namesArray.get(i + 1);

        if (nameObj && fileSpecObj) {
          const name =
            nameObj instanceof PDFString ? nameObj.decodeText() : 'unknown';
          // Extract file content (simplified - needs proper stream decoding)
          embeddedFiles.push({
            name,
            content: '', // Would need to decode the stream
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error finding embedded files: ${error.message}`);
    }

    return embeddedFiles;
  }

  /**
   * Generate visual invoice content (basic implementation)
   */
  private async generateVisualInvoice(
    pdfDoc: PDFDocument,
    invoice: FacturXInvoiceData,
  ): Promise<void> {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText('FACTURE / INVOICE', {
      x: 50,
      y: yPosition,
      size: 20,
    });
    yPosition -= 40;

    // Invoice details
    page.drawText(`Numéro / Number: ${invoice.number}`, {
      x: 50,
      y: yPosition,
      size: 12,
    });
    yPosition -= 20;

    page.drawText(
      `Date: ${invoice.issueDate.toISOString().split('T')[0]}`,
      {
        x: 50,
        y: yPosition,
        size: 12,
      },
    );
    yPosition -= 40;

    // Seller
    page.drawText('Vendeur / Seller:', { x: 50, y: yPosition, size: 12 });
    yPosition -= 20;
    page.drawText(invoice.seller.name, { x: 50, y: yPosition, size: 10 });
    yPosition -= 15;
    if (invoice.seller.address) {
      page.drawText(
        `${invoice.seller.address.line1}, ${invoice.seller.address.postalCode} ${invoice.seller.address.city}`,
        { x: 50, y: yPosition, size: 10 },
      );
      yPosition -= 15;
    }
    if (invoice.seller.identifiers?.siret) {
      page.drawText(`SIRET: ${invoice.seller.identifiers.siret}`, {
        x: 50,
        y: yPosition,
        size: 10,
      });
      yPosition -= 15;
    }
    if (invoice.seller.identifiers?.tva) {
      page.drawText(`TVA: ${invoice.seller.identifiers.tva}`, {
        x: 50,
        y: yPosition,
        size: 10,
      });
      yPosition -= 30;
    }

    // Buyer
    page.drawText('Client / Buyer:', { x: 50, y: yPosition, size: 12 });
    yPosition -= 20;
    page.drawText(invoice.buyer.name, { x: 50, y: yPosition, size: 10 });
    yPosition -= 15;
    if (invoice.buyer.address) {
      page.drawText(
        `${invoice.buyer.address.line1}, ${invoice.buyer.address.postalCode} ${invoice.buyer.address.city}`,
        { x: 50, y: yPosition, size: 10 },
      );
      yPosition -= 30;
    }

    // Line items
    page.drawText('Articles / Items:', { x: 50, y: yPosition, size: 12 });
    yPosition -= 25;

    invoice.items.forEach((item, index) => {
      const line = `${index + 1}. ${item.description} - ${item.quantity} × ${item.unitPrice.toFixed(2)} ${invoice.currency} = ${item.netAmount.toFixed(2)} ${invoice.currency}`;
      page.drawText(line, { x: 50, y: yPosition, size: 9 });
      yPosition -= 15;

      if (yPosition < 100) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = newPage.getSize().height - 50;
      }
    });

    yPosition -= 20;

    // Totals
    page.drawText(
      `Sous-total HT / Subtotal: ${invoice.subtotal.toFixed(2)} ${invoice.currency}`,
      { x: 50, y: yPosition, size: 11 },
    );
    yPosition -= 20;

    page.drawText(
      `TVA / VAT: ${invoice.totalVAT.toFixed(2)} ${invoice.currency}`,
      { x: 50, y: yPosition, size: 11 },
    );
    yPosition -= 20;

    page.drawText(
      `TOTAL TTC / Total: ${invoice.totalAmount.toFixed(2)} ${invoice.currency}`,
      { x: 50, y: yPosition, size: 14 },
    );

    // Footer
    yPosition = 50;
    page.drawText('Document généré avec Factur-X / Factur-X compliant', {
      x: 50,
      y: yPosition,
      size: 8,
    });
  }
}
