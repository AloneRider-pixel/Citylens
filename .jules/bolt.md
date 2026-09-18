## 2025-03-01 - Optimization of POI computations in LandmarkMapView
**Learning:** Iterating through POI categories using `.filter()` for each category (which was done 4 times in `LandmarkMapView.tsx`) is an O(n) operation per filter, adding up. In large data fetches with unmemoized rendering, this triggers O(n) multiple times every re-render.
**Action:** Replaced multiple `.filter()` calls with a single iteration pass counting categories in `useMemo`. Memoized computations such as `filteredPOIs` inside `useMemo` to prevent these arrays from being reconstructed on every frame render when resizing the map or selecting POIs.

## 2023-10-25 - Optimization of stats computation in Modals
**Learning:** Performing multiple iterations (like O(n) array `.map`, `.reduce` or `new Set`) on arrays inside a render function leads to redundant work on each re-render, even if the source data hasn't changed.
**Action:** Wrapped these modal statistics calculations inside `useMemo` so they're only computed once when the data (`savedTours`) changes. I also reduced multiple iterations of the array to a single loop.

## 2023-10-25 - Optimization of static components re-rendering
**Learning:** In a single-page app where modals or global state changes frequently (like `isPassportOpen` in `App.tsx`), heavy components like map views (`LandmarkMapView`), complex tabs (`LandmarkHistoryView`), and quizzes (`LandmarkChallengeQuiz`) will unnecessarily re-render on every state toggle, even when their props haven't changed. This can cause UI stutter.
**Action:** Wrapped these heavy, leaf-node components in `React.memo` since they only depend on stable props (`recognition` and `history` objects) and don't need to update when sibling state changes.
