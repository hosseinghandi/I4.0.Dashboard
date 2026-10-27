import { requestJson, postJson } from '../services/http'
import type { ApiResult } from '../machines/types'
import type { ProductionArticle, ProductionArticleInput } from './types'

const base = '/api/production-articles'

export async function listProductionArticles(search: string): Promise<ProductionArticle[]> {
  const result = await requestJson<ApiResult<ProductionArticle[]>>(`${base}?search=${encodeURIComponent(search)}`)
  return result.data ?? []
}

export async function createProductionArticle(input: ProductionArticleInput): Promise<ProductionArticle> {
  const result = await postJson<ApiResult<ProductionArticle>>(base, input)
  return result.data as ProductionArticle
}

export async function updateProductionArticle(id: number, input: ProductionArticleInput): Promise<ProductionArticle> {
  const result = await requestJson<ApiResult<ProductionArticle>>(`${base}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return result.data as ProductionArticle
}

export async function deleteProductionArticle(id: number): Promise<void> {
  await requestJson<ApiResult<never>>(`${base}/${id}`, { method: 'DELETE' })
}
