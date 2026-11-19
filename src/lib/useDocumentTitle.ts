import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
}
