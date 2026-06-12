// 定义后台菜单的 Sequelize 模型。
import { DataTypes } from 'sequelize';

export function initMenuModels(sequelize) {
  const AdminMenu = sequelize.define(
    'AdminMenu',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      parentId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        field: 'parent_id'
      },
      menuKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'menu_key'
      },
      title: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      menuType: {
        type: DataTypes.ENUM('domain', 'menu'),
        allowNull: false,
        defaultValue: 'menu',
        field: 'menu_type'
      },
      icon: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      routeName: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'route_name'
      },
      permissionKey: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'permission_key'
      },
      groupTitle: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'group_title'
      },
      badge: {
        type: DataTypes.STRING(32),
        allowNull: true
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order'
      },
      isVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_visible'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      }
    },
    {
      tableName: 'admin_menus',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return {
    AdminMenu
  };
}

export function associateMenuModels({ AdminMenu }) {
  AdminMenu.hasMany(AdminMenu, {
    as: 'children',
    foreignKey: 'parentId'
  });

  AdminMenu.belongsTo(AdminMenu, {
    as: 'parent',
    foreignKey: 'parentId'
  });
}
