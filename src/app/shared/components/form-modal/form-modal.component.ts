import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Reusable Add/Edit form modal wrapper.
 *
 * Responsibilities (UI presentation only):
 *  - Overlay, header (title/subtitle + close button), footer (Hủy / Lưu).
 *  - A 2-column responsive grid for the projected form body (collapses to 1 column on mobile).
 *  - Backdrop-click and Escape-to-close, disabled while `saving`.
 *
 * The projected content owns the reactive/template form and its validation.
 * The host component decides what "Save" does via the (save) output and controls
 * the button state with [saveDisabled] / [saving].
 *
 * Usage:
 *   <app-form-modal
 *     [open]="isFormOpen"
 *     [title]="formMode === 'add' ? 'Thêm mới phòng ban' : 'Cập nhật phòng ban'"
 *     [saving]="loading"
 *     [saveDisabled]="form.invalid"
 *     (save)="onSave(form.value)"
 *     (cancel)="closeForm()">
 *
 *     <div class="form-field">...</div>
 *     <div class="form-field full-span">...</div>
 *   </app-form-modal>
 */
@Component({
  selector: 'app-form-modal',
  standalone: true,
  templateUrl: './form-modal.component.html',
  styleUrl: './form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormModalComponent {
  /** Whether the modal is visible. Host owns this flag. */
  @Input() open = false;
  /** Header title (e.g. "Thêm mới phòng ban"). */
  @Input({ required: true }) title = '';
  /** Optional muted line under the title. */
  @Input() subtitle = '';
  /** In-flight state: shows a spinner on Lưu and locks close/cancel. */
  @Input() saving = false;
  /** Disables the Lưu button (typically form.invalid). Accepts null so `ngForm.invalid` can bind directly. */
  @Input() saveDisabled: boolean | null = false;
  @Input() saveLabel = 'Lưu';
  @Input() cancelLabel = 'Hủy';
  /** Allow closing by clicking the dark backdrop. */
  @Input() closeOnBackdrop = true;
  /** Max width of the panel. Use a wider value for dense 2-column forms. */
  @Input() width = '640px';

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdrop(): void {
    if (this.closeOnBackdrop && !this.saving) {
      this.cancel.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.saving) {
      this.cancel.emit();
    }
  }
}
