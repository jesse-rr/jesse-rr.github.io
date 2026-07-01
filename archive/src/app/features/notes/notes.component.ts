import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { Subject, debounceTime } from 'rxjs';
import { DriveFile, FOLDER_MIME, isMarkdownFile } from '../../shared/models/drive.model';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { DriveService } from '../../core/services/drive.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { DriveLoginComponent } from '../../shared/components/drive-login/drive-login.component';

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
  
  newFileName = '';
  
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
      await this.handleQueryParams();
    } catch (error) {
      console.error(error);
    }
  }

  private async handleQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'new-note') {
      const title = params.get('title') || 'New Note';
      const content = params.get('content') || '';
      try {
        const newNote = await this.driveService.createMarkdownFile(title, this.currentNoteFolderId, content);
        await this.loadNoteFolderContents();
        await this.openNote(newNote);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error(error);
      }
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
      console.error(error);
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
      this.currentNoteContent = '';
      this.renderMarkdown();
    }
  }

  async createNewNote() {
    if (!this.newFileName.trim()) return;
    try {
      const name = this.newFileName.trim();
      this.newFileName = '';
      const newNote = await this.driveService.createMarkdownFile(name, this.currentNoteFolderId, `# ${name}\n\nStart writing here...`);
      await this.loadNoteFolderContents();
      await this.openNote(newNote);
    } catch (error) {
      alert('Failed to create note.');
    }
  }

  async createNewFolder() {
    if (!this.newFileName.trim()) return;
    try {
      const name = this.newFileName.trim();
      this.newFileName = '';
      await this.driveService.createFolder(name, this.currentNoteFolderId);
      await this.loadNoteFolderContents();
    } catch (error) {
      alert('Failed to create folder.');
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
      this.renderedMarkdown = '';
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
      console.error(error);
    } finally {
      this.savingNote = false;
    }
  }

  async deleteCurrentNote() {
    if (!this.selectedNote) return;
    const ok = confirm('Are you sure you want to delete this note?');
    if (!ok) return;

    try {
      await this.driveService.delete(this.selectedNote.id);
      this.selectedNote = null;
      this.currentNoteTitle = '';
      this.currentNoteContent = '';
      this.renderedMarkdown = '';
      await this.loadNoteFolderContents();
    } catch (error) {
      alert('Failed to delete note.');
    }
  }
}