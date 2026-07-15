import { CanDeactivateFn } from '@angular/router';

/** Component có thể tự quyết định cho phép rời trang hay không (vd: còn thay đổi chưa lưu). */
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

/**
 * Guard chặn điều hướng nội bộ Angular khi component còn thay đổi chưa lưu.
 * Uỷ quyền quyết định cho chính component qua canDeactivate().
 */
export const pendingChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
