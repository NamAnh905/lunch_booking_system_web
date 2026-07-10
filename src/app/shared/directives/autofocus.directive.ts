import { Directive, ElementRef, AfterViewInit, Input, inject } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  private el = inject(ElementRef);

  @Input('appAutoFocus') set autofocus(value: boolean | string | undefined | null) {
    if (value === false || value === 'false') {
      this.enabled = false;
    } else {
      this.enabled = true;
    }
  }

  private enabled = true;

  ngAfterViewInit(): void {
    if (this.enabled) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      }, 150);
    }
  }
}
