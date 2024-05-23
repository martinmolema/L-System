import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ThreeJSRenderService} from "../../services/three-jsrender.service";
import {LSystemCalculator} from "../../classes/lsystem-calculator";

@Component({
  selector: 'Three-js-renderer',
  standalone: true,
  imports: [],
  templateUrl: './three-js-renderer.component.html',
  styleUrl: './three-js-renderer.component.css'
})
export class ThreeJsRendererComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('rendererCanvas', {static: true})
  public rendererCanvas: ElementRef<HTMLCanvasElement> | undefined = undefined;

  @Input() lsystem: LSystemCalculator | undefined = undefined;
  @Input() uniqueDrawingID: string = '';

  constructor(private engServ: ThreeJSRenderService) { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.lsystem) {
      this.engServ.createShapes(this.lsystem);
      this.engServ.animate();
    }
  }

  ngAfterViewInit(): void {
    console.log(this.rendererCanvas);
    if (this.rendererCanvas) {
      this.engServ.createScene(this.rendererCanvas);

    }
  }

}
