import {StackItem} from "./stack-item";
import {PointExt} from "./pointExt";
import {SVGLine} from "./svgline";
import {LSystemVariable} from "./lsystem-variable";
import {LSystemJSONParameters} from "./lsystem-jsonparameters";
import {OriginPositionsEnum} from "./origin-positions-enum";
import {Point} from "./point";
import {Point3d} from "./point3d";

export const SpecialChars = ['+', '-', '[', ']', '>', '<'];
export type StrokeOpacitySettings = 'None' | 'Normal' | 'Reverse';

export class LSystemCalculator {

  public systemName: string;
  private rules: string[] = new Array<string>();
  private variables: Array<LSystemVariable> = new Array<LSystemVariable>();
  private drawingVariables: Array<string> = new Array<string>();
  private axiom = '';
  private originPosition2d: OriginPositionsEnum;
  private originCoordinates2d: Point;
  private originCoordinates3d: Point3d;
  private points: Array<PointExt>;
  private polylineString: string = '';
  private totalLineLength: number = 0;
  public fadeStrokeOpacity: StrokeOpacitySettings;
  public strokeColor: string = '#000000';
  private calculationTime: number = 0;
  private recursiveIterations: number = 0;
  private usePolyline: boolean = false;
  private fillPolyline: boolean = false;
  public uniqueDrawingID: string = '';
  public lineThickness3d: number = 1;
  public rotationAngleRandomizerValue: number = 0;

  private angle = 0;
  private stack: Array<StackItem>;
  private lastPosition: PointExt | undefined = undefined;
  public lines: Array<SVGLine>;

  public completeFormula = '';
  public rotationAngle: number = 0;
  public lineLengthMultiplier = 1;
  public lineLength = 50;
  public startingAngle = 90;

  private processedRules: Map<string, string> = new Map<string, string>();
  public nrOfIterationsRequested: number = 0;

  constructor(systemName: string, origin: OriginPositionsEnum | Point | Point3d) {
    this.systemName = systemName;
    this.stack = new Array<StackItem>();
    this.lines = new Array<SVGLine>();
    this.points = new Array<PointExt>();

    this.originCoordinates2d = new Point(0, 0);
    this.originCoordinates3d = new Point3d(0, 0, 0);
    this.originPosition2d = OriginPositionsEnum.UseCoordinates;

    if (origin instanceof Point) {
      this.originCoordinates2d = origin.clone();
      this.originPosition2d = OriginPositionsEnum.UseCoordinates;
    } else if (origin instanceof Point3d) {
      this.originCoordinates3d = origin.clone();
    } else {
      this.originPosition2d = origin;
    }
    this.fadeStrokeOpacity = "None";
  }

  get TotalLineLength(): number {
    return this.totalLineLength;
  }

  get PolylineString(): string {
    if (this.usePolyline) {
      return this.polylineString;
    } else {
      return '';
    }
  }

  get OriginPosition(): OriginPositionsEnum {
    return this.originPosition2d;
  }

  set OriginPosition(shortname: OriginPositionsEnum) {
    this.originPosition2d = shortname;
  }

  get OriginCoordinates2d(): Point {
    return this.originCoordinates2d;
  }

  set OriginCoordinates2d(p: Point) {
    this.originCoordinates2d.x = p.x;
    this.originCoordinates2d.y = p.y;
  }


  get OriginCoordinates3d(): Point3d {
    return this.originCoordinates3d;
  }

  set OriginCoordinates3d(p: Point3d) {
    this.originCoordinates3d.x = p.x;
    this.originCoordinates3d.y = p.y;
    this.originCoordinates3d.z = p.z;
  }

  get CalculationTime(): number {
    return this.calculationTime;
  }

  get RecursiveIterations(): number {
    return this.recursiveIterations;
  }

  get UsePolyline(): boolean {
    return this.usePolyline;
  }

  set UsePolyline(v: boolean) {
    this.usePolyline = v;
  }

  get FillPolyline(): boolean {
    return this.fillPolyline;
  }

  set FillPolyline(v: boolean) {
    this.fillPolyline = v;
  }

  clearVariables(): void {
    this.variables = new Array<LSystemVariable>();
  }

  clearRules(): void {
    this.rules = [];
    this.processedRules.clear();
  }

  get Axiom(): string {
    return this.axiom;
  }

  get Variables(): Array<LSystemVariable> {
    return this.variables;
  }

  get Rules(): Array<string> {
    return this.rules;
  }

  addRule(rule: string) {
    this.rules.push(rule);
    this.processRules();
  }

  addVariableObject(variable: LSystemVariable) {
    this.variables.push(variable);
    this.clearCalculatedFormula();
    this.drawingVariables = this.variables.filter(v => v.isDrawingVariable).map(v => v.varname);
  }

  addVariableSimple(varname: string, isdrawingVariable: boolean = false) {
    this.addVariableObject(new LSystemVariable(varname, isdrawingVariable));
  }

  setAxiom(axiom: string) {
    this.axiom = axiom;
    this.clearCalculatedFormula();
  }

