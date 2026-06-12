// 统一初始化并注册所有 Sequelize 模型和模型关联。
import { getSequelize } from '../db/sequelize.js';
import { initAuditModels } from '../modules/audit/audit.model.js';
import { associateAuthModels, initAuthModels } from '../modules/auth/auth.model.js';
import { associateMenuModels, initMenuModels } from '../modules/menus/menu.model.js';
import { initOrderModels } from '../modules/orders/order.model.js';
import { associateRoleModels, initRoleModels } from '../modules/roles/role.model.js';

let models;

export function getModels() {
  if (!models) {
    const sequelize = getSequelize();
    const auditModels = initAuditModels(sequelize);
    const authModels = initAuthModels(sequelize);
    const menuModels = initMenuModels(sequelize);
    const orderModels = initOrderModels(sequelize);
    const roleModels = initRoleModels(sequelize);

    associateAuthModels(authModels);
    associateMenuModels(menuModels);
    associateRoleModels(roleModels);

    models = {
      ...auditModels,
      ...authModels,
      ...menuModels,
      ...orderModels,
      ...roleModels
    };
  }

  return models;
}

export async function authenticateModels() {
  getModels();
  await getSequelize().authenticate();
}
