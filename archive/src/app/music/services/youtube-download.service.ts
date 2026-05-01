import { Injectable } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { DriveService } from './drive.service';

const COBALT_API = 'https://api.cobalt.tools';

@Injectable({ providedIn: 'root' })
export class YoutubeDownloadService {
  constructor(
    private authService: GoogleAuthService,
    private driveService: DriveService
  ) {}

  async download(
    url: string,
    format: 'mp3' | 'mp4',
    folderId: string,
    onProgress?: (status: string) => void
  ): Promise<string> {
    onProgress?.('Requesting download...');

    const cobaltPayload: any = {
      url: url,
      downloadMode: format === 'mp3' ? 'audio' : 'auto',
      filenameStyle: 'pretty',
    };

    if (format === 'mp3') {
      cobaltPayload.audioFormat = 'mp3';
    }

    const cobaltRes = await fetch(`${COBALT_API}/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cobaltPayload),
    });

    if (!cobaltRes.ok) {
      const errText = await cobaltRes.text();
      throw new Error(`Download service error: ${errText}`);
    }

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      throw new Error(data.error?.code || 'Download failed');
    }

    let downloadUrl: string;

    if (data.status === 'tunnel' || data.status === 'redirect') {
      downloadUrl = data.url;
    } else if (data.status === 'picker') {
      if (data.audio) {
        downloadUrl = data.audio;
      } else if (data.picker && data.picker.length > 0) {
        downloadUrl = data.picker[0].url;
      } else {
        throw new Error('No downloadable content found');
      }
    } else {
      throw new Error(`Unexpected response status: ${data.status}`);
    }

    onProgress?.('Downloading file...');

    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
      throw new Error(`Failed to download file: ${fileRes.status}`);
    }

    const blob = await fileRes.blob();

    let filename = this.extractFilename(url, format);
    const disposition = fileRes.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    }

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

  private extractFilename(url: string, format: string): string {
    try {
      const parsed = new URL(url);
      const videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').pop() || 'video';
      return `youtube_${videoId}`;
    } catch {
      return `youtube_download`;
    }
  }
}
