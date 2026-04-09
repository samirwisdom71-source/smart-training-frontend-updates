import { Injectable, signal } from '@angular/core';

export type DataViewMode = 'table' | 'cards';

@Injectable({ providedIn: 'root' })
export class DataViewPreferenceService {
  private static readonly storageKey = 'st-data-view-mode';

  /** Shared app preference: table vs card layout for list pages. */
  readonly mode = signal<DataViewMode>(this.readInitial());

  setMode(m: DataViewMode): void {
    this.mode.set(m);
    try {
      localStorage.setItem(DataViewPreferenceService.storageKey, m);
    } catch {
      /* ignore quota / private mode */
    }
  }

  private readInitial(): DataViewMode {
    try {
      const v = localStorage.getItem(DataViewPreferenceService.storageKey);
      return v === 'cards' ? 'cards' : 'table';
    } catch {
      return 'table';
    }
  }
}
