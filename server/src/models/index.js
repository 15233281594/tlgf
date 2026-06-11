// 统一初始化并注册所有 Sequelize 模型和模型关联。
import { getSequelize } from '../db/sequelize.js';
import { associateAuthModels, initAuthModels } from '../modules/auth/auth.model.js';

let models;

export function getModels() {
  if (!models) {
    const sequelize = getSequelize();
    const authModels = initAuthModels(sequelize);

    associateAuthModels(authModels);

    models = {
      ...authModels
    };
  }

  return models;
}

export async function authenticateModels() {
  getModels();
  await getSequelize().authenticate();
}
