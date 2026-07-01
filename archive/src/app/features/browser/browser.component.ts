import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { DriveService } from '../../core/services/drive.service';
import { DriveFile, FOLDER_MIME } from '../../shared/models/drive.model';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { DriveLoginComponent } from '../../shared/components/drive-login/drive-login.component';

interface GitHubProject {
  name: string;
  url: string;
  description: string;
}

@Component({
  selector: 'app-browser',
  imports: [CommonModule, FormsModule, HeaderComponent, DriveLoginComponent],
  templateUrl: './browser.component.html',
  styleUrl: './browser.component.scss'
})
export class BrowserComponent implements OnInit {
  githubProjects: GitHubProject[] = [
    { name: 'jesse-rr.github.io', url: 'https://github.com/jesse-rr/jesse-rr.github.io', description: 'Main landing portfolio landing page' },
    { name: 'archive-app', url: 'https://github.com/jesse-rr/jesse-rr.github.io/tree/main/archive', description: 'Angular file manager platform and productivity dashboard' },
    { name: 'game-taste-discovery', url: 'https://github.com/jesse-rr/jesse-rr.github.io/tree/main/archive/src/app/components/understand', description: 'Branching questionnaire mapping gamer taste profiles' }
  ];

  categories = ['All', 'Folders', 'Markdown (.md)', 'PDF Documents', 'Audio (.mp3)', 'JSON Data'];
  selectedCategory = 'All';
  searchQuery = '';

  folderMime = FOLDER_MIME;
  currentFolderId: string = '';
  folderContents: DriveFile[] = [];
  folderPath: DriveFile[] = [];

  constructor(
    public authService: GoogleAuthService,
    private driveService: DriveService
  ) {}

  async ngOnInit() {
    if (this.authService.isAuthenticated) {
      await this.initBrowser();
    }
    this.authService.accessToken$.subscribe(async (token) => {
      if (token) {
        await this.initBrowser();
      }
    });
  }

  private async initBrowser() {
    try {
      this.currentFolderId = await this.driveService.resolveNotesRoot();
      await this.loadFolderContents();
    } catch (error) {
      console.error(error);
    }
  }

  async loadFolderContents() {
    if (!this.currentFolderId) return;
    try {
      this.folderContents = await this.driveService.listFolder(this.currentFolderId);
      await this.loadFolderPath();
    } catch (error) {
      console.error(error);
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

    try {
      const root = await this.driveService.getFile(rootId);
      path.unshift(root);
    } catch {}

    this.folderPath = path;
  }

  async navigateToFolder(folderId: string) {
    this.currentFolderId = folderId;
    this.searchQuery = '';
    await this.loadFolderContents();
  }

  async navigatePath(index: number) {
    const targetFolder = this.folderPath[index];
    if (targetFolder.id === this.currentFolderId) return;
    this.currentFolderId = targetFolder.id;
    this.searchQuery = '';
    await this.loadFolderContents();
  }

  getFileTypeLabel(file: DriveFile): string {
    if (file.mimeType === FOLDER_MIME) return 'Folder';
    const name = file.name.toLowerCase();
    if (name.endsWith('.md')) return 'MD';
    if (name.endsWith('.pdf')) return 'PDF';
    if (name.endsWith('.mp3')) return 'MP3';
    if (name.endsWith('.json')) return 'JSON';
    return 'File';
  }

  get filteredContents(): DriveFile[] {
    let result = this.folderContents;

    if (this.selectedCategory === 'Folders') {
      result = result.filter(f => f.mimeType === FOLDER_MIME);
    } else if (this.selectedCategory === 'Markdown (.md)') {
      result = result.filter(f => f.name.toLowerCase().endsWith('.md'));
    } else if (this.selectedCategory === 'PDF Documents') {
      result = result.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    } else if (this.selectedCategory === 'Audio (.mp3)') {
      result = result.filter(f => f.name.toLowerCase().endsWith('.mp3'));
    } else if (this.selectedCategory === 'JSON Data') {
      result = result.filter(f => f.name.toLowerCase().endsWith('.json'));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    return result;
  }

  openFileLink(file: DriveFile) {
    if (file.webContentLink) {
      window.open(file.webContentLink, '_blank');
    } else {
      const url = this.driveService.getStreamUrl(file.id);
      window.open(url, '_blank');
    }
  }
}
