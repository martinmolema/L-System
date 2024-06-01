import { Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {
  LSystemComponentScalableVectorGraphicsRenderer
} from "./components/LSystemComponentScalableVectorGraphicsRenderer/l-system-component-scalable-vector-graphics-renderer.component";
import {LSystemCalculator, SpecialChars} from "./classes/lsystem-calculator";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import {FormErrorDirective} from "./directives/form-error.directive";
import {LSystemVariable} from "./classes/lsystem-variable";
import {CarthesianCoordinates2d} from "./classes/carthesian-coordinates2d";
import {forkJoin, Observable, Subscription} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {LSystemJSONParameters} from "./classes/lsystem-jsonparameters";
import {DecimalPipe} from "@angular/common";
import {OriginPositionsEnum} from "./classes/origin-positions-enum";
import {Ajv2020} from "ajv/dist/2020";
import {ThreeJsRendererComponent} from "./components/three-js-renderer/three-js-renderer.component";
import {Point} from "./classes/point";
import {ThreeJSRenderService} from "./services/three-jsrender.service";
import {GitVersionInfo, ProjectBuildInfo} from "../environments/git-version-info";


type RendererTypes = '2d' | 'threejs';


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
      if (!(SpecialChars.includes(char)) && !variables.includes(char)) {
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
  imports: [RouterOutlet, LSystemComponentScalableVectorGraphicsRenderer, ReactiveFormsModule, FormErrorDirective, FormsModule, DecimalPipe, ThreeJsRendererComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly OriginPositions = OriginPositionsEnum;
  protected readonly Math = Math;

  lsystem: LSystemCalculator;
  allSystems: Array<LSystemCalculator>;
  autoUpdateDrawing: boolean = true;
  valueChangeSubscribers: Array<Subscription>;

  public versionInfo = GitVersionInfo;
  public buildInfo = ProjectBuildInfo;

  renderer: RendererTypes = 'threejs';

  formgroup: FormGroup;

  preventUpdates: boolean = false;

  idxSelectedSystem: number = 5;
  zoomFactor: number = 1;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private threeJSRenderer: ThreeJSRenderService
  ) {
    this.valueChangeSubscribers = new Array<Subscription>();
    this.allSystems = new Array<LSystemCalculator>();
    this.lsystem = new LSystemCalculator('x', OriginPositionsEnum.CENTER);

    this.formgroup = this.formBuilder.group({});

    this.createForm(this.lsystem);

    this.getDataForCurves().subscribe({
      next: (data) => {


        this.allSystems = data;
        this.lsystem = this.allSystems[this.idxSelectedSystem];
        this.createForm(this.lsystem);

        this.createHandlers();

        this.setupSystemAndRedraw();
      },
      error: (message: string) => {
        alert(message);
      }
    });


  }

  setRenderer(): void {
    this.redraw(this.nrOfIterations?.value);
  }

  /**
   * Creates a new form based on a given LSystemCalculator
   * @param lsystem
   */
  createForm(lsystem: LSystemCalculator): void {
    this.clearFormHandlers();

    this.formgroup = this.formBuilder.group({
        autoUpdate: [this.autoUpdateDrawing],
        nrOfIterations: [lsystem.nrOfIterationsRequested, [Validators.required, Validators.min(0), Validators.max(30)]],
        rotationAngle: [lsystem.rotationAngle, [Validators.required, Validators.min(-180), Validators.max(+180)]],
        startAngle: [lsystem.startingAngle, [Validators.required, Validators.min(-180), Validators.max(+180)]],
        lineLength: [lsystem.lineLength, [Validators.required, Validators.min(0), Validators.max(800)]],
        originX: [0, [Validators.required, Validators.min(-400), Validators.max(400)]],
        originY: [0, [Validators.required, Validators.min(-400), Validators.max(400)]],
        originX3d: [0, [Validators.required, Validators.min(-400), Validators.max(400)]],
        originY3d: [0, [Validators.required, Validators.min(-400), Validators.max(400)]],
        originZ3d: [0, [Validators.required, Validators.min(-400), Validators.max(400)]],
        lengthMultiplier: [lsystem.lineLengthMultiplier, [Validators.required, Validators.min(0.01), Validators.max(20)]],
        axiom: [lsystem.Axiom, [Validators.required, Validators.minLength(1)]],
        fadeStrokeOpacity: [lsystem.fadeStrokeOpacity],
        usePolyline: [lsystem.UsePolyline],
        fillPolyline: [lsystem.FillPolyline],
        strokeColor: [lsystem.strokeColor, [Validators.required, Validators.minLength(3)]],
        listOfVariables: this.formBuilder.array([]),
        listOfRules: this.formBuilder.array([]),
        lineThickness3d: [lsystem.lineThickness3d, [Validators.required, Validators.min(1), Validators.max(30)]],
        rotationAngleRandomizerValue: [lsystem.rotationAngleRandomizerValue, [Validators.required, Validators.min(0), Validators.max(180)]]
      },
      {
        validators: [checkVariablesAndRules]
      });
    this.updateVariables();
    this.updateRules();
  }


  clearFormHandlers(): void {
    if (this.valueChangeSubscribers) {
      this.valueChangeSubscribers.forEach(sub => sub.unsubscribe());
      this.valueChangeSubscribers = new Array<Subscription>();
    }
  }

  /**
   * Update the from from an LSystem. This will create a new form and then create a new handler for events.
   * @param lsystem
   */
  updateFormFromLSystem(lsystem: LSystemCalculator): void {
    // create a new form
    this.createForm(lsystem);

    this.createHandlers();
  }

  selectSystem(event: Event) {
    this.lsystem = this.allSystems[this.idxSelectedSystem];
    this.setupSystemAndRedraw();
  }

  setupSystemAndRedraw() {
    this.updateFormFromLSystem(this.lsystem);

    this.setOriginFromPosition(this.lsystem.OriginPosition);
    this.resetZoom();

    this.redraw(this.lsystem.nrOfIterationsRequested);

  }

  resetZoom(): void {
    this.zoomFactor = 1;
  }

  updateOriginFromDrag(point: Point): void {
    this.setOriginInForm(point);
    if (this.usePolyline) {
      this.lsystem.createPolyline(this.lsystem.OriginCoordinates2d, this.zoomFactor)
    }
  }

  setOriginInForm(point: Point): void {
    this.originX?.setValue(point.x,{emitEvent: false});
    this.originY?.setValue(point.y,{emitEvent: false});
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

  addNewVariableFromForm(name: string, isDrawing: boolean): void {
    this.addNewVariable(new LSystemVariable(name, isDrawing));
  }

  addNewRule(newRule: string) {
    const varArray = this.rules;
    const item = this.formBuilder.group({
      rule: [newRule, {
        validators: [checkRules],
        updateOn: 'change'
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

  clearVariables(): void {
    this.lsystem.clearVariables();
    this.variables?.clear();
  }

  createHandlers(): void {
    this.clearFormHandlers();
    // the list of items below will immediately trigger a recalculation
    [
      this.nrOfIterations,
      this.lineLength,
      this.axiom,
      this.rotationAngle,
      this.startAngle,
      this.lengthMultiplier,
      this.fadeStrokeOpacity,
      this.usePolyline,
      this.originX,
      this.originY,
      this.originX3d,
      this.originY3d,
      this.originZ3d,
      this.lineThickness3d,
      this.rotationAngleRandomizerValue,
    ].forEach((field: AbstractControl | null) => {
      if (field !== null) {
        this.valueChangeSubscribers.push(field.valueChanges.subscribe(() => {
          if (this.formgroup.valid) {
            this.autoUpdateDrawing = this.autoUpdate ? this.autoUpdate.value : this.autoUpdateDrawing;

            if (this.autoUpdateDrawing) {
              this.changeParametersAndRedraw();
            }
          }
        }));
      }

    });
    if (this.variables) {
      this.valueChangeSubscribers.push(this.variables?.valueChanges.subscribe((variable: FormGroup) => {
        this.processFormVariables();
      }));
    }

    if (this.rules) {
      this.valueChangeSubscribers.push(this.rules?.valueChanges.subscribe((rule: FormGroup) => {
        this.processFormRules();
      }))
    }

    // the fields below will only change information on the L-system object that will cause the HTML in the component
    // to change some aspects; not recalc the whole system
    [
      this.fillPolyline,
      this.strokeColor,
    ].forEach((field: AbstractControl | null) => {
      if (field !== null) {
        this.valueChangeSubscribers.push(field.valueChanges.subscribe(() => {
          this.changeLSystemSimpleParameters();
        }));
      }
    });
  }

  submitValues(): void {
    this.changeParametersAndRedraw();
  }

  copyJSONToClipboard(): void {
    const json = JSON.stringify(this.lsystem.createParameterObject());
    const type = "text/plain";
    const blob = new Blob([json], {type});
    const data = [new ClipboardItem({[type]: blob})];
    navigator.clipboard.write(data);
  }

  copySVGToClipboard(): void {
    let svg = '';
    if (this.lsystem.UsePolyline) {
      svg = this.lsystem.createPolylineAsSVGStringComplete(new Point(400, 400));
    } else {
      svg = this.lsystem.createLinesAsSVGStringComplete(new Point(400, 400));
    }
    const type = "text/plain";
    const blob = new Blob([svg], {type});
    const data = [new ClipboardItem({[type]: blob})];
    navigator.clipboard.write(data);
  }

  copyResultFormulaToClipboard(): void {
    const svg = this.lsystem.completeFormula;
    const type = "text/plain";
    const blob = new Blob([svg], {type});
    const data = [new ClipboardItem({[type]: blob})];
    navigator.clipboard.write(data);

  }

  changeParametersAndRedraw(): void {
    this.changeLSystemParametersForCalculation();
    if (this.nrOfIterations) {
      this.redraw(parseInt(this.nrOfIterations.value));
    }
  }


  processFormVariables(): void {
    this.lsystem.clearVariables();
    this.variables?.controls.map(c => c as FormGroup).forEach((variable: FormGroup) => {
      const name = variable.get('variableName')?.value;
      const isDrawing = variable.get('isDrawing')?.value;

      this.lsystem.addVariableSimple(name, isDrawing);
    });
  }

  processFormRules(): void {
    this.lsystem.clearRules();
    this.rules?.controls.forEach((control: AbstractControl) => {
      const formGroup = (control as FormGroup);
      const rule = formGroup.get('rule')?.value;
      if (rule) {
        this.lsystem.addRule(rule);
      }

    });
  }

  changeLSystemParametersForCalculation() {
    if (this.preventUpdates) { return ; }

    this.lsystem.OriginCoordinates3d.setXYZ(
      this.originX3d?.value,
      this.originY3d?.value,
      this.originZ3d?.value,
    );

    this.lsystem.OriginCoordinates2d.setXY(
      this.originX?.value,
      this.originY?.value
    );

    this.lsystem.lineLength = this.lineLength?.value;
    this.lsystem.setAxiom(this.axiom?.value);
    this.lsystem.startingAngle = this.startAngle?.value;
    this.lsystem.rotationAngle = this.rotationAngle?.value;
    this.lsystem.lineLengthMultiplier = this.lengthMultiplier?.value;
    this.lsystem.fadeStrokeOpacity = this.fadeStrokeOpacity?.value;
    this.lsystem.UsePolyline = this.usePolyline?.value;
    this.lsystem.lineThickness3d = this.lineThickness3d?.value;
    this.lsystem.rotationAngleRandomizerValue = this.rotationAngleRandomizerValue?.value;

    this.processFormRules();
    this.processFormVariables();

    this.changeLSystemSimpleParameters();
  }

  changeLSystemSimpleParameters(): void {
    this.lsystem.FillPolyline = this.fillPolyline?.value;
    this.lsystem.strokeColor = this.strokeColor?.value;
  }

  redraw(nrOfIterations: number): void {
    this.lsystem.startGeneration(nrOfIterations, this.lsystem.OriginCoordinates2d, this.lsystem.OriginCoordinates3d, this.zoomFactor);
  }

  get autoUpdate(): AbstractControl | null {
    return this.formgroup.get('autoUpdate');
  }

  get nrOfIterations(): AbstractControl | null {return this.formgroup.get('nrOfIterations');}
  get lineLength(): AbstractControl | null {return this.formgroup.get('lineLength');}

  get originX(): AbstractControl | null {return this.formgroup.get('originX'); }
  get originY(): AbstractControl | null {return this.formgroup.get('originY');}

  get originX3d(): AbstractControl | null {return this.formgroup.get('originX3d'); }
  get originY3d(): AbstractControl | null {return this.formgroup.get('originY3d');}
  get originZ3d(): AbstractControl | null {return this.formgroup.get('originZ3d');}

  get lineThickness3d(): AbstractControl | null {return this.formgroup.get('lineThickness3d');}
  get lengthMultiplier(): AbstractControl | null {return this.formgroup.get('lengthMultiplier');}

  get axiom(): AbstractControl | null {return this.formgroup.get('axiom');}
  get rotationAngle(): AbstractControl | null {return this.formgroup.get('rotationAngle');}
  get startAngle(): AbstractControl | null {return this.formgroup.get('startAngle');}
  get fadeStrokeOpacity(): AbstractControl | null {return this.formgroup.get('fadeStrokeOpacity');}
  get strokeColor(): AbstractControl | null {return this.formgroup.get('strokeColor');}
  get usePolyline(): AbstractControl | null {return this.formgroup.get('usePolyline');}
  get fillPolyline(): AbstractControl | null {return this.formgroup.get('fillPolyline');}
  get rotationAngleRandomizerValue(): AbstractControl | null {return this.formgroup.get('rotationAngleRandomizerValue');}

  get variables(): FormArray | undefined {const items = this.formgroup.get('listOfVariables');
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

  deleteOneVariable(index: number): void {
    this.variables?.removeAt(index);
  }

  deleteOneRule(index: number): void {
    this.rules?.removeAt(index);
  }

  /**
   * Loads the definitions of the curves. Do JSON validation using the AJV JSON Schema Validator (@see https://ajv.js.org/guide/modifying-data.html)
   *
   * Uses {@link ../../assets/json-schema-definitions.json} schema for the validation
   *
   * If an HTTP-error occurs (e.g. a basic JSON syntax check), the HTTP-error is returned as a string via the subscriber.error()
   * If validation against the schema fails, the error message as a string is returned via the subscriber.error()
   */
  getDataForCurves(): Observable<Array<LSystemCalculator>> {
    return new Observable<Array<LSystemCalculator>>(subscriber => {

      forkJoin([
        this.http.get<Array<LSystemJSONParameters>>('./assets/lsystem-definitions.json'),
        this.http.get<Array<LSystemJSONParameters>>('./assets/json-schema-definitions/lsystem-definition-schema.json')
      ]).subscribe({
        next: (results) => {

          const schema = results[1];
          const data = results[0];

          /**
           * start validation; if parts of a definition is missing, apply the given default value.
           */
          const ajv = new Ajv2020({useDefaults: true});
          const validator = ajv.compile(schema);
          const isJSONValid = validator(data);

          if (isJSONValid) {
            const items = new Array<LSystemCalculator>();
            data.forEach((sys: LSystemJSONParameters) => {
              const newSystem = new LSystemCalculator(sys.systemName, OriginPositionsEnum.CENTER);
              newSystem.initFromParametersObject(sys);
              items.push(newSystem);
            });
            items.sort((sys1, sys2) => sys1.systemName.localeCompare(sys2.systemName));
            subscriber.next(items);

          } else {
            const firstError = validator.errors ? validator.errors[0] : undefined;
            if (firstError) {
              subscriber.error(`Invalid JSON : ${firstError.message}`);
            } else {
              subscriber.error(`Unknown JSON Validation error`);
            }
          }
        },
        error: (err: HttpErrorResponse) => {
          subscriber.error(err.message);
        }

      });
    });
  }

  /*createJSON() {
    this.allSystems = new Array<LSystemCalculator>();

    let oneLsystem = new LSystemCalculator('bushy cactus tree', OriginPositionsEnum.CenterBottom);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addVariableSimple('Y');
    oneLsystem.addRule('X=X[-FFF][+FFF]FX');
    oneLsystem.addRule('Y=YFX[+Y][-Y]');
    oneLsystem.setAxiom('Y');
    oneLsystem.lineLength = 5;
    oneLsystem.rotationAngle = 25.7;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('squares', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addRule('F=FF+F-F+F+FF');
    oneLsystem.setAxiom('F+F+F+F');
    oneLsystem.lineLength = 20;
    oneLsystem.rotationAngle = 90;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('Fractal tree', OriginPositionsEnum.CenterBottom);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addRule('X= >[-FX]+FX');
    oneLsystem.setAxiom('FX');
    oneLsystem.lineLength = 200;
    oneLsystem.rotationAngle = 40;
    oneLsystem.lineLengthMultiplier = 0.5;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('plant left oriented', OriginPositionsEnum.BottomRight);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addRule('X=F-[[X]+X]+F[+FX]-X');
    oneLsystem.addRule('F=FF');
    oneLsystem.setAxiom('X');
    oneLsystem.lineLength = 5;
    oneLsystem.rotationAngle = 22.5;
    oneLsystem.startGeneration(5);
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('square sierpinski', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addRule('X=XF-F+F-XF+F+XF-F+F-X');
    oneLsystem.setAxiom('F+XF+F+XF');
    oneLsystem.lineLength = 10;
    oneLsystem.rotationAngle = 90;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('??', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addRule('F=F+F-F-FF+F+F-F');
    oneLsystem.setAxiom('F+F+F+F');
    oneLsystem.lineLength = 5;
    oneLsystem.rotationAngle = 90;
    oneLsystem.startGeneration(5);
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('triangles', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addRule('F=F-F+F');
    oneLsystem.setAxiom('F+F+F');
    oneLsystem.lineLength = 20;
    oneLsystem.rotationAngle = 120;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('Peano Curve', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addVariableSimple('Y');
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addRule('X=XFYFX+F+YFXFY-F-XFYFX');
    oneLsystem.addRule('Y=YFXFY-F-XFYFX+F+YFXFY');
    oneLsystem.setAxiom('X');
    oneLsystem.lineLength = 5;
    oneLsystem.rotationAngle = 90;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('Sierpinski Arrowhead', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableObject(new LSystemVariable('F', true));
    oneLsystem.addVariableObject(new LSystemVariable('X', false));
    oneLsystem.addVariableObject(new LSystemVariable('Y', false));
    oneLsystem.addRule('X=YF+XF+Y');
    oneLsystem.addRule('Y=XF-YF-X');
    oneLsystem.setAxiom('YF');
    oneLsystem.lineLength = 10;
    oneLsystem.startingAngle = 0;
    oneLsystem.rotationAngle = 60;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('Hilbert curve', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addVariableSimple('Y');
    oneLsystem.addRule('X=-YF+XFX+FY-');
    oneLsystem.addRule('Y=+XF-YFY-FX+');
    oneLsystem.setAxiom('X');
    oneLsystem.lineLength = 10;
    oneLsystem.rotationAngle = 90;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('Quadratic Snowflake variant B', OriginPositionsEnum.CENTER);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addRule('F=F+F-F-F+F');
    oneLsystem.setAxiom('FF+FF+FF+FF');
    oneLsystem.lineLength = 3;
    oneLsystem.rotationAngle = 90;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('Quadratic Gosper', OriginPositionsEnum.BottomLeft);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('X');
    oneLsystem.addVariableSimple('Y');
    oneLsystem.addRule('X=XFX-YF-YF+FX+FX-YF-YFFX+YF+FXFXYF-FX+YF+FXFX+YF-FXYF-YF-FX+FX+YFYF-');
    oneLsystem.addRule('Y=+FXFX-YF-YF+FX+FXYF+FX-YFYF-FX-YF+FXYFYF-FX-YFFX+FX+YF-YF-FX+FX+YFY');
    oneLsystem.setAxiom('-YF');
    oneLsystem.lineLength = 5;
    oneLsystem.rotationAngle = 90;
    this.allSystems.push(oneLsystem);

    oneLsystem = new LSystemCalculator('L-system leaf', OriginPositionsEnum.CenterBottom);
    oneLsystem.addVariableSimple('F', true);
    oneLsystem.addVariableSimple('x');
    oneLsystem.addVariableSimple('y');
    oneLsystem.addVariableSimple('a');
    oneLsystem.addVariableSimple('b');
    oneLsystem.addRule('F=>F<');
    oneLsystem.addRule('a=F[+x]Fb');
    oneLsystem.addRule('b=F[-y]Fa');
    oneLsystem.addRule('x=a');
    oneLsystem.addRule('y=b');
    oneLsystem.setAxiom('a');
    oneLsystem.lineLength = 10;
    oneLsystem.rotationAngle = 30;
    oneLsystem.startingAngle = 90;
    oneLsystem.lineLengthMultiplier = 0.5;
    this.allSystems.push(oneLsystem);

    const json_list = this.allSystems.map(LSystemComponentScalableVectorGraphicsRenderer => LSystemComponentScalableVectorGraphicsRenderer.createParameterObject());

    const json = JSON.stringify(json_list);
    console.log(json);

    return this.allSystems;

  }*/

  createCoordinateForCanvas2d(): CarthesianCoordinates2d {
    return new CarthesianCoordinates2d(0,0,800,800);
  }

  setOriginFromForm(shortname: string) {
    this.resetZoom();
    const coords = this.createCoordinateForCanvas2d();
    switch (shortname) {
      case 'TL':
        coords.setOriginTopLeft(1, 1);
        this.lsystem.OriginPosition = OriginPositionsEnum.TopLeft;
        break;
      case 'TC':
        coords.setOriginCenterTop(1);
        this.lsystem.OriginPosition = OriginPositionsEnum.CenterTop;
        break;
      case 'TR':
        coords.setOriginTopRight(1, 1);
        this.lsystem.OriginPosition = OriginPositionsEnum.TopRight;
        break;
      case 'C':
        coords.setOrigin(0, 0);
        this.lsystem.OriginPosition = OriginPositionsEnum.CENTER;
        break;
      case 'LC':
        coords.setOriginCenterLeft(1);
        this.lsystem.OriginPosition = OriginPositionsEnum.CenterLeft;
        break;
      case 'RC':
        coords.setOriginCenterRight(1);
        this.lsystem.OriginPosition = OriginPositionsEnum.CenterRight;
        break;
      case 'BL':
        coords.setOriginBottomLeft(1, 1);
        this.lsystem.OriginPosition = OriginPositionsEnum.BottomLeft;
        break;
      case 'BC':
        coords.setOriginCenterBottom(0);
        this.lsystem.OriginPosition = OriginPositionsEnum.CenterBottom;
        break;
      case 'BR':
        coords.setOriginBottomRight(1, 1);
        this.lsystem.OriginPosition = OriginPositionsEnum.BottomRight;
        break;
    }
    const newX = coords.OriginX;
    const newY = coords.OriginY;

    this.setOriginInForm(new Point(newX, newY));
    this.lsystem.OriginCoordinates2d = new Point(newX, newY);
  }

  setOriginFromPosition(positionType: OriginPositionsEnum) {
    const coords = this.createCoordinateForCanvas2d();

    switch (positionType) {
      case OriginPositionsEnum.TopLeft:
        coords.setOriginTopLeft(1, 1);
        break;
      case OriginPositionsEnum.CenterTop:
        coords.setOriginCenterTop(1);
        break;
      case OriginPositionsEnum.TopRight:
        coords.setOriginTopRight(1, 1);
        break;
      case OriginPositionsEnum.CENTER:
        coords.setOrigin(0, 0);
        break;
      case OriginPositionsEnum.CenterLeft:
        coords.setOriginCenterLeft(1);
        break;
      case OriginPositionsEnum.CenterRight:
        coords.setOriginCenterRight(1);
        break;
      case OriginPositionsEnum.BottomLeft:
        coords.setOriginBottomLeft(1, 1);
        break;
      case OriginPositionsEnum.CenterBottom:
        coords.setOriginCenterBottom(0);
        break;
      case OriginPositionsEnum.BottomRight:
        coords.setOriginBottomRight(1, 1);
        break;
      case OriginPositionsEnum.UseCoordinates:
        coords.setOrigin(this.lsystem.OriginCoordinates2d.x, this.lsystem.OriginCoordinates2d.y);
        break;
    }
    const newX = coords.OriginX;
    const newY = coords.OriginY;
    this.originX?.setValue(newX);
    this.originY?.setValue(newY);

    this.lsystem.OriginCoordinates2d = new Point(newX, newY);
  }


  decreaseIteration(): void {
    if (this.nrOfIterations !== null && this.nrOfIterations.value > 1) {
      this.nrOfIterations.setValue(this.nrOfIterations.value - 1);
    }
  }

  increaseIteration(): void {
    if (this.nrOfIterations !== null) {
      this.nrOfIterations.setValue(this.nrOfIterations.value + 1);
    }
  }

  changeLineLength(amount: number): void {
    if (this.lineLength !== null) {
      let newValue = this.lineLength.value + amount;

      newValue = Math.max(0, Math.min(500, newValue));
      this.lineLength.setValue(newValue);
    }
  }

  changeRotationAngle(amount: number): void {
    if (this.rotationAngle !== null) {
      let newValue = this.rotationAngle.value + amount;

      newValue = Math.max(-180, Math.min(180, newValue));
      this.rotationAngle.setValue(newValue);
    }
  }

  changeStartAngle(amount: number): void {
    if (this.startAngle !== null) {
      let newValue = this.startAngle.value + amount;

      newValue = Math.max(-180, Math.min(180, newValue));
      this.startAngle.setValue(newValue);
    }
  }

  changeLineLengthMultiplier(amount: number): void {
    if (this.lengthMultiplier !== null) {
      let newValue = this.lengthMultiplier.value + amount;

      newValue = Math.max(0.01, Math.min(30, newValue)) * 10;

      if (amount < 0) {
        newValue = Math.floor(newValue) / 10;
      } else {
        newValue = Math.ceil(newValue) / 10;
      }

      if (newValue < 0.01) {
        newValue = 0.01;
      }
      this.lengthMultiplier.setValue(newValue);
    }
  }

  cangeLineThickness(amount: number): void {
    if (this.lineThickness3d !== null){
      let newValue = this.lineThickness3d.value + amount;
      newValue = Math.max(1,Math.min(32, newValue));
      this.lineThickness3d.setValue(newValue);
    }
  }

  reset3dCamera(): void {
    this.threeJSRenderer.resetCameraPosition();
  }

}


