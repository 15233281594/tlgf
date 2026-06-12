export type PaymentStatus = 'pending' | 'reviewing' | 'paid' | 'rejected' | 'cancelled'

export type AdminOrder = {
  id: number
  orderNo: string
  customerName: string | null
  contactType: 'wechat' | 'qq' | 'phone' | 'other'
  contactValue: string | null
  serviceType: string
  currentRank: string | null
  targetRank: string | null
  amountCents: number
  paymentStatus: PaymentStatus
  paymentScreenshotKey: string | null
  note: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type OrderPagination = {
  page: number
  pageSize: number
  total: number
}

export type OrderListResponse = {
  orders: AdminOrder[]
  pagination: OrderPagination
}

export type OrderDetailResponse = {
  order: AdminOrder
}

export type UpdateOrderPaymentStatusPayload = {
  paymentStatus: PaymentStatus
}

export type UpdateOrderNotePayload = {
  note: string
}
