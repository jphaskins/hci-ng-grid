import {Injectable} from "@angular/core";
import {Subject, Observable} from "rxjs/Rx";

import {GridService} from "./grid.service";
import {Point} from "../utils/point";
import {Range} from "../utils/range";
import {EventMeta} from "../utils/event-meta";

export const CLICK = 0;
export const TAB = 1;
export const ARROW = 2;

@Injectable()
export class GridEventService {
  private nColumns: number = 0;
  private selectedLocation: Point = new Point(-1, -1);
  private selectedLocationSubject = new Subject<Point>();

  private _currentRange: Range = null;
  private selectedRange = new Subject<Range>();
  private selectedRangeObservable = this.selectedRange.asObservable();

  private lastDx: number = 0;
  private lastDy: number = 0;
  private lastEvent: number = null;

  constructor(private gridService: GridService) {}

  get currentRange(): Range {
    return this._currentRange;
  }

  setNColumns(nColumns: number) {
    this.nColumns = nColumns;
  }

  setCurrentLocation(location: Point) {
    console.debug("GridEvent.setCurrentLocation: " + (location === null ? "null" : location.toString()));

    this.selectedLocation = location;
    this.selectedLocationSubject.next(this.selectedLocation);
  }

  setSelectedLocation(location: Point, eventMeta: EventMeta) {
    console.debug("GridEvent.setSelectedLocation");
    if (!this.gridService.cellSelect) {
      return;
    }
    if (location === null) {
      return;
    }
    if (eventMeta === null) {
      this.setCurrentLocation(location);
    }

    /*if (this._currentRange == null) {
      this._currentRange = new Range(location, location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta == null || eventMeta.isNull()) {
      this._currentRange.setInitial(location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta.ctrl) {
      this._currentRange.update(location);
      this.selectedRange.next(this._currentRange);
    }*/
  }

