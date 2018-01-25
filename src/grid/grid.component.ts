/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, ElementRef, HostListener, Input, OnChanges, QueryList, SimpleChange, ViewChild, ViewEncapsulation
} from "@angular/core";
import {DomSanitizer, SafeStyle} from "@angular/platform-browser";

import {Subscription} from "rxjs/Subscription";

import {GridDataService} from "./services/grid-data.service";
import {GridEventService} from "./services/grid-event.service";
import {GridConfigService} from "./services/grid-config.service";
import {GridMessageService} from "./services/grid-message.service";
import {Point} from "./utils/point";
import {Range} from "./utils/range";
import {Row} from "./row/row";
import {RowGroup} from "./row/row-group";
import {Column} from "./column/column";
import {PageInfo} from "./utils/page-info";
import {ExternalInfo} from "./utils/external-info";
import {ExternalData} from "./utils/external-data";
import {ColumnDefComponent} from "./column/column-def.component";

/**
 * Thoughts..
 * data or click represented by three ints
 * i = rowGroup, j = subRow, k = col
 * if no grouping, then j always 0.
 *
 * group by a, b
 *   A   B
 *           x   y   z
 *           1   2   3
 *
 *   grouped data separated into subRow -1?  click on subrow collapses/expands?  not show grouped keys for rest of rows (0 and 1)?
 *
 */
