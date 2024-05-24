export class Point3d{
  x:number;
  y:number;
  z: number;


  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  clone(): Point3d {
    return new Point3d(this.x, this.y, this.z);
  }

  setXYZ(x: number, y: number,z:number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
