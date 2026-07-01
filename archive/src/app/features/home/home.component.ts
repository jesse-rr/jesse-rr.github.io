import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';

interface GalleryItem {
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  items: GalleryItem[] = [
    { title: 'Music Player', description: 'Stream and manage your music library from Google Drive.', route: '/music' },
    { title: 'Notes Editor', description: 'Write and preview markdown notes synced to Drive.', route: '/notes' },
    { title: 'Tier List', description: 'Create and manage drag-and-drop tier lists.', route: '/tierlist' },
    { title: 'Taste Discovery', description: 'Rank your gaming preferences and discover your gamer archetype.', route: '/understand' },
    { title: 'Drive Browser', description: 'Browse, search, and filter your Google Drive files by type.', route: '/browser' },
    { title: 'Projects', description: 'Track ideas, projects, and tasks in one place.', route: '/projects' }
  ];
}