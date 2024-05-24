export class PointExt  {
  x: number;
  y: number;
  iterationNr: number = -1;
  letter: string = '';


  constructor(x: number, y: number, iterationNr: number = -1, letter: string = '') {
    this.x = x;
    this.y = y;
    this.iterationNr = iterationNr;
    this.letter = letter;
  }

  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }


  get xAsString(): string {
    return this.x.toFixed(1);
  }

  get yAsString(): string {
    return this.y.toFixed(1)
  }
}
