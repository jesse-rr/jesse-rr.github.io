import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../models/project.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-folder',
  imports: [CommonModule],
  templateUrl: './folder.component.html',
  styleUrl: './folder.component.scss'
})
export class FolderComponent {
  @Input() project!: Project;

  constructor(private router: Router) { }

  navigate() {
    if (this.project.route) {
      this.router.navigate([this.project.route]);
    }
  }
}
