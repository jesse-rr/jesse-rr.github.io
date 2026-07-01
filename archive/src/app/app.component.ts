import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DriveLoginComponent } from './shared/components/drive-login/drive-login.component';
import { GoogleAuthService } from './core/services/google-auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, DriveLoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(public authService: GoogleAuthService) {}
}
