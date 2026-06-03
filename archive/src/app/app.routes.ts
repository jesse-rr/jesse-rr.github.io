// app.routes.ts - add tierlist route
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { EntryComponent } from './components/entry/entry.component';
import { MusicPageComponent } from './music/components/music-page/music-page.component';
import { NotesComponent } from './components/notes/notes.component';
import { TierlistComponent } from './components/tierlist/tierlist.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'entry/:id', component: EntryComponent },
    { path: 'music', component: MusicPageComponent },
    { path: 'notes', component: NotesComponent },
    { path: 'tierlist', component: TierlistComponent },
    { path: '**', redirectTo: '' }
];