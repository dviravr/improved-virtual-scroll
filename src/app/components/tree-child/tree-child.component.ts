import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { Observable } from "rxjs";
import { ChildNode } from "../../models/tree-node.interface";
import { TreeDataService } from "../../services/tree-data.service";
import { VisibilityTrackerDirective } from "../../directives/visibility-tracker.directive";

@Component({
  selector: "app-tree-child",
  standalone: true,
  imports: [CommonModule, VisibilityTrackerDirective],
  templateUrl: "./tree-child.component.html",
  styleUrl: "./tree-child.component.less",
})
export class TreeChildComponent implements OnInit {
  @Input() nodeId!: number;
  @Input() visibilityIndex!: number;
  @Input() isInVisibleRange: boolean = false;
  @Output() visibilityChange = new EventEmitter<{
    index: number;
    isVisible: boolean;
  }>();

  node$!: Observable<ChildNode | undefined>;

  constructor(private treeDataService: TreeDataService) {}

  ngOnInit(): void {
    this.node$ = this.treeDataService.getNodeById(this.nodeId);
  }

  // onVisibilityChange(id: string, isVisible: boolean): void {
  //   // this.visibilityChange.emit({ id, isVisible });
  // }
}
