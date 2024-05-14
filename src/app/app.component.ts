import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LSystemComponent} from "./lsystem/lsystem.component";
import {LSystemCalculator} from "./classes/lsystem-calculator";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LSystemComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'math-lsystem';

  lsystem: LSystemCalculator;

  constructor() {
    this.lsystem = new LSystemCalculator(400, 400);

    /*
        // bushy cactus tree
        lsystem.addVariable('F');
        lsystem.addVariable('X');
        lsystem.addVariable('Y');
        lsystem.addRule('X=X[-FFF][+FFF]FX');
        lsystem.addRule('Y=YFX[+Y][-Y]');
        lsystem.setAxiom('Y');
        lsystem.lineLength = 5;
        lsystem.rotationAngle = 25.7;
        lsystem.originY = -400;
        lsystem.startGeneration(8);
    */

    /*

        // squares
        lsystem.addVariable('F');
        lsystem.addRule('F=FF+F-F+F+FF');
        lsystem.setAxiom('F+F+F+F');
        lsystem.lineLength = 20;
        lsystem.rotationAngle = 90;
        lsystem.startGeneration(4);

    */

    // fractal tree
    this.lsystem.addVariable('F');
    this.lsystem.addVariable('X');
    this.lsystem.addRule('X= >[-FX]+FX');
    this.lsystem.setAxiom('FX');
    this.lsystem.lineLength = 200;
    this.lsystem.rotationAngle = 40;
    this.lsystem.OriginY = -100;
    this.lsystem.lineLengthMultiplier = 0.5;
    this.lsystem.startGeneration(8);

    /*
    // plant left oriented
    lsystem.addVariable('F');
    lsystem.addVariable('X');
    lsystem.addRule('X=F-[[X]+X]+F[+FX]-X');
    lsystem.addRule('F=FF');
    lsystem.setAxiom('X');
    lsystem.lineLength = 5;
    lsystem.rotationAngle = 22.5;
    lsystem.startGeneration(5);

*/
    /*

        // square sierpinski
        lsystem.addVariable('F');
        lsystem.addVariable('X');
        lsystem.addRule('X=XF-F+F-XF+F+XF-F+F-X');
        lsystem.setAxiom('F+XF+F+XF');
        lsystem.lineLength = 10;
        lsystem.rotationAngle = 90;
        lsystem.originX = 250;
        lsystem.startGeneration(5);
    */
    /*
        // ?
        lsystem.addVariable('F');
        lsystem.addRule('F=F+F-F-FF+F+F-F');
        lsystem.setAxiom('F+F+F+F');
        lsystem.lineLength = 5;
        lsystem.rotationAngle = 90;
        lsystem.setOriginBottomRight(0,0)
        lsystem.startGeneration(5);
        */

    /*
        // triangles
        lsystem.addVariable('F');
        lsystem.addRule('F=F-F+F');
        lsystem.setAxiom('F+F+F');
        lsystem.lineLength = 20;
        lsystem.rotationAngle = 120;
        lsystem.setOrigin(-200, 100);
        lsystem.startGeneration(5);
    */
    /*

        // Peano Curve
        lsystem.addVariable('X');
        lsystem.addVariable('Y');
        lsystem.addVariable('F');
        lsystem.addRule('X=XFYFX+F+YFXFY-F-XFYFX');
        lsystem.addRule('Y=YFXFY-F-XFYFX+F+YFXFY');
        lsystem.setAxiom('X');
        lsystem.lineLength = 5 ;
        lsystem.rotationAngle = 90;
        lsystem.setOrigin(200, -300);
        lsystem.startGeneration(5);
    */
    /*
        // Sierpinski Arrowhead
        lsystem.addVariable('F');
        lsystem.addVariable('X');
        lsystem.addVariable('Y');
        lsystem.addRule('X=YF+XF+Y');
        lsystem.addRule('Y=XF-YF-X');
        lsystem.setAxiom('YF');
        lsystem.lineLength = 10 ;
        lsystem.startingAngle = 0;
        lsystem.rotationAngle = 60;
        lsystem.setOriginBottomLeft(10,10)
        lsystem.startGeneration(7);*/

    /*
        // Hilbert
        lsystem.addVariable('F');
        lsystem.addVariable('X');
        lsystem.addVariable('Y');
        lsystem.addRule('X=-YF+XFX+FY-');
        lsystem.addRule('Y=+XF-YFY-FX+');
        lsystem.setAxiom('X');
        lsystem.lineLength = 10 ;
        lsystem.rotationAngle = 90;
        lsystem.setOriginBottomLeft(10,10);
        lsystem.startGeneration(7);
    */
    /*

        // Quadratic Snowflake variant B
        lsystem.addVariable('F');
        lsystem.addRule('F=F+F-F-F+F');
        lsystem.setAxiom('FF+FF+FF+FF');
        lsystem.lineLength = 3 ;
        lsystem.rotationAngle = 90;
        lsystem.setOriginBottomRight(20,20);
        lsystem.startGeneration(5);
    */


    /*

        // Quadratic Gosper
        lsystem.addVariable('F');
        lsystem.addVariable('X');
        lsystem.addVariable('Y');
        lsystem.addRule('X=XFX-YF-YF+FX+FX-YF-YFFX+YF+FXFXYF-FX+YF+FXFX+YF-FXYF-YF-FX+FX+YFYF-');
        lsystem.addRule('Y=+FXFX-YF-YF+FX+FXYF+FX-YFYF-FX-YF+FXYFYF-FX-YFFX+FX+YF-YF-FX+FX+YFY');
        lsystem.setAxiom('-YF');
        lsystem.lineLength = 5;
        lsystem.rotationAngle = 90;
        lsystem.setOriginBottomLeft(10,10);
        lsystem.startGeneration(4);
    */

  }
}
