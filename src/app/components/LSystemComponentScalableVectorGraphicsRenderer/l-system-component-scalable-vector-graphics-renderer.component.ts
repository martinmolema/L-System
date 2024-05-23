import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Point} from "../../classes/point";
import {LSystemCalculator} from "../../classes/lsystem-calculator";
import {CarthesianCoordinates} from "../../classes/carthesian-coordinates";

const SVG_NS = "http://www.w3.org/2000/svg";

@Component({
  selector: 'LSystemComponentScalableVectorGraphicsRenderer',
  standalone: true,
  imports: [],
  templateUrl: './l-system-component-scalable-vector-graphics-renderer.component.html',
  styleUrl: './l-system-component-scalable-vector-graphics-renderer.component.css'
})
export class LSystemComponentScalableVectorGraphicsRenderer implements OnChanges, OnInit, AfterViewInit {

  @Input() lsystem: LSystemCalculator | undefined = undefined;
  @Input() canvas: CarthesianCoordinates;
  @ViewChild("drawing") drawingElement: ElementRef | undefined;
  @ViewChild("polylineElement") polylineElement: ElementRef | undefined;
  @Input() uniqueDrawingID: string = '';

  startPoint = new Point(0, 0);
  translationStartValue = new Point(0, 0);
  isDragging = false;
  CTM: any;

  constructor() {
    this.canvas = new CarthesianCoordinates(0, 0, 0, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['uniqueDrawingID'] || changes['lsystem']) {
      // remove the current <animate>-element and replace with new so we are sure the animation is restarted
      const svgPolylineElement = this.polylineElement?.nativeElement;
      if (svgPolylineElement) {
        while (svgPolylineElement.lastChild) {
          svgPolylineElement.removeChild(svgPolylineElement.lastChild);
        }
        const animation:SVGAnimationElement = document.createElementNS(SVG_NS,"animate") as SVGAnimationElement;
        const totalLength = this.lsystem?.TotalLineLength ? this.lsystem.TotalLineLength : 0;
        animation.setAttribute('attributeName', 'stroke-dashoffset');
        animation.setAttribute('from', totalLength.toString() );
        animation.setAttribute('to', '0');
        animation.setAttribute('begin', '0s');
        animation.setAttribute('fill', 'freeze');
        animation.setAttribute('dur', '1.5s');
        animation.id =  "my-animation";
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
      this.canvas.zoomFactor += 0.1;
    } else {
      this.canvas.zoomFactor -= 0.1;
    }
    this.canvas.zoomFactor = Math.min(5, this.canvas.zoomFactor);
    this.canvas.zoomFactor = Math.max(0.1, this.canvas.zoomFactor);
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    const startX = (event.clientX - this.CTM.e) / this.CTM.a;
    const startY = (event.clientY - this.CTM.f) / this.CTM.d;

    this.startPoint = new Point(startX, startY);
    this.translationStartValue = new Point(this.canvas.translation.x, this.canvas.translation.y);

  }

  endDrag(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

  drag(event: MouseEvent): void {
    if (this.isDragging) {

      const newX = Math.floor((event.clientX - this.CTM.e) / this.CTM.a);
      const newY = Math.floor((event.clientY - this.CTM.f) / this.CTM.d);

      let diffX = (newX - this.startPoint.x) * (1/this.canvas.zoomFactor);
      let diffY = (newY - this.startPoint.y)  * (1/this.canvas.zoomFactor);

      this.canvas.translation.setXY(this.translationStartValue.x + diffX, this.translationStartValue.y + diffY);
    }

  }

}
