import { createRequestCoordinator, RequestTimeoutError, withRequestTimeout } from '@/lib/request';

describe('request stability', () => {
  afterEach(() => jest.useRealTimers());

  test('deduplicates concurrent requests and caches successful detail data', async () => {
    const coordinator = createRequestCoordinator<string>(1000);
    const task = jest.fn(async () => 'club');
    const [first, second] = await Promise.all([
      coordinator.run('slug', task),
      coordinator.run('slug', task),
    ]);
    expect([first, second]).toEqual(['club', 'club']);
    expect(task).toHaveBeenCalledTimes(1);
    await coordinator.run('slug', task);
    expect(task).toHaveBeenCalledTimes(1);
  });

  test('releases failed requests so retry can run', async () => {
    const coordinator = createRequestCoordinator<string>();
    const task = jest.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('recovered');
    await expect(coordinator.run('list', task)).rejects.toThrow('offline');
    await expect(coordinator.run('list', task)).resolves.toBe('recovered');
  });

  test('bounds cached detail entries', async () => {
    const coordinator = createRequestCoordinator<string>(1000, 2);
    const task = jest.fn(async () => 'club');
    await coordinator.run('a', task);
    await coordinator.run('b', task);
    await coordinator.run('c', task);
    await coordinator.run('a', task);
    expect(task).toHaveBeenCalledTimes(4);
  });

  test('aborts and rejects a request that exceeds its deadline', async () => {
    jest.useFakeTimers();
    const request = withRequestTimeout(
      (signal) => new Promise<string>((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
      100,
    );
    const expectation = expect(request).rejects.toBeInstanceOf(RequestTimeoutError);
    await jest.advanceTimersByTimeAsync(101);
    await expectation;
  });
});
