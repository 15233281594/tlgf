// 定义后台角色和角色权限的 Sequelize 模型。
import { DataTypes } from 'sequelize';

export function initRoleModels(sequelize) {
  const AdminRole = sequelize.define(
    'AdminRole',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      roleKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'role_key'
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_system'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order'
      }
    },
    {
      tableName: 'admin_roles',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  const AdminRolePermission = sequelize.define(
    'AdminRolePermission',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      roleKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'role_key'
      },
      permissionKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'permission_key'
      }
    },
    {
      tableName: 'admin_role_permissions',
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  return {
    AdminRole,
    AdminRolePermission
  };
}

export function associateRoleModels({ AdminRole, AdminRolePermission }) {
  AdminRole.hasMany(AdminRolePermission, {
    as: 'permissions',
    foreignKey: 'roleKey',
    sourceKey: 'roleKey'
  });

  AdminRolePermission.belongsTo(AdminRole, {
    as: 'role',
    foreignKey: 'roleKey',
    targetKey: 'roleKey'
  });
}
