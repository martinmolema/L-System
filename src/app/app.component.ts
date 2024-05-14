import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LSystemComponent} from "./lsystem/lsystem.component";
import {LSystemCalculator} from "./classes/lsystem-calculator";
import {
  AbstractControl,
  FormBuilder, FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {FormErrorDirective} from "./directives/form-error.directive";

function checkRules(rules: AbstractControl): ValidationErrors | null {
  if (rules.value === null) {
    return null
  }

  const lines = rules.value.split(/\r?\n/);
  if (lines.length < 1) {
    return {notEnoughRules: true};
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('=');
    if (parts.length === 2) {
      if (parts[0].trim().length < 1 || parts[1].trim().length < 1) {
        return {MissingParts: line};
      }
      return null;
    } else {
      return {incorrectRule: line};
    }
  }
  return null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LSystemComponent, ReactiveFormsModule, FormErrorDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'math-lsystem';

  lsystem: LSystemCalculator;

  formgroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
  ) {
    this.lsystem = new LSystemCalculator(400, 400);

    this.createFractal();

    const rules = this.lsystem.rulesAsString;

    this.formgroup = this.formBuilder.group({
      nrOfIterations: [this.lsystem.nrOfIterationsRequested, [Validators.required, Validators.min(0), Validators.max(30)]],
      lineLength: [this.lsystem.lineLength, [Validators.required, Validators.min(0), Validators.max(800)]],
      originX: [this.lsystem.OriginX, [Validators.required, Validators.min(-400), Validators.max(400)]],
      originY: [this.lsystem.OriginY, [Validators.required, Validators.min(-400), Validators.max(400)]],
      axiom: [this.lsystem.Axiom, [Validators.required, Validators.minLength(1)]],
      rules: [rules, {
        validators: [Validators.required, checkRules],
        updateOn: 'change'
      }],
    });

    this.formgroup.valueChanges.subscribe(() => {
      if (this.formgroup.valid) {

        this.lsystem.setOrigin(this.originX?.value, this.originY?.value);
        this.lsystem.lineLength = this.lineLength?.value;

        this.lsystem.clearRules();
        this.rules?.value.split('\n').forEach((rule: string) => {
          this.lsystem.addRule(rule);
        })

        this.lsystem.setAxiom(this.axiom?.value);

        this.lsystem.startGeneration(this.nrOfIterations?.value);
      }
    });
  }

  get nrOfIterations(): AbstractControl | null {return this.formgroup.get('nrOfIterations');  }
  get lineLength(): AbstractControl | null {return this.formgroup.get('lineLength');  }
  get originX(): AbstractControl | null {return this.formgroup.get('originX');  }
  get originY(): AbstractControl | null {return this.formgroup.get('originY');  }
  get rules(): AbstractControl | null {return this.formgroup.get('rules');  }
  get axiom() : AbstractControl | null {return this.formgroup.get('axiom');  }

  createFractal() {
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
