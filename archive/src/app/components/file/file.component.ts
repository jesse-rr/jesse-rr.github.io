import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Entry } from '../../models/entry.model';

@Component({
  selector: 'app-file',
  imports: [],
  templateUrl: './file.component.html',
  styleUrl: './file.component.scss'
})
export class FileComponent {
  @Input() entry!: Entry;

  constructor(private router: Router) { }

  navigate() {
    if (this.entry.route) {
      this.router.navigate([this.entry.route]);
    }
  }
}
