import { Injectable } from '@angular/core';
import { Project } from '../models/project.model';
import { DriveService } from '../../../core/services/drive.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projects: Project[] = [];
  private projectsFileId: string | null = null;

  private defaultProjects: Project[] = [
    {
      id: '1',
      title: 'Portfolio Website',
      category: 'Project',
      tags: ['Web'],
      content: '# Portfolio Website\n\nThis is my personal portfolio website built to showcase my creations.'
    },
    {
      id: '2',
      title: 'Game Engine',
      category: 'Project',
      tags: ['Games'],
      content: '# Game Engine\n\nA custom 2D WebGL game engine designed for high-performance pixel-art games.'
    },
    {
      id: '3',
      title: 'Mobile App',
      category: 'File',
      tags: ['Mobile'],
      content: '# Mobile App\n\nCross-platform note-taking and task application built using modern frameworks.'
    }
  ];

  constructor(private driveService: DriveService) {}

  async loadProjects(): Promise<Project[]> {
    try {
      const rootId = await this.driveService.resolveNotesRoot();
      const files = await this.driveService.listFolder(rootId);
      const file = files.find(f => f.name === 'projects.json');

      if (file) {
        this.projectsFileId = file.id;
        const content = await this.driveService.getMarkdownContent(file.id);
        this.projects = JSON.parse(content);
      } else {
        this.projects = [...this.defaultProjects];
        await this.saveProjects();
      }
    } catch {
      this.projects = [...this.defaultProjects];
    }
    return this.projects;
  }

  async saveProjects(): Promise<void> {
    const content = JSON.stringify(this.projects, null, 2);
    const rootId = await this.driveService.resolveNotesRoot();

    if (this.projectsFileId) {
      await this.driveService.updateMarkdownFile(this.projectsFileId, content);
    } else {
      const newFile = await this.driveService.createMarkdownFile('projects.json', rootId, content);
      this.projectsFileId = newFile.id;
    }
  }

  getProjectsList(): Project[] {
    return this.projects;
  }

  async createProject(project: Project): Promise<void> {
    this.projects.push(project);
    await this.saveProjects();
  }

  async updateProject(updated: Project): Promise<void> {
    const idx = this.projects.findIndex(p => p.id === updated.id);
    if (idx !== -1) {
      this.projects[idx] = updated;
      await this.saveProjects();
    }
  }

  async deleteProject(id: string): Promise<void> {
    this.projects = this.projects.filter(p => p.id !== id);
    await this.saveProjects();
  }
}
