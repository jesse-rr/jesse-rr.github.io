import {Component, Input} from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {MarkdownViewer} from '../../util/markdown-viewer/markdown-viewer';
import {Entry} from '../../models/entry.model';
import {EntryService} from '../../util/project.service';

@Component({
  selector: 'app-entry',
  imports: [ HeaderComponent, MarkdownViewer ],
  templateUrl: './entry.component.html',
  styleUrl: './entry.component.scss'
})
export class EntryComponent {
  entry?: Entry;

  constructor(private entryService: EntryService) {}

  @Input() set id(value: string) {
    this.entry = this.entryService.getAll().find(e => e.id === value);
  }
}
