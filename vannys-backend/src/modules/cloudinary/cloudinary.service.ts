import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  urlThumbnail: string;
  urlMedium: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly folder: string;

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    this.folder = config.get('CLOUDINARY_FOLDER', 'vannys-touch/products');
  }

  async uploadBuffer(buffer: Buffer, subfolder?: string): Promise<CloudinaryUploadResult> {
    const folder = subfolder ? `${this.folder}/${subfolder}` : this.folder;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      urlThumbnail: this.buildTransformUrl(result.public_id, 'w_300,h_300,c_fill,q_auto,f_auto'),
      urlMedium: this.buildTransformUrl(result.public_id, 'w_600,h_600,c_fill,q_auto,f_auto'),
    };
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted Cloudinary asset: ${publicId}`);
    } catch (err) {
      this.logger.error(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
    }
  }

  private buildTransformUrl(publicId: string, transformation: string): string {
    return cloudinary.url(publicId, {
      transformation: [{ raw_transformation: transformation }],
      secure: true,
    });
  }
}
