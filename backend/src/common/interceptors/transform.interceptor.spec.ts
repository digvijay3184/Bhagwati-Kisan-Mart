import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('TransformInterceptor (PRD Section 2.4 Consistent Envelope)', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap response data in { success: true, data, error: null }', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of({ id: '123', name: 'Chlorpyrifos' }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { id: '123', name: 'Chlorpyrifos' },
        error: null,
      });
      done();
    });
  });

  it('should handle undefined or null data by setting data to null', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of(undefined),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
        error: null,
      });
      done();
    });
  });

  it('should not double-wrap if response already has success flag', (done) => {
    const mockContext = {} as ExecutionContext;
    const existing = { success: true, data: [1, 2, 3], error: null };
    const mockCallHandler: CallHandler = {
      handle: () => of(existing),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(existing);
      done();
    });
  });
});
