import { Component, signal, computed, inject, Input, Output, EventEmitter } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ROLES } from '@shared/constants/role.constants';
import {
  LucideCalendarDays, LucidePieChart,
  LucideUsers, LucideShield, LucideKey, LucideBuilding,
  LucideUtensilsCrossed, LucideSoup, LucideCoins,
  LucideTicket, LucideMessageSquare, LucideBell,
  LucideMenu, LucideSettings
} from '@lucide/angular';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  superAdminOnly?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    LucideCalendarDays, LucidePieChart,
    LucideUsers, LucideShield, LucideKey, LucideBuilding,
    LucideUtensilsCrossed, LucideSoup, LucideCoins,
    LucideTicket, LucideMessageSquare, LucideBell,
    LucideMenu, LucideSettings
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  @Input() isSidebarOpen = false;
  @Output() closed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.currentUserValue
  });

  isCollapsed = signal<boolean>(false);

  private menuGroups: MenuGroup[] = [
    {
      title: 'THỐNG KÊ',
      items: [
        {
          label: 'Theo tháng',
          icon: 'pie-chart',
          route: '/statistic/order-monthly'
        },
        {
          label: 'Theo ngày',
          icon: 'calendar-days',
          route: '/statistic/order-daily'
        }
      ]
    },
    {
      title: 'HỆ THỐNG',
      items: [
        {
          label: 'Người dùng',
          icon: 'users',
          route: '/system/admin/user'
        },
        {
          label: 'Vai trò',
          icon: 'shield',
          route: '/system/admin/role',
          superAdminOnly: true
        },
        {
          label: 'Quyền',
          icon: 'key',
          route: '/system/admin/permission',
          superAdminOnly: true
        },
        {
          label: 'Phòng ban',
          icon: 'building',
          route: '/system/admin/department'
        },
        {
          label: 'Cấu hình hệ thống',
          icon: 'settings',
          route: '/system/admin/config',
          superAdminOnly: true
        }
      ]
    },
    {
      title: 'QUẢN LÝ SUẤT ĂN',
      items: [
        {
          label: 'Thực đơn',
          icon: 'utensils-crossed',
          route: '/system/meal/menu'
        },
        {
          label: 'Món ăn',
          icon: 'soup',
          route: '/system/meal/dish'
        },
        {
          label: 'Giá',
          icon: 'coins',
          route: '/system/meal/price'
        }
      ]
    },
    {
      title: 'TƯƠNG TÁC',
      items: [
        {
          label: 'Trao đổi vé',
          icon: 'ticket',
          route: '/system/interaction/ticket-exchange'
        },
        {
          label: 'Thông báo',
          icon: 'bell',
          route: '/system/interaction/notification'
        }
      ]
    }
  ];

  visibleGroups = computed<MenuGroup[]>(() => {
    if (this.currentUser()?.roles.includes(ROLES.SUPER_ADMIN)) {
      return this.menuGroups;
    }
    return this.menuGroups
      .map(group => ({ ...group, items: group.items.filter(item => !item.superAdminOnly) }))
      .filter(group => group.items.length > 0);
  });

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
