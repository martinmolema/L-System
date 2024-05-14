import { Injectable } from '@angular/core';
import {AbstractControl} from "@angular/forms";

@Injectable({
  providedIn: 'root'
})
export class FormErrorSupportService {

  constructor() {
  }

  public static report(control: AbstractControl, name: string): string {
    if (control === null) {
      return '';
    }
    if (control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return `Het veld ${name} mag niet leeg zijn.`;
    } else if (control.hasError('min') && control.errors!==null) {
      return `Het veld ${name} moet een minimale waarde van ${control.errors['min'].min} hebben.`;
    } else if (control.hasError('max') && control.errors!==null) {
      return `Het veld ${name} moet een maximale waarde van ${control.errors['max'].max} hebben.`;
    } else if (control.hasError('pattern')) {
      return `Het veld ${name} voldoet niet aan het gewenste patroon.`;
    } else if (control.hasError('maxlength') && control.errors!==null) {
      return `Het veld ${name} mag maximaal ${control.errors['maxlength'].requiredLength} tekens lang zijn.`;
    } else if (control.hasError('minlength') && control.errors!==null) {
      return `Het veld ${name} moet minimale lengte van ${control.errors['minlength'].requiredLength} tekens zijn.`;
    } else {
      return 'error?';
    }

  }



}
