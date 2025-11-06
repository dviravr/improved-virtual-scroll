import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { VisibilityService } from "../services/visibility.service";

@Directive({
  selector: "[appVisibilityTracker]",
  standalone: true,
})
export class VisibilityTrackerDirective implements OnInit, OnDestroy {
  @Output() visibilityChange = new EventEmitter<boolean>();

  constructor(
    private elementRef: ElementRef,
    private visibilityService: VisibilityService
  ) {}

  ngOnInit(): void {
    // Register this element with the centralized visibility service
    // The service manages a SINGLE IntersectionObserver for all elements
    this.visibilityService.observe(
      this.elementRef.nativeElement,
      (isVisible) => {
        this.visibilityChange.emit(isVisible);
      }
    );
  }

  ngOnDestroy(): void {
    // Unregister this element when directive is destroyed
    this.visibilityService.unobserve(this.elementRef.nativeElement);
  }
}
