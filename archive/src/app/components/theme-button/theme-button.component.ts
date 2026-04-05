import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../util/theme.service';

@Component({
  selector: 'app-theme-button',
  imports: [CommonModule],
  templateUrl: './theme-button.component.html',
  styleUrl: './theme-button.component.scss'
})
export class ThemeButtonComponent {
  isDarkMode$;

  constructor(private themeService: ThemeService) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
