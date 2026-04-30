import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rename-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './rename-dialog.component.html',
  styleUrl: './rename-dialog.component.scss'
})
export class RenameDialogComponent implements OnInit {
  @Input() currentName: string = '';
  @Output() rename = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  newName: string = '';

  ngOnInit() {
    this.newName = this.currentName;
  }

  onSubmit() {
    const trimmed = this.newName.trim();
    if (trimmed && trimmed !== this.currentName) {
      this.rename.emit(trimmed);
    } else {
      this.cancel.emit();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
  }
}
