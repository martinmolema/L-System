import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  Input,
  OnChanges,
  OnInit, Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {PointExt} from "../../classes/pointExt";
import {LSystemCalculator} from "../../classes/lsystem-calculator";
import {CarthesianCoordinates2d} from "../../classes/carthesian-coordinates2d";
import {Point} from "../../classes/point";

const SVG_NS = "http://www.w3.org/2000/svg";

@Component({
  selector: 'LSystemComponentScalableVectorGraphicsRenderer',
  standalone: true,
  imports: [],
  templateUrl: './l-system-component-scalable-vector-graphics-renderer.component.html',
  styleUrl: './l-system-component-scalable-vector-graphics-renderer.component.css'
})
export class LSystemComponentScalableVectorGraphicsRenderer implements OnChanges, OnInit, AfterViewInit {

  @Input() lsystem: LSystemCalculator;

  @Input() origin: Point;
  @Output() originChange: EventEmitter<Point> = new EventEmitter<Point>();

  @Input() zoomFactor: number = 1;
  @Output() zoomFactorChange: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild("drawing") drawingElement: ElementRef | undefined;
  @ViewChild("polylineElement") polylineElement: ElementRef | undefined;
  @Input() uniqueDrawingID: string = '';


  startPoint = new Point(0, 0);
  translationStartValue = new Point(0, 0);
  isDragging = false;
  CTM: any;

  constructor() {
    this.origin = new Point(0, 0);
    this.lsystem = new LSystemCalculator('x', new Point(0, 0));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['uniqueDrawingID'] || changes['lsystem']) {
      // remove the current <animate>-element and replace with new so we are sure the animation is restarted
      const svgPolylineElement = this.polylineElement?.nativeElement;
      if (svgPolylineElement) {
        while (svgPolylineElement.lastChild) {
          svgPolylineElement.removeChild(svgPolylineElement.lastChild);
        }
        const animation: SVGAnimationElement = document.createElementNS(SVG_NS, "animate") as SVGAnimationElement;
        const totalLength = this.lsystem?.TotalLineLength ? this.lsystem.TotalLineLength : 0;
        animation.setAttribute('attributeName', 'stroke-dashoffset');
        animation.setAttribute('from', totalLength.toString());
        animation.setAttribute('to', '0');
        animation.setAttribute('begin', '0s');
        animation.setAttribute('fill', 'freeze');
        animation.setAttribute('dur', '1.5s');
        animation.id = "my-animation";
        svgPolylineElement.appendChild(animation);
        animation.beginElementAt(0);
      }
    }
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    if (this.drawingElement) {
      this.CTM = this.drawingElement.nativeElement.getScreenCTM();
    }
  }

  handleWheelevent(event: WheelEvent): void {
    if (event.deltaY < 0) {
      this.zoomFactor += 0.1;
    } else {
      this.zoomFactor -= 0.1;
    }
    this.zoomFactor = Math.min(5, this.zoomFactor);
    this.zoomFactor = Math.max(0.1, this.zoomFactor);

    this.zoomFactorChange.emit(this.zoomFactor);
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    const startX = (event.clientX - this.CTM.e) / this.CTM.a;
    const startY = (event.clientY - this.CTM.f) / this.CTM.d;

    this.startPoint = new Point(startX, startY);
    if (this.lsystem?.OriginCoordinates2d) {
      this.translationStartValue = new Point(this.lsystem.OriginCoordinates2d?.x, this.lsystem.OriginCoordinates2d.y);
    }

  }

  endDrag(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

  drag(event: MouseEvent): void {
    if (this.isDragging && this.lsystem?.OriginCoordinates2d) {

      const newX = Math.floor((event.clientX - this.CTM.e) / this.CTM.a);
      const newY = Math.floor((event.clientY - this.CTM.f) / this.CTM.d);

      let diffX = (newX - this.startPoint.x) * (1 / this.zoomFactor);
      let diffY = - (newY - this.startPoint.y) * (1 / this.zoomFactor);

      diffX = Math.floor (diffX * 10) / 10;
      diffY = Math.floor (diffY * 10) / 10;

      this.origin.setXY(this.translationStartValue.x + diffX, this.translationStartValue.y + diffY);
      this.originChange.emit(this.origin);
    }

  }

}
