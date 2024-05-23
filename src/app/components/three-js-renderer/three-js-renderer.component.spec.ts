import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeJsRendererComponent } from './three-js-renderer.component';

describe('ThreeJsRendererComponent', () => {
  let component: ThreeJsRendererComponent;
  let fixture: ComponentFixture<ThreeJsRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeJsRendererComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThreeJsRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
