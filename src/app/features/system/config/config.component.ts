import { AfterViewInit, Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from './config.service';
import { ToastService } from '@shared/services/toast.service';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { SystemConfig } from '@shared/models/system-config.model';
import { enumerateDates, isWeekend, parseIsoDate, toIsoDate } from '@shared/utils/date.util';

const TIME_PATTERN = /^\d{2}:\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_HOLIDAY_RANGE_DAYS = 366;

const HOLIDAYS_KEY = 'HOLIDAYS';
const ADMIN_REPORT_EMAILS_KEY = 'ADMIN_REPORT_EMAILS';

type ConfigTab = 'time' | 'holidays' | 'email';
const TABS: ConfigTab[] = ['time', 'holidays', 'email'];

interface ConfigViewModel extends SystemConfig {
  category: ConfigTab;
  isTimeInput: boolean;
  isListInput: boolean;
  listItems: string[];
}

function categoryOf(configKey: string): ConfigTab {
  if (configKey === HOLIDAYS_KEY) return 'holidays';
  if (configKey === ADMIN_REPORT_EMAILS_KEY) return 'email';
  return 'time';
}

function parseList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .sort();
}

function toViewModel(c: SystemConfig): ConfigViewModel {
  const category = categoryOf(c.configKey);
  const isListInput = category === 'holidays' || category === 'email';
  return {
    ...c,
    category,
    isTimeInput: !isListInput && TIME_PATTERN.test(c.configValue ?? ''),
    isListInput,
    listItems: isListInput ? parseList(c.configValue) : []
  };
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModalComponent, CrudActionsComponent],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss'
})
export class ConfigComponent implements OnInit, AfterViewInit {
  @ViewChildren('tabBtn') tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  private configService = inject(ConfigService);
  private toastService = inject(ToastService);

  configs: ConfigViewModel[] = [];
  loading = false;
  saving = false;

  activeTab: ConfigTab = 'time';
  viewToggleIndicator = { left: 0, width: 0 };
  viewToggleIndicatorAnimated = false;

  isFormOpen = false;
  editingConfig: ConfigViewModel | null = null;
  formValue = '';

  holidayFrom = '';
  holidayTo = '';
  stagedHolidays: string[] = [];

  ngOnInit(): void {
    this.loadConfigs();
  }

  ngAfterViewInit(): void {
    this.syncViewToggleIndicator();
    this.tabButtons.changes.subscribe(() => setTimeout(() => this.syncViewToggleIndicator()));
    setTimeout(() => this.viewToggleIndicatorAnimated = true);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncViewToggleIndicator();
  }

  get visibleConfigs(): ConfigViewModel[] {
    return this.configs.filter(c => c.category === this.activeTab);
  }

  get formTitle(): string {
    if (!this.editingConfig) return '';
    if (this.editingConfig.category === 'holidays') return 'Thêm ngày nghỉ';
    if (this.editingConfig.category === 'email') return 'Thêm email nhận báo cáo';
    return 'Cập nhật ' + (this.editingConfig.description || this.editingConfig.configKey).toLowerCase();
  }

  setActiveTab(tab: ConfigTab): void {
    this.activeTab = tab;
    setTimeout(() => this.syncViewToggleIndicator());
  }

  private syncViewToggleIndicator(): void {
    const index = TABS.indexOf(this.activeTab);
    const target = this.tabButtons?.get(index)?.nativeElement;
    if (!target) return;

    this.viewToggleIndicator = { left: target.offsetLeft, width: target.offsetWidth };
  }

  loadConfigs(): void {
    this.loading = true;
    this.configService.getAll().subscribe({
      next: (res) => {
        this.configs = (res.result ?? []).map(toViewModel);
        this.ensureWellKnownRows();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.showError('Không thể tải cấu hình hệ thống.');
      }
    });
  }

  private ensureWellKnownRows(): void {
    this.ensureRow(HOLIDAYS_KEY, 'Ngày nghỉ lễ (không cho đặt suất ăn)');
    this.ensureRow(ADMIN_REPORT_EMAILS_KEY, 'Email nhận báo cáo Excel tự động');
  }

  private ensureRow(key: string, description: string): void {
    if (this.configs.some(c => c.configKey === key)) {
      return;
    }
    this.configs.push(toViewModel({ configKey: key, configValue: '', description }));
  }

