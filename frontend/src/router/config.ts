/**
 * React Router Configuration with Future Flags
 * Handles React Router v6+ configuration and future compatibility
 */

export const routerConfig = {
  // React Router v7 future flags
  future: {
    // Enable new data router features
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
};