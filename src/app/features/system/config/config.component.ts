import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from './config.service';
import { ToastService } from '../../../core/services/toast.service';
import { SystemConfig, SystemConfigUpdateRequest } from '@shared/models/system-config.model';

const TIME_PATTERN = /^\d{2}:\d{2}$/;

/** View-model: quyết định loại input (time/text) MỘT LẦN lúc tải dữ liệu,
 *  không tính lại theo giá trị đang gõ dở — nếu không, `<input type="time">`
 *  trả về chuỗi rỗng khi người dùng đang sửa (ví dụ đang xoá lại giờ), khiến
 *  điều kiện không khớp regex nữa và Angular đổi sang `<input type="text">`
 *  giữa chừng, làm mất nội dung đang gõ và khôi phục lại giá trị cũ. */
interface ConfigViewModel extends SystemConfig {
  isTimeInput: boolean;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss'
})
export class ConfigComponent implements OnInit {
  private configService = inject(ConfigService);
  private toastService = inject(ToastService);

  configs: ConfigViewModel[] = [];
  loading = false;
  saving = false;

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading = true;
    this.configService.getAll().subscribe({
      next: (res) => {
        this.configs = (res.result ?? []).map(c => ({
          ...c,
          isTimeInput: TIME_PATTERN.test(c.configValue ?? '')
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.showError('Không thể tải cấu hình hệ thống.');
      }
    });
  }

  save(): void {
    const requests: SystemConfigUpdateRequest[] = this.configs.map(c => ({
      configKey: c.configKey,
      configValue: c.configValue ?? ''
    }));

    this.saving = true;
    this.configService.updateAll(requests).subscribe({
      next: (res) => {
        this.configs = (res.result ?? []).map(c => ({
          ...c,
          isTimeInput: TIME_PATTERN.test(c.configValue ?? '')
        }));
        this.saving = false;
        this.toastService.showSuccess('Đã lưu cấu hình hệ thống thành công!');
      },
      error: () => {
        this.saving = false;
        this.toastService.showError('Lưu cấu hình thất bại, vui lòng thử lại.');
      }
    });
  }
}
