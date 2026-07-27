import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { CrudSearchComponent } from '@shared/components/crud/crud-search.component';
import { AuditLogService } from './audit-log.service';
import { AuditLogQuery, AuditLogResponse } from '@shared/models/audit-log.model';
import { AUDIT_ACTION_KINDS, AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from '@shared/constants/audit-log.constants';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, CrudSearchComponent],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss'
})
export class AuditLogComponent extends BaseCrudComponent<AuditLogResponse, AuditLogQuery, any> {
  private auditLogService = inject(AuditLogService);

  availableActions: string[] = [];
  selectedLog: AuditLogResponse | null = null;

  override ngOnInit(): void {
    super.ngOnInit();
    this.auditLogService.getActions().subscribe({
      next: (res) => this.availableActions = res.result || []
    });
  }

  getService() {
    return {
      query: (query: AuditLogQuery, page: number, size: number): Observable<any> =>
        this.auditLogService.getAuditLogs(page + 1, size, query.keyword, query.action, query.startDate, query.endDate)
    };
  }

  getDefaultForm(): any {
    return {};
  }

  override getDefaultQuery(): AuditLogQuery {
    return {
      keyword: '',
      action: '',
      startDate: '',
      endDate: ''
    };
  }

  actionLabel(action: string): string {
    return AUDIT_ACTION_LABELS[action] || action;
  }

  actionKind(action: string): string {
    return AUDIT_ACTION_KINDS[action] || 'update';
  }

  entityLabel(item: AuditLogResponse): string {
    if (!item.targetEntity) return '-';
    const label = AUDIT_ENTITY_LABELS[item.targetEntity] || item.targetEntity;
    return item.targetId ? `${label} #${item.targetId}` : label;
  }

  performerLabel(item: AuditLogResponse): string {
    if (!item.username) return 'Hệ thống';
    return item.fullName ? `${item.fullName} (${item.username})` : item.username;
  }

  openDetail(item: AuditLogResponse): void {
    this.selectedLog = item;
  }

  closeDetail(): void {
    this.selectedLog = null;
  }

  formatValue(value?: string): string {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
}
