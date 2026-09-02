import { TestBed } from '@angular/core/testing';
import { RestaurantProfile } from './restaurant-profile';

describe('RestaurantProfile', () => {
  let service: RestaurantProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestaurantProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
