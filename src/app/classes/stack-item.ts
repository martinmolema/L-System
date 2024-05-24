import {PointExt} from "./pointExt";

export class StackItem {
  angle: number;
  position: PointExt;

  /**
   *
   * @param angle {number} in degrees
   * @param position {PointExt}
   */
  constructor(angle: number, position: PointExt) {
    this.angle = angle;
    this.position = new PointExt(position.x, position.y);
  }
}

