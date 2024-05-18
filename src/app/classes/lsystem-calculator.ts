import {StackItem} from "./stack-item";
import {Point} from "./point";
import {SVGLine} from "./svgline";
import {LSystemVariable} from "./lsystem-variable";
import {LSystemJSONParameters} from "./lsystem-jsonparameters";

export const SpecialChars = ['+', '-', '[', ']', '>', '<'];

export enum OriginPositions {
  UseCoordinates,
  CENTER,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
  CenterLeft,
  CenterRight,
  CenterTop,
  CenterBottom
}

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
  }

  addVariableSimple(varname: string, isdrawingVariable: boolean = false) {
    this.addVariableObject(new LSystemVariable(varname, isdrawingVariable));
  }

  setAxiom(axiom: string) {
    this.axiom = axiom;
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
    })
  }

  startGeneration(nrOfIterations: number) {
    this.nrOfIterationsRequested = nrOfIterations;
    this.lastPosition = new Point(0, 0);
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

  generateOneIteration(nrOfIterations: number, formula: string, lineLength: number) {
    if (nrOfIterations !== 0) {
      for (let char of formula) {
        this.completeFormula += char;

        if (this.processedRules.has(char)) {
          lineLength = this.processNonRuleCharFromFormula(char, lineLength);

          const newFormula = this.processedRules.get(char);

          if (newFormula !== undefined) {
            this.generateOneIteration(nrOfIterations - 1, newFormula, lineLength);
          }
        } else {
          lineLength = this.processNonRuleCharFromFormula(char, lineLength);
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
  processNonRuleCharFromFormula(char: string, length: number) {

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
        this.lastPosition = this.drawLine(this.lastPosition, length);
      }
    }
    return length;
  }

  drawLine(point1: Point | undefined, length: number): undefined | Point {
    if (point1 === undefined) {
      return;
    }
    const newx = point1.x + Math.cos((this.angle / 180) * Math.PI) * length;
    const newy = point1.y + Math.sin((this.angle / 180) * Math.PI) * length;

    const line = new SVGLine(point1.x, point1.y, newx, newy);
    // line.setAttribute("stroke-opacity", (iterationNr / nrOfIterationsRequested).toString());

    line.classList.push("shape");
    line.classList.push(`letter-${point1.letter}`);
    line.classList.push(`iteration-${point1.iterationNr}`);

    this.lines.push(line);
    this.points.push(point1);

    return new Point(newx, newy, 0, '');

  }

  turn(rotation: number) {
    this.angle += rotation;
  }

  createParameterObject(): LSystemJSONParameters{
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
    return params;
  }

  initFromParametersObject(params: LSystemJSONParameters): void {
    this.systemName = params.systemName;
    this.variables = params.variables;
    this.axiom = params.axiom;
    this.rules = params.rules;
    this.rotationAngle = params.rotationAngle;
    this.startingAngle = params.startingAngle;
    this.lineLength = params.lineLength;
    this.lineLengthMultiplier = params.lineLengthMultiplier;
    this.originPosition = params.originPosition;
    this.originCoordinates = params.originCoordinates;
  }

}

