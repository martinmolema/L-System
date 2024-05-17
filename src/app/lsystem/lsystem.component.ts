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
import {Point} from "../classes/point";
import {LSystemCalculator} from "../classes/lsystem-calculator";
import {DrawingCanvas} from "../classes/drawing-canvas";


@Component({
  selector: 'app-lsystem',
  standalone: true,
  imports: [],
  templateUrl: './lsystem.component.html',
  styleUrl: './lsystem.component.css'
})
export class LSystemComponent implements OnChanges, OnInit, AfterViewInit {

  @Input() lsystem: LSystemCalculator | undefined = undefined;
  @Input() canvas: DrawingCanvas;
  @ViewChild("drawing") drawingElement: ElementRef | undefined;

  startPoint = new Point(0, 0);
  // translation = new Point(0, 0);
  translationStartValue = new Point(0, 0);
  zoomFactor = 1;
  transformString: string;
  isDragging = false;
  CTM: any;

  constructor() {
    this.transformString = '';
    this.canvas = new DrawingCanvas(0, 0, 0, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.lsystem instanceof LSystemCalculator) {
      if (changes['canvas']) {
      }
      /*
            if (changes['Translation'] && this.Translation) {
              const newTranslation = (changes['Translation'].currentValue as unknown) as Point;
              this.setZoomTranslation(this.zoomFactor, newTranslation, false);
              this.translation.x = newTranslation.x;
              this.translation.y = newTranslation.y;
            }
      */
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

    this.setZoomTranslation(this.zoomFactor);
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

      let diffX = newX - this.startPoint.x;
      let diffY = newY - this.startPoint.y;

      this.canvas.translation.setXY(this.translationStartValue.x + diffX, this.translationStartValue.y + diffY);
    }

  }

  setZoomTranslation(zoom: number) {
    const zoomStr = `scale(${zoom},${zoom})`;
    this.transformString = `${zoomStr}`;
  }

}