@Component({
  selector: "hci-grid",
  providers: [
    GridDataService,
    GridEventService,
    GridConfigService,
    GridMessageService],
  template: `
    <div #gridContainer (keydown)="onKeyDown($event);">
      <div [style.display]="busy ? 'inherit' : 'none'" class="hci-grid-busy" [style.height.px]="gridContainerHeight">
        <div class="hci-grid-busy-div" [style.transform]="gridContainerHeightCalc">
          <span class="fas fa-sync fa-spin fa-5x fa-fw hci-grid-busy-icon"></span>
        </div>
      </div>
      <textarea #copypastearea style="position: absolute; left: -2000px;"></textarea>
      
      <!-- Title Bar -->
      <div *ngIf="title !== null" class="hci-grid-header">
        <span>{{title}}</span>
      </div>
      
      <!-- Content -->
      <div class="d-flex flex-nowrap" style="width: 100%; white-space: nowrap; border: black 1px solid;">
      
        <div *ngIf="gridData === null || gridData.length === 0" class="d-flex flex-nowrap empty-content">
          <div *ngIf="!busy" class="empty-content-text">No Data</div>
          <div *ngIf="busy" class="empty-content-text">Loading Data...</div>
        </div>
        
        <!-- Left (Fixed) Content -->
        <div [style.flex]="nFixedColumns > 0 ? '1 1 ' + (nFixedColumns * 10) + '%' : '1 1 0%'"
             [style.display]="nFixedColumns == 0 ? 'none' : ''">
          <!-- Left Headers -->
          <div *ngIf="columnHeaders" class="d-flex flex-nowrap">
            <hci-column-header class="hci-grid-column-header hci-grid-row-height"
                               *ngFor="let column of columnDefinitions | isFixed:true; let j = index"
                               [column]="column"
                               [style.flex]="'1 1 ' + column.width + '%'"
                               [style.min-width]="column.minWidth ? column.minWidth + 'px' : 'initial'"
                               [style.max-width]="column.maxWidth ? column.maxWidth + 'px' : 'initial'">
            </hci-column-header><br />
          </div>
          
          <!-- Left Data Rows -->
          <hci-row-group *ngFor="let row of gridData; let i = index" [i]="i" [fixed]="true"></hci-row-group>
        </div>
        
        <!-- Right (Main) Content -->
        <div class="rightDiv"
             style="overflow-x: auto;"
             [style.flex]="nFixedColumns > 0 ? '1 1 ' + (100 - nFixedColumns * 10) + '%' : '1 1 100%'">
          <!-- Right Headers -->
          <div *ngIf="columnHeaders" class="d-flex flex-nowrap">
            <hci-column-header *ngFor="let column of columnDefinitions | isFixed:false | isVisible; let j = index"
                               [column]="column"
                               class="hci-grid-column-header hci-grid-row-height"
                               [class.hci-grid-row-height]="column.filterType === null"
                               [class.hci-grid-row-height-filter]="column.filterType !== null"
                               [style.display]="column.visible ? 'inline-block' : 'none'"
                               [style.flex]="'1 1 ' + column.width + '%'"
                               [style.min-width]="column.minWidth ? column.minWidth + 'px' : 'initial'"
                               [style.max-width]="column.maxWidth ? column.maxWidth + 'px' : 'initial'">
            </hci-column-header><br />
          </div>
          
          <!-- Right Data Rows -->
          <hci-row-group *ngFor="let row of gridData; let i = index" [i]="i" [fixed]="false"></hci-row-group>
        </div>
      </div>
      
      <!-- Footer -->
      <div *ngIf="pageSize > 0"
           style="width: 100%; border: black 1px solid; padding: 3px;">
        <div>
          <div style="float: left; font-weight: bold;">Showing page {{pageInfo.page + 1}} of {{pageInfo.numPages}}</div>
          <div style="margin-left: auto; margin-right: auto; width: 75%; text-align: center;">
            <span (click)="doPageFirst();" style="padding-left: 15px; padding-right: 15px;"><span class="fas fa-fast-backward"></span></span>
            <span (click)="doPagePrevious();" style="padding-left: 15px; padding-right: 15px;"><span class="fas fa-backward"></span></span>
            <select [ngModel]="pageSize"
                    (ngModelChange)="doPageSize($event)"
                    style="padding-left: 15px; padding-right: 15px;">
              <option *ngFor="let o of pageSizes" [ngValue]="o">{{o}}</option>
            </select>
            <span (click)="doPageNext();" style="padding-left: 15px; padding-right: 15px;"><span class="fas fa-forward"></span></span>
            <span (click)="doPageLast();" style="padding-left: 15px; padding-right: 15px;"><span class="fas fa-fast-forward"></span></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [ `
    
    .empty-content {
      height: 150px;
      flex: 1 0 100%;
    }
    
    .empty-content-text {
      align-self: center;
      margin-right: auto;
      margin-left: auto;
      color: #dddddd;
      font-size: 5em;
    }
    
    .hci-grid-header {
      background-color: transparent;
      color: black;
      padding: 10px;
      border-top-left-radius: 0px;
      border-top-right-radius: 0px;
      border: black 1px solid;
      font-weight: bold;
      font-size: large;
    }
    
    .hci-grid-column-header {
      display: flex;
      border: black 1px solid;
      font-weight: bold;
      background-color: transparent;
      color: black;
      vertical-align: top;
    }
    /*
    .hci-grid-row-height {
      height: 30px;
    }
    
    .hci-grid-row-height-filter {
      height: 60px;
    }
    */
    .hci-grid-busy {
      z-index: 9999;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      position: absolute;
    }
    
    .hci-grid-busy-div {
      transform-origin: top left;
    }
    
    .hci-grid-busy-icon {
      color: rgba(255, 0, 0, 0.5);
    }
    
  ` ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridComponent implements OnChanges {

  @ViewChild("copypastearea") copypastearea: any;
  @ViewChild("gridContainer") gridContainer: any;

  @Input() inputData: Object[] = null;

  @Input() config: any = {};
  @Input() title: string = null;
  @Input() rowSelect: boolean;
  @Input() cellSelect: boolean;
  @Input() keyNavigation: boolean;
  @Input() nUtilityColumns: number;
  @Input() columnDefinitions: Column[];
  @Input() fixedColumns: string[];
  @Input() groupBy: string[];
  @Input() groupByCollapsed: boolean;
  @Input() externalFiltering: boolean;
  @Input() externalSorting: boolean;
  @Input() externalPaging: boolean;
  @Input() pageSize: number;
  @Input() pageSizes: number[];

  @Input() onAlert: Function;
  @Input() onExternalDataCall: Function;
  @Input() level: string = null;
  @Input() onRowDoubleClick: Function;

  @ContentChildren(ColumnDefComponent) columnDefComponents: QueryList<ColumnDefComponent>;

  gridData: Array<RowGroup> = new Array<RowGroup>();
  nFixedColumns: number = 0;
  nColumns: number = 0;
  fixedMinWidth: number = 0;
  pageInfo: PageInfo = new PageInfo();
  initialized: boolean = false;
  columnHeaders: boolean = false;
  busy: boolean = false;
  gridContainerHeight: number = 0;
  gridContainerHeightCalc: SafeStyle = this.domSanitizer.bypassSecurityTrustStyle("'translate(calc(50% - 2.5em), 0px)'");

  columnsChangedSubscription: Subscription;

  constructor(private el: ElementRef, private changeDetectorRef: ChangeDetectorRef, private domSanitizer: DomSanitizer, private gridDataService: GridDataService, private gridEventService: GridEventService, private gridConfigService: GridConfigService, private gridMessageService: GridMessageService) {}

  /**
   * Setup listeners and pass inputs to services (particularly the config service).
   */
  ngAfterContentInit() {
    if (this.level) {
      this.gridMessageService.setLevel(this.level);
    }

    this.updateGridContainerHeight();

    /* Listen to changes in the data.  Updated data when the data service indicates a change. */
    this.gridDataService.data.subscribe((data: Array<RowGroup>) => {
      this.gridData = data;
      this.busy = false;
      this.changeDetectorRef.markForCheck();
    });

    /* The grid component handles the footer which includes paging.  Listen to changes in the pageInfo and update. */
    this.gridDataService.pageInfoObserved.subscribe((pageInfo: PageInfo) => {
      this.pageInfo = pageInfo;
    });

    /* Listen to changes in Sort/Filter/Page.
    If there is an onExternalDataCall defined, send that info to that provided function. */
    if (this.onExternalDataCall) {
      this.gridDataService.externalInfoObserved.subscribe((externalInfo: ExternalInfo) => {
        this.updateGridContainerHeight();
        this.busy = true;
        this.changeDetectorRef.markForCheck();
        this.onExternalDataCall(externalInfo).then((externalData: ExternalData) => {
          if (externalData.externalInfo === null) {
            this.gridDataService.pageInfo.setNumPages(1);
          } else {
            this.gridDataService.pageInfo = externalData.externalInfo.getPage();
          }
          this.gridDataService.setInputData(externalData.data);
          this.gridDataService.setInputDataInit();

          this.pageInfo = this.gridDataService.pageInfo;
          this.pageSize = this.gridDataService.pageInfo.getPageSize();
        });
      });
    }

    if (this.onAlert) {
      this.gridMessageService.messageObservable.subscribe((message: string) => {
        this.onAlert(message);
      });
    }

    /* If onRowDoubleClick is provided, then listen and send to function. */
    if (this.onRowDoubleClick) {
      this.gridDataService.doubleClickObserved.subscribe((row: Row) => {
        let keys: number[] = this.gridConfigService.getKeyColumns();
        if (keys.length === 0) {
          return;
        } else {
          this.onRowDoubleClick(row.cells[keys[0]].value);
        }
      });
    }

    this.buildConfig();
    this.gridConfigService.setConfig(this.config);
    this.initGridConfiguration();

    /* Get initial page Info */
    this.pageInfo = this.gridDataService.pageInfo;

    /* Can't use inputData and onExternalDataCall.  If onExternalDataCall provided, use that, otherwise use inputData. */
    if (this.onExternalDataCall) {
      this.busy = true;
      this.changeDetectorRef.markForCheck();
      this.onExternalDataCall(new ExternalInfo(null, null, this.pageInfo)).then((externalData: ExternalData) => {
        this.gridDataService.pageInfo = externalData.getExternalInfo().getPage();
        this.gridDataService.setInputData(externalData.getData());
        this.gridDataService.setInputDataInit();
        this.postInit();
      });
    } else if (this.inputData) {
      if (this.gridDataService.setInputData(this.inputData)) {
        this.gridConfigService.init();
        this.postInitGridConfiguration();
      }
      this.gridDataService.setInputDataInit();
      this.postInit();
    } else {
      this.postInit();
    }

    this.columnsChangedSubscription = this.gridConfigService.getColumnsChangedSubject().subscribe((changed: boolean) => {
      if (changed) {
        this.initGridConfiguration();
        this.gridDataService.setInputDataInit();
        this.postInit();
      }
    });
  }

  ngAfterViewInit() {
    this.updateGridContainerHeight();
  }

  ngOnDestroy() {
    if (this.columnsChangedSubscription) {
      this.columnsChangedSubscription.unsubscribe();
    }
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: Event) {
    this.updateGridContainerHeight();
  }

  updateGridContainerHeight() {
    this.gridContainerHeight = Math.max(150, this.gridContainer.nativeElement.offsetHeight);
    this.gridContainerHeightCalc = this.domSanitizer.bypassSecurityTrustStyle("translate(calc(50% - 2.5em), calc(" + (Math.floor(this.gridContainerHeight / 2)) + "px - 2.5em))");
  }

  postInit() {
    this.updateGridContainerHeight();

    this.pageInfo = this.gridDataService.pageInfo;
    this.pageSize = this.gridDataService.pageInfo.getPageSize();
    this.pageSizes = this.gridConfigService.pageSizes;

    this.initialized = true;
    this.gridEventService.setSelectedLocation(null, null);
    this.changeDetectorRef.markForCheck();
  }

  ngOnChanges(changes: {[propName: string]: SimpleChange}) {
    if (this.initialized) {
      if (changes["inputData"]) {
        this.gridDataService.setInputData(this.inputData);
        this.gridDataService.setInputDataInit();
      } else if (changes["config"]) {
        this.gridConfigService.setConfig(this.config);
      } else {
        this.buildConfig();
        this.gridConfigService.setConfig(this.config);
      }

      this.updateGridContainerHeight();
    }
  }

  buildConfig() {
    if (this.rowSelect !== undefined) {
      this.config.rowSelect = this.rowSelect;
    }
    if (this.cellSelect !== undefined) {
      this.config.cellSelect = this.cellSelect;
    }
    if (this.keyNavigation !== undefined) {
      this.config.keyNavigation = this.keyNavigation;
    }
    if (this.nUtilityColumns !== undefined) {
      this.config.nUtilityColumns = this.nUtilityColumns;
    }
    if (this.columnDefinitions !== undefined) {
      this.config.columnDefinitions = this.columnDefinitions;
    } else {
      this.config.columnDefinitions = Column.getColumns(this.columnDefComponents);
    }
    if (this.fixedColumns !== undefined) {
      this.config.fixedColumns = this.fixedColumns;
    }
    if (this.groupBy !== undefined) {
      this.config.groupBy = this.groupBy;
    }
    if (this.groupByCollapsed !== undefined) {
      this.config.groupByCollapsed = this.groupByCollapsed;
    }
    if (this.externalFiltering !== undefined) {
      this.config.externalFiltering = this.externalFiltering;
    }
    if (this.externalSorting !== undefined) {
      this.config.externalSorting = this.externalSorting;
    }
    if (this.externalPaging !== undefined) {
      this.config.externalPaging = this.externalPaging;
    }
    if (this.pageSize !== undefined) {
      this.config.pageSize = this.pageSize;
    }
    if (this.pageSizes !== undefined) {
      this.config.pageSizes = this.pageSizes;
    }
  }

  doPageFirst() {
    this.gridDataService.setPage(-2);
  }

  doPagePrevious() {
    this.gridDataService.setPage(-1);
  }

  doPageSize(value: number) {
    this.gridDataService.setPageSize(value);
  }

  doPageNext() {
    this.gridDataService.setPage(1);
  }

  doPageLast() {
    this.gridDataService.setPage(2);
  }

  initGridConfiguration() {
    this.gridDataService.pageInfo.pageSize = this.gridConfigService.pageSize;
    this.gridConfigService.init();
    this.postInitGridConfiguration();
  }

  postInitGridConfiguration() {
    if (this.gridConfigService.columnDefinitions !== null) {
      this.columnDefinitions = this.gridConfigService.columnDefinitions;

      this.columnHeaders = this.gridConfigService.columnHeaders;

      if (this.gridConfigService.fixedColumns != null) {
        this.nFixedColumns = this.gridConfigService.fixedColumns.length;
      }
      this.nColumns = this.gridConfigService.columnDefinitions.length;
      this.gridEventService.setNColumns(this.nColumns);
      this.fixedMinWidth = 0;
      for (var i = 0; i < this.gridConfigService.columnDefinitions.length; i++) {
        if (this.gridConfigService.columnDefinitions[i].isFixed) {
          this.fixedMinWidth = this.fixedMinWidth + this.gridConfigService.columnDefinitions[i].minWidth;
        }
      }
    }
  }

  /* Key Events */
  onKeyDown(event: KeyboardEvent) {
    this.gridMessageService.debug("GridComponent.onKeyDown");
    if (event.ctrlKey && event.keyCode === 67) {
      this.gridMessageService.debug("Copy Event");

      let range: Range = this.gridEventService.currentRange;
      if (range != null && !range.min.equals(range.max)) {
        let copy: string = "";

        for (var i = range.min.i; i <= range.max.i; i++) {
          for (var j = range.min.j; j <= range.max.j; j++) {
            for (var k = range.min.k; k <= range.max.k; k++) {
              copy += this.gridDataService.getRowGroup(i).get(j).get(k).value;
              if (k < range.max.k) {
                copy += "\t";
              }
            }
            if (i < range.max.i) {
              copy += "\n";
            } else if (i === range.max.i && j < range.max.j) {
              copy += "\n";
            }
          }
        }

        this.copypastearea.nativeElement.value = copy;
        this.copypastearea.nativeElement.select();
        event.stopPropagation();
      }
    } else if (event.ctrlKey && event.keyCode === 86) {
      this.copypastearea.nativeElement.select();
      let paste: string = this.copypastearea.nativeElement.value;

      this.gridMessageService.debug("Paste Event: " + paste);

      let range: Range = this.gridEventService.currentRange;
      if (range === null) {
        this.gridMessageService.warn("No cell selected to paste");
        return;
      } else if (paste === null || paste === "") {
        this.gridMessageService.warn("No data to paste");
        return;
      }

      let i = range.min.i;
      let j = range.min.j;
      let k = range.min.k;
      let cols: string[] = null;

      if (paste.endsWith("\n")) {
        paste = paste.substr(0, paste.length - 1);
      }

      let allowPaste: boolean = true;
      let rows: string[] = paste.split("\n");
      for (var ii = 0; ii < rows.length; ii++) {
        cols = rows[ii].split("\t");
        for (var kk = 0; kk < cols.length; kk++) {
          if (this.gridDataService.getRowGroup(i) == null) {
            allowPaste = false;
            break;
          } else if (this.gridDataService.getRowGroup(i).get(j) == null) {
            allowPaste = false;
            break;
          } else if (this.gridDataService.getRowGroup(i).get(j).get(k) == null) {
            allowPaste = false;
            break;
          }
          k = k + 1;
        }
        if (!allowPaste) {
          break;
        } else if (this.gridDataService.getRowGroup(i).get(j + 1) != null) {
          j = j + 1;
        } else {
          i = i + 1;
          j = 0;
        }
        k = range.min.k;
        if (this.gridDataService.getRowGroup(i) == null && ii !== rows.length - 1) {
          allowPaste = false;
          break;
        }
      }

      i = range.min.i;
      j = range.min.j;
      k = range.min.k;

      if (allowPaste) {
        for (var ii = 0; ii < rows.length; ii++) {
          cols = rows[ii].split("\t");
          for (var kk = 0; kk < cols.length; kk++) {
            this.gridDataService.getRowGroup(i).get(j).get(k).value = cols[kk];
            k = k + 1;
          }

          if (this.gridDataService.getRowGroup(i).get(j + 1) != null) {
            j = j + 1;
          } else {
            i = i + 1;
            j = 0;
          }
          k = range.min.k;
        }

        this.gridDataService.cellDataUpdate(new Range(range.min, new Point(i, j, k + cols.length - 1)));
      } else {
        this.gridMessageService.warn("Paste went out of range");
      }
    }
  }

}
