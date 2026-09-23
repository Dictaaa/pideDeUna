import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BranchPicker } from './branch-picker';

describe('BranchPicker', () => {
  let component: BranchPicker;
  let fixture: ComponentFixture<BranchPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
