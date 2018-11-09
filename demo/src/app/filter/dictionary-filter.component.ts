import {Component, ElementRef} from "@angular/core";
import {HttpClient} from "@angular/common/http";

import {FilterInfo, FilterRenderer, GridService} from "hci-ng-grid";

/**
 * Offers comparison with a few different data types such as numbers and dates.
 *
 * @since 1.0.0
 */
@Component({
  selector: "hci-grid-select-filter",
  template: `
    <div class="d-flex flex-nowrap"
         (mousedown)="stop($event)"
         (mouseup)="stop($event)"
         (click)="stop($event)"
         [style.width.px]="width"
         style="padding: .5rem 0; background-color: white; border: black 1px solid; position: absolute;">
      <div class="parent">
        <div class="d-flex flex-nowrap" style="margin-bottom: 8px; align-items: center; width: 100%;">
          <button class="btn btn-primary" (click)="selectAll()">Select All</button>
          <button class="btn btn-secondary l-gap" (click)="deselectAll()">Deselect All</button>
          <div class="d-flex justify-content-end" style="align-items: center; margin-left: auto; margin-right: 10px;">
            <div *ngIf="changed" (click)="filter()" class="fade-in-out" style="color: green;">
              <i class="fas fa-check-circle fa-lg l-gap"></i>
            </div>
            <div (click)="valueClear()" style="color: red;">
              <i class="fas fa-times-circle fa-lg l-gap"></i>
            </div>
            <div *ngIf="gridService.linkedGroups"
                 (click)="toggleShared()"
                 placement="top"
                 container="body"
                 ngbTooltip="Share Filter with other Grids"
                 [style.color]="shared ? 'green' : 'red'">
              <i class="fas fa-share-alt-square fa-lg l-gap"></i>
            </div>
          </div>
        </div>

        <div class="form-group choice-list">
          <div *ngFor="let choice of choices" class="input-group flex-nowrap" (click)="valueChange(choice.value)">
            <input type="checkbox" id="choiceCheckbox" [ngModel]="choice.selected" class="form-control" />
            <label class="form-check-label" for="choiceCheckbox">{{choice.display}}</label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
  
    .choice-list {
      max-height: 200px;
      overflow-y: auto;
      border-top: black 2px solid;
    }
  
    .btn {
      padding: 1px 8px;
    }
    
    .form-group {
      flex: 1 0 100%;
    }
    
    .input-group {
      align-items: center;
      padding: 5px;
    }
    
    .form-control {
      flex: 0 1 10%;
      margin-right: 5px;
    }
    
    .form-check-label {
      flex: 1 0 90%;
    }
    
    .parent {
      flex: 1 1 100%;
      align-items: center;
      padding-left: 5px;
      flex-wrap: wrap;
      display: flex;
    }
    
    .l-gap {
      margin-left: 5px;
    }

    .fade-in-out {
      opacity: 1.0;
      animation: fade 2.0s linear infinite;
    }

    @keyframes fade {
      0%, 100% { opacity: 1.0 }
      50% { opacity: 0.0 }
    }
  `]
})
export class DictionaryFilterRenderer extends FilterRenderer {

  url: string;
  choices: any[] = [];

  width: number = 300;
  init: boolean = false;
  changed: boolean = false;

  constructor(private http: HttpClient, gridService: GridService, elementRef: ElementRef) {
    super(gridService, elementRef);
  }

  filter() {
    this.filters = [];
    for (let choice of this.choices) {
      if (choice.selected) {
        this.filters.push(new FilterInfo(this.column.field, this.column.dataType, choice.value, null, "E", true));
      }
    }

    this.gridService.addFilters(this.column.field, this.filters);
    this.gridService.filter();
    this.changed = false;

    if (this.shared) {
      this.gridService.globalClearPushFilter(this.column.field, this.filters);
    }
  }

  getChoices() {
    this.http.get(this.url)
      .subscribe((choices: any[]) => {
        this.choices = choices;
      });
  }

  deselectAll() {
    for (let choice of this.choices) {
      choice.selected = false;
    }
    this.changed = true;
  }

  selectAll() {
    for (let choice of this.choices) {
      choice.selected = true;
    }
    this.changed = true;
  }

  setConfig(config: any) {
    super.setConfig(config);

    if (config.url) {
      this.url = config.url;
      this.getChoices();
    }
  }

  /**
   * Negates the current selection.
   *
   * @param id The value of the choice.
   */
  valueChange(id: any) {
    this.changed = true;

    for (let choice of this.choices) {
      if (choice.value === id) {
        choice.selected = !choice.selected;
        break;
      }
    }
  }

  /**
   * Removes all filters on this column.
   */
  valueClear() {
    super.valueClear();

    this.changed = false;
    this.deselectAll();
    this.gridService.addFilters(this.column.field, []);
    this.gridService.filter();

    if (this.shared) {
      this.gridService.globalClearPushFilter(this.column.field, this.filters);
    }
  }

}
