/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";

import { DemoAppComponent } from "./demo-app.component";
import { SimpleGridComponent } from "./simple-grid.component";
import { EditGridComponent } from "./edit-grid.component";
import { GroupGridComponent } from "./group-grid.component";
import { GridModule } from "hci-ng2-grid/index";

@NgModule({
    imports: [ BrowserModule, CommonModule, GridModule ],
    declarations: [ DemoAppComponent, SimpleGridComponent, EditGridComponent, GroupGridComponent ],
    bootstrap: [ DemoAppComponent ]
})
export class AppModule {}
