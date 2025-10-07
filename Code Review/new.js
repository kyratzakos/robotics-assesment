// This code snippet is part of a reducer that runs after a server action.
// It receives the current state and new data from the server.
// 'mutable' is an object that will be used to construct the new router state.
// 'seedData' contains the new data fetched from the server.

if (seedData !== null) {
    const rsc = seedData[1]
    const newCacheNode = mutable.cache ? structuredClone(mutable.cache) : createEmptyCacheNode()
    newCacheNode.rsc = rsc
    newCacheNode.prefetchRsc = null
    newCacheNode.loading = seedData[3]

    fillLazyItemsTillLeafWithHead(now, newCacheNode, undefined, newTree, seedData, head, undefined)
   
    // If the server action caused a revalidation, we need to refresh other parts of the cache.
    if (revalidated) {
        refreshInactiveParallelSegments({
            navigatedAt: now,
            state: currentState,
            updatedTree: newTree,
            updatedCache: newCacheNode,
            includeNextUrl: !!nextUrl,
            canonicalUrl: mutable.canonicalUrl || currentState.canonicalUrl
        })

        if (mutable.prefetchCache?.clear){
            mutable.prefetchCache.clear()
        } else {
            mutable.prefetchCache = new Map()
        }
    } else {
        mutable.prefetchCache = mutable.prefetchCache ?? new Map()
    }

    mutable.cache = newCacheNode
}