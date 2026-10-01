import { useEffect, useState, useCallback } from "react";

export const usePersistState = <T>(
  key: string,
  initialValue: T | (() => T)
) => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  const setValue = useCallback((value: T | ((prevState: T) => T)) => {
    setState(currentState => {
      const newValue = value instanceof Function ? value(currentState) : value;
      
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
      
      return newValue;
    });
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state]);

  return [state, setValue] as const;
};
