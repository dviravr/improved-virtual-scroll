import { Component } from "@angular/core";
import { BoardComponent } from "./components/board/board.component";
import { CardListComponent } from "./components/card-list/card-list.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [BoardComponent, CardListComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.less",
})
export class AppComponent {
  title = "ad-demo";
}
