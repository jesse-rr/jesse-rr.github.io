import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveFile, formatFileSize, getFileExtension } from '../../models/drive.model';

@Component({
  selector: 'app-music-file-card',
  imports: [CommonModule],
  templateUrl: './music-file-card.component.html',
  styleUrl: './music-file-card.component.scss'
})
export class MusicFileCardComponent {
  @Input() file!: DriveFile;
  @Input() index: number = 0;
  @Input() isPlaying: boolean = false;
  @Input() isPaused: boolean = false;
  @Output() play = new EventEmitter<void>();
  @Output() contextMenu = new EventEmitter<{ x: number; y: number; file: DriveFile }>();

  get fileSize(): string {
    return formatFileSize(this.file.size);
  }

  get fileExt(): string {
    return getFileExtension(this.file.name);
  }

  get displayName(): string {
    const name = this.file.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.substring(0, lastDot) : name;
  }

  onPlay(event: MouseEvent) {
    event.stopPropagation();
    this.play.emit();
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
