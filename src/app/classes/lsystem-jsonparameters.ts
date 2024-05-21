import {LSystemVariable} from "./lsystem-variable";
import {StrokeOpacitySettings} from "./lsystem-calculator";
import {Point} from "./point";
import {OriginPositionsEnum} from "./origin-positions-enum";

export class LSystemJSONParameters {
  systemName: string;
  variables: LSystemVariable[];
  axiom: string;
  rules: string[];
  rotationAngle: number;
  startingAngle: number;
  lineLength: number;
  lineLengthMultiplier: number;
  originPosition: OriginPositionsEnum;
  originCoordinates: Point;
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
    this.originCoordinates = new Point(0,0);
    this.fadeStrokeOpacity = 'None';
    this.strokeColor = 'black';
    this.nrOfIterationsToDrawAtSelection = 3;
    this.fillPolyline = false;
    this.usePolyline = false;
  }
}
