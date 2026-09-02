import { TestBed } from '@angular/core/testing';
import { OrderAdmin } from './order-admin';

describe('OrderAdmin', () => {
  let service: OrderAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
