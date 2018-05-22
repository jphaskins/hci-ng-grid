import {Component} from "@angular/core";

import {DataGeneratorService} from "../services/data-generator.service";
import {
  ChoiceEditRenderer, CompareFilterRenderer, DateEditRenderer, SelectFilterRenderer,
  TextFilterRenderer
} from "hci-ng-grid";

@Component({
  selector: "linked-grid",
  template: `
    <div class="card">
      <div class="card-header">
        <h4>Linked Grids</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Both grids belong to the same group.  Open the Last Name filter and click the share icon.  When the icon is green,
          when you filter, the filter is applied to both grids.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [ngbPopover]="config0" popoverTitle="Config" placement="right">Show Config</button>
          <ng-template #config0>
            <pre>
              &lt;hci-grid [data]="data1"
                        [configurable]="true"
                        [columnDefinitions]="columns1"
                        [linkedGroups]="['groupA']"
                        [pageSize]="5"
                        [pageSizes]="[5, 10, 25]"&gt;
              &lt;/hci-grid&gt;
              &lt;hci-grid [data]="data2"
                        [configurable]="true"
                        [columnDefinitions]="columns2"
                        [linkedGroups]="['groupA']"
                        [pageSize]="5"
                        [pageSizes]="[5, 10, 25]"&gt;
              &lt;/hci-grid&gt;
            </pre>
          </ng-template>
        </div>
        <p>
          <hci-grid [data]="data1"
                    [configurable]="true"
                    [columnDefinitions]="columns1"
                    [linkedGroups]="['groupA']"
                    [pageSize]="5"
                    [pageSizes]="[5, 10, 25]">
          </hci-grid>
        </p>
        <p>
          <hci-grid [data]="data2"
                    [configurable]="true"
                    [columnDefinitions]="columns2"
                    [linkedGroups]="['groupA']"
                    [pageSize]="5"
                    [pageSizes]="[5, 10, 25]">
          </hci-grid>
        </p>
      </div>
    </div>
    `
})
export class LinkedDemoComponent {

  data1: any[];
  columns1: any[] = [
    { field: "idPatient", name: "ID", visible: false },
    { field: "lastName", name: "Last Name", filterRenderer: TextFilterRenderer },
    { field: "middleName", name: "Middle Name" },
    { field: "firstName", name: "First Name", filterRenderer: TextFilterRenderer },
    { field: "dob", name: "Date of Birth", dataType: "date", editRenderer: DateEditRenderer, filterRenderer: CompareFilterRenderer },
    { field: "gender", name: "Gender", editRenderer: ChoiceEditRenderer, choices: [ {value: "Female", display: "Female"}, {value: "Male", display: "Male"} ], filterRenderer: SelectFilterRenderer },
    { field: "nLabs", name: "# Labs", dataType: "number" },
  ];

  data2: any[];
  columns2: any[] = [
    { field: "idPatient", name: "ID", visible: false },
    { field: "lastName", name: "Last Name", filterRenderer: TextFilterRenderer },
    { field: "middleName", name: "Middle Name" },
    { field: "firstName", name: "First Name", filterRenderer: TextFilterRenderer },
    { field: "dob", name: "Date of Birth", dataType: "date", editRenderer: DateEditRenderer, filterRenderer: CompareFilterRenderer },
    { field: "gender", name: "Gender", editRenderer: ChoiceEditRenderer, choices: [ {value: "Female", display: "Female"}, {value: "Male", display: "Male"} ], filterRenderer: SelectFilterRenderer },
    { field: "nLabs", name: "# Labs", dataType: "number" },
  ];

  constructor(private dataGeneratorService: DataGeneratorService) {}

  ngOnInit() {
    this.data1 = this.dataGeneratorService.getData(57);
    this.data2 = this.dataGeneratorService.getData(33);
  }

}
