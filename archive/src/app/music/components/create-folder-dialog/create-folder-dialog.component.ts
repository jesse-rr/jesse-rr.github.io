import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-folder-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-folder-dialog.component.html',
  styleUrl: './create-folder-dialog.component.scss'
})
export class CreateFolderDialogComponent {
  @Output() create = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  folderName: string = '';

  onSubmit() {
    const trimmed = this.folderName.trim();
    if (trimmed) {
      this.create.emit(trimmed);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
  }
}
