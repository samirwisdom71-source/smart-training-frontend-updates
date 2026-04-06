import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { SettingsApiService } from '../../../core/api/settings/settings-api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { ShowIfPermissionDirective } from '../../../core/directives/show-if-permission.directive';
import { PermissionCodes } from '../../../core/auth/permissions';
import { AuthService } from '../../../core/auth/auth.service';
import type { SystemSettingDto } from '../../../core/api/settings/settings-api.models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, ShowIfPermissionDirective],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsApi = inject(SettingsApiService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly PermissionCodes = PermissionCodes;

  readonly loading = signal(false);
  readonly savingKey = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly items = signal<SystemSettingDto[]>([]);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.settings') }]);

  ngOnInit(): void {
    this.load();
  }

  canManage(): boolean {
    return this.auth.hasPermission(PermissionCodes.settings.manage);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.settingsApi.getAll().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.items.set(res.data);
        else this.error.set('Failed to load settings');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load settings');
      },
    });
  }

  save(item: SystemSettingDto, value: string): void {
    this.savingKey.set(item.key);
    this.settingsApi.put(item.key, { value: value || null }).subscribe({
      next: () => {
        this.savingKey.set(null);
        this.items.update((list) =>
          list.map((x) => (x.key === item.key ? { ...x, value: value || null } : x))
        );
        this.toast.success(this.translate.instant('common.saved'));
      },
      error: () => {
        this.savingKey.set(null);
        this.toast.error(this.translate.instant('dialog.error'));
      },
    });
  }

  description(item: SystemSettingDto): string {
    const lang = this.translate.currentLang || 'en';
    if (lang === 'ar' && item.descriptionAr) return item.descriptionAr;
    return item.descriptionEn || item.descriptionAr || '';
  }
}
