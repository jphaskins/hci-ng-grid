import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Rx";

import {GridConfigService} from "./grid-config.service";
import {Cell} from "../cell/cell";
import {Row} from "../row/row";
import {RowGroup} from "../row/row-group";
import {Column} from "../column/column";
import {Range} from "../utils/range";
import {SortInfo} from "../utils/sort-info";
import {PageInfo} from "../utils/page-info";
import {FilterInfo} from "../utils/filter-info";
import {ExternalInfo} from "../utils/external-info";
import {RowSelectCellComponent} from "../cell/row-select-cell.component";

@Injectable()
export class GridDataService {

  inputData: Object[];
  preparedData: Array<Row>;

  gridData: Array<RowGroup>;
  data = new Subject<Array<RowGroup>>();

  columnDefinitions: Column[] = null;
  refreshGridInit: boolean = false;

  filterInfo: Array<FilterInfo> = new Array<FilterInfo>();

  sortInfo: SortInfo = new SortInfo();
  sortInfoObserved = new Subject<SortInfo>();

  pageInfo: PageInfo = new PageInfo();
  pageInfoObserved = new Subject<PageInfo>();

  externalInfoObserved = new Subject<ExternalInfo>();
  doubleClickObserved = new Subject<Object>();
  cellDataUpdateObserved = new Subject<Range>();

  private selectedRows: any[] = [];
  private selectedRowsSubject: Subject<any[]> = new Subject<any[]>();

  constructor(private gridConfigService: GridConfigService) {
    this.pageInfo.setPage(0);
    this.pageInfo.setPageSize(this.gridConfigService.pageSize);
  }

  getOriginalDataSize(): number {
    if (this.inputData === undefined) {
      return 0;
    } else {
      return this.inputData.length;
    }
  }

  /**
   * Deletes the selected rows based on the key of the selected row.  This is really for bound data only.  If deleting
   * from an external data source, the call should be made to that service to delete the rows, then the grid should just
   * be refreshed.
   */
  deleteSelectedRows() {
    this.inputData = this.inputData.filter((row: Object) => {
      for (var j = 0; j < this.columnDefinitions.length; j++) {
        if (this.columnDefinitions[j].isKey && this.selectedRows.indexOf(this.getField(row, this.columnDefinitions[j].field)) !== -1) {
          return false;
        }
      }
      return true;
    });
    this.setInputDataInit();

    if (this.gridData.length === 0) {
      this.setPage(-2);
    }

    this.selectedRows = [];
    this.selectedRowsSubject.next(this.selectedRows);
  }

  clearSelectedRows() {
    this.selectedRows = [];
    this.selectedRowsSubject.next(this.selectedRows);
  }

  setSelectedRow(i: number, j: number, k: number) {
    let key: any = this.getKey(i, j);
    this.getRowGroup(i).get(j).get(k).value = true;

    if (this.selectedRows.indexOf(key) === -1) {
      this.selectedRows.push(key);
    }
    this.selectedRowsSubject.next(this.selectedRows);
  }

  setUnselectedRow(i: number, j: number, k: number) {
    let key: any = this.getKey(i, j);
    this.getRowGroup(i).get(j).get(k).value = false;

    if (this.selectedRows.indexOf(key) !== -1) {
      this.selectedRows.splice(this.selectedRows.indexOf(key), 1);
    }
    this.selectedRowsSubject.next(this.selectedRows);
  }

  getSelectedRowsSubject() {
    return this.selectedRowsSubject;
  }

  cellDataUpdate(range: Range) {
    this.cellDataUpdateObserved.next(range);
  }

  doubleClickRow(i: number, j: number) {
    this.doubleClickObserved.next(this.gridData[i].rows[j]);
  }

  getKey(i: number, j: number): any {
    return this.gridData[i].rows[j].key;
  }

