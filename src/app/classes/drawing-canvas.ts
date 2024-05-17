import {Point} from "./point";

export class DrawingCanvas {
  private originX = 0;
  private originY = 0;
  private svgWidth = 0;
  private svgHeight = 0;

  public translation: Point;

  constructor(originX: number, originY: number, svgWidth: number, svgHeight: number) {
    this.originX = originX;
    this.originY = originY;
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.translation = new Point(0, 0);
  }

  setTranslation(x: number, y: number) : void {
    this.translation.setXY(x,y)
  }

  correctOriginFromTranslation(): void {
    this.translateOrigin(this.translation.x, this.translation.y);
    this.resetTranslation();
  }

  resetTranslation(): void {
    this.setTranslation(0,0);
  }

  setOrigin(x: number | undefined, y: number | undefined) {
    if (x !== undefined) {
      this.originX = x;
    }
    if (y !== undefined) {
      this.originY = y;
    }
  }

  setOriginLeftCenter(marginX: number) {
    this.originX = -this.svgWidth / 2 + marginX;
    this.originY = 0;
  }

  setOriginRightCenter(marginX: number) {
    this.originX = this.svgWidth / 2 - marginX;
    this.originY = 0;
  }

  setOriginBottomLeft(marginX: number, marginY: number) {
    this.setOrigin(-this.svgWidth / 2 + marginX, -this.svgHeight / 2 + marginY);
  }

  setOriginBottomCenter(marginY: number) {
    this.setOrigin(0, -this.svgHeight / 2 + marginY);
  }

  setOriginBottomRight(marginX: number, marginY: number) {
    this.setOrigin(this.svgWidth / 2 - marginX, -this.svgHeight / 2 + marginY);
  }

  setOriginTopLeft(marginX: number, marginY: number) {
    this.setOrigin(-this.svgWidth / 2 + marginX, this.svgHeight / 2 - marginY);
  }

  setOriginTopCenter(marginY: number) {
    this.setOrigin(0, this.svgHeight / 2 - marginY);
  }


  setOriginTopRight(marginX: number, marginY: number) {
    this.setOrigin(this.svgWidth / 2 - marginX, this.svgHeight / 2 - marginY);
  }

  translateOrigin(x: number, y: number): void {
    this.setOrigin(this.originX + x, this.originY - y);
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

}
