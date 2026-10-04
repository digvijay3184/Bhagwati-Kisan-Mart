import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware (PRD Section 2.5.9 Tracing)', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should generate a new request id if none is provided in headers', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(typeof req.headers['x-request-id']).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      req.headers['x-request-id'],
    );
    expect(next).toHaveBeenCalled();
  });

  it('should reuse existing x-request-id from incoming request', () => {
    const req: any = { headers: { 'x-request-id': 'client-provided-trace-id' } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe('client-provided-trace-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'client-provided-trace-id',
    );
    expect(next).toHaveBeenCalled();
  });
});
