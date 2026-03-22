import { useEffect, useRef } from 'react'

const useInfiniteScroll = ({ hasMore, isLoading, onLoadMore }) => {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { rootMargin: '300px 0px' },
    )

    observer.observe(sentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore])

  return sentinelRef
}

export default useInfiniteScroll
