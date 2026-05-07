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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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
}
