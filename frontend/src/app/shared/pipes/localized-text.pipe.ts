import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService } from '../../core/i18n/locale.service';

/**
 * Picks Arabic/English text based on current app language.
 * Usage:
 *   {{ item.nameAr | localizedText:item.nameEn:item.name }}
 */
@Pipe({ name: 'localizedText', standalone: true, pure: false })
export class LocalizedTextPipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(ar?: string | null, en?: string | null, fallback?: string | null): string {
    const a = (ar ?? '').trim();
    const e = (en ?? '').trim();
    const f = (fallback ?? '').trim();
    const isAr = this.locale.currentLang?.toLowerCase().startsWith('ar');
    if (isAr) return a || e || f || '—';
    return e || a || f || '—';
  }
}

