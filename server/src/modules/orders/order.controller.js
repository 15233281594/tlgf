// 提供后台订单列表、订单详情和订单履约处理接口。
import { HttpError } from '../../core/errors.js';
import { auditActions } from '../audit/audit.actions.js';
import { recordAuditLog } from '../audit/audit.service.js';
import {
  findAdminOrderById,
  listAdminOrders,
  updateAdminOrderNote,
  updateAdminOrderPaymentStatus
} from './order.repository.js';

const paymentStatuses = new Set(['pending', 'reviewing', 'paid', 'rejected', 'cancelled']);

function normalizePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize ?? query.limit ?? '10', 10) || 10));

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize
  };
}

function normalizeKeyword(keyword) {
  if (typeof keyword !== 'string') {
    return '';
  }

  return keyword.trim().slice(0, 64);
}

function normalizePaymentStatus(paymentStatus, { allowEmpty = false } = {}) {
  if (allowEmpty && (!paymentStatus || paymentStatus === 'all')) {
    return '';
  }

  if (typeof paymentStatus !== 'string' || !paymentStatuses.has(paymentStatus)) {
    throw new HttpError(400, '无效的支付状态');
  }

  return paymentStatus;
}

function normalizeNote(note) {
  if (typeof note !== 'string') {
    return '';
  }

  return note.trim().slice(0, 2000);
}

function readOrderId(req) {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '无效的订单 ID');
  }

  return id;
}

function orderSnapshot(order) {
  return {
    id: order.id,
    orderNo: order.orderNo,
    customerName: order.customerName,
    serviceType: order.serviceType,
    amountCents: order.amountCents,
    paymentStatus: order.paymentStatus,
    note: order.note
  };
}

async function findOrderOrThrow(id) {
  const order = await findAdminOrderById(id);

  if (!order) {
    throw new HttpError(404, '订单不存在');
  }

  return order;
}

export async function listOrders(req, res) {
  const pagination = normalizePagination(req.query);
  const paymentStatus = normalizePaymentStatus(req.query.paymentStatus, { allowEmpty: true });
  const result = await listAdminOrders({
    keyword: normalizeKeyword(req.query.keyword),
    paymentStatus,
    limit: pagination.limit,
    offset: pagination.offset
  });

  res.status(200).json({
    orders: result.orders,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.total
    }
  });
}

export async function getOrderDetail(req, res) {
  const order = await findOrderOrThrow(readOrderId(req));

  res.status(200).json({
    order
  });
}

export async function updateOrderPaymentStatus(req, res) {
  const id = readOrderId(req);
  const order = await findOrderOrThrow(id);
  const paymentStatus = normalizePaymentStatus(req.body?.paymentStatus);
  const updatedOrder = await updateAdminOrderPaymentStatus(id, paymentStatus);

  await recordAuditLog(req, {
    action: auditActions.orderPaymentStatusUpdate,
    targetType: 'order',
    targetId: updatedOrder.orderNo,
    targetLabel: updatedOrder.orderNo,
    detail: {
      before: orderSnapshot(order),
      after: orderSnapshot(updatedOrder)
    }
  });

  res.status(200).json({
    order: updatedOrder
  });
}

export async function updateOrderNote(req, res) {
  const id = readOrderId(req);
  const order = await findOrderOrThrow(id);
  const note = normalizeNote(req.body?.note);
  const updatedOrder = await updateAdminOrderNote(id, note);

  await recordAuditLog(req, {
    action: auditActions.orderNoteUpdate,
    targetType: 'order',
    targetId: updatedOrder.orderNo,
    targetLabel: updatedOrder.orderNo,
    detail: {
      before: {
        note: order.note
      },
      after: {
        note: updatedOrder.note
      }
    }
  });

  res.status(200).json({
    order: updatedOrder
  });
}
