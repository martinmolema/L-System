export class LSystemVariable {
  varname: string;
  isDrawingVariable: boolean;

  constructor(varname: string, isDrawingVariable: boolean) {
    this.varname = varname;
    this.isDrawingVariable = isDrawingVariable;
  }
}
