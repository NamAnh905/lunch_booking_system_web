import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterRenderEffect,
  model,
  input,
  signal,
  viewChildren,
} from '@angular/core';

interface IndicatorMetrics {
  left: number;
  width: number;
}

@Component({
  selector: 'app-ticket-tabs',
  standalone: true,
  templateUrl: './ticket-tabs.component.html',
  styleUrl: './ticket-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketTabsComponent {
  labels = input.required<string[]>();
  activeIndex = model(0);

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected readonly indicator = signal<IndicatorMetrics>({ left: 0, width: 0 });
  protected readonly measured = signal(false);

  constructor() {
    afterRenderEffect(() => {
      this.labels();
      this.activeIndex();
      this.tabButtons();
      this.syncIndicator();
    });
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.syncIndicator();
  }

  protected select(index: number): void {
    this.activeIndex.set(index);
  }

  private syncIndicator(): void {
    const target = this.tabButtons()[this.activeIndex()]?.nativeElement;
    if (!target) return;

    this.indicator.set({ left: target.offsetLeft, width: target.offsetWidth });
    this.measured.set(true);
  }
}
