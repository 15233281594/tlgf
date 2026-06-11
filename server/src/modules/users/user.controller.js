// 提供用户模块示例接口，后续可替换为真实用户业务。
export function getCurrentUser(_req, res) {
  res.status(200).json({
    id: 'mock-user-001',
    name: 'Demo User',
    roles: ['admin']
  });
}
