import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadResult {
  url: string;
  storageKey: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateUploadUrl(reviewId: string, filename: string, mimeType: string): Promise<UploadResult> {
    const storageKey = `reviews/${reviewId}/${Date.now()}-${filename}`;
    // Local / S3 signed URL abstraction
    const url = `https://storage.marketplace.local/${storageKey}`;
    return { url, storageKey };
  }
}
