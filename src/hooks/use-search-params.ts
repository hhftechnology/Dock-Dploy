import { useState, useEffect, useCallback } from 'react';

export function useSearchParams() {
  const [searchParams, setSearchParamsState] = useState(
    new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    const handlePopState = () => {
      setSearchParamsState(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSearchParams = useCallback((newParams: Record<string, string> | URLSearchParams) => {
    const nextParams = new URLSearchParams(
      newParams instanceof URLSearchParams ? newParams : newParams
    );
    const newUrl = `${window.location.pathname}?${nextParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    setSearchParamsState(nextParams);
  }, []);

  return [searchParams, setSearchParams] as const;
}
