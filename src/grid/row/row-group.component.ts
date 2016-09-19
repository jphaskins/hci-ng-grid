import { Component, Input } from "@angular/core";

import { RowGroup } from "./row-group";
import { GridConfigService } from "../services/grid-config.service";
import { GridDataService } from "../services/grid-data.service";

const HIDDEN: number = 0;
const COLLAPSED: number = 1;
const EXPANDED: number = 2;

/**
 * A Cell represents an i and j position in a grid.  This component binds the grid data for that position.  Rendering of
 * the data is left to a dynamically generated template which extends the CellTemplate class.  By default the DefaultCell
 * class is used which simply renders the value in a span.
 */
@Component({
  selector: "hci-row-group",
  template: `
    <div *ngIf="rowGroup.header !== null"
         (click)="rowHeaderClick()"
         class="hci-row header"
         style="padding-top: 3px; border: black 1px solid; width: 100%;">
      <span style="padding-left: 10px;"><i class="fa fa-minus"></i></span><span *ngFor="let cell of rowGroup.header.cells" style="padding-left: 10px;">{{cell.value}}</span>
    </div>
    <!--<br *ngIf="rowGroup.header !== null" />-->
    <hci-row *ngFor="let row of rowGroup.rows; let j = index"
             [i]="i"
             [j]="j"
             [fixed]="fixed">
    </hci-row>
  `
})
export class RowGroupComponent {

  @Input() i: number;
  @Input() fixed: boolean;

  state: number = COLLAPSED;
  rowGroup: RowGroup;

  constructor(private gridDataService: GridDataService, private gridConfigService: GridConfigService) {}

  ngOnInit() {
    this.rowGroup = this.gridDataService.getRowGroup(this.i);
  }

  rowHeaderClick() {
    console.log("RowComponent.rowHeaderClick");
    this.gridDataService.sort("GROUP_BY");
  }
}