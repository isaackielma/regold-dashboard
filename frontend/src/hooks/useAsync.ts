import { useState, useCallback, useEffect } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  const run = useCallback(() => {
    setState({ data: null, loading: true, error: null });
    fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { ...state, reload: run };
}
