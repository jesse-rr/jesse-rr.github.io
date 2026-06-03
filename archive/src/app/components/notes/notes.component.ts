// notes.component.ts - fix the marked configuration
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { Subject, debounceTime } from 'rxjs';
import { DriveFile, FOLDER_MIME, isMarkdownFile } from '../../music/models/drive.model';
import { GoogleAuthService } from '../../music/services/google-auth.service';
import { DriveService } from '../../music/services/drive.service';
import { HeaderComponent } from '../header/header.component';
import { DriveLoginComponent } from '../../music/components/drive-login/drive-login.component';

@Component({
  selector: 'app-notes',
  imports: [CommonModule, FormsModule, DriveLoginComponent, HeaderComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnInit, OnDestroy {
  folderMime = FOLDER_MIME;
  noteFolderContents: DriveFile[] = [];
  noteFolderPath: DriveFile[] = [];
  currentNoteFolderId: string = '';
  selectedNote: DriveFile | null = null;
  currentNoteTitle: string = '';
  currentNoteContent: string = '';
  renderedMarkdown: string = '';
  savingNote = false;
  sidebarVisible = true;
  editorVisible = true;
  previewVisible = true;
  
  modalVisible = false;
  modalTitle = '';
  modalInput = '';
  modalType: 'note' | 'folder' = 'note';
  
  private saveDebounce = new Subject<void>();
  private autoSaveInterval: any;

  constructor(
    public authService: GoogleAuthService,
    private driveService: DriveService
  ) {
    this.saveDebounce.pipe(debounceTime(500)).subscribe(() => {
      this.saveCurrentNoteImmediate();
    });
    
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  async ngOnInit() {
    if (this.authService.isAuthenticated) {
      await this.initNotesRoot();
    }
    this.authService.accessToken$.subscribe(async (token) => {
      if (token) {
        await this.initNotesRoot();
      }
    });
    this.autoSaveInterval = setInterval(() => {
      if (this.selectedNote && this.currentNoteContent) {
        this.saveCurrentNoteImmediate();
      }
    }, 10000);
  }

  ngOnDestroy() {
    this.saveDebounce.complete();
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.selectedNote) {
      this.saveCurrentNoteImmediate();
    }
  }

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    if (this.selectedNote) {
      this.saveCurrentNoteImmediate();
    }
  }

  private async initNotesRoot() {
    try {
      this.currentNoteFolderId = await this.driveService.resolveNotesRoot();
      await this.loadNoteFolderContents();
    } catch (error) {
      console.error('Failed to init notes root:', error);
    }
  }

  async refreshNotes() {
    await this.loadNoteFolderContents();
    if (this.selectedNote) {
      const refreshed = this.noteFolderContents.find(n => n.id === this.selectedNote?.id);
      if (refreshed) {
        await this.openNote(refreshed);
      }
    }
  }

  async loadNoteFolderContents() {
    if (!this.currentNoteFolderId) return;
    try {
      this.noteFolderContents = await this.driveService.listFolder(this.currentNoteFolderId);
      await this.loadNoteFolderPath();
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }

  private async loadNoteFolderPath() {
    const path: DriveFile[] = [];
    let currentId = this.currentNoteFolderId;
    const rootId = await this.driveService.resolveNotesRoot();

    while (currentId && currentId !== rootId) {
      try {
        const file = await this.driveService.getFile(currentId);
        path.unshift(file);
        currentId = file.parents?.[0] || '';
      } catch {
        break;
      }
    }

    const root = await this.driveService.getFile(rootId);
    path.unshift(root);
    this.noteFolderPath = path;
  }

  async navigateToFolder(index: number) {
    const targetFolder = this.noteFolderPath[index];
    if (targetFolder.id === this.currentNoteFolderId) return;
    this.currentNoteFolderId = targetFolder.id;
    await this.loadNoteFolderContents();
    this.selectedNote = null;
    this.currentNoteTitle = '';
    this.currentNoteContent = '';
    this.renderedMarkdown = '';
  }

  async openNote(note: DriveFile) {
    if (note.mimeType === FOLDER_MIME) {
      this.currentNoteFolderId = note.id;
      await this.loadNoteFolderContents();
      this.selectedNote = null;
      return;
    }

    if (!isMarkdownFile(note)) return;

    if (this.selectedNote && this.selectedNote.id !== note.id) {
      await this.saveCurrentNoteImmediate();
    }

    this.selectedNote = note;
    this.currentNoteTitle = note.name.replace(/\.md$/, '');
    try {
      this.currentNoteContent = await this.driveService.getMarkdownContent(note.id);
      this.renderMarkdown();
    } catch (error) {
      this.currentNoteContent = '# Error loading note\n\nCould not load the content.';
      this.renderMarkdown();
    }
  }

  showCreateNoteModal() {
    this.modalType = 'note';
    this.modalTitle = 'Create New Note';
    this.modalInput = '';
    this.modalVisible = true;
  }

  showCreateFolderModal() {
    this.modalType = 'folder';
    this.modalTitle = 'Create New Folder';
    this.modalInput = '';
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
    this.modalInput = '';
  }

  async confirmModal() {
    if (!this.modalInput.trim()) return;
    
    if (this.modalType === 'note') {
      await this.createNewNote(this.modalInput);
    } else {
      await this.createNewFolder(this.modalInput);
    }
    this.closeModal();
  }

  async createNewNote(name: string) {
    try {
      const newNote = await this.driveService.createMarkdownFile(name, this.currentNoteFolderId, `# ${name}\n\nStart writing here...`);
      await this.loadNoteFolderContents();
      await this.openNote(newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Please make sure you are logged in.');
    }
  }

  async createNewFolder(name: string) {
    try {
      await this.driveService.createFolder(name, this.currentNoteFolderId);
      await this.loadNoteFolderContents();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please make sure you are logged in.');
    }
  }

  onContentChange() {
    this.renderMarkdown();
    this.saveDebounce.next();
  }

  private renderMarkdown() {
    try {
      this.renderedMarkdown = marked.parse(this.currentNoteContent) as string;
    } catch (error) {
      this.renderedMarkdown = '<p>Error rendering markdown</p>';
    }
  }

  private async saveCurrentNoteImmediate() {
    if (!this.selectedNote || this.savingNote) return;

    this.savingNote = true;
    try {
      const titleWithExt = this.currentNoteTitle.endsWith('.md') ? this.currentNoteTitle : this.currentNoteTitle + '.md';
      if (titleWithExt !== this.selectedNote.name) {
        await this.driveService.rename(this.selectedNote.id, titleWithExt);
        this.selectedNote.name = titleWithExt;
        await this.loadNoteFolderContents();
      }
      await this.driveService.updateMarkdownFile(this.selectedNote.id, this.currentNoteContent);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      this.savingNote = false;
    }
  }

  async deleteCurrentNote() {
    if (!this.selectedNote) return;
    const confirmed = confirm(`Delete "${this.selectedNote.name}"?`);
    if (!confirmed) return;

    try {
      await this.driveService.delete(this.selectedNote.id);
      this.selectedNote = null;
      this.currentNoteTitle = '';
      this.currentNoteContent = '';
      this.renderedMarkdown = '';
      await this.loadNoteFolderContents();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note.');
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  toggleEditor() {
    this.editorVisible = !this.editorVisible;
  }

  togglePreview() {
    this.previewVisible = !this.previewVisible;
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
  }
}