  setSelectedRange(location: Point, eventMeta: EventMeta) {
    if (!this.gridService.cellSelect) {
      return;
    }
    this.selectedLocation = location;

    if (this._currentRange == null) {
      this._currentRange = new Range(location, location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta == null || eventMeta.isNull()) {
      this._currentRange.setInitial(location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta.ctrl) {
      this._currentRange.update(location);
      this.selectedRange.next(this._currentRange);
    }
  }

  arrowFromLocation(i: number, j: number, keyCode: number) {
    if (keyCode === 37) {
      this.arrowFrom(new Point(i, j), -1, 0, null);
    } else if (keyCode === 39) {
      this.arrowFrom(new Point(i, j), 1, 0, null);
    } else if (keyCode === 38) {
      this.arrowFrom(new Point(i, j), 0, -1, null);
    } else if (keyCode === 40) {
      this.arrowFrom(new Point(i, j), 0, 1, null);
    }
  }

  /**
   * Changes the current location based on the location passed to it plus the direction of the arrow key.  For example,
   * dx=-1 and dy=0 in the case of a left arrow click.  If the new location is greater than the number of columns, then
   * move to the next row down.  If the column is NOT visible, then keep iterating dx+1 until there is a visible one.
   *
   * @param location
   * @param dx
   * @param dy
   */
  arrowFrom(location: Point, dx: number, dy: number, eventMeta: EventMeta) {
    this.lastEvent = ARROW;

    if (!this.gridService.cellSelect) {
      return;
    }
    if (location !== null) {
      this.selectedLocation = location;
    } else if (this.selectedLocation.isNegative()) {
      this.selectedLocation = new Point(0, 0);
      this.selectedLocationSubject.next(this.selectedLocation);
      return;
    }

    this.lastDx = dx;
    this.lastDy = dy;

    let tries: number = this.gridService.columnDefinitions.length;
    do {
      if (this.selectedLocation.isNegative()) {
        this.selectedLocation = new Point(0, 0);
        break;
      }
      if (tries === 0) {
        this.selectedLocation.i = 0;
        this.selectedLocation.j = 0;
        break;
      }

      if (dy > 0 && this.gridService.getRowGroup(this.selectedLocation.i).length() === this.selectedLocation.j + dy) {
        this.selectedLocation = new Point(-1, -1);
      } else if (dy !== 0) {
        this.selectedLocation.j = this.selectedLocation.j + dy;
      } else if (dx !== 0) {
        this.selectedLocation.j = this.selectedLocation.j + dx;
      }

      /*if (dy > 0 && this.gridService.getRowGroup(this.selectedLocation.i).length() === this.selectedLocation.j + dy) {
        this.selectedLocation.i = this.selectedLocation.i + dy;
        this.selectedLocation.j = 0;
      } else if (dy > 0) {
        this.selectedLocation.j = this.selectedLocation.j + dy;
      } else if (dy < 0 && this.selectedLocation.j > 0) {
        this.selectedLocation.j = this.selectedLocation.j + dy;
      } else if (dy < 0 && this.selectedLocation.j === 0) {
        this.selectedLocation.i = this.selectedLocation.i + dy;
        if (this.selectedLocation.i < 0) {
          this.selectedLocation = new Point(-1, -1);
        } else {
          this.selectedLocation.j = this.gridService.getRowGroup(this.selectedLocation.i).length() - 1;
        }
      } else if (dx !== 0) {
        this.selectedLocation.k = this.selectedLocation.k + dx;
        this.selectedLocation.i = Math.max(0, this.selectedLocation.i);
        this.selectedLocation.j = Math.max(0, this.selectedLocation.j);
        //this.selectedLocation.k = Math.max(0, this.selectedLocation.k);

        if (this.selectedLocation.k === this.nColumns) {
          this.selectedLocation.k = 0;

          if (this.gridService.getRowGroup(this.selectedLocation.i).length() === this.selectedLocation.j + 1) {
            this.selectedLocation.i = this.selectedLocation.i + 1;
            this.selectedLocation.j = 0;
          } else {
            this.selectedLocation.j = this.selectedLocation.j + 1;
          }
        } else if (this.selectedLocation.k < 0) {
          this.selectedLocation.k = this.gridService.columnDefinitions.length - 1;
          if (this.selectedLocation.j > 0) {
            this.selectedLocation.j = this.selectedLocation.j - 1;
          } else if (this.selectedLocation.i === 0) {
            this.selectedLocation.k = this.gridService.columnDefinitions.length - 1;
          } else {
            this.selectedLocation.i = this.selectedLocation.i - 1;
          }
        }
      }*/

      tries = tries - 1;
    } while (this.selectedLocation.j >= 0 && !this.gridService.columnDefinitions[this.selectedLocation.j].visible);

    if (this.gridService.getRowGroup(this.selectedLocation.i) === null) {
      this.selectedLocation = new Point(-1, -1);
    }

    console.debug("arrowFrom: to: " + this.selectedLocation.toString());

    this.selectedLocationSubject.next(this.selectedLocation);
  }

  tabFrom(location: Point, eventMeta: EventMeta) {
    this.lastEvent = TAB;

    if (location === null) {
      this.arrowFrom(this.selectedLocation, 1, 0, eventMeta);
    } else {
      this.arrowFrom(location, 1, 0, eventMeta);
    }
  }

  repeatLastEvent() {
    if (this.lastEvent !== null) {
      if (this.lastEvent === TAB) {
        this.tabFrom(null, null);
      } else if (this.lastEvent === ARROW) {
        this.arrowFrom(null, this.lastDx, this.lastDy, null);
      } else {
        this.selectedLocation = new Point(-1, -1);
        this.selectedLocationSubject.next(this.selectedLocation);
      }
    } else {
      this.selectedLocation = new Point(-1, -1);
      this.selectedLocationSubject.next(this.selectedLocation);
    }
  }

  getLastDx(): number {
    return this.lastDx;
  }

  getLastDy(): number {
    return this.lastDy;
  }

  getSelectedLocationSubject(): Subject<Point> {
    return this.selectedLocationSubject;
  }

  getSelecetdRangeObservable(): Observable<Range> {
    return this.selectedRangeObservable;
  }

  isLastEventArrow(): boolean {
    return this.lastEvent !== null && this.lastEvent === ARROW;
  }

  isLastEventClick(): boolean {
    return this.lastEvent !== null && this.lastEvent === CLICK;
  }

  isLastEventTab(): boolean {
    return this.lastEvent !== null && this.lastEvent === TAB;
  }
}
