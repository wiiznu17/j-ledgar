export interface IStorageProvider {
  /**
   * Uploads a file to object storage.
   * @param key The destination path/key in the bucket.
   * @param file Buffer of the file content.
   * @param contentType MIME type of the file.
   */
  uploadFile(key: string, buffer: Buffer, mimetype: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;

  /**
   * Generates a signed URL for temporary access to a file.
   * @param key The file key.
   * @param expires Seconds until the link expires.
   */
  getSignedUrl(key: string, expires?: number): Promise<string>;
}

export const IStorageProvider = Symbol('IStorageProvider');
