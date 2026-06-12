// 定义后台管理员账号和登录会话的 Sequelize 模型。
import { DataTypes } from 'sequelize';

export function initAuthModels(sequelize) {
  const AdminUser = sequelize.define(
    'AdminUser',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
      },
      role: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: 'admin'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at'
      }
    },
    {
      tableName: 'admin_users',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  const AdminSession = sequelize.define(
    'AdminSession',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      adminUserId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'admin_user_id'
      },
      tokenHash: {
        type: DataTypes.CHAR(64),
        allowNull: false,
        unique: true,
        field: 'token_hash'
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
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at'
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at'
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_seen_at'
      }
    },
    {
      tableName: 'admin_sessions',
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  return {
    AdminSession,
    AdminUser
  };
}

export function associateAuthModels({ AdminSession, AdminUser }) {
  AdminUser.hasMany(AdminSession, {
    as: 'sessions',
    foreignKey: 'adminUserId'
  });

  AdminSession.belongsTo(AdminUser, {
    as: 'adminUser',
    foreignKey: 'adminUserId'
  });
}
