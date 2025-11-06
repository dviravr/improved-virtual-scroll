import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class VisibilityService {
  private observer: IntersectionObserver;
  private callbacks = new Map<Element, (isVisible: boolean) => void>();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        });
      },
      {
        root: document.querySelector(".tree-list"), // Observe within tree-list container
        rootMargin: "100px", // Trigger 100px before entering viewport
        threshold: 0, // Trigger as soon as any part is visible
      }
    );
  }

  /**
   * Register an element to be observed
   */
  observe(element: Element, callback: (isVisible: boolean) => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  /**
   * Unregister an element from being observed
   */
  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  /**
   * Get the number of elements being observed
   */
  getObservedCount(): number {
    return this.callbacks.size;
  }
}
