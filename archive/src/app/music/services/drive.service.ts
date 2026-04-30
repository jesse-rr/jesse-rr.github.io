import { Injectable } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { DriveFile, DriveListResponse, FOLDER_MIME } from '../models/drive.model';
import { MUSIC_ROOT_PATH } from '../config/google.config';
import { BehaviorSubject } from 'rxjs';

const API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

@Injectable({ providedIn: 'root' })
export class DriveService {
  private musicRootId: string | null = null;
  private rootResolving = false;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private authService: GoogleAuthService) {}

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.authService.accessToken}`,
    };
  }

  async resolveMusicRoot(): Promise<string> {
    if (this.musicRootId) return this.musicRootId;
    if (this.rootResolving) {
      while (this.rootResolving) {
        await new Promise(r => setTimeout(r, 100));
      }
      if (this.musicRootId) return this.musicRootId;
    }

    this.rootResolving = true;
    try {
      let parentId = 'root';

      for (const folderName of MUSIC_ROOT_PATH) {
        const query = `name='${folderName}' and '${parentId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
        const res = await this.request<DriveListResponse>(
          `${API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
        );

        if (res.files.length === 0) {
          const created = await this.createFolderRaw(folderName, parentId);
          parentId = created.id;
        } else {
          parentId = res.files[0].id;
        }
      }

      this.musicRootId = parentId;
      return parentId;
    } finally {
      this.rootResolving = false;
    }
  }

  async listFolder(folderId: string): Promise<DriveFile[]> {
    this.loadingSubject.next(true);
    try {
      const query = `'${folderId}' in parents and trashed=false`;
      const fields = 'files(id,name,mimeType,size,modifiedTime,parents,iconLink,webContentLink,thumbnailLink)';
      const orderBy = 'folder,name';

      let allFiles: DriveFile[] = [];
      let pageToken: string | undefined;

      do {
        const url = `${API_BASE}/files?q=${encodeURIComponent(query)}&fields=nextPageToken,${fields}&orderBy=${orderBy}&pageSize=100${pageToken ? '&pageToken=' + pageToken : ''}`;
        const res = await this.request<DriveListResponse>(url);
        allFiles = allFiles.concat(res.files);
        pageToken = res.nextPageToken;
      } while (pageToken);

      return allFiles.sort((a, b) => {
        const aIsFolder = a.mimeType === FOLDER_MIME ? 0 : 1;
        const bIsFolder = b.mimeType === FOLDER_MIME ? 0 : 1;
        if (aIsFolder !== bIsFolder) return aIsFolder - bIsFolder;
        return a.name.localeCompare(b.name);
      });
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async createFolder(name: string, parentId: string): Promise<DriveFile> {
    return this.createFolderRaw(name, parentId);
  }

  private async createFolderRaw(name: string, parentId: string): Promise<DriveFile> {
    const metadata = {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    };

    return this.request<DriveFile>(`${API_BASE}/files?fields=id,name,mimeType,parents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
  }

  async uploadFile(file: File, parentId: string, onProgress?: (pct: number) => void): Promise<DriveFile> {
    const metadata = {
      name: file.name,
      parents: [parentId],
    };

    if (file.size < 5 * 1024 * 1024) {
      return this.multipartUpload(file, metadata);
    } else {
      return this.resumableUpload(file, metadata, onProgress);
    }
  }

  private async multipartUpload(file: File, metadata: any): Promise<DriveFile> {
    const boundary = '---archive-music-boundary---';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelimiter = '\r\n--' + boundary + '--';

    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + file.type + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      base64Data +
      closeDelimiter;

    return this.request<DriveFile>(
      `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,parents`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      }
    );
  }

  private async resumableUpload(file: File, metadata: any, onProgress?: (pct: number) => void): Promise<DriveFile> {
    const initRes = await fetch(
      `${UPLOAD_BASE}/files?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,parents`,
      {
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': file.type,
          'X-Upload-Content-Length': file.size.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    const uploadUri = initRes.headers.get('Location')!;

    return new Promise<DriveFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUri);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    });
  }

  async rename(fileId: string, newName: string): Promise<DriveFile> {
    return this.request<DriveFile>(
      `${API_BASE}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,parents`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      }
    );
  }

  async move(fileId: string, newParentId: string, oldParentId: string): Promise<DriveFile> {
    return this.request<DriveFile>(
      `${API_BASE}/files/${fileId}?addParents=${newParentId}&removeParents=${oldParentId}&fields=id,name,mimeType,size,modifiedTime,parents`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }
    );
  }

  async delete(fileId: string): Promise<void> {
    await this.request<void>(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async getFile(fileId: string): Promise<DriveFile> {
    return this.request<DriveFile>(
      `${API_BASE}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,parents,webContentLink`
    );
  }

  getStreamUrl(fileId: string): string {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  async listAllFolders(folderId?: string): Promise<DriveFile[]> {
    const rootId = folderId || await this.resolveMusicRoot();
    const query = `'${rootId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
    const res = await this.request<DriveListResponse>(
      `${API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents)&orderBy=name&pageSize=100`
    );
    return res.files;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Drive API error ${res.status}: ${error}`);
    }

    if (res.status === 204) return undefined as T;

    return res.json();
  }
}
