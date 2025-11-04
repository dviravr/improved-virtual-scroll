import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { ChildNode } from "../../models/tree-node.interface";
import { TreeDataService } from "../../services/tree-data.service";

@Component({
  selector: "app-tree-child",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tree-child.component.html",
  styleUrl: "./tree-child.component.less",
})
export class TreeChildComponent implements OnInit {
  @Input() nodeId!: number;

  node$!: Observable<ChildNode | undefined>;

  constructor(private treeDataService: TreeDataService) {}

  ngOnInit(): void {
    this.node$ = this.treeDataService.getNodeById(this.nodeId);
  }
}
