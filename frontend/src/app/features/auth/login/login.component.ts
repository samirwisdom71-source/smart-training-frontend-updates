import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { LanguageSwitcherComponent } from '../../../layout/header/language-switcher/language-switcher.component';

const REMEMBER_EMAIL_KEY = 'smart_training_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink, LanguageSwitcherComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  readonly locale = inject(LocaleService);
  email = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  loading = false;
  errorMessage = '';
  emailError = '';
  passwordError = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        this.email = saved;
        this.rememberMe = true;
      }
    } catch {
      /* ignore */
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';
    const e = this.email.trim();
    const p = this.password;
    if (!e) {
      this.emailError = this.translate.instant('validation.required');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(e)) {
      this.emailError = this.translate.instant('validation.email');
      return;
    }
    if (!p) {
      this.passwordError = this.translate.instant('validation.required');
      return;
    }
    this.loading = true;
    this.auth.login(e, p).subscribe({
      next: () => {
        if (this.rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, e);
        else localStorage.removeItem(REMEMBER_EMAIL_KEY);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.errors?.[0] ?? err.message ?? this.translate.instant('auth.loginError');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
