import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Point} from "../classes/point";
import {LSystemCalculator} from "../classes/lsystem-calculator";


@Component({
  selector: 'app-lsystem',
  standalone: true,
  imports: [],
  templateUrl: './lsystem.component.html',
  styleUrl: './lsystem.component.css'
})
export class LSystemComponent implements OnChanges, OnInit, AfterViewInit {

  @Input() lsystem: LSystemCalculator | undefined = undefined;
  @Input() Translation: Point | undefined = undefined;
  @ViewChild("drawing") drawingElement: ElementRef | undefined;
  @Output() TranslationChange: EventEmitter<Point> = new EventEmitter<Point>();

  startPoint = new Point(0, 0);
  translation = new Point(0, 0);
  temporaryTranslation = new Point(0, 0);
  zoomFactor = 1;
  transformString: string;
  isDragging = false;
  CTM: any;

  constructor() {
    this.transformString = '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.lsystem instanceof LSystemCalculator) {
      if (changes['Translation'] && this.Translation) {
        const newTranslation = (changes['Translation'].currentValue as unknown) as Point;
        this.setZoomTranslation(this.zoomFactor, newTranslation, false);
        this.translation.x = newTranslation.x;
        this.translation.y = newTranslation.y;
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

    this.setZoomTranslation(this.zoomFactor, this.translation);
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    const startX = (event.clientX - this.CTM.e) / this.CTM.a;
    const startY = (event.clientY - this.CTM.f) / this.CTM.d;

    this.startPoint.x = startX;
    this.startPoint.y = startY;
    this.startPoint = new Point(this.startPoint.x, this.startPoint.y);
    this.temporaryTranslation = new Point(0, 0);

  }

  endDrag(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;

      if (this.translation) {
        this.translation.x = Math.floor(this.temporaryTranslation.x * 10) / 10;
        this.translation.y = Math.floor(this.temporaryTranslation.y * 10) / 10;
        this.TranslationChange.emit(this.translation);
      }
    }
  }

  drag(event: MouseEvent): void {
    if (this.isDragging) {

      const newX = Math.floor((event.clientX - this.CTM.e) / this.CTM.a);
      const newY = Math.floor((event.clientY - this.CTM.f) / this.CTM.d);

      let diffX = newX - this.startPoint.x;
      let diffY = newY - this.startPoint.y;

      if (this.translation) {

        this.temporaryTranslation.x = this.translation?.x + diffX;
        this.temporaryTranslation.y = this.translation?.y + diffY;

        this.setZoomTranslation(this.zoomFactor, this.temporaryTranslation);
      }
    }

  }

  setZoomTranslation(zoom: number, translation: Point | undefined, emitNewValue = true) {
    if (translation) {
      const translateStr = `translate(${translation.xAsString},${-translation.yAsString})`;
      const zoomStr = `scale(${zoom},${zoom})`;

      this.transformString = `${translateStr} ${zoomStr}`;
    }

    if (emitNewValue) {
      this.TranslationChange.emit(translation);
    }
  }

}
