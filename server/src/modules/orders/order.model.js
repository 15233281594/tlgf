// 定义订单履约的 Sequelize 模型。
import { DataTypes } from 'sequelize';

export function initOrderModels(sequelize) {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      orderNo: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        field: 'order_no'
      },
      customerName: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'customer_name'
      },
      contactType: {
        type: DataTypes.ENUM('wechat', 'qq', 'phone', 'other'),
        allowNull: false,
        defaultValue: 'wechat',
        field: 'contact_type'
      },
      contactValue: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'contact_value'
      },
      serviceType: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'service_type'
      },
      currentRank: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'current_rank'
      },
      targetRank: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'target_rank'
      },
      amountCents: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'amount_cents'
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'reviewing', 'paid', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'payment_status'
      },
      paymentScreenshotKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'payment_screenshot_key'
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'orders',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return {
    Order
  };
}
