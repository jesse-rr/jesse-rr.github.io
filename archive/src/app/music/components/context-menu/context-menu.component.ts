import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveFile, FOLDER_MIME } from '../../models/drive.model';

export type ContextMenuAction = 'rename' | 'delete' | 'move' | 'play' | 'download';

@Component({
  selector: 'app-context-menu',
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() target: DriveFile | null = null;
  @Output() action = new EventEmitter<ContextMenuAction>();
  @Output() close = new EventEmitter<void>();

  get isFolder(): boolean {
    return this.target?.mimeType === FOLDER_MIME;
  }

  get menuStyle() {
    const menuWidth = 180;
    const menuHeight = 200;
    let adjustedX = this.x;
    let adjustedY = this.y;

    if (typeof window !== 'undefined') {
      if (this.x + menuWidth > window.innerWidth) {
        adjustedX = window.innerWidth - menuWidth - 10;
      }
      if (this.y + menuHeight > window.innerHeight) {
        adjustedY = window.innerHeight - menuHeight - 10;
      }
    }

    return {
      left: adjustedX + 'px',
      top: adjustedY + 'px'
    };
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.close.emit();
  }

  @HostListener('document:contextmenu')
  onDocumentContextMenu() {
    this.close.emit();
  }

  onAction(action: ContextMenuAction, event: MouseEvent) {
    event.stopPropagation();
    this.action.emit(action);
  }
}
