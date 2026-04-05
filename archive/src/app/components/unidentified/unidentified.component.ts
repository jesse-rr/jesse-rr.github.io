import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Entry } from '../../models/entry.model';

@Component({
    selector: 'app-unidentified',
    imports: [],
    templateUrl: './unidentified.component.html',
    styleUrl: './unidentified.component.scss'
})
export class UnidentifiedComponent {
    @Input() entry!: Entry;

    constructor(private router: Router) { }

    navigate() {
        if (this.entry.route) {
            this.router.navigate([this.entry.route]);
        }
    }
}
