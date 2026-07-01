import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { MusicPageComponent } from './features/music/components/music-page/music-page.component';
import { NotesComponent } from './features/notes/notes.component';
import { TierlistComponent } from './features/tierlist/tierlist.component';
import { UnderstandComponent } from './features/understand/understand.component';
import { BrowserComponent } from './features/browser/browser.component';
import { ProjectsComponent } from './features/projects/projects.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'music', component: MusicPageComponent },
    { path: 'notes', component: NotesComponent },
    { path: 'tierlist', component: TierlistComponent },
    { path: 'understand', component: UnderstandComponent },
    { path: 'browser', component: BrowserComponent },
    { path: 'projects', component: ProjectsComponent },
    { path: '**', redirectTo: '' }
];