import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { FolderComponent } from '../folder/folder.component';
import { FileComponent } from '../file/file.component';
import { UnidentifiedComponent } from '../unidentified/unidentified.component';
import { EntryService } from '../../util/project.service';
import { Entry, EntryCategory } from '../../models/entry.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, HeaderComponent, FolderComponent, FileComponent, UnidentifiedComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  searchQuery = '';
  selectedCategory: EntryCategory | '' = '';
  selectedTag: string | '' = '';
  tags: string[] = [];
  categories: EntryCategory[] = [];
  allEntries: Entry[] = [];

  constructor(private entryService: EntryService) { }

  ngOnInit() {
    this.allEntries = this.entryService.getAll();
    this.categories = this.entryService.getCategories();
    this.tags = this.entryService.getTags();
  }

  get filtered(): Entry[] {
    return this.allEntries.filter(e => {
      const matchesSearch = !this.searchQuery ||
        e.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        e.tags?.some(t => t.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesCat = !this.selectedCategory ||
        e.category === this.selectedCategory;

      const matchesTag = !this.selectedTag ||
        e.tags?.includes(this.selectedTag);

      return matchesSearch && matchesCat && matchesTag;
    });
  }

  selectCategory(cat: EntryCategory) {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
  }

  selectTag(tag: string) {
    this.selectedTag = this.selectedTag === tag ? '' : tag;
  }
}
