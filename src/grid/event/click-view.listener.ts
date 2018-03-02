import {ClickListener} from "./click.interface";
import {EventListener} from "./event-listener";
import {HtmlUtil} from "../utils/html-util";
import {Point} from "../utils/point";
import {isDevMode} from "@angular/core";

export class ClickViewListener extends EventListener implements ClickListener {

  click(event: MouseEvent): boolean {
    console.debug("ClickViewListener.click");

    let idElement: HTMLElement = HtmlUtil.getIdElement(<HTMLElement>event.srcElement);
    if (idElement !== null && idElement.id.startsWith("click-")) {
      event.stopPropagation();

      let location: Point = HtmlUtil.getLocation(idElement);
      let key: any = this.grid.getGridService().getRow(location.i).key;
      if (isDevMode()) {
        console.debug("outputRowClick Emit: " + key);
      }
      this.grid.outputRowClick.emit(key);
      return true;
    } else {
      return false;
    }
  }

}
