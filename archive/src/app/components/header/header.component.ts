import { Component } from '@angular/core';
import {ThemeButtonComponent} from '../theme-button/theme-button.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [ ThemeButtonComponent, RouterLink ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