  processRules() {
    this.processedRules = new Map<string, string>();

    this.rules.forEach(rule => {
      const parts = rule.split('=');
      if (parts.length > 1) {
        const varname = parts[0].trim();
        const rulepart = parts[1].trim();

        this.processedRules.set(varname, rulepart);
      }
    });
    this.clearCalculatedFormula();
  }

  clearCalculatedFormula(): void {
    this.completeFormula = '';
  }

  startGeneration(nrOfIterations: number, origin2d: Point, origin3d: Point3d, zoomFactor: number) {

    this.uniqueDrawingID = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
    this.nrOfIterationsRequested = nrOfIterations;
    this.lastPosition = new PointExt(0, 0, 0, '');
    this.angle = this.startingAngle;
    this.stack = new Array<StackItem>();
    this.lines = new Array<SVGLine>();
    this.points = new Array<PointExt>();
    this.clearCalculatedFormula();

    this.recursiveIterations = 0;

    this.nrOfIterationsRequested = nrOfIterations;

    const startDateTime = new Date();
    this.completeFormula = this.generateOneIteration(nrOfIterations, this.axiom, this.lineLength);
    const endDateTime = new Date();

    /*
        console.log(JSON.stringify(this.lines.map((line: SVGLine) => {
          const x:any = {};
          x.x1 =line.x1.toFixed(1);
          x.x2 =line.x2.toFixed(1);
          x.y1 =line.y1.toFixed(1);
          x.y2 =line.y2.toFixed(1);
          x.iterationNr = line.iterationNr;
          return x;
        })));
    */


    if (this.usePolyline) {
      this.createPolyline(origin2d, zoomFactor);
    }
    this.calculationTime = (endDateTime.getTime() - startDateTime.getTime());
  }

  createPolyline(origin: Point, zoomfactor: number): string {
    this.polylineString = this.points
      .map(p => new PointExt(p.x + origin.x, p.y + origin.y))
      .map(p => `${p.xAsString},${p.yAsString}`)
      .join(' ');

    let total = 0;
    let lastPoint = new PointExt(0, 0);
    this.points.forEach(point => {
      if (lastPoint) {
        const diffX = point.x - lastPoint.x;
        const diffY = point.y - lastPoint.y;
        total += Math.sqrt(diffX * diffX + diffY * diffY);
      }
      lastPoint = point;
    })
    this.totalLineLength = Math.ceil(total);

    return this.polylineString;
  }

  createLinesAsStringArray(origin: Point): string[] {
    const linesAsStringArr = this.lines.map<string>((line: SVGLine) => line.toString(origin));
    return linesAsStringArr;
  }

  createLinesAsSVGStringComplete(canvasOrigin: Point): string {
    const linesAsString = this.createLinesAsStringArray(this.OriginCoordinates2d).join('\n');
    const result = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <g transform="translate(${canvasOrigin.x} ${canvasOrigin.y}) scale(1,-1)">
    ${linesAsString}
    </g>
    </svg>`;
    return result;
  }

  createPolylineAsSVGStringComplete(canvasOrigin: Point): string {
    this.createPolyline(canvasOrigin, 1);
    const result = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <g transform="translate(${canvasOrigin.x} ${canvasOrigin.y}) scale(1,-1)">
      <polyline points="${this.polylineString}" stroke="${this.strokeColor}" ${this.fillPolyline ? 'fill="' + this.strokeColor + '"' : ''}></polyline>
    </g>
    </svg>`;
    return result;
  }

  /**
   * Returns the rewritten formula (@see @param formula)
   * @param nrOfIterations
   * @param formula
   * @param lineLength
   * @returns {string} the rewritten formula
   */
  generateOneIteration(nrOfIterations: number, formula: string, lineLength: number): string {
    let returnFormula = '';
    if (nrOfIterations !== 0) {
      this.recursiveIterations++;

      for (let char of formula) {
        if (this.processedRules.has(char)) {

          if (this.drawingVariables.includes(char)) {
            lineLength = this.processNonRuleCharFromFormula(char, lineLength, nrOfIterations, char);
          }

          const newFormula = this.processedRules.get(char);

          if (newFormula !== undefined) {
            const rewrittenFormula = this.generateOneIteration(nrOfIterations - 1, newFormula, lineLength);

            returnFormula += (rewrittenFormula === "") ? char : rewrittenFormula;
          }
        } else {
          returnFormula += char;
          lineLength = this.processNonRuleCharFromFormula(char, lineLength, nrOfIterations, char);
        }
      }
    }

    return returnFormula;
  }

