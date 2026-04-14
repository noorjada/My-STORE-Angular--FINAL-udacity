import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthResponse, User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromLocalStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isTokenValid());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    if (!this.isTokenValid()) {
      this.logout();
    }
  }

  register(email: string, firstName: string, lastName: string, password: string): Observable<AuthResponse> {
    const authResponse: AuthResponse = {
      token: this.generateToken(),
      user: {
        id: Math.floor(Math.random() * 1000).toString(),
        email,
        firstName,
        lastName,
        isAdmin: false,
        createdAt: new Date()
      }
    };
    this.setCurrentUser(authResponse);
    return of(authResponse);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const authResponse: AuthResponse = {
      token: this.generateToken(),
      user: {
        id: '1', // Mock User ID
        email,
        firstName: 'Test',
        lastName: 'User',
        isAdmin: true, // Mocking admin access as shown in previous requests
        createdAt: new Date()
      }
    };
    this.setCurrentUser(authResponse);
    return of(authResponse);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setCurrentUser(authResponse: AuthResponse): void {
    const { token, user } = authResponse;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private getUserFromLocalStorage(): User | null {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  private isTokenValid(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  private generateToken(): string {
    return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private getAllUsers(): User[] {
    const usersJson = localStorage.getItem('all_users');
    return usersJson ? JSON.parse(usersJson) : [];
  }
}
