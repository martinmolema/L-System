import {StackItem} from "./stack-item";
import {Point} from "./point";
import {SVGLine} from "./svgline";
import {LSystemVariable} from "./lsystem-variable";
import {LSystemJSONParameters} from "./lsystem-jsonparameters";
import {OriginPositions} from "./origin-positions";

export const SpecialChars = ['+', '-', '[', ']', '>', '<'];
export type StrokeOpacitySettings = 'None' | 'Normal' | 'Reverse';

export class LSystemCalculator {

  public systemName: string;
  private rules: string[] = new Array<string>();
  private variables: Array<LSystemVariable> = new Array<LSystemVariable>();
  private axiom = '';
  private originPosition: OriginPositions;
  private originCoordinates: Point;
  private points: Array<Point>;
  private polylineString: string = '';
  private totalLineLength: number = 0;
  public fadeStrokeOpacity: StrokeOpacitySettings;
  public strokeColor: string = 'black';

  private angle = 0;
  private stack: Array<StackItem>;
  private lastPosition: Point | undefined = undefined;
  public lines: Array<SVGLine>;

  public completeFormula = '';
  public rotationAngle: number = 0;
  public lineLengthMultiplier = 1;
  public lineLength = 50;
  public startingAngle = 90;

  private processedRules: Map<string, string> = new Map<string, string>();
  public nrOfIterationsRequested: number = 0;

  constructor(systemName: string, origin: OriginPositions | Point) {
    this.systemName = systemName;
    this.stack = new Array<StackItem>();
    this.lines = new Array<SVGLine>();
    this.points = new Array<Point>();

    if (origin instanceof Point) {
      this.originCoordinates = origin.clone();
      this.originPosition = OriginPositions.UseCoordinates;
    } else {
      this.originCoordinates = new Point(0, 0);
      this.originPosition = origin;
    }
    this.fadeStrokeOpacity = "None";
  }

  get TotalLineLength(): number {
    return this.totalLineLength;
  }

  get PolylineString(): string {
    return this.polylineString;
  }

  get OriginPosition(): OriginPositions {
    return this.originPosition;
  }

  set OriginPosition(shortname: OriginPositions) {
    this.originPosition = shortname;
  }

  get OriginCoordinates(): Point {
    return this.originCoordinates;
  }

  set OriginCoordinates(p: Point) {
    this.originCoordinates.x = p.x;
    this.originCoordinates.y = p.y;
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

  startGeneration(nrOfIterations: number) {
    this.nrOfIterationsRequested = nrOfIterations;
    this.lastPosition = new Point(0, 0, 0, '');
    this.angle = this.startingAngle;
    this.stack = new Array<StackItem>();
    this.lines = new Array<SVGLine>();
    this.points = new Array<Point>();
    this.completeFormula = '';

    this.nrOfIterationsRequested = nrOfIterations;

    this.generateOneIteration(nrOfIterations, this.axiom, this.lineLength);

  }

  createPolyline(): string {
    this.polylineString = this.points.map(p => `${p.xAsString},${p.yAsString}`).join(' ');

    let total = 0;
    let lastPoint = new Point(0, 0);
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
    const linesAsString = this.createLinesAsStringArray(this.OriginCoordinates).join('\n');
    const result = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <g transform="translate(${canvasOrigin.x} ${canvasOrigin.y}) scale(1,-1)">
    ${linesAsString}
    </g>
    </svg>`;
    return result;
  }

  generateOneIteration(nrOfIterations: number, formula: string, lineLength: number) {
    if (nrOfIterations !== 0) {
      for (let char of formula) {
        this.completeFormula += char;

        if (this.processedRules.has(char)) {
          lineLength = this.processNonRuleCharFromFormula(char, lineLength, nrOfIterations, char);

          const newFormula = this.processedRules.get(char);

          if (newFormula !== undefined) {
            this.generateOneIteration(nrOfIterations - 1, newFormula, lineLength);
          }
        } else {
          lineLength = this.processNonRuleCharFromFormula(char, lineLength, nrOfIterations, char);
        }
      }
    }
    return;
  }

  /**
   *
   * @param char
   * @param length
   */
  processNonRuleCharFromFormula(char: string, length: number, iterationNr: number, letter: string) {

    if (SpecialChars.includes(char)) {
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
          this.turn(this.rotationAngle);
          break;
        case "-":
          this.turn(-this.rotationAngle);
          break;
      }
    } else {
      const drawingVariables = this.variables.filter(v => v.isDrawingVariable).map(v => v.varname);
      if (drawingVariables.includes(char)) {
        this.lastPosition = this.addLineToCurve(this.lastPosition, length, iterationNr, letter);
      }
    }
    return length;
  }

  addLineToCurve(point1: Point | undefined, length: number, iterationNr: number, letter: string): undefined | Point {
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

    const line = new SVGLine(point1.x, point1.y, newx, newy, 'shape', this.strokeColor, 1, opacityValue);
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

    return new Point(newx, newy, iterationNr, letter);

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
    params.lineLengthMultiplier = this.lineLengthMultiplier;
    params.originPosition = this.originPosition;
    params.originCoordinates = this.originCoordinates;
    params.fadeStrokeOpacity = this.fadeStrokeOpacity;
    params.strokeColor = this.strokeColor;
    return params;
  }

  initFromParametersObject(params: LSystemJSONParameters): void {
    this.systemName = params.systemName;
    this.variables = params.variables;
    this.axiom = params.axiom || '';
    this.rules = params.rules || '';
    this.rotationAngle = params.rotationAngle || 10;
    this.startingAngle = params.startingAngle || 90;
    this.lineLength = params.lineLength || 1;
    this.lineLengthMultiplier = params.lineLengthMultiplier;
    this.originPosition = params.originPosition || OriginPositions.CENTER;
    this.originCoordinates = params.originCoordinates || new Point(0, 0);
    this.strokeColor = params.strokeColor || 'black';
    this.fadeStrokeOpacity = params.fadeStrokeOpacity || 'None';
  }

}

