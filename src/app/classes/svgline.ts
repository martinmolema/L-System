import {Point} from "./point";

export class SVGLine {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  strokeWidth:number;
  stroke: string;
  classList: Array<string>;

  constructor(x1: number, y1: number, x2: number, y2: number, className = '') {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.stroke = 'black';
    this.strokeWidth = 1;
    this.classList = new Array<string>();
    if (className !== '') {
      this.classList.push(className);
    }
  }

  toString(offset: Point): string {
    const x1 = (this.x1 + offset.x).toFixed(1);
    const y1 = (this.y1 + offset.y).toFixed(1);
    const x2 = (this.x2 + offset.x).toFixed(1);
    const y2 = (this.y2 + offset.y).toFixed(1);
    return `<line x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}" stroke="${this.stroke}" stroke-width="${this.stroke}"/>`;
  }
}
