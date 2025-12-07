/**
 * Storage Service Interface
 *
 * Abstract interface for document storage backends.
 * Can be implemented for local filesystem, S3, Azure Blob, etc.
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   *
   * @param path - Relative path within storage (e.g., "tax/org123/2025/vat-returns/2025-01.json")
   * @param data - File data as Buffer or string
   * @param mimeType - MIME type of the file
   * @returns URL or path to the stored file
   */
  upload(path: string, data: Buffer | string, mimeType: string): Promise<string>;

  /**
   * Download a file from storage
   *
   * @param url - URL or path returned from upload()
   * @returns File data as Buffer
   */
  download(url: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   *
   * @param url - URL or path returned from upload()
   */
  delete(url: string): Promise<void>;

  /**
   * Check if a file exists
   *
   * @param url - URL or path to check
   * @returns True if file exists
   */
  exists(url: string): Promise<boolean>;
}
