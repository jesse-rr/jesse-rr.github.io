import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {marked} from 'marked';
import {Entry} from '../../models/entry.model';

@Component({
  selector: 'app-markdown-viewer',
  imports: [],
  templateUrl: './markdown-viewer.html',
  styleUrl: './markdown-viewer.scss',
})
export class MarkdownViewer implements OnChanges {
  html: string | Promise<string> = '';
  @Input() entry?: Entry;

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entry'] && this.entry) {
      if (this.entry.content?.readMe) {
        this.loadMarkdown();
      }
    }
  }

  loadMarkdown() {
    const url = 'https://raw.githubusercontent.com/jesse-rr/' + this.entry!.content!.readMe;

    this.http.get(url, { responseType: 'text' }).subscribe(md => {
      this.html = marked.parse(md);
    });
  }
}
