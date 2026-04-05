import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import {EntryComponent} from './components/entry/entry.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'entry/:id', component: EntryComponent },
    { path: '**', redirectTo: '' }
];