  openEditTime(config: ConfigViewModel): void {
    this.editingConfig = config;
    this.formValue = config.configValue ?? '';
    this.isFormOpen = true;
  }

  openAddListItem(config: ConfigViewModel): void {
    this.editingConfig = config;
    this.formValue = '';
    this.resetHolidayStaging();
    this.isFormOpen = true;
  }

  closeForm(): void {
    if (this.saving) return;
    this.isFormOpen = false;
    this.editingConfig = null;
    this.formValue = '';
    this.resetHolidayStaging();
  }

  private resetHolidayStaging(): void {
    this.holidayFrom = '';
    this.holidayTo = '';
    this.stagedHolidays = [];
  }

  get canAddHolidayRange(): boolean {
    return !!this.holidayFrom && !this.saving;
  }

  addHolidayRange(): void {
    const config = this.editingConfig;
    if (!config || !this.holidayFrom) return;

    const from = this.holidayFrom;
    const to = this.holidayTo || from;

    if (to < from) {
      this.toastService.showError('"Đến ngày" phải bằng hoặc sau "Từ ngày".');
      return;
    }

    const dates = enumerateDates(parseIsoDate(from), parseIsoDate(to));
    if (dates.length > MAX_HOLIDAY_RANGE_DAYS) {
      this.toastService.showError(`Khoảng ngày quá dài, tối đa ${MAX_HOLIDAY_RANGE_DAYS} ngày mỗi lần.`);
      return;
    }

    const alreadyKnown = new Set([...config.listItems, ...this.stagedHolidays]);
    const newDates = dates
      .filter(date => !isWeekend(date))
      .map(toIsoDate)
      .filter(date => !alreadyKnown.has(date));

    if (newDates.length === 0) {
      this.toastService.showError('Khoảng đã chọn không có ngày làm việc nào mới.');
      return;
    }

    this.stagedHolidays = [...this.stagedHolidays, ...newDates].sort();
    this.holidayFrom = '';
    this.holidayTo = '';
  }

  removeStagedHoliday(date: string): void {
    this.stagedHolidays = this.stagedHolidays.filter(d => d !== date);
  }

  saveForm(): void {
    const config = this.editingConfig;
    if (!config) return;

    if (config.category === 'holidays') {
      if (this.stagedHolidays.length === 0) return;
      const listItems = [...config.listItems, ...this.stagedHolidays].sort();
      this.persistConfig(config, listItems.join(','));
      return;
    }

    if (config.isListInput) {
      const raw = this.formValue.trim();
      if (!raw) return;
      if (config.category === 'email' && !EMAIL_PATTERN.test(raw)) {
        this.toastService.showError('Email không hợp lệ.');
        return;
      }
      if (config.listItems.includes(raw)) {
        this.toastService.showError(config.category === 'email' ? 'Email này đã tồn tại.' : 'Ngày nghỉ này đã tồn tại.');
        return;
      }
      const listItems = [...config.listItems, raw].sort();
      this.persistConfig(config, listItems.join(','));
      return;
    }

    if (config.isTimeInput && !TIME_PATTERN.test(this.formValue)) {
      this.toastService.showError('Giờ không hợp lệ.');
      return;
    }
    this.persistConfig(config, this.formValue.trim());
  }

  removeListItem(config: ConfigViewModel, item: string): void {
    const listItems = config.listItems.filter(i => i !== item);
    this.persistConfig(config, listItems.join(','));
  }

  private persistConfig(config: ConfigViewModel, configValue: string): void {
    this.saving = true;
    this.configService.updateAll([{ configKey: config.configKey, configValue }]).subscribe({
      next: (res) => {
        const updated = res.result?.[0];
        if (updated) {
          const index = this.configs.findIndex(c => c.configKey === updated.configKey);
          if (index !== -1) {
            this.configs[index] = toViewModel(updated);
          }
        }
        this.saving = false;
        this.toastService.showSuccess('Đã lưu cấu hình thành công!');
        this.closeForm();
      },
      error: () => {
        this.saving = false;
        this.toastService.showError('Lưu cấu hình thất bại, vui lòng thử lại.');
      }
    });
  }
}
