import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbItem } from '../../models/drive.model';

@Component({
  selector: 'app-music-breadcrumb',
  imports: [CommonModule],
  templateUrl: './music-breadcrumb.component.html',
  styleUrl: './music-breadcrumb.component.scss'
})
export class MusicBreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Output() navigate = new EventEmitter<BreadcrumbItem>();
  @Output() logout = new EventEmitter<void>();
}
