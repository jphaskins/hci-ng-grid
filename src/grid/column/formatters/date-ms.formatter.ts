import * as moment from "moment";

import {FormatterParser} from "./formatter-parser";

export class DateMsFormatter extends FormatterParser {

  format: string = "MM/DD/YYYY";

  setConfig(config: any) {
    super.setConfig(config);

    if (config.format) {
      this.format = config.format;
    }
  }

  formatValue(value: any): any {
    if (value !== undefined) {
      let date: string = moment(value).format(this.format);

      if (date === "Invalid date") {
        throw new Error("Could not format date.");
      } else {
        return date;
      }
    } else {
      return undefined;
    }
  }

  parseValue(value: any): any {
    if (value !== undefined) {
      let date: number = moment(value, this.format).toDate().getTime();

      if (isNaN(date)) {
        throw new Error("Could not format date.");
      } else {
        return date;
      }
    } else {
      return undefined;
    }
  }
}
