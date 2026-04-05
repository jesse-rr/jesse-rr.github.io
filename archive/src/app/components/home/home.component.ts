import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { FolderComponent } from '../folder/folder.component';
import { ProjectService } from '../../util/project.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, HeaderComponent, FolderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  searchQuery = '';
  selectedCategory = '';
  categories: string[] = [];
  allProjects: Project[] = [];

  constructor(private projectService: ProjectService) { }

  ngOnInit() {
    this.allProjects = this.projectService.getAll();
    this.categories = this.projectService.getCategories();
  }

  get filtered(): Project[] {
    return this.allProjects.filter(p => {
      const matchesSearch = !this.searchQuery ||
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchesCat = !this.selectedCategory ||
        p.categories?.includes(this.selectedCategory);
      return matchesSearch && matchesCat;
    });
  }

  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
  }
}
