// 定义后台审计日志的 Sequelize 模型。
import { DataTypes } from 'sequelize';

export function initAuditModels(sequelize) {
  const AdminAuditLog = sequelize.define(
    'AdminAuditLog',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      adminUserId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        field: 'admin_user_id'
      },
      adminEmail: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'admin_email'
      },
      adminName: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'admin_name'
      },
      action: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      targetType: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'target_type'
      },
      targetId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'target_id'
      },
      targetLabel: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'target_label'
      },
      detail: {
        type: DataTypes.JSON,
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'ip_address'
      },
      userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'user_agent'
      }
    },
    {
      tableName: 'admin_audit_logs',
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  return {
    AdminAuditLog
  };
}
