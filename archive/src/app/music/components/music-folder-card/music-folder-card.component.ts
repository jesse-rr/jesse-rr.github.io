import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveFile } from '../../models/drive.model';

@Component({
  selector: 'app-music-folder-card',
  imports: [CommonModule],
  templateUrl: './music-folder-card.component.html',
  styleUrl: './music-folder-card.component.scss'
})
export class MusicFolderCardComponent {
  @Input() file!: DriveFile;
  @Output() open = new EventEmitter<void>();
  @Output() dropFiles = new EventEmitter<void>();
  @Output() contextMenu = new EventEmitter<{ x: number; y: number; file: DriveFile }>();

  isDragOver = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    this.dropFiles.emit();
  }

  onClick() {
    this.open.emit();
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.emit({
      x: event.clientX,
      y: event.clientY,
      file: this.file
    });
  }
}
