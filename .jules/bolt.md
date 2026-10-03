## 2025-03-01 - Optimization of POI computations in LandmarkMapView
**Learning:** Iterating through POI categories using `.filter()` for each category (which was done 4 times in `LandmarkMapView.tsx`) is an O(n) operation per filter, adding up. In large data fetches with unmemoized rendering, this triggers O(n) multiple times every re-render.
**Action:** Replaced multiple `.filter()` calls with a single iteration pass counting categories in `useMemo`. Memoized computations such as `filteredPOIs` inside `useMemo` to prevent these arrays from being reconstructed on every frame render when resizing the map or selecting POIs.

## 2023-10-25 - Optimization of stats computation in Modals
**Learning:** Performing multiple iterations (like O(n) array `.map`, `.reduce` or `new Set`) on arrays inside a render function leads to redundant work on each re-render, even if the source data hasn't changed.
**Action:** Wrapped these modal statistics calculations inside `useMemo` so they're only computed once when the data (`savedTours`) changes. I also reduced multiple iterations of the array to a single loop.

## 2023-11-04 - Optimization of high-frequency 3D render loops in VR components
**Learning:** Re-computing and re-mapping arrays to generate complex 3D CSS structures (like VR panaroma meshes or compass dials) inside the render loop causes significant layout thrashing when the parent component updates at 60FPS (e.g., via device gyroscope `pitch`/`yaw`). Even if the data doesn't change, React rebuilds the deep div tree inline.
**Action:** Extract fully static elements (like compass degree tapes) outside the component completely. For dynamic but low-frequency updating 3D meshes (like the cylinder projection that only depends on `imageSrc` and constant panels), wrap them in `useMemo` so the 3D element tree is only built once, saving immense diffing costs during high-FPS camera rotations.

## 2025-03-01 - Optimization of high-frequency mouse events in ARViewfinder
**Learning:** High-frequency input events like `mousemove` triggering React state updates (`setState`) in complex components cause significant layout thrashing and performance bottlenecks, as the entire component tree re-renders on every pixel move.
**Action:** Replaced the `tilt` state with a `useRef` pointing to the parallax container, and updated the DOM directly via `parallaxRef.current.style.transform` inside the event handler. This bypasses the React render cycle completely for hover effects, ensuring smooth 60fps performance without re-rendering the heavy AR component.
