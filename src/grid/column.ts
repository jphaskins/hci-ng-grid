export class Column {
  private _field: string;
  private _name: string;
  private _template: any;
  private _visible: boolean = true;
  private _validator: any;
  private _sortOrder: number;
  private _width: number;
  private _isGroup: boolean = false;
  private _isUtility: boolean = false;
  private _defaultValue: any;

  constructor(o: Object) {
    Object.assign(this, o);
  }

  get field(): string {
    return this._field;
  }

  set field(field: string) {
    this._field = field;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get template(): any {
    return this._template;
  }

  set template(template: any) {
    this._template = template;
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(visible: boolean) {
    this._visible = visible;
  }

  get validator(): any {
    return this._validator;
  }

  set validator(validator: any) {
    this._validator = validator;
  }

  get sortOrder(): any {
    return this._sortOrder;
  }

  set sortOrder(sortOrder: any) {
    this._sortOrder = sortOrder;
  }

  get width(): any {
    return this._width;
  }

  set width(width: any) {
    this._width = width;
  }

  get isGroup(): boolean {
    return this._isGroup;
  }

  set isGroup(isGroup: boolean) {
    this._isGroup = isGroup;
  }

  get isUtility(): boolean {
    return this._isUtility;
  }

  set isUtility(isUtility: boolean) {
    this._isUtility = isUtility;
  }

  get defaultValue(): any {
    return this._defaultValue;
  }

  set defaultValue(defaultValue: any) {
    this._defaultValue = defaultValue;
  }

}
