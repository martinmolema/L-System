export class Point {
  x: number;
  y: number;
  iterationNr: number = -1;
  letter: string = '';

  constructor(x: number, y:number, iterationNr:number = -1, letter: string = '') {
    this.x = x;
    this.y = y;
    this.iterationNr = iterationNr || -1;
    this.letter = letter || '';
  }

  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }

  get xAsString(): string {
    return this.x.toFixed(1);
  }
  get yAsString(): string {
    return this.y.toFixed(1)
  }
}
