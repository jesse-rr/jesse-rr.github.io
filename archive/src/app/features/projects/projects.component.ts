import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, ProjectCategory } from './models/project.model';
import { ProjectService } from './services/project.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { marked } from 'marked';

@Component({
  selector: 'app-projects',
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  selectedProject: Project | null = null;
  
  newTitle = '';
  newCategory: ProjectCategory = 'Project';

  editMode = false;
  renderedMarkdown = '';

  constructor(private projectService: ProjectService) {}

  async ngOnInit() {
    this.projects = await this.projectService.loadProjects();
    await this.handleQueryParams();
    if (this.projects.length > 0 && !this.selectedProject) {
      this.selectProject(this.projects[0]);
    }
  }

  private async handleQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'new-project') {
      const title = params.get('title') || 'New Project';
      const categoryStr = params.get('category') || 'Project';
      let category: ProjectCategory = 'Project';
      if (categoryStr === 'Idea' || categoryStr === 'Task') {
        category = 'Idea';
      } else if (categoryStr === 'File') {
        category = 'File';
      } else if (categoryStr === 'Undefined') {
        category = 'Undefined';
      }
      const content = params.get('content') || `# ${title}\n\nWrite your project details or ideas here...`;

      const newProject: Project = {
        id: Date.now().toString(),
        title: title,
        category: category,
        tags: [],
        content: content
      };

      await this.projectService.createProject(newProject);
      this.projects = this.projectService.getProjectsList();
      this.selectProject(newProject);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  selectProject(project: Project) {
    this.selectedProject = project;
    this.editMode = false;
    this.renderMarkdown();
  }

  renderMarkdown() {
    if (this.selectedProject && this.selectedProject.content) {
      this.renderedMarkdown = marked.parse(this.selectedProject.content) as string;
    } else {
      this.renderedMarkdown = '';
    }
  }

  async createProject() {
    if (!this.newTitle.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      title: this.newTitle.trim(),
      category: this.newCategory,
      tags: [],
      content: `# ${this.newTitle}\n\nWrite your project details or ideas here...`
    };

    this.newTitle = '';
    await this.projectService.createProject(newProject);
    this.projects = this.projectService.getProjectsList();
    this.selectProject(newProject);
  }

  async saveProject() {
    if (!this.selectedProject) return;
    await this.projectService.updateProject(this.selectedProject);
    this.renderMarkdown();
    this.editMode = false;
  }

  async deleteProject() {
    if (!this.selectedProject) return;
    const ok = confirm(`Delete project "${this.selectedProject.title}"?`);
    if (!ok) return;

    await this.projectService.deleteProject(this.selectedProject.id);
    this.projects = this.projectService.getProjectsList();
    
    if (this.projects.length > 0) {
      this.selectProject(this.projects[0]);
    } else {
      this.selectedProject = null;
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
  }
}
