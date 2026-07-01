import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.darkMode.asObservable();

  constructor() {
    const saved = localStorage.getItem('darkMode') === 'true';
    this.darkMode.next(saved);
    this.updateBodyClass();
  }

  toggleTheme() {
    this.darkMode.next(!this.darkMode.value);
    this.updateBodyClass();
  }

  private updateBodyClass() {
    if (this.darkMode.value) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }
}