  /**
   * Upon filtering, we check for external filtering and if external, post new ExternalInfo to observable.
   * We will assume that there may be a mix of internal and external filtering/sorting/paging.  If external
   * filtering, we will send an ExternalInfo object, but if the sort/page is internal, set those values to
   * null in the ExternalInfo.  So the external call will filter but we will still rely internally on sorting
   * and paging.
   *
   * Filtering Steps
   * Re-init data.
   * Set page to 0;
   * Filter
   * Sort
   * Paginate
   */
  filter() {
    if (this.gridConfigService.externalFiltering) {
      this.filterInfo = new Array<FilterInfo>();
      for (var j = 0; j < this.columnDefinitions.length; j++) {
        if (this.columnDefinitions[j].filterValue !== null && this.columnDefinitions[j].filterValue !== "") {
          this.filterInfo.push(new FilterInfo(this.columnDefinitions[j].field, this.columnDefinitions[j].filterValue));
        }
      }

      this.pageInfo.setPage(0);

      this.externalInfoObserved.next(new ExternalInfo(this.filterInfo, (this.gridConfigService.externalSorting) ? this.sortInfo : null, (this.gridConfigService.externalPaging) ? this.pageInfo : null));
    } else {
      this.pageInfo.setPage(0);
      this.initData(true, !this.gridConfigService.externalFiltering, !this.gridConfigService.externalSorting, !this.gridConfigService.externalPaging);
    }
  }

  /**
   * TODO: Make filter case insensitive.
   */
  filterPreparedData() {
    let filteredData: Array<Row> = new Array<Row>();

    for (var i = 0; i < this.preparedData.length; i++) {
      let inc: boolean = true;
      for (var j = 0; j < this.columnDefinitions.length; j++) {
        if (this.columnDefinitions[j].filterValue === null || this.columnDefinitions[j].filterValue === "") {
          continue;
        }

        if (this.columnDefinitions[j].filterType === "input" || this.columnDefinitions[j].filterType === "select") {
          if (this.preparedData[i].get(j).value === null || this.preparedData[i].get(j).value.toString().indexOf(this.columnDefinitions[j].filterValue) === -1) {
            inc = false;
            break;
          }
        }
      }
      if (inc) {
        filteredData.push(this.preparedData[i]);
      }
    }
    this.preparedData = filteredData;
  }

  getCell(i: number, j: number, k: number): Cell {
    if (j === -1) {
      return this.gridData[i].getHeader().get(k);
    } else {
      return this.gridData[i].get(j).get(k);
    }
  }

  getField(row: Object, field: String): Object {
    var fields = field.split(".");

    var obj = row[fields[0]];
    for (var i = 1; i < fields.length; i++) {
      obj = obj[fields[i]];
    }
    return obj;
  }

  getRowGroup(i: number): RowGroup {
    return this.gridData[i];
  }

  handleValueChange(i: number, j: number, key: number, k: number, value: any) {
    if (j === -1) {
      for (var n = 0; n < this.gridData[i].length(); n++) {
        this.setInputDataValue(this.gridData[i].get(n).rowNum, this.gridConfigService.columnDefinitions[k].field, value);
      }
    } else {
      this.setInputDataValue(key, this.gridConfigService.columnDefinitions[k].field, value);
    }
  }

  /**
   * TODO: If groupBy, don't just push rows, but check for pre-existing keys and add those rows to existing rowData.
   *
   * @param inputData
   */
  initData(prep: boolean, filter: boolean, sort: boolean, paginate: boolean) {
    this.columnDefinitions = this.gridConfigService.columnDefinitions;
    if (this.inputData === null) {
      return;
    }

    if (prep) {
      this.prepareData();
    }
    if (filter) {
      this.filterPreparedData();
    }
    if (sort) {
      this.sortPreparedData();
    }
    this.resetUtilityColumns();

    let START: number = 0;
    let END: number = this.preparedData.length;

    if (!this.gridConfigService.externalPaging) {
      this.pageInfo.setDataSize(this.preparedData.length);
    }
    if (paginate && this.pageInfo.getPageSize() > 0) {
      START = this.pageInfo.getPage() * this.pageInfo.getPageSize();
      END = Math.min(START + this.pageInfo.getPageSize(), this.pageInfo.getDataSize());
      this.pageInfo.setNumPages(Math.ceil(this.pageInfo.getDataSize() / this.pageInfo.getPageSize()));
    } else if (this.gridConfigService.externalPaging) {
      this.pageInfo.setNumPages(Math.ceil(this.pageInfo.getDataSize() / this.pageInfo.getPageSize()));
    } else if (!this.gridConfigService.externalPaging) {
      this.pageInfo.setNumPages(1);
    }
    this.pageInfoObserved.next(this.pageInfo);

    this.gridData = new Array<RowGroup>();
    if (this.gridConfigService.groupBy !== null) {
      // This is all wrong for sorting... if group by, only search for next common row.
      // If sorting on non group-by fields, then grouping sort of breaks unless those sorted rows still happen to
      // lay next to each other
      let groupColumns: Array<number> = new Array<number>();
      for (var i = 0; i < this.gridConfigService.columnDefinitions.length; i++) {
        if (this.gridConfigService.columnDefinitions[i].isGroup) {
          groupColumns.push(i);
        }
      }

      let currentRowGroup: RowGroup = null;
      for (var i = START; i < END; i++) {
        if (currentRowGroup === null) {
          currentRowGroup = new RowGroup();
          currentRowGroup.add(this.preparedData[i]);
          currentRowGroup.createHeader(groupColumns);
        } else if (currentRowGroup.equals(this.preparedData[i], groupColumns)) {
          currentRowGroup.add(this.preparedData[i]);
        } else {
          this.gridData.push(currentRowGroup);
          currentRowGroup = new RowGroup();
          currentRowGroup.add(this.preparedData[i]);
          currentRowGroup.createHeader(groupColumns);
        }
      }
      if (currentRowGroup !== null) {
        if (this.gridConfigService.groupByCollapsed) {
          currentRowGroup.state = currentRowGroup.COLLAPSED;
        } else {
          currentRowGroup.state = currentRowGroup.EXPANDED;
        }
        this.gridData.push(currentRowGroup);
      }
    } else {
      for (var i = START; i < END; i++) {
        let rowGroup: RowGroup = new RowGroup();
        rowGroup.add(this.preparedData[i]);
        this.gridData.push(rowGroup);
      }
    }

    this.data.next(this.gridData);
  }

