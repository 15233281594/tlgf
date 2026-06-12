import { apiClient, request } from '../utils/http'
import type {
  OrderDetailResponse,
  OrderListResponse,
  PaymentStatus,
  UpdateOrderNotePayload,
  UpdateOrderPaymentStatusPayload
} from '../types/order'

export function getAdminOrders(params: {
  page?: number
  pageSize?: number
  keyword?: string
  paymentStatus?: PaymentStatus | 'all'
} = {}) {
  return request<OrderListResponse>(apiClient.get('/admin/orders', { params }))
}

export function getAdminOrderDetail(id: number) {
  return request<OrderDetailResponse>(apiClient.get(`/admin/orders/${id}`))
}

export function updateAdminOrderPaymentStatus(id: number, payload: UpdateOrderPaymentStatusPayload) {
  return request<OrderDetailResponse>(apiClient.patch(`/admin/orders/${id}/payment-status`, payload))
}

export function updateAdminOrderNote(id: number, payload: UpdateOrderNotePayload) {
  return request<OrderDetailResponse>(apiClient.patch(`/admin/orders/${id}/note`, payload))
}
