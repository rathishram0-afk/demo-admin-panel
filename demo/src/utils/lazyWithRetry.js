import { lazy } from 'react';

/**
 * Utility to wrap React.lazy with auto-retry and cache-invalidation reload
 * when a dynamically imported JS chunk fails to fetch after a new deployment.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('retry-lazy-refreshed') === 'true';

    try {
      const component = await componentImport();
      sessionStorage.setItem('retry-lazy-refreshed', 'false');
      return component;
    } catch (error) {
      console.error('Dynamic import failed loading module chunk:', error);
      const errStr = error?.toString?.() || '';
      const isImportError =
        error?.name === 'ChunkLoadError' ||
        errStr.includes('Failed to fetch dynamically imported module') ||
        errStr.includes('Importing a module script failed') ||
        error?.message?.includes('import');

      if (isImportError && !pageHasBeenRefreshed) {
        sessionStorage.setItem('retry-lazy-refreshed', 'true');
        window.location.reload(true);
        return new Promise(() => {});
      }
      throw error;
    }
  });
}
