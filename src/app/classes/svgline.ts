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
}
