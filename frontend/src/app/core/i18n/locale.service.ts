import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { appConfig } from '../../config/app.config';

const STORAGE_KEY = 'smart_training_locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);

  constructor() {
    const saved = this.getStored();
    const initial = saved ?? appConfig.defaultLocale;
    this.translate.use(initial);
    this.applyLang(initial);
  }

  get currentLang(): string {
    return this.translate.currentLang ?? appConfig.defaultLocale;
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  get supportedLocales(): readonly string[] {
    return appConfig.supportedLocales;
  }

  getStored(): string | null {
    if (typeof localStorage === 'undefined') return null;
    const v = localStorage.getItem(STORAGE_KEY);
    return appConfig.supportedLocales.includes(v as 'en' | 'ar') ? v : null;
  }

  setLang(lang: string): void {
    if (!appConfig.supportedLocales.includes(lang as 'en' | 'ar')) return;
    localStorage.setItem(STORAGE_KEY, lang);
    this.translate.use(lang);
    this.applyLang(lang);
  }

  private applyLang(lang: string): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const doc = typeof document !== 'undefined' ? document.documentElement : null;
    if (doc) {
      doc.dir = dir;
      doc.lang = lang === 'ar' ? 'ar' : 'en';
      doc.classList.toggle('rtl', lang === 'ar');
      doc.classList.toggle('ltr', lang !== 'ar');
    }
  }

  /** Label for language switcher UI (native name). */
  getLangLabel(code: string): string {
    return code === 'ar' ? 'العربية' : 'English';
  }
}
