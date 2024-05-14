import {Directive, DoCheck, ElementRef, HostListener, Input} from '@angular/core';
import {AbstractControl} from "@angular/forms";
import {FormErrorSupportService} from "../services/form-error-support.service";

@Directive({
  selector: '[FormError]',
  standalone: true
})
export class FormErrorDirective  implements  DoCheck {
  @Input() control: AbstractControl | undefined | null;
  @Input() name: string | undefined | null;

  @HostListener('change') logChange() {this.detectChanges(); }


  constructor(private el: ElementRef) {
    this.control = undefined;
    this.name = undefined;
  }

  detectChanges(): void {
    if (this.control?.invalid) {
      this.el.nativeElement.style.display = 'block';
      if (this.control && this.name) {
        this.el.nativeElement.innerHTML = FormErrorSupportService.report(this.control, this.name);
        this.el.nativeElement.classList.add('hasError');
      }
    }
    else {
      this.el.nativeElement.innerHTML = ''
      this.el.nativeElement.classList.remove('hasError');
    }

  }

  ngDoCheck(): void {
    this.detectChanges();
  }


}
