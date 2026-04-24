export interface IStorageProvider {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
  downloadFile(url: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
}
