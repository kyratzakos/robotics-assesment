# Code Review & Debugging - Router Cache Update (Part 3)

This README summarizes the review of the reducer snippet (found in [original.js](./original.js)) that updates the Next.js router cache after a server action, plus a suggested fix.

## Key Findings

1. Overwriting the cache breaks referential sharing

    Building a brand-new cache node and assigning it to `mutable.cache` invalidates unchanged branches, causing unnecessary re-renders and lost memoization.

2. Refresh invoked with an incomplete cache

    `refreshInactiveParallelSegments` is given a newly created node, not the merged cache, so it under-refreshes and can drop parallel segments.

3. Brittle seed indexing

    Using `seedData[1]`, `seedData[3]` without guarding shape can assign `undefined` or wrong types.

4. Unconditional prefetch cache reset

    Clearing `prefetchCache` every time discards useful prefetches when no revalidation occurred.

## Goals of the Fix

- Preserve structural sharing of the cache
- Ensure refresh sees the merged cache and the updated tree
- Reset prefetch cache only when revalidation actually happened

## Corrected Snippet

Code can be found inside [new.js](./new.js)

## Why This Works Better

- Structural sharing preserved: clone-and-patch keeps references for untouched branches, reducing re-renders
- Refresh correctness: refreshInactiveParallelSegments receives the updated, full cache alongside the new tree
- Smarter invalidation: prefetches are only cleared when revalidation happened, retaining useful warm data

## Potential Next Steps

- Replace deep clone with path-aware structural sharing for performance
- Add type definitions for seedData to eliminate magic indices