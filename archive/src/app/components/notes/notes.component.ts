import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { Subject, debounceTime, switchMap } from 'rxjs';
import {DriveLoginComponent} from "../../music/components/drive-login/drive-login.component";
import {DriveFile, FOLDER_MIME, isMarkdownFile} from "../../music/models/drive.model";
import {GoogleAuthService} from "../../music/services/google-auth.service";
import {DriveService} from "../../music/services/drive.service";

@Component({
  selector: 'app-notes',
  imports: [CommonModule, FormsModule, DriveLoginComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnInit, OnDestroy {
  folderMime = FOLDER_MIME;
  folderContents: DriveFile[] = [];
  folderPath: DriveFile[] = [];
  currentFolderId: string = '';
  selectedNote: DriveFile | null = null;
  currentNoteTitle: string = '';
  currentNoteContent: string = '';
  renderedMarkdown: string = '';
  saving = false;
  private saveDebounce = new Subject<void>();

  constructor(
      public authService: GoogleAuthService,
      private driveService: DriveService
  ) {
    this.saveDebounce.pipe(debounceTime(1000)).subscribe(() => {
      this.saveNoteImmediate();
    });
  }

  async ngOnInit() {
    if (this.authService.isAuthenticated) {
      await this.initNotesRoot();
    }
  }

  ngOnDestroy() {
    this.saveDebounce.complete();
  }

  private async initNotesRoot() {
    try {
      this.currentFolderId = await this.driveService.resolveNotesRoot();
      await this.loadNotes();
    } catch (error) {
      console.error('Failed to init notes root:', error);
    }
  }

  async loadNotes() {
    if (!this.currentFolderId) return;
    try {
      this.folderContents = await this.driveService.listFolder(this.currentFolderId);
      await this.loadFolderPath();
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }

  private async loadFolderPath() {
    const path: DriveFile[] = [];
    let currentId = this.currentFolderId;
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
    this.folderPath = path;
  }

  async navigateToFolder(index: number) {
    const targetFolder = this.folderPath[index];
    if (targetFolder.id === this.currentFolderId) return;
    this.currentFolderId = targetFolder.id;
    await this.loadNotes();
    this.selectedNote = null;
    this.currentNoteTitle = '';
    this.currentNoteContent = '';
    this.renderedMarkdown = '';
  }

  async openNote(note: DriveFile) {
    if (note.mimeType === FOLDER_MIME) {
      this.currentFolderId = note.id;
      await this.loadNotes();
      this.selectedNote = null;
      this.currentNoteTitle = '';
      this.currentNoteContent = '';
      this.renderedMarkdown = '';
      return;
    }

    if (!isMarkdownFile(note)) return;

    this.selectedNote = note;
    this.currentNoteTitle = note.name.replace(/\.md$/, '');
    try {
      this.currentNoteContent = await this.driveService.getMarkdownContent(note.id);
      this.renderMarkdown();
    } catch (error) {
      console.error('Failed to load note content:', error);
      this.currentNoteContent = '# Error loading note\n\nCould not load the content.';
      this.renderMarkdown();
    }
  }

  async createNewNote() {
    const name = prompt('Enter note name:');
    if (!name) return;

    try {
      const newNote = await this.driveService.createMarkdownFile(name, this.currentFolderId, `# ${name}\n\nStart writing here...`);
      await this.loadNotes();
      await this.openNote(newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }

  async createNewFolder() {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      await this.driveService.createFolder(name, this.currentFolderId);
      await this.loadNotes();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }

  onContentChange() {
    this.renderMarkdown();
    this.saveDebounce.next();
  }

  private renderMarkdown() {
    try {
      this.renderedMarkdown = marked(this.currentNoteContent) as string;
    } catch (error) {
      this.renderedMarkdown = '<p>Error rendering markdown</p>';
    }
  }

  saveNote() {
    this.saveDebounce.next();
  }

  private async saveNoteImmediate() {
    if (!this.selectedNote || this.saving) return;

    this.saving = true;
    try {
      const titleWithExt = this.currentNoteTitle.endsWith('.md') ? this.currentNoteTitle : this.currentNoteTitle + '.md';
      if (titleWithExt !== this.selectedNote.name) {
        await this.driveService.rename(this.selectedNote.id, titleWithExt);
        this.selectedNote.name = titleWithExt;
      }
      await this.driveService.updateMarkdownFile(this.selectedNote.id, this.currentNoteContent);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      this.saving = false;
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
      await this.loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
  }
}