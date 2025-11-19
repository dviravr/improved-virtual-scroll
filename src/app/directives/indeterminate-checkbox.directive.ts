import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appIndeterminate]',
  standalone: true
})
export class IndeterminateCheckboxDirective implements OnChanges {
  @Input() appIndeterminate: boolean = false;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnChanges(): void {
    this.el.nativeElement.indeterminate = this.appIndeterminate;
  }
}

