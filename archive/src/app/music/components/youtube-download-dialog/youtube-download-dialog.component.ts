import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DriveService } from '../../services/drive.service';
import { DriveFile, FOLDER_MIME } from '../../models/drive.model';

interface FolderNode {
  file: DriveFile;
  children?: FolderNode[];
  expanded: boolean;
  loading: boolean;
}

export interface YoutubeDownloadRequest {
  url: string;
  format: 'mp3' | 'mp4';
  folderId: string;
}

@Component({
  selector: 'app-youtube-download-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './youtube-download-dialog.component.html',
  styleUrl: './youtube-download-dialog.component.scss'
})
export class YoutubeDownloadDialogComponent implements OnInit {
  @Output() download = new EventEmitter<YoutubeDownloadRequest>();
  @Output() cancel = new EventEmitter<void>();

  youtubeUrl: string = '';
  format: 'mp3' | 'mp4' = 'mp3';
  folders: FolderNode[] = [];
  selectedFolderId: string | null = null;
  foldersLoading = true;

  constructor(private driveService: DriveService) {}

  async ngOnInit() {
    try {
      const rootId = await this.driveService.resolveMusicRoot();
      const rootFolders = await this.driveService.listAllFolders(rootId);

      this.selectedFolderId = rootId;

      this.folders = [{
        file: { id: rootId, name: 'Music (root)', mimeType: FOLDER_MIME },
        expanded: true,
        loading: false,
        children: rootFolders.map(f => ({
          file: f,
          expanded: false,
          loading: false
        }))
      }];
    } catch (err) {
      console.error(err);
    } finally {
      this.foldersLoading = false;
    }
  }

  async toggleExpand(node: FolderNode) {
    if (node.expanded) {
      node.expanded = false;
      return;
    }

    if (!node.children) {
      node.loading = true;
      try {
        const subFolders = await this.driveService.listAllFolders(node.file.id);
        node.children = subFolders.map(f => ({
          file: f,
          expanded: false,
          loading: false
        }));
      } catch (err) {
        console.error(err);
        node.children = [];
      } finally {
        node.loading = false;
      }
    }

    node.expanded = true;
  }

  selectFolder(node: FolderNode) {
    this.selectedFolderId = node.file.id;
  }

  get isValid(): boolean {
    return this.youtubeUrl.trim().length > 0 && !!this.selectedFolderId;
  }

  onSubmit() {
    if (!this.isValid) return;
    this.download.emit({
      url: this.youtubeUrl.trim(),
      format: this.format,
      folderId: this.selectedFolderId!
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
  }
}
