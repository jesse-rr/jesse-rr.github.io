import { Injectable } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { DriveService } from './drive.service';

const YT_DLP_API = 'https://cobalt-api-01no.onrender.com'

@Injectable({ providedIn: 'root' })
export class YoutubeDownloadService {
  constructor(
    private authService: GoogleAuthService,
    private driveService: DriveService
  ) { }

  async download(
    url: string,
    format: 'mp3' | 'mp4',
    folderId: string,
    onProgress?: (status: string) => void
  ): Promise<string> {
    onProgress?.('Requesting download...');

    // First get video info for the filename
    const infoRes = await fetch(`${YT_DLP_API}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!infoRes.ok) {
      const err = await infoRes.json();
      throw new Error(`Failed to get video info: ${err.error}`);
    }

    const info = await infoRes.json();
    onProgress?.('Downloading video...');

    // Download the actual file
    const downloadRes = await fetch(`${YT_DLP_API}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format }),
    });

    if (!downloadRes.ok) {
      const err = await downloadRes.json();
      throw new Error(`Download failed: ${err.error}`);
    }

    const blob = await downloadRes.blob();
    
    let filename = this.sanitizeFilename(info.title || 'youtube_video');
    if (!filename.endsWith(`.${format}`)) {
      filename = `${filename}.${format}`;
    }

    onProgress?.(`Uploading "${filename}" to Drive...`);

    const file = new File([blob], filename, {
      type: format === 'mp3' ? 'audio/mpeg' : 'video/mp4'
    });

    await this.driveService.uploadFile(file, folderId);
    return filename;
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 200);
  }
}
