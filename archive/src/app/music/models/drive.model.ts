export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
  iconLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface DriveFolder extends DriveFile {
  mimeType: 'application/vnd.google-apps.folder';
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export const FOLDER_MIME = 'application/vnd.google-apps.folder';

export const AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
];

export function isAudioFile(file: DriveFile): boolean {
  return AUDIO_MIMES.some(m => file.mimeType.startsWith(m.split('/')[0] + '/'));
}

export function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return '';
  const b = parseInt(bytes, 10);
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
}
