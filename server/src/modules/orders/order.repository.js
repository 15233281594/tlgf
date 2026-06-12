// 封装后台订单履约的数据查询和写入逻辑。
import { Op, fn, col } from 'sequelize';
import { getModels } from '../../models/index.js';

const orderAttributes = [
  'id',
  'orderNo',
  'customerName',
  'contactType',
  'contactValue',
  'serviceType',
  'currentRank',
  'targetRank',
  'amountCents',
  'paymentStatus',
  'paymentScreenshotKey',
  'note',
  'created_at',
  'updated_at'
];

function toAdminOrder(order) {
  if (!order) {
    return null;
  }

  const data = order.get({ plain: true });

  return {
    id: data.id,
    orderNo: data.orderNo,
    customerName: data.customerName,
    contactType: data.contactType,
    contactValue: data.contactValue,
    serviceType: data.serviceType,
    currentRank: data.currentRank,
    targetRank: data.targetRank,
    amountCents: data.amountCents,
    paymentStatus: data.paymentStatus,
    paymentScreenshotKey: data.paymentScreenshotKey,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

function buildOrderWhere({ keyword, paymentStatus }) {
  const where = {};
  const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : '';

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (normalizedKeyword) {
    where[Op.or] = [
      { orderNo: { [Op.like]: `%${normalizedKeyword}%` } },
      { customerName: { [Op.like]: `%${normalizedKeyword}%` } },
      { contactValue: { [Op.like]: `%${normalizedKeyword}%` } },
      { serviceType: { [Op.like]: `%${normalizedKeyword}%` } }
    ];
  }

  return where;
}

export async function listAdminOrders({ keyword = '', paymentStatus = '', limit = 10, offset = 0 } = {}) {
  const { Order } = getModels();
  const { count, rows } = await Order.findAndCountAll({
    attributes: orderAttributes,
    where: buildOrderWhere({ keyword, paymentStatus }),
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC']
    ],
    limit,
    offset
  });

  return {
    total: count,
    orders: rows.map(toAdminOrder)
  };
}

export async function getOrderDashboardStats() {
  const { Order } = getModels();
  const rows = await Order.findAll({
    attributes: ['paymentStatus', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount_cents')), 'amountCents']],
    group: ['paymentStatus']
  });
  const stats = {
    total: 0,
    totalAmountCents: 0,
    pending: 0,
    reviewing: 0,
    paid: 0,
    rejected: 0,
    cancelled: 0
  };

  rows.forEach((row) => {
    const data = row.get({ plain: true });
    const count = Number(data.count) || 0;
    const amountCents = Number(data.amountCents) || 0;

    stats.total += count;
    stats.totalAmountCents += amountCents;

    if (Object.prototype.hasOwnProperty.call(stats, data.paymentStatus)) {
      stats[data.paymentStatus] = count;
    }
  });

  return stats;
}

export async function listRecentAdminOrders(limit = 5) {
  const { Order } = getModels();
  const orders = await Order.findAll({
    attributes: orderAttributes,
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC']
    ],
    limit
  });

  return orders.map(toAdminOrder);
}

export async function findAdminOrderById(id) {
  const { Order } = getModels();
  const order = await Order.findByPk(id, {
    attributes: orderAttributes
  });

  return toAdminOrder(order);
}

export async function updateAdminOrderPaymentStatus(id, paymentStatus) {
  const { Order } = getModels();

  await Order.update(
    {
      paymentStatus
    },
    {
      where: {
        id
      }
    }
  );

  return findAdminOrderById(id);
}

export async function updateAdminOrderNote(id, note) {
  const { Order } = getModels();

  await Order.update(
    {
      note
    },
    {
      where: {
        id
      }
    }
  );

  return findAdminOrderById(id);
}
