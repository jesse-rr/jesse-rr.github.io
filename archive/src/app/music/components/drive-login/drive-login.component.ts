import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '../../services/google-auth.service';

@Component({
  selector: 'app-drive-login',
  imports: [CommonModule],
  templateUrl: './drive-login.component.html',
  styleUrl: './drive-login.component.scss'
})
export class DriveLoginComponent {
  constructor(public authService: GoogleAuthService) {}

  get gisLoaded$() {
    return this.authService.gisLoaded$;
  }

  login() {
    this.authService.login();
  }
}
