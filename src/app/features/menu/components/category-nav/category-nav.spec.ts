import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryNav } from './category-nav';

describe('CategoryNav', () => {
  let component: CategoryNav;
  let fixture: ComponentFixture<CategoryNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryNav],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
