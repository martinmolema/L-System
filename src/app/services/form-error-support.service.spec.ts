import { TestBed } from '@angular/core/testing';

import { FormErrorSupportService } from './form-error-support.service';

describe('FormErrorSupportService', () => {
  let service: FormErrorSupportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormErrorSupportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
