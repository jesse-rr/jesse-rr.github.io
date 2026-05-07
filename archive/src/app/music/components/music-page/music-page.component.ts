import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import JSZip from 'jszip';
import { HeaderComponent } from '../../../components/header/header.component';
import { DriveLoginComponent } from '../drive-login/drive-login.component';
import { MusicBreadcrumbComponent } from '../music-breadcrumb/music-breadcrumb.component';
import { MusicToolbarComponent } from '../music-toolbar/music-toolbar.component';
import { MusicFolderCardComponent } from '../music-folder-card/music-folder-card.component';
import { MusicFileCardComponent } from '../music-file-card/music-file-card.component';
import { ContextMenuComponent, ContextMenuAction } from '../context-menu/context-menu.component';
import { RenameDialogComponent } from '../rename-dialog/rename-dialog.component';
import { MoveDialogComponent } from '../move-dialog/move-dialog.component';
import { CreateFolderDialogComponent } from '../create-folder-dialog/create-folder-dialog.component';
import { GoogleAuthService } from '../../services/google-auth.service';
import { DriveService } from '../../services/drive.service';
import { DriveFile, BreadcrumbItem, FOLDER_MIME } from '../../models/drive.model';

@Component({
  selector: 'app-music-page',
  imports: [
    CommonModule,
    HeaderComponent,
    DriveLoginComponent,
    MusicBreadcrumbComponent,
    MusicToolbarComponent,
    MusicFolderCardComponent,
    MusicFileCardComponent,
    ContextMenuComponent,
    RenameDialogComponent,
    MoveDialogComponent,
    CreateFolderDialogComponent
  ],
  templateUrl: './music-page.component.html',
  styleUrl: './music-page.component.scss'
})
export class MusicPageComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  loading = false;
  error: string | null = null;

  currentFolderId: string | null = null;
  files: DriveFile[] = [];
  breadcrumb: BreadcrumbItem[] = [];

  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuTarget: DriveFile | null = null;

  renameDialogVisible = false;
  renameTarget: DriveFile | null = null;

  moveDialogVisible = false;
  moveTarget: DriveFile | null = null;

  createFolderDialogVisible = false;

  uploadProgress: number | null = null;

  playingFile: DriveFile | null = null;
  audioBlobUrl: string | null = null;
  audioLoading = false;
  audioPlaying = false;
  audioCurrentTime = 0;
  audioDuration = 0;
  audioVolume = 1;

  toastMessage: string | null = null;
  toastTimeout: any = null;

  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  private subscriptions: Subscription[] = [];

  get folders(): DriveFile[] {
    return this.files.filter(f => f.mimeType === FOLDER_MIME);
  }

  get audioFiles(): DriveFile[] {
    return this.files.filter(f => f.mimeType !== FOLDER_MIME);
  }

  constructor(
    private authService: GoogleAuthService,
    private driveService: DriveService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.authService.accessToken$.subscribe(token => {
        this.isAuthenticated = !!token;
        if (token) {
          this.initDrive();
        }
      })
    );

    this.subscriptions.push(
      this.driveService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.cleanupAudio();
  }

  async initDrive() {
    try {
      this.error = null;
      const rootId = await this.driveService.resolveMusicRoot();
      this.currentFolderId = rootId;
      this.breadcrumb = [{ id: rootId, name: 'Music' }];
      await this.loadFolder(rootId);
    } catch (err: any) {
      this.error = 'Failed to connect to Google Drive. Please try again.';
      console.error(err);
    }
  }

  async loadFolder(folderId: string) {
    try {
      this.error = null;
      this.currentFolderId = folderId;
      this.files = await this.driveService.listFolder(folderId);
    } catch (err: any) {
      this.error = 'Failed to load folder contents.';
      console.error(err);
    }
  }

  async navigateToFolder(folder: DriveFile) {
    this.breadcrumb.push({ id: folder.id, name: folder.name });
    await this.loadFolder(folder.id);
  }

  async navigateToBreadcrumb(item: BreadcrumbItem) {
    const index = this.breadcrumb.findIndex(b => b.id === item.id);
    if (index >= 0) {
      this.breadcrumb = this.breadcrumb.slice(0, index + 1);
      await this.loadFolder(item.id);
    }
  }

  onCreateFolder() {
    this.createFolderDialogVisible = true;
  }

  async onCreateFolderConfirm(name: string) {
    if (!this.currentFolderId) return;
    this.createFolderDialogVisible = false;
    try {
      await this.driveService.createFolder(name, this.currentFolderId);
      await this.loadFolder(this.currentFolderId);
      this.showToast(`Created folder "${name}"`);
    } catch (err) {
      this.showToast('Failed to create folder');
      console.error(err);
    }
  }

  onCancelCreateFolder() {
    this.createFolderDialogVisible = false;
  }

  async onUploadFiles(files: FileList) {
    if (!this.currentFolderId || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        this.uploadProgress = 0;
        await this.driveService.uploadFile(file, this.currentFolderId, (pct) => {
          this.uploadProgress = pct;
        });
        this.showToast(`Uploaded "${file.name}"`);
      } catch (err) {
        this.showToast(`Failed to upload "${file.name}"`);
        console.error(err);
      }
    }

    this.uploadProgress = null;
    await this.loadFolder(this.currentFolderId);
  }

  onContextMenu(event: { x: number; y: number; file: DriveFile }) {
    this.contextMenuX = event.x;
    this.contextMenuY = event.y;
    this.contextMenuTarget = event.file;
    this.contextMenuVisible = true;
  }

  onCloseContextMenu() {
    this.contextMenuVisible = false;
    this.contextMenuTarget = null;
  }

  async onContextMenuAction(action: ContextMenuAction) {
    const target = this.contextMenuTarget;
    this.onCloseContextMenu();
    if (!target || !this.currentFolderId) return;

    switch (action) {
      case 'rename':
        this.renameTarget = target;
        this.renameDialogVisible = true;
        break;

      case 'delete':
        if (confirm(`Delete "${target.name}"? This cannot be undone.`)) {
          try {
            await this.driveService.delete(target.id);
            await this.loadFolder(this.currentFolderId);
            this.showToast(`Deleted "${target.name}"`);
          } catch (err) {
            this.showToast('Failed to delete');
            console.error(err);
          }
        }
        break;

      case 'move':
        this.moveTarget = target;
        this.moveDialogVisible = true;
        break;

      case 'play':
        this.startPlayback(target);
        break;

      case 'download':
        this.downloadItem(target);
        break;
    }
  }

  async onRename(newName: string) {
    if (!this.renameTarget || !this.currentFolderId) return;
    try {
      await this.driveService.rename(this.renameTarget.id, newName);
      this.renameDialogVisible = false;
      this.renameTarget = null;
      await this.loadFolder(this.currentFolderId);
      this.showToast(`Renamed to "${newName}"`);
    } catch (err) {
      this.showToast('Failed to rename');
      console.error(err);
    }
  }

  onCancelRename() {
    this.renameDialogVisible = false;
    this.renameTarget = null;
  }

  async onMove(targetFolderId: string) {
    if (!this.moveTarget || !this.currentFolderId) return;
    try {
      await this.driveService.move(this.moveTarget.id, targetFolderId, this.currentFolderId);
      this.moveDialogVisible = false;
      this.moveTarget = null;
      await this.loadFolder(this.currentFolderId);
      this.showToast('Moved successfully');
    } catch (err) {
      this.showToast('Failed to move');
      console.error(err);
    }
  }

  onCancelMove() {
    this.moveDialogVisible = false;
    this.moveTarget = null;
  }

  async onPlayFile(file: DriveFile) {
    if (this.playingFile?.id === file.id) {
      this.togglePlayPause();
      return;
    }
    await this.startPlayback(file);
  }

  private async startPlayback(file: DriveFile) {
    this.cleanupAudio();
    this.playingFile = file;
    this.audioLoading = true;
    this.audioPlaying = false;

    try {
      const url = this.driveService.getStreamUrl(file.id);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.authService.accessToken}` }
      });

      if (!res.ok) throw new Error(`Failed to stream: ${res.status}`);

      const blob = await res.blob();
      this.audioBlobUrl = URL.createObjectURL(blob);
      this.audioLoading = false;

      setTimeout(() => {
        if (this.audioElement?.nativeElement) {
          const audio = this.audioElement.nativeElement;
          audio.volume = this.audioVolume;
          audio.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      this.audioLoading = false;
      this.playingFile = null;
      this.showToast('Failed to play audio');
      console.error(err);
    }
  }

  togglePlayPause() {
    if (!this.audioElement?.nativeElement) return;
    const audio = this.audioElement.nativeElement;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  onAudioPlay() {
    this.audioPlaying = true;
  }

  onAudioPause() {
    this.audioPlaying = false;
  }

  onAudioTimeUpdate() {
    if (!this.audioElement?.nativeElement) return;
    this.audioCurrentTime = this.audioElement.nativeElement.currentTime;
  }

  onAudioLoaded() {
    if (!this.audioElement?.nativeElement) return;
    this.audioDuration = this.audioElement.nativeElement.duration;
  }

  onSeek(event: MouseEvent, progressBar: HTMLElement) {
    if (!this.audioElement?.nativeElement || !this.audioDuration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    this.audioElement.nativeElement.currentTime = pct * this.audioDuration;
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioVolume = parseFloat(input.value);
    if (this.audioElement?.nativeElement) {
      this.audioElement.nativeElement.volume = this.audioVolume;
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get progressPercent(): number {
    if (!this.audioDuration) return 0;
    return (this.audioCurrentTime / this.audioDuration) * 100;
  }

  onStopPlayback() {
    this.cleanupAudio();
    this.playingFile = null;
    this.audioPlaying = false;
    this.audioCurrentTime = 0;
    this.audioDuration = 0;
  }

  private cleanupAudio() {
    if (this.audioBlobUrl) {
      URL.revokeObjectURL(this.audioBlobUrl);
      this.audioBlobUrl = null;
    }
  }

  private async downloadItem(file: DriveFile) {
    if (file.mimeType === FOLDER_MIME) {
      await this.downloadFolder(file);
    } else {
      await this.downloadFile(file);
    }
  }

  private async downloadFile(file: DriveFile) {
    try {
      this.showToast(`Downloading "${file.name}"...`);
      const url = this.driveService.getStreamUrl(file.id);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.authService.accessToken}` }
      });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      this.showToast('Failed to download');
      console.error(err);
    }
  }

  private async downloadFolder(folder: DriveFile) {
    try {
      this.showToast(`Preparing "${folder.name}" for download...`);
      const files = await this.driveService.listFolder(folder.id);
      const audioFiles = files.filter(f => f.mimeType !== FOLDER_MIME);

      if (audioFiles.length === 0) {
        this.showToast('Folder is empty');
        return;
      }

      const zip = new JSZip();

      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        this.showToast(`Downloading ${i + 1}/${audioFiles.length}: ${file.name}`);
        const url = this.driveService.getStreamUrl(file.id);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${this.authService.accessToken}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          zip.file(file.name, blob);
        }
      }

      this.showToast('Creating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${folder.name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      this.showToast(`Downloaded "${folder.name}.zip"`);
    } catch (err) {
      this.showToast('Failed to download folder');
      console.error(err);
    }
  }

  logout() {
    this.authService.logout();
    this.files = [];
    this.breadcrumb = [];
    this.currentFolderId = null;
    this.cleanupAudio();
    this.playingFile = null;
  }

  private showToast(message: string) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  refresh() {
    if (this.currentFolderId) {
      this.loadFolder(this.currentFolderId);
    }
  }
}