  resetUtilityColumns() {
    this.clearSelectedRows();

    let columnDefinitions: Column[] = this.gridConfigService.columnDefinitions;

    for (var i = 0; i < this.preparedData.length; i++) {
      for (var j = 0; j < columnDefinitions.length; j++) {
        if (columnDefinitions[j].isUtility) {
          if (columnDefinitions[j].defaultValue !== undefined) {
            if (columnDefinitions[j].template === "RowSelectCellComponent" || columnDefinitions[j].component === RowSelectCellComponent) {
              this.preparedData[i].get(j).value = false;
            }
          } else {
            this.preparedData[i].get(j).value = columnDefinitions[j].defaultValue;
          }
        }
      }
    }
  }

  prepareData() {
    this.preparedData = new Array<any>();
    let columnDefinitions: Column[] = this.gridConfigService.columnDefinitions;

    for (var i = 0; i < this.inputData.length; i++) {
      let row: Row = new Row();
      row.rowNum = i;
      for (var j = 0; j < columnDefinitions.length; j++) {
        if (columnDefinitions[j].isKey) {
          row.key = this.getField(this.inputData[i], columnDefinitions[j].field);
        }
        if (columnDefinitions[j].isUtility) {
          if (columnDefinitions[j].defaultValue !== undefined) {
            if (columnDefinitions[j].template === "RowSelectCellComponent" || columnDefinitions[j].component === RowSelectCellComponent) {
              row.add(new Cell({value: false}));
            }
          } else {
            row.add(new Cell({value: columnDefinitions[j].defaultValue}));
          }
        } else {
          row.add(new Cell({value: this.getField(this.inputData[i], columnDefinitions[j].field), key: i}));
        }
      }
      this.preparedData.push(row);
    }
  }

  setInputData(inputData: Array<Object>): boolean {
    this.inputData = inputData;

    if (this.pageInfo.getPageSize() === -1 && this.inputData.length > 50) {
      this.pageInfo.setPageSize(10);
    }

    if (this.gridConfigService.columnDefinitions === null && this.inputData.length > 0) {
      this.columnDefinitions = new Array<Column>();
      let keys: Array<string> = Object.keys(this.inputData[0]);
      for (var i = 0; i < keys.length; i++) {
        this.columnDefinitions.push(Column.deserialize({ field: keys[i], template: "LabelCell" }));
        this.gridConfigService.columnDefinitions = this.columnDefinitions;
      }
      return true;
    } else {
      return false;
    }
  }

  setInputDataInit() {
    this.initData(true, !this.gridConfigService.externalFiltering, !this.gridConfigService.externalSorting, !this.gridConfigService.externalPaging);
  }

  /**
   * When a cell value updates, we have a i,j,k position and value.  Now this works for updating our internal
   * grid data which is flattened, but our input data could have a complex data structure.  An list of Person
   * may have a field like demographics.firstName which is in its own demographic object within person.
   *
   * @param rowIndex
   * @param field
   * @param value
   */
  setInputDataValue(key: number, field: string, value: any) {
    var fields = field.split(".");

    var obj = this.inputData[key];
    for (var i = 0; i < fields.length - 1; i++) {
      obj = obj[fields[i]];
    }
    obj[fields[fields.length - 1]] = value;
  }

