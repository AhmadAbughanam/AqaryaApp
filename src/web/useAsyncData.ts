import {useCallback, useEffect, useState, type DependencyList} from 'react';

export interface AsyncData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  dependencies: DependencyList = [],
): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then(result => {
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Unable to load data.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [...dependencies, revision]);

  return {data, error, loading, refresh};
}
