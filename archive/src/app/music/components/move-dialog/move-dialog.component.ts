import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveService } from '../../services/drive.service';
import { DriveFile, FOLDER_MIME } from '../../models/drive.model';

interface FolderNode {
  file: DriveFile;
  children?: FolderNode[];
  expanded: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-move-dialog',
  imports: [CommonModule],
  templateUrl: './move-dialog.component.html',
  styleUrl: './move-dialog.component.scss'
})
export class MoveDialogComponent implements OnInit {
  @Input() fileName: string = '';
  @Output() move = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  folders: FolderNode[] = [];
  selectedFolderId: string | null = null;
  loading = true;

  constructor(private driveService: DriveService) {}

  async ngOnInit() {
    try {
      const rootId = await this.driveService.resolveMusicRoot();
      const rootFolders = await this.driveService.listAllFolders(rootId);

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
      console.error('Failed to load folders', err);
    } finally {
      this.loading = false;
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
        console.error('Failed to load subfolders', err);
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

  onMove() {
    if (this.selectedFolderId) {
      this.move.emit(this.selectedFolderId);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
  }
}
