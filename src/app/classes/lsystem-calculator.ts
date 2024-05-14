import {StackItem} from "./stack-item";
import {Point} from "./point";
import {SVGLine} from "./svgline";

export class LSystemCalculator {

  private rules: string[] = new Array<string>();
  private vars: string[] = new Array<string>();
  private axiom = '';

  private originX = 0;
  private originY = 0;

  private angle = 0;
  private stack: Array<StackItem>;
  private lastPosition: Point | undefined = undefined;
  private svgWidth = 0;
  private svgHeight = 0;
  public lines: Array<SVGLine>;

  public completeFormula = '';
  public rotationAngle: number = 0;
  public lineLengthMultiplier = 1;
  public lineLength = 50;
  public startingAngle = 90;

  private processedRules: Map<string, string> = new Map<string, string>();
  public nrOfIterationsRequested: number = 0;

  constructor(svgWidth: number, svgHeight: number) {
    this.svgHeight = svgHeight;
    this.svgWidth = svgWidth;
    this.stack = new Array<StackItem>();
    this.lines = new Array<SVGLine>();
  }

  get rulesAsString(): string {
    return this.rules.join("\n");
  }

  clearRules():void{
    this.rules = [];
    this.processedRules.clear();
  }

  setOrigin(x: number | undefined, y: number | undefined) {
    if (x !== undefined) {this.originX = x;}
    if (y !== undefined) {this.originY = y;}
  }

  setOriginLeftCenter(marginX: number, marginY: number) {
    this.originX = -this.svgWidth / 2 + marginX;
    this.originY = 0;
  }

  setOriginRightCenter(marginX: number) {
    this.originX = this.svgWidth / 2 - marginX;
    this.originY = 0;
  }

  setOriginBottomLeft(marginX: number, marginY: number) {
    this.originX = -this.svgWidth / 2 + marginX;
    this.originY = -this.svgHeight / 2 + marginY;
  }

  setOriginBottomRight(marginX: number, marginY: number) {
    this.originX = this.svgWidth / 2 - marginX;
    this.originY = -this.svgHeight / 2 + marginY;
  }

  setOriginTopLeft(marginX: number, marginY: number) {
    this.originX = -this.svgWidth / 2 + marginX;
    this.originY = this.svgHeight / 2 - marginY;
  }


  setOriginTopRight(marginX: number, marginY: number) {
    this.originX = this.svgWidth / 2 - marginX;
    this.originY = this.svgHeight / 2 - marginY;
  }

  get OriginX(): number {
    return this.originX;
  }

  set OriginX(x: number) {
    this.originX = x;
  }

  get OriginY(): number {
    return this.originY;
  }

  set OriginY(y: number) {
    this.originY = y;
  }

  get Axiom(): string {
    return this.axiom;
  }


  addRule(rule: string) {
    this.rules.push(rule);
    this.processRules();
  }

  addVariable(variable: string) {
    this.vars.push(variable);
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
    this.lastPosition = new Point(this.originX, this.originY);
    this.angle = this.startingAngle;
    this.stack = new Array<StackItem>();
    this.lines = new Array<SVGLine>();
    this.completeFormula = '';

    this.nrOfIterationsRequested = nrOfIterations;

    this.generateOneIteration(nrOfIterations, this.axiom, this.lineLength);

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

    switch (char) {
      case "F":
        this.lastPosition = this.drawLine(this.lastPosition, length);
        break;
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
      case "+":
        this.turn(this.rotationAngle);
        break;
      case "-":
        this.turn(-this.rotationAngle);
        break;
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

    return new Point(newx, newy, 0, '');

  }

  turn(rotation: number) {
    this.angle += rotation;
  }

}

