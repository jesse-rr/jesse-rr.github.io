import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { FolderComponent } from '../folder/folder.component';
import { FileComponent } from '../file/file.component';
import { UnidentifiedComponent } from '../unidentified/unidentified.component';
import { marked } from 'marked';
import { Subject, debounceTime } from 'rxjs';
import { DriveFile, FOLDER_MIME, isMarkdownFile } from "../../music/models/drive.model";
import { GoogleAuthService } from "../../music/services/google-auth.service";
import { DriveService } from "../../music/services/drive.service";
import { Entry } from '../../models/entry.model'

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, HeaderComponent, FolderComponent, FileComponent, UnidentifiedComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  categories = ['All', 'Project', 'File', 'Undefined', 'Notes'];
  selectedCategory = 'All';
  searchQuery = '';
  selectedTag = '';
  tags: string[] = [];
  entries: Entry[] = [];
  folderMime = FOLDER_MIME;

  noteFolderContents: DriveFile[] = [];
  noteFolderPath: DriveFile[] = [];
  currentNoteFolderId: string = '';
  selectedNote: DriveFile | null = null;
  currentNoteTitle: string = '';
  currentNoteContent: string = '';
  renderedMarkdown: string = '';
  savingNote = false;
  private saveDebounce = new Subject<void>();

  constructor(
      public authService: GoogleAuthService,
      private driveService: DriveService
  ) {
    this.saveDebounce.pipe(debounceTime(1000)).subscribe(() => {
      this.saveCurrentNoteImmediate();
    });
  }

  async ngOnInit() {
    await this.loadEntries();
    if (this.authService.isAuthenticated) {
      await this.initNotesRoot();
    }
    this.authService.accessToken$.subscribe(async (token) => {
      if (token) {
        await this.initNotesRoot();
      }
    });
  }

  ngOnDestroy() {
    this.saveDebounce.complete();
  }

  private async loadEntries() {
    this.entries = [
      { id: '1', title: 'Project Alpha', category: 'Project', tags: ['web', 'design'] },
      { id: '2', title: 'Documentation.pdf', category: 'File', tags: ['docs'] },
      { id: '3', title: 'Misc Item', category: 'Undefined', tags: [] },
    ];
    this.updateTags();
  }

  private updateTags() {
    const allTags = new Set<string>();
    this.entries.forEach(e => {
      if (e.tags && e.tags.length > 0) {
        e.tags.forEach(t => allTags.add(t));
      }
    });
    this.tags = Array.from(allTags).sort();
  }

  get filtered(): Entry[] {
    let result = this.entries;
    if (this.selectedCategory !== 'All' && this.selectedCategory !== 'Notes') {
      result = result.filter(e => e.category === this.selectedCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q));
    }
    if (this.selectedTag) {
      result = result.filter(e => e.tags && e.tags.includes(this.selectedTag));
    }
    return result;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.selectedTag = '';
    this.searchQuery = '';
  }

  private async initNotesRoot() {
    try {
      this.currentNoteFolderId = await this.driveService.resolveNotesRoot();
      await this.loadNoteFolderContents();
    } catch (error) {
      console.error('Failed to init notes root:', error);
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

  async navigateNoteFolder(index: number) {
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

  async createNewNote() {
    const name = prompt('Enter note name:');
    if (!name) return;

    try {
      const newNote = await this.driveService.createMarkdownFile(name, this.currentNoteFolderId, `# ${name}\n\nStart writing here...`);
      await this.loadNoteFolderContents();
      await this.openNote(newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Please make sure you are logged in.');
    }
  }

  async createNoteFolder() {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      await this.driveService.createFolder(name, this.currentNoteFolderId);
      await this.loadNoteFolderContents();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please make sure you are logged in.');
    }
  }

  onNoteContentChange() {
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

  saveCurrentNote() {
    this.saveDebounce.next();
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

  togglePreviewTheme() {
    document.body.classList.toggle('dark-mode');
  }
}