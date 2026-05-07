import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-music-toolbar',
  imports: [CommonModule],
  templateUrl: './music-toolbar.component.html',
  styleUrl: './music-toolbar.component.scss'
})
export class MusicToolbarComponent {
  @Output() createFolder = new EventEmitter<void>();
  @Output() uploadFiles = new EventEmitter<FileList>();
  @Output() refresh = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<'asc' | 'desc'>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  sortOrder: 'asc' | 'desc' = 'asc';

  triggerUpload() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(input.files);
      input.value = '';
    }
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.emit(input.value);
  }

  toggleSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit(this.sortOrder);
  }
}
