import { TestBed } from '@angular/core/testing';
import { AuditLogAdmin } from './audit-log-admin';

describe('AuditLogAdmin', () => {
  let service: AuditLogAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditLogAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
