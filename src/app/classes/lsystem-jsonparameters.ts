import {LSystemVariable} from "./lsystem-variable";
import {StrokeOpacitySettings} from "./lsystem-calculator";
import {PointExt} from "./pointExt";
import {OriginPositionsEnum} from "./origin-positions-enum";
import {Point} from "./point";
import {Point3d} from "./point3d";

export class LSystemJSONParameters {
  systemName: string;
  variables: LSystemVariable[];
  axiom: string;
  rules: string[];
  rotationAngle: number;
  startingAngle: number;
  lineLength: number;
  lineLengthMultiplier: number;
  lineThickness3d:number;
  originPosition: OriginPositionsEnum;
  originCoordinates2d: Point;
  originCoordinates3d: Point3d;
  fadeStrokeOpacity: StrokeOpacitySettings;
  strokeColor: string;
  nrOfIterationsToDrawAtSelection: number;
  fillPolyline: boolean;
  usePolyline: boolean;

  constructor(systemName: string) {
    this.systemName = systemName;
    this.variables = [];
    this.axiom = '';
    this.rules = [];
    this.rotationAngle = 0;
    this.startingAngle = 0;
    this.lineLength = 0;
    this.lineLengthMultiplier = 0;
    this.originPosition = OriginPositionsEnum.CENTER;
    this.originCoordinates2d = new Point(0,0);
    this.originCoordinates3d = new Point3d(0,0,0);
    this.fadeStrokeOpacity = 'None';
    this.strokeColor = 'black';
    this.nrOfIterationsToDrawAtSelection = 3;
    this.fillPolyline = false;
    this.usePolyline = false;
    this.lineThickness3d = 1;
  }
}
