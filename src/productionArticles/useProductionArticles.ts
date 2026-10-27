import { useCallback, useEffect, useState } from 'react'
import { listProductionArticles } from './service'
import type { ProductionArticle } from './types'

const REFRESH_INTERVAL_MS = 3000

export function useProductionArticles(search: string) {
  const [productionArticles, setProductionArticles] = useState<ProductionArticle[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout>

    const load = async () => {
      try {
        const data = await listProductionArticles(search)
        if (!cancelled) {
          setProductionArticles(data)
          setError(null)
          setLoaded(true)
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Caricamento dei Production Article non riuscito.')
      } finally {
        if (!cancelled) timeout = setTimeout(() => void load(), REFRESH_INTERVAL_MS)
      }
    }

    void load()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [search, revision])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  return { productionArticles, error, loaded, refresh }
}
