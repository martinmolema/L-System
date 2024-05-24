export class CarthesianCoordinates3d {
  x:number;
  y:number;
  z:number;
  svgWidth: number;
  svgHeight: number

  constructor(x: number, y: number, z: number, svgWidth: number, svgHeight: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.svgHeight = svgHeight;
    this.svgWidth = svgWidth;
  }

  setOrigin(x:number, y:number,z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
