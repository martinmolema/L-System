import {Point} from "./point";

export class StackItem {
  angle: number;
  position: Point;

  /**
   *
   * @param angle {number} in degrees
   * @param position {Point}
   */
  constructor(angle: number, position: Point) {
    this.angle = angle;
    this.position = new Point(position.x, position.y);
  }
}

