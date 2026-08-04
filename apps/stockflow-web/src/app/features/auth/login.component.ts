import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

type AuthMode = 'signIn' | 'signUp';

@Component({
  selector: 'sf-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mode: AuthMode = 'signIn';
  fullName = '';
  email = '';
  password = '';
  submitting = false;
  error = '';
  message = '';

  constructor(readonly auth: AuthService) {}

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.error = '';
    this.message = '';
  }

  async submit(): Promise<void> {
    if (this.submitting) return;

    const email = this.email.trim().toLowerCase();
    if (!email || !this.password) {
      this.error = 'Enter your email and password.';
      return;
    }
    if (this.mode === 'signUp' && !this.fullName.trim()) {
      this.error = 'Enter your full name.';
      return;
    }

    this.submitting = true;
    this.error = '';
    this.message = '';

    try {
      if (this.mode === 'signIn') {
        this.error = await this.auth.signIn(email, this.password) ?? '';
        return;
      }

      const result = await this.auth.signUp({
        email,
        password: this.password,
        fullName: this.fullName.trim()
      });
      this.error = result.error ?? '';
      if (!result.error && result.confirmationRequired) {
        this.message = 'Account created. Check your email to confirm your address, then sign in.';
        this.mode = 'signIn';
        this.password = '';
      }
    } catch {
      this.error = 'Authentication is temporarily unavailable. Please try again.';
    } finally {
      this.submitting = false;
    }
  }
}
