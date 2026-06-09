export function getCurrentUser(_req, res) {
  res.status(200).json({
    id: 'mock-user-001',
    name: 'Demo User',
    roles: ['admin']
  });
}
