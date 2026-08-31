import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductSheet } from './product-sheet';

describe('ProductSheet', () => {
  let component: ProductSheet;
  let fixture: ComponentFixture<ProductSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSheet],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
