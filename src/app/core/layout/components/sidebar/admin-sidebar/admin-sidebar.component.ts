import { Component, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideCalendarDays, LucidePieChart,
  LucideUsers, LucideShield, LucideKey, LucideBuilding,
  LucideUtensilsCrossed, LucideSoup, LucideCoins,
  LucideTicket, LucideMessageSquare, LucideBell,
  LucideMenu
} from '@lucide/angular';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    LucideCalendarDays, LucidePieChart,
    LucideUsers, LucideShield, LucideKey, LucideBuilding,
    LucideUtensilsCrossed, LucideSoup, LucideCoins,
    LucideTicket, LucideMessageSquare, LucideBell,
    LucideMenu
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  isCollapsed = signal<boolean>(false);

  menuGroups = [
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
          route: '/system/admin/role'
        },
        {
          label: 'Quyền',
          icon: 'key',
          route: '/system/admin/permission'
        },
        {
          label: 'Phòng ban',
          icon: 'building',
          route: '/system/admin/department'
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
          label: 'Phản hồi',
          icon: 'message-square',
          route: '/system/interaction/feedback'
        },
        {
          label: 'Thông báo',
          icon: 'bell',
          route: '/system/interaction/notification'
        }
      ]
    }
  ];

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
