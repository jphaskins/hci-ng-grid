import {Component, HostBinding} from "@angular/core";

import {Observable, of, throwError} from "rxjs";
import {delay} from "rxjs/operators";

import {GridService} from "hci-ng-grid";

import {DataGeneratorService} from "../services/data-generator.service";

@Component({
  selector: "new-row-demo",
  template: `
    <div class="card">
      <div class="card-header">
        <h4>New Row</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Add a new row of data to the grid.  Try saving with a last name of "Error" to see what a http response might look like.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config1">Show Config</button>
          <mat-menu #config1="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [mode]="'spreadsheet'"
                addNewRowButtonLocation="footer"
                [newRowPostCall]="boundNewRowPostCall"
                [newRowPostCallError]="newRowPostCallError"
                [pageSize]="10"
                [pageSizes]="[10, 25, 100]&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div>
          <hci-grid [data]="data"
                    [columns]="columns"
                    [mode]="'spreadsheet'"
                    addNewRowButtonLocation="footer"
                    [newRowPostCall]="boundNewRowPostCall"
                    [newRowPostCallError]="newRowPostCallError"
                    [pageSize]="10"
                    [pageSizes]="[10, 25, 100]">
          </hci-grid>
        </div>
      </div>
    </div>
  `
})
export class NewRowDemo {

  @HostBinding("class") classList: string = "demo-component";

  uniqueId: number;

  data: Object[];
  columns: any[] = [
    { field: "idPatient", name: "ID", visible: false },
    { field: "lastName", name: "Last Name", editConfig: {required: true} },
    { field: "middleName", name: "Middle Name" },
    { field: "firstName", name: "First Name", editConfig: {required: true} },
    { field: "dob", name: "Date of Birth", dataType: "date" },
    { field: "gender", name: "Gender", dataType: "choice", choices: [{value: "Female", display: "Female"}, {value: "Male", display: "Male"}] },
    { field: "address", name: "Address" }
  ];

  boundNewRowPostCall: (data: any) => Observable<any>;

  constructor(private dataGeneratorService: DataGeneratorService) {
    this.boundNewRowPostCall = this.newRowPostCall.bind(this);
  }

  ngOnInit() {
    this.data = this.dataGeneratorService.getData(13);
    this.uniqueId = this.data.length;
  }

  newRowPostCall(data: any): Observable<any> {
    if (data.lastName === "Error") {
      return throwError("Test save error.").pipe(delay(Math.random() * 500 + 250));
    }

    data.idPatient = this.uniqueId++;
    return of(data).pipe(delay(Math.random() * 500 + 250));
  }

  newRowPostCallError(error: any, gridService?: GridService): Observable<any>  {
    console.error("Custom Error Function: " + error);
    gridService.getNewRowMessageSubject().next("Custom Error Function: " + error);
    return of(undefined);
  };

}
