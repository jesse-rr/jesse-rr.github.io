import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GOOGLE_CLIENT_ID, DRIVE_SCOPES } from '../config/google.config';

declare const google: any;

const TOKEN_KEY = 'archive_music_token';
const TOKEN_EXPIRY_KEY = 'archive_music_token_expiry';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private tokenClient: any = null;
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<any>(null);
  private gisLoadedSubject = new BehaviorSubject<boolean>(false);

  accessToken$ = this.accessTokenSubject.asObservable();
  user$ = this.userSubject.asObservable();
  gisLoaded$ = this.gisLoadedSubject.asObservable();

  get accessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.accessTokenSubject.value;
  }

  constructor(private ngZone: NgZone) {
    this.restoreSession();
    this.loadGisScript();
  }

  private async restoreSession(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return;

    const expiryTime = parseInt(expiry, 10);
    if (Date.now() >= expiryTime) {
      this.clearStorage();
      return;
    }

    const valid = await this.validateToken(token);
    if (valid) {
      this.ngZone.run(() => {
        this.accessTokenSubject.next(token);
        this.fetchUserInfo(token);
        this.scheduleRefresh(expiryTime - Date.now());
      });
    } else {
      this.clearStorage();
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token);
      return res.ok;
    } catch {
      return false;
    }
  }

  private saveSession(token: string, expiresInSeconds: number): void {
    if (typeof localStorage === 'undefined') return;
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  private clearStorage(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  private scheduleRefresh(msUntilExpiry: number): void {
    const refreshIn = Math.max(msUntilExpiry - 60000, 10000);
    setTimeout(() => {
      if (this.isAuthenticated) {
        this.refreshToken();
      }
    }, refreshIn);
  }

  private loadGisScript(): void {
    if (typeof document === 'undefined') return;

    if (typeof google !== 'undefined' && google.accounts) {
      this.initTokenClient();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.ngZone.run(() => {
        this.initTokenClient();
      });
    };
    document.head.appendChild(script);
  }

  private initTokenClient(): void {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPES,
      callback: (response: any) => {
        this.ngZone.run(() => {
          if (response.access_token) {
            const expiresIn = response.expires_in || 3600;
            this.accessTokenSubject.next(response.access_token);
            this.saveSession(response.access_token, expiresIn);
            this.fetchUserInfo(response.access_token);
            this.scheduleRefresh(expiresIn * 1000);
          }
        });
      },
      error_callback: (error: any) => {
        console.error('OAuth error:', error);
      }
    });
    this.gisLoadedSubject.next(true);
  }

  login(): void {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  private refreshToken(): void {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  logout(): void {
    const token = this.accessTokenSubject.value;
    if (token && typeof google !== 'undefined') {
      google.accounts.oauth2.revoke(token, () => { });
    }
    this.accessTokenSubject.next(null);
    this.userSubject.next(null);
    this.clearStorage();
  }

  private async fetchUserInfo(token: string): Promise<void> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const user = await res.json();
      this.ngZone.run(() => this.userSubject.next(user));
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  }
}
