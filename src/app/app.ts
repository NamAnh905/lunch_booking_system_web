import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmComponent } from './shared/components/confirm/confirm.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ConfirmComponent],
  template: `
    <app-toast></app-toast>
    <app-confirm></app-confirm>
    <router-outlet></router-outlet>
  `,
  standalone: true
})
export class App {
  title = 'LunchOrder-Web';
}
