import { useState, useCallback } from 'react';

export function useSearchbarVisibility() {
  const [isVisible, setIsVisible] = useState(true); 
  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []); 
  return { isVisible, show, hide };
}