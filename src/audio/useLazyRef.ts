import { useRef, type MutableRefObject } from 'react';

export default function useLazyRef<T>(init: () => T): MutableRefObject<T> {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = init();
  return ref as MutableRefObject<T>;
}
