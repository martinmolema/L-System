import {LSystemVariable} from "./lsystem-variable";
import {OriginPositions} from "./lsystem-calculator";
import {Point} from "./point";

export class LSystemJSONParameters {
  systemName: string;
  variables: LSystemVariable[];
  axiom: string;
  rules: string[];
  rotationAngle: number;
  startingAngle: number;
  lineLength: number;
  lineLengthMultiplier: number;
  originPosition: OriginPositions;
  originCoordinates: Point;

  constructor(systemName: string) {
    this.systemName = systemName;
    this.variables = [];
    this.axiom = '';
    this.rules = [];
    this.rotationAngle = 0;
    this.startingAngle = 0;
    this.lineLength = 0;
    this.lineLengthMultiplier = 0;
    this.originPosition = OriginPositions.CENTER;
    this.originCoordinates = new Point(0,0);
  }
}
