import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeButtonComponent } from '../theme-button/theme-button.component';
import { RouterLink } from '@angular/router';
import { GoogleAuthService } from '../../music/services/google-auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ThemeButtonComponent, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(public authService: GoogleAuthService) {}

  logout() {
    this.authService.logout();
  }
}