  /**
   *
   * @param char
   * @param length
   */
  processNonRuleCharFromFormula(char: string, length: number, iterationNr: number, letter: string) {

    if (SpecialChars.includes(char)) {
      let angle = this.rotationAngle;
      if (this.rotationAngleRandomizerValue !== 0) {
        const randomValue = (Math.random() - 0.5) * this.rotationAngleRandomizerValue;
        angle += randomValue;
      }

      switch (char) {
        case "[":
          if (this.lastPosition) {
            this.stack.push(new StackItem(this.angle, this.lastPosition))
          }
          break;
        case "]":
          const item = this.stack.pop();
          if (this.lastPosition && item) {
            this.lastPosition.x = item.position.x;
            this.lastPosition.y = item.position.y;
            this.lastPosition.iterationNr = item.position.iterationNr;
            this.angle = item.angle;
          }
          break;
        case ">":
          length *= this.lineLengthMultiplier;
          break;
        case "<":
          length /= this.lineLengthMultiplier;
          break;
        case "+":
          this.turn( angle);
          break;
        case "-":
          this.turn(-angle);
          break;
      }
    } else {
      if (this.drawingVariables.includes(char)) {
        this.lastPosition = this.addLineToCurve(this.lastPosition, length, iterationNr, letter);
      }
    }
    return length;
  }

  addLineToCurve(point1: PointExt | undefined, length: number, iterationNr: number, letter: string): undefined | PointExt {
    if (point1 === undefined) {
      return;
    }
    const newx = point1.x + Math.cos((this.angle / 180) * Math.PI) * length;
    const newy = point1.y + Math.sin((this.angle / 180) * Math.PI) * length;

    let opacityValue = 1;

    switch (this.fadeStrokeOpacity) {
      case "None":
        break;
      case "Normal":
        opacityValue = (1 / this.nrOfIterationsRequested) * iterationNr;
        break;
      case "Reverse":
        opacityValue = 1 - (1 / this.nrOfIterationsRequested) * iterationNr;
        break;
    }

    const line = new SVGLine(point1.x, point1.y, newx, newy, iterationNr, 'shape', this.strokeColor, this.lineThickness3d, opacityValue);
    // line.setAttribute("stroke-opacity", (iterationNr / nrOfIterationsRequested).toString());

    if (this.fadeStrokeOpacity !== "None") {
      line.classList.push("fade-stroke");
      if (this.fadeStrokeOpacity === 'Reverse') {
        line.classList.push("reverse");
      }
    }
    line.classList.push(`letter-${letter}`);
    line.classList.push(`iteration-${iterationNr}`);

    this.lines.push(line);
    this.points.push(point1);

    return new PointExt(newx, newy, iterationNr, letter);

  }

  turn(rotation: number) {
    this.angle += rotation;
  }

  createParameterObject(): LSystemJSONParameters {
    const params = new LSystemJSONParameters(this.systemName);
    params.systemName = this.systemName;
    params.variables = this.variables;
    params.axiom = this.axiom;
    params.rules = this.rules;
    params.rotationAngle = this.rotationAngle;
    params.startingAngle = this.startingAngle;
    params.lineLength = this.lineLength;
    params.lineThickness3d = this.lineThickness3d;
    params.lineLengthMultiplier = this.lineLengthMultiplier;
    params.originPosition = this.originPosition2d;
    params.originCoordinates2d = this.originCoordinates2d;
    params.originCoordinates3d = this.originCoordinates3d;
    params.fadeStrokeOpacity = this.fadeStrokeOpacity;
    params.strokeColor = this.strokeColor;
    params.nrOfIterationsToDrawAtSelection = this.nrOfIterationsRequested;
    params.fillPolyline = this.fillPolyline;
    params.usePolyline = this.usePolyline;
    params.rotationAngleRandomizerValue = this.rotationAngleRandomizerValue;
    return params;
  }

  initFromParametersObject(params: LSystemJSONParameters): void {
    this.systemName = params.systemName;
    this.axiom = params.axiom || '';
    this.rotationAngle = params.rotationAngle || 10;
    this.startingAngle = params.startingAngle || 90;
    this.lineLength = params.lineLength || 1;
    this.lineLengthMultiplier = params.lineLengthMultiplier;
    this.lineThickness3d = params.lineThickness3d;
    this.originPosition2d = params.originPosition;
    if (params.originPosition === OriginPositionsEnum.UseCoordinates && params.originCoordinates2d) {
      this.originCoordinates2d = new Point(params.originCoordinates2d.x, params.originCoordinates2d.y);
    } else {
      this.originCoordinates2d = new Point(0, 0);
    }

    if (params.originCoordinates3d) {
      this.originCoordinates3d = new Point3d(
        params.originCoordinates3d.x,
        params.originCoordinates3d.y,
        params.originCoordinates3d.z
      )
    }

    this.strokeColor = params.strokeColor || 'black';
    this.fadeStrokeOpacity = params.fadeStrokeOpacity || 'None';
    this.nrOfIterationsRequested = params.nrOfIterationsToDrawAtSelection;
    this.fillPolyline = params.fillPolyline;
    this.usePolyline = params.usePolyline;
    this.rotationAngleRandomizerValue = params.rotationAngleRandomizerValue;

    params.variables.forEach(variable => this.addVariableSimple(variable.varname, variable.isDrawingVariable));
    params.rules.forEach(rule => this.addRule(rule));
  }

}

