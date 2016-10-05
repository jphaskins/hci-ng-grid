import { Component, ViewChild, ElementRef } from "@angular/core";

import { CELL_CSS } from "./cell-template.component";
import { CellTemplate } from "./cell-template.component";

/**
 * The ng2-bootstrap datepicker does not yet offer a popup mode, so we will wrap the datepicker in a traditional
 * bootstrap dropdown.
 */
@Component({
  selector: "hci-grid-cell-date",
  styles: [ CELL_CSS, `
    .date-cell {
      width: 100%;
      height: 100%;
      background-color: transparent;
      border: none;
      text-align: left;
    }
  ` ],
  template: `
    <div (keydown)="onKeyDown($event);" class="grid-cell-template" dropdown [(isOpen)]="status.isopen" (onToggle)="onToggle();" [ngClass]="{ 'focused': focused }">
      <button #datepickerbutton id="single-button" type="button" class="date-cell" dropdownToggle [disabled]="disabled">
        {{ value | date }}
      </button>
      <div #datepickerParent dropdownMenu role="menu" class="dropdown-menu" role="menu" aria-labelledby="single-button">
        <datepicker [ngModel]="value" (ngModelChange)="onModelChange($event);" class="grid-cell-template"></datepicker>
      </div>
    </div>
  `
})
export class DateCell extends CellTemplate {

  @ViewChild("datepickerbutton") datepickerbutton: ElementRef;
  @ViewChild("datepickerParent") datepickerParent: ElementRef;

  public disabled: boolean = false;
  public status: { isopen: boolean } = { isopen: false };

  onToggle() {
    if (this.status.isopen) {
      //console.log(this.datepickerParent.nativeElement.getElementsByClassName("grid-cell-template"));
      console.log(this.datepickerParent.nativeElement.getElementsByClassName("active"));
      this.datepickerParent.nativeElement.getElementsByClassName("active")[0].focus();
    }
  }

  /**
   * This overrides the default cell template.  When the datetime in milliseconds is passed to the bootstrap datepicker,
   * it is converted to a js date.  When the date is updated, the js date is saved.  However, we want a long in milliseconds.
   * So we override the listener for the datepicker model to convert the value back to milliseconds before emitting the
   * new value back to the parent grid.
   *
   * @param value
   */
  onModelChange(value: Object) {
    console.log("DateCell.onKeyDown");

    if (value instanceof Date) {
      var ms: number = value.getTime();
      this.value = ms;
      this.valueChange.emit(ms);
    }
  }

  onFocus() {
    super.onFocus();
    this.datepickerbutton.nativeElement.focus();
    //this.datepicker.nativeElement.focus();
  }

  focus() {
    console.log("DateCell.focus");
    this.status.isopen = !this.status.isopen;
  }

  /*onKeyDown(event: KeyboardEvent) {
    console.log("DateCell.onKeyDown");
    if (event.keyCode === 9) {
      event.preventDefault();
      this.datepickerbutton.nativeElement.blur();
      this.tabEvent.emit(true);
    }
  }*/
}
