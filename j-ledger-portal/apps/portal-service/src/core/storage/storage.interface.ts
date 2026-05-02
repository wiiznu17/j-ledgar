export interface IStorageProvider {
  uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folder?: string,
  ): Promise<{ url: string; key: string }>;
  
  deleteFile(key: string): Promise<void>;
  
  getSignedUrl?(key: string): Promise<string>;
}

export const STORAGE_PROVIDER = 'IStorageProvider';
