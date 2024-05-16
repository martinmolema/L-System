import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LSystemComponent} from "./lsystem/lsystem.component";
import {LSystemCalculator, SpecialChars} from "./classes/lsystem-calculator";
import {
  AbstractControl, FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import {FormErrorDirective} from "./directives/form-error.directive";
import {LSystemVariable} from "./classes/lsystem-variable";
import {Point} from "./classes/point";

function checkRules(ruleControl: AbstractControl): ValidationErrors | null {
  if (ruleControl.value === null) {
    return null
  }
  const line = ruleControl.value;
  const parts = line.split('=');
  if (parts.length === 2) {
    if (parts[0].trim().length < 1 || parts[1].trim().length < 1) {
      return {MissingParts: line};
    }
    return null;
  } else {
    return {incorrectRule: line};
  }
  return null;
}

function checkVariablesAndRules(form: FormGroup): null | ValidationErrors {
  const variables = (form.get('listOfVariables') as FormArray).controls.map((subform: AbstractControl) => (subform as FormGroup).get('variableName')?.value);
  const rules = (form.get('listOfRules') as FormArray).controls.map((subform: AbstractControl) => (subform as FormGroup).get('rule')?.value);

  for (let r = 0; r < rules.length; r++) {
    const rule = rules[r].trim();
    const parts = rule.split('=');

    if (parts.length !== 2) {
      //console.log(`NotEnoughPartsForFormula: ${rule}`);
      return {NotEnoughPartsForFormula: rule};
    }
    const varname = parts[0].trim();
    const formula = parts[1].trim();

    if (varname.length !== 1) {
      //console.log(`WrongLengthVariableNameLeftOfEqualSign: ${varname}`);
      return {WrongLengthVariableNameLeftOfEqualSign: varname};
    }

    if (!variables.includes(varname)) {
      //console.log(`WrongVariableLeftOfEqualSign: ${varname}`);
      return {WrongVariableLeftOfEqualSign: varname}
    }

    for (let c = 0; c < formula.length; c++) {
      let char = formula.charAt(c);
      if (! (SpecialChars.includes(char)) && !variables.includes(char)) {
        //console.log(`Wrong char in formula: ${char}`);
        return {WrongVariable: char};
      }
    }
   // console.log(`Formula OK : ${formula}`)
  }
  //console.log(`All formulas ok`);
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
  autoUpdateDrawing:boolean = true;

  translation: Point | undefined = undefined;

  formgroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
  ) {
    this.lsystem = new LSystemCalculator(800, 800);

    this.setupLSystem();
    this.translation = new Point(0,0);

    this.formgroup = new FormGroup({});
    this.createForm();

    this.createHandlers();
  }

  createForm(): void {
    this.formgroup = this.formBuilder.group({
      autoUpdate:[this.autoUpdateDrawing],
      nrOfIterations: [this.lsystem.nrOfIterationsRequested, [Validators.required, Validators.min(0), Validators.max(30)]],
      rotationAngle: [this.lsystem.rotationAngle,[Validators.required, Validators.min(-180), Validators.max(+180)]],
      startAngle: [this.lsystem.startingAngle,[Validators.required, Validators.min(-180), Validators.max(+180)]],
      lineLength: [this.lsystem.lineLength, [Validators.required, Validators.min(0), Validators.max(800)]],
      originX: [this.lsystem.OriginX, [Validators.required, Validators.min(-400), Validators.max(400)]],
      originY: [this.lsystem.OriginY, [Validators.required, Validators.min(-400), Validators.max(400)]],
      lengthMultiplier: [this.lsystem.lineLengthMultiplier, [Validators.required]],
      axiom: [this.lsystem.Axiom, [Validators.required, Validators.minLength(1)]],

      listOfVariables: this.formBuilder.array([]),
      listOfRules: this.formBuilder.array([]),
    },
      {
        validators:[checkVariablesAndRules]
      });
    this.updateVariables();
    this.updateRules();
  }

  updateOriginFromTranslation():void {
    if (this.translation) {
      this.lsystem.translateOrigin(this.translation.x, -this.translation.y);

      const newX = this.lsystem.OriginX;
      const newY = this.lsystem.OriginY;


      this.originX?.setValue(newX);
      this.originY?.setValue(newY);

      if (this.autoUpdateDrawing) {
        this.translation = new Point(0,0);

        this.changeParametersAndRedraw();
      }
    }
  }

  updateRules(): void {
    this.lsystem.Rules.forEach(rule => {
      this.addNewRule(rule);
    });

  }

  updateVariables(): void {
    this.lsystem.Variables.forEach((variableName: LSystemVariable) => {
      this.addNewVariable(variableName)
    });
  }

  addNewVariable(variableName: LSystemVariable) {
    const varArray = this.variables;
    const item = this.formBuilder.group({
      variableName: [variableName.varname],
      isDrawing: [variableName.isDrawingVariable],
    })
    varArray?.push(item);
  }

  addNewVariableFromForm(name: string, isDrawing:boolean): void {
    this.addNewVariable(new LSystemVariable(name, isDrawing));
  }

  addNewRule(newRule: string) {
    const varArray = this.rules;
    const item = this.formBuilder.group({
      rule: [newRule,{
        validators: [checkRules],
        updateOn:'change'
      }]
    })
    varArray?.push(item);
  }

  parseRulesForVariables() {
    this.clearVariables();
    const uniqueVariablesFound = new Set<string>();

    this.rules?.controls.forEach((control: AbstractControl) => {
      const formGroup = (control as FormGroup);
      if (formGroup.valid) {
        const rule = formGroup.get('rule')?.value;

        rule.split('').forEach((char: string) => uniqueVariablesFound.add(char));
      }
    });
    Array.from(uniqueVariablesFound.values()).forEach((char: string) => {
      const isDrawingVar = ['F', 'G'].includes(char);
      const isSpecialChar = SpecialChars.includes(char);
      const isEqualChar = (char == '=');
      if (!isSpecialChar && !isEqualChar) {
        const newVar = new LSystemVariable(char, isDrawingVar);
        this.lsystem.addVariableObject(newVar);
        this.addNewVariable(newVar);
      }
    });

  }

  clearVariables():void {
    this.lsystem.clearVariables();
    this.variables?.clear();
  }

  createHandlers(): void{
    this.formgroup.valueChanges.subscribe(() => {
      if (this.formgroup.valid) {
        this.autoUpdateDrawing = this.autoUpdate ? this.autoUpdate.value : this.autoUpdateDrawing;

        if (this.autoUpdateDrawing) {
          this.changeParametersAndRedraw();
        }
      }
    });
  }

  submitValues(): void {
    this.changeParametersAndRedraw();
  }

  changeParametersAndRedraw(): void {
    this.changeLSystemParameters();
    if (this.nrOfIterations) {
      this.redraw(parseInt(this.nrOfIterations.value));
    }
  }


  changeLSystemParameters() {

    this.lsystem.setOrigin(this.originX?.value, this.originY?.value);
    this.lsystem.lineLength = this.lineLength?.value;

    this.lsystem.clearRules();
    this.rules?.controls.forEach((control: AbstractControl) => {
      const formGroup = (control as FormGroup);
      const rule = formGroup.get('rule')?.value;
      if (rule) {
        this.lsystem.addRule(rule);
      }

    });

    this.variables?.controls.forEach((variable: AbstractControl) => {
      this.lsystem.addVariableObject(variable.value);
    });
    this.lsystem.setAxiom(this.axiom?.value);
    this.lsystem.startingAngle = this.startAngle?.value;
    this.lsystem.rotationAngle = this.rotationAngle?.value;
    this.lsystem.lineLengthMultiplier = this.lengthMultiplier?.value;

  }

  redraw(nrOfIterations:number): void {

    this.lsystem.startGeneration(nrOfIterations);

  }

  get autoUpdate(): AbstractControl | null {return this.formgroup.get('autoUpdate');  }
  get nrOfIterations(): AbstractControl | null {return this.formgroup.get('nrOfIterations');  }
  get lineLength(): AbstractControl | null {return this.formgroup.get('lineLength');  }
  get originX(): AbstractControl | null {return this.formgroup.get('originX');  }
  get originY(): AbstractControl | null {return this.formgroup.get('originY');  }
  get axiom() : AbstractControl | null {return this.formgroup.get('axiom');  }
  get rotationAngle() : AbstractControl | null {return this.formgroup.get('rotationAngle');  }
  get startAngle() : AbstractControl | null {return this.formgroup.get('startAngle');  }
  get lengthMultiplier() : AbstractControl | null {return this.formgroup.get('lengthMultiplier');  }

  get variables(): FormArray | undefined {
    const items =  this.formgroup.get('listOfVariables');
    return (items as FormArray);
  }

  get rules(): FormArray | undefined {
    const items = this.formgroup.get('listOfRules');
    return (items as FormArray);
  }

  oneVariable(index: number): FormGroup {
    const item = this.variables?.controls[index];
    return (item as FormGroup);
  }

  oneRule(index: number): FormGroup {
    const item = this.rules?.controls[index];
    return (item as FormGroup);
  }

  deleteOneVariable(index:number):void {
    this.variables?.removeAt(index);
  }

  deleteOneRule(index:number):void {
    this.rules?.removeAt(index);
  }

  setupLSystem() {
    /*
        // bushy cactus tree
        lsystem.addVariableObject('F');
        lsystem.addVariableObject('X');
        lsystem.addVariableObject('Y');
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
        lsystem.addVariableObject('F');
        lsystem.addRule('F=FF+F-F+F+FF');
        lsystem.setAxiom('F+F+F+F');
        lsystem.lineLength = 20;
        lsystem.rotationAngle = 90;
        lsystem.startGeneration(4);

    */

/*
    // fractal tree
    this.lsystem.addVariableObject('F');
    this.lsystem.addVariableObject('X');
    this.lsystem.addRule('X= >[-FX]+FX');
    this.lsystem.setAxiom('FX');
    this.lsystem.lineLength = 200;
    this.lsystem.rotationAngle = 40;
    this.lsystem.OriginY = -100;
    this.lsystem.lineLengthMultiplier = 0.5;
    this.lsystem.startGeneration(8);
*/

    /*
    // plant left oriented
    lsystem.addVariableObject('F');
    lsystem.addVariableObject('X');
    lsystem.addRule('X=F-[[X]+X]+F[+FX]-X');
    lsystem.addRule('F=FF');
    lsystem.setAxiom('X');
    lsystem.lineLength = 5;
    lsystem.rotationAngle = 22.5;
    lsystem.startGeneration(5);

*/
    /*

        // square sierpinski
        lsystem.addVariableObject('F');
        lsystem.addVariableObject('X');
        lsystem.addRule('X=XF-F+F-XF+F+XF-F+F-X');
        lsystem.setAxiom('F+XF+F+XF');
        lsystem.lineLength = 10;
        lsystem.rotationAngle = 90;
        lsystem.originX = 250;
        lsystem.startGeneration(5);
    */
    /*
        // ?
        lsystem.addVariableObject('F');
        lsystem.addRule('F=F+F-F-FF+F+F-F');
        lsystem.setAxiom('F+F+F+F');
        lsystem.lineLength = 5;
        lsystem.rotationAngle = 90;
        lsystem.setOriginBottomRight(0,0)
        lsystem.startGeneration(5);
        */

    /*
        // triangles
        lsystem.addVariableObject('F');
        lsystem.addRule('F=F-F+F');
        lsystem.setAxiom('F+F+F');
        lsystem.lineLength = 20;
        lsystem.rotationAngle = 120;
        lsystem.setOrigin(-200, 100);
        lsystem.startGeneration(5);
    */
    /*

        // Peano Curve
        lsystem.addVariableObject('X');
        lsystem.addVariableObject('Y');
        lsystem.addVariableObject('F');
        lsystem.addRule('X=XFYFX+F+YFXFY-F-XFYFX');
        lsystem.addRule('Y=YFXFY-F-XFYFX+F+YFXFY');
        lsystem.setAxiom('X');
        lsystem.lineLength = 5 ;
        lsystem.rotationAngle = 90;
        lsystem.setOrigin(200, -300);
        lsystem.startGeneration(5);
    */
    /*    // Sierpinski Arrowhead
        this.lsystem.addVariableObject(new LSystemVariable('F', true));
        this.lsystem.addVariableObject(new LSystemVariable('X', false));
        this.lsystem.addVariableObject(new LSystemVariable('Y', false));
        this.lsystem.addRule('X=YF+XF+Y');
        this.lsystem.addRule('Y=XF-YF-X');
        this.lsystem.setAxiom('YF');
        this.lsystem.lineLength = 10 ;
        this.lsystem.startingAngle = 0;
        this.lsystem.rotationAngle = 60;
        this.lsystem.setOriginBottomLeft(10,10)
        this.lsystem.startGeneration(7);
*/
    /*
        // Hilbert
        lsystem.addVariableObject('F');
        lsystem.addVariableObject('X');
        lsystem.addVariableObject('Y');
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
        lsystem.addVariableObject('F');
        lsystem.addRule('F=F+F-F-F+F');
        lsystem.setAxiom('FF+FF+FF+FF');
        lsystem.lineLength = 3 ;
        lsystem.rotationAngle = 90;
        lsystem.setOriginBottomRight(20,20);
        lsystem.startGeneration(5);
    */

/*
        // Quadratic Gosper
        this.lsystem.addVariableSimple('F', true);
        this.lsystem.addVariableSimple('X');
        this.lsystem.addVariableSimple('Y');
        this.lsystem.addRule('X=XFX-YF-YF+FX+FX-YF-YFFX+YF+FXFXYF-FX+YF+FXFX+YF-FXYF-YF-FX+FX+YFYF-');
        this.lsystem.addRule('Y=+FXFX-YF-YF+FX+FXYF+FX-YFYF-FX-YF+FXYFYF-FX-YFFX+FX+YF-YF-FX+FX+YFY');
        this.lsystem.setAxiom('-YF');
        this.lsystem.lineLength = 5;
        this.lsystem.rotationAngle = 90;
        this.lsystem.setOriginBottomLeft(10,10);
        this.lsystem.startGeneration(4);*/

        // L-system leaf
        this.lsystem.addVariableSimple('F', true);
        this.lsystem.addVariableSimple('x');
        this.lsystem.addVariableSimple('y');
        this.lsystem.addVariableSimple('a');
        this.lsystem.addVariableSimple('b');
        this.lsystem.addRule('F=>F<');
        this.lsystem.addRule('a=F[+x]Fb');
        this.lsystem.addRule('b=F[-y]Fa');
        this.lsystem.addRule('x=a');
        this.lsystem.addRule('y=b');
        this.lsystem.setAxiom('a');
        this.lsystem.setOriginBottomCenter(0,10)
        this.lsystem.lineLength = 10;
        this.lsystem.rotationAngle = 30;
        this.lsystem.startingAngle = 90;
        this.lsystem.lineLengthMultiplier = 0.5;
        this.lsystem.startGeneration(10);

  }

  protected readonly Math = Math;
}