  setPage(mode: number) {
    if (mode === -2) {
      this.pageInfo.setPage(0);
    } else if (mode === -1 && this.pageInfo.page > 0) {
      this.pageInfo.setPage(this.pageInfo.getPage() - 1);
    } else if (mode === 1 && this.pageInfo.getPage() < this.pageInfo.getNumPages() - 1) {
      this.pageInfo.setPage(this.pageInfo.getPage() + 1);
    } else if (mode === 2) {
      this.pageInfo.setPage(this.pageInfo.getNumPages() - 1);
    }

    if (this.gridConfigService.externalPaging) {
      this.externalInfoObserved.next(new ExternalInfo((this.gridConfigService.externalFiltering) ? this.filterInfo : null, (this.gridConfigService.externalSorting) ? this.sortInfo : null, this.pageInfo));
    } else {
      this.initData(false, !this.gridConfigService.externalFiltering, !this.gridConfigService.externalSorting, true);
    }
  }

  setPageSize(pageSize: number) {
    this.pageInfo.setPageSize(pageSize);
    this.pageInfo.setPage(0);

    if (this.gridConfigService.externalPaging) {
      this.externalInfoObserved.next(new ExternalInfo((this.gridConfigService.externalFiltering) ? this.filterInfo : null, (this.gridConfigService.externalSorting) ? this.sortInfo : null, this.pageInfo));
    } else {
      this.initData(false, !this.gridConfigService.externalFiltering, !this.gridConfigService.externalSorting, this.pageInfo.getPageSize() > 0);
    }
  }

  /**
   * Sorting Steps
   * Sort
   * Paginate (stay on current page)
   *
   * @param column
   */
  sort(field: string) {
    if (this.sortInfo.field === null || this.sortInfo.field !== field) {
      this.sortInfo.field = field;
      this.sortInfo.asc = true;
    } else {
      this.sortInfo.asc = !this.sortInfo.asc;
    }
    this.sortInfoObserved.next(this.sortInfo);

    if(this.gridConfigService.externalSorting) {
      this.externalInfoObserved.next(new ExternalInfo((this.gridConfigService.externalFiltering) ? this.filterInfo : null, this.sortInfo, (this.gridConfigService.externalPaging) ? this.pageInfo : null));
    } else {
      this.initData(false, !this.gridConfigService.externalFiltering, true, !this.gridConfigService.externalPaging);
    }
  }

  sortPreparedData() {
    let sortColumns: Array<number> = new Array<number>();

    if (this.sortInfo.field === null && this.gridConfigService.groupBy !== null) {
      this.sortInfo.field = "GROUP_BY";
    }

    if (this.sortInfo.field === "GROUP_BY") {
      for (var i = 0; i < this.columnDefinitions.length; i++) {
        if (this.columnDefinitions[i].isGroup) {
          sortColumns.push(i);
        }
      }
    } else {
      for (var i = 0; i < this.columnDefinitions.length; i++) {
        if (this.columnDefinitions[i].field === this.sortInfo.field) {
          sortColumns.push(i);
          break;
        }
      }
    }

    this.preparedData = this.preparedData.sort((o1: Row, o2: Row) => {
      let v: number = 0;
      for (var i = 0; i < sortColumns.length; i++) {
        if (typeof o1.get(sortColumns[i]).value === "number") {
          if (this.sortInfo.asc) {
            v = o1.get(sortColumns[i]).value - o2.get(sortColumns[i]).value;
          } else {
            v = o2.get(sortColumns[i]).value - o1.get(sortColumns[i]).value;
          }
        } else if (typeof o1.get(sortColumns[i]).value === "string") {
          if (this.sortInfo.asc) {
            if (o1.get(sortColumns[i]).value < o2.get(sortColumns[i]).value) {
              v = -1;
            } else if (o1.get(sortColumns[i]).value > o2.get(sortColumns[i]).value) {
              v = 1;
            }
          } else {
            if (o1.get(sortColumns[i]).value > o2.get(sortColumns[i]).value) {
              v = -1;
            } else if (o1.get(sortColumns[i]).value < o2.get(sortColumns[i]).value) {
              v = 1;
            }
          }
        }
        if (v !== 0) {
          return v;
        }
      }
      return v;
    });
  }

}
