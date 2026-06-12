// 汇总并注册后端 API 路由。
import { Router } from 'express';
import {
  changeCurrentAdminPassword,
  getCurrentAdmin,
  login,
  logout,
  updateCurrentAdminProfile
} from '../modules/auth/auth.controller.js';
import { requireAdmin, requirePermission } from '../modules/auth/auth.middleware.js';
import { permissions } from '../modules/auth/permissions.js';
import { listAdminAuditLogs } from '../modules/audit/audit.controller.js';
import { getAdminDashboard } from '../modules/dashboard/dashboard.controller.js';
import { getHealth } from '../modules/health/health.controller.js';
import {
  createMember,
  listMembers,
  resetMemberPassword,
  updateMember,
  updateMemberStatus
} from '../modules/members/member.controller.js';
import {
  createMenu,
  getAdminNavigation,
  listMenuManagement,
  removeMenu,
  updateMenu
} from '../modules/menus/menu.controller.js';
import {
  getOrderDetail,
  listOrders,
  updateOrderNote,
  updateOrderPaymentStatus
} from '../modules/orders/order.controller.js';
import {
  createRole,
  listRoles,
  removeRole,
  updateRole,
  updateRolePermissionList
} from '../modules/roles/role.controller.js';
import { getCurrentUser } from '../modules/users/user.controller.js';

export const apiRouter = Router();

// 访问方式：GET http://localhost:9999/api/health
// 接口作用：服务健康检查，用来确认后端是否启动、当前环境信息、运行时长和数据库连接状态。
apiRouter.get('/health', getHealth);

// 访问方式：POST http://localhost:9999/api/auth/login
// 请求参数：JSON body { "email": "管理员邮箱", "password": "管理员密码" }
// 接口作用：后台管理员登录；账号密码验证成功后，后端会写入 HttpOnly Cookie 保存登录会话。
apiRouter.post('/auth/login', login);

// 访问方式：GET http://localhost:9999/api/auth/me
// 请求要求：浏览器需要自动携带登录后写入的 Cookie。
// 接口作用：查询当前后台管理员登录状态；已登录返回管理员信息，未登录返回 authenticated: false。
apiRouter.get('/auth/me', getCurrentAdmin);

// 访问方式：POST http://localhost:9999/api/auth/logout
// 请求要求：浏览器需要自动携带登录 Cookie。
// 接口作用：后台管理员退出登录；后端会注销数据库里的 session，并清除浏览器 Cookie。
apiRouter.post('/auth/logout', logout);

// 访问方式：PATCH http://localhost:9999/api/auth/profile
// 请求参数：JSON body { "name": "新的姓名" }
// 请求要求：必须登录后台。
// 接口作用：修改当前登录管理员自己的姓名；保存后返回最新当前账号信息。
apiRouter.patch('/auth/profile', requireAdmin, updateCurrentAdminProfile);

// 访问方式：PATCH http://localhost:9999/api/auth/password
// 请求参数：JSON body { "currentPassword": "当前密码", "newPassword": "新密码" }
// 请求要求：必须登录后台。
// 接口作用：当前登录管理员修改自己的密码；后端会校验当前密码，并加密保存新密码。
apiRouter.patch('/auth/password', requireAdmin, changeCurrentAdminPassword);

// 访问方式：GET http://localhost:9999/api/admin/navigation
// 请求要求：必须登录后台。
// 接口作用：根据当前管理员权限返回可见后台菜单树，前端左侧菜单由该接口渲染。
apiRouter.get('/admin/navigation', requireAdmin, getAdminNavigation);

// 访问方式：GET http://localhost:9999/api/admin/dashboard
// 请求要求：必须登录后台，并拥有 dashboard:view 权限。
// 接口作用：聚合业务工作台需要的订单统计、待办、最近订单、角色权限、菜单和审计日志数据。
apiRouter.get('/admin/dashboard', requirePermission(permissions.dashboardView), getAdminDashboard);

// 访问方式：GET http://localhost:9999/api/admin/orders?page=1&pageSize=10&keyword=客户&paymentStatus=pending
// 请求要求：必须登录后台，并拥有 order:read 权限。
// 接口作用：分页查询后台订单列表，支持订单号、客户、联系方式、服务类型关键词搜索和支付状态筛选。
apiRouter.get('/admin/orders', requirePermission(permissions.orderRead), listOrders);

// 访问方式：GET http://localhost:9999/api/admin/orders/:id
// 请求要求：必须登录后台，并拥有 order:read 权限。
// 接口作用：查询单个订单详情，用于后台订单详情弹窗和履约处理。
apiRouter.get('/admin/orders/:id', requirePermission(permissions.orderRead), getOrderDetail);

// 访问方式：PATCH http://localhost:9999/api/admin/orders/:id/payment-status
// 请求参数：JSON body { "paymentStatus": "pending|reviewing|paid|rejected|cancelled" }
// 请求要求：必须登录后台，并拥有 payment:review 权限。
// 接口作用：修改订单支付状态，适合财务审核收款凭证和金额后使用，并写入审计日志。
apiRouter.patch('/admin/orders/:id/payment-status', requirePermission(permissions.paymentReview), updateOrderPaymentStatus);

// 访问方式：PATCH http://localhost:9999/api/admin/orders/:id/note
// 请求参数：JSON body { "note": "履约备注" }
// 请求要求：必须登录后台，并拥有 order:manage 权限。
// 接口作用：保存订单履约备注，客服或运营处理订单时记录沟通、进度和异常情况。
apiRouter.patch('/admin/orders/:id/note', requirePermission(permissions.orderManage), updateOrderNote);

// 访问方式：GET http://localhost:9999/api/admin/roles
// 请求要求：必须登录后台，并拥有 permission:manage 权限。
// 接口作用：查询后台角色、权限点字典和角色拥有的权限，用于角色权限页面展示和授权。
apiRouter.get('/admin/roles', requirePermission(permissions.permissionManage), listRoles);

// 访问方式：POST http://localhost:9999/api/admin/roles
// 请求参数：JSON body { "key": "finance", "name": "财务", "description": "角色说明", "isActive": true, "sortOrder": 30 }
// 请求要求：必须登录后台，并拥有 permission:manage 权限。
// 接口作用：新增后台角色；新增后可继续调用授权接口为角色分配权限点。
apiRouter.post('/admin/roles', requirePermission(permissions.permissionManage), createRole);

// 访问方式：PATCH http://localhost:9999/api/admin/roles/:roleKey
// 请求参数：JSON body { "name": "角色名称", "description": "角色说明", "isActive": true, "sortOrder": 30 }
// 请求要求：必须登录后台，并拥有 permission:manage 权限。
// 接口作用：编辑后台角色基础信息；系统角色不能停用，已有成员占用的角色不能停用。
apiRouter.patch('/admin/roles/:roleKey', requirePermission(permissions.permissionManage), updateRole);

// 访问方式：PATCH http://localhost:9999/api/admin/roles/:roleKey/permissions
// 请求参数：JSON body { "permissions": ["dashboard:view", "order:read"] }
// 请求要求：必须登录后台，并拥有 permission:manage 权限。
// 接口作用：保存角色授权；超级管理员等系统角色默认全部权限，不能在这里取消授权。
apiRouter.patch('/admin/roles/:roleKey/permissions', requirePermission(permissions.permissionManage), updateRolePermissionList);

// 访问方式：DELETE http://localhost:9999/api/admin/roles/:roleKey
// 请求要求：必须登录后台，并拥有 permission:manage 权限。
// 接口作用：删除后台角色；系统角色不能删除，已有成员占用的角色不能删除。
apiRouter.delete('/admin/roles/:roleKey', requirePermission(permissions.permissionManage), removeRole);

// 访问方式：GET http://localhost:9999/api/admin/menus
// 请求要求：必须登录后台，并拥有 menu:manage 权限。
// 接口作用：查询后台全部菜单和权限点字典，用于菜单管理页面增删改查。
apiRouter.get('/admin/menus', requirePermission(permissions.menuManage), listMenuManagement);

// 访问方式：POST http://localhost:9999/api/admin/menus
// 请求参数：JSON body { "menuKey": "menu-key", "title": "菜单名", "menuType": "domain|menu", "parentId": 1, "routeName": "路由名", "permissionKey": "权限点" }
// 请求要求：必须登录后台，并拥有 menu:manage 权限。
// 接口作用：新增后台菜单；可创建一级菜单或二级菜单，并绑定权限点、图标、分组和排序。
apiRouter.post('/admin/menus', requirePermission(permissions.menuManage), createMenu);

// 访问方式：PATCH http://localhost:9999/api/admin/menus/:id
// 请求参数：JSON body 同新增菜单。
// 请求要求：必须登录后台，并拥有 menu:manage 权限。
// 接口作用：编辑后台菜单；修改后前端下次加载导航时会按最新配置渲染。
apiRouter.patch('/admin/menus/:id', requirePermission(permissions.menuManage), updateMenu);

// 访问方式：DELETE http://localhost:9999/api/admin/menus/:id
// 请求要求：必须登录后台，并拥有 menu:manage 权限。
// 接口作用：删除后台菜单；如果存在子菜单，需要先删除子菜单。
apiRouter.delete('/admin/menus/:id', requirePermission(permissions.menuManage), removeMenu);

// 访问方式：GET http://localhost:9999/api/admin/members
// 请求要求：必须登录后台，并拥有 member:manage 权限。
// 接口作用：查询后台成员账号列表和可选角色，返回成员基础信息、角色、状态、最近登录时间和权限。
apiRouter.get('/admin/members', requirePermission(permissions.memberManage), listMembers);

// 访问方式：GET http://localhost:9999/api/admin/audit-logs?limit=50&offset=0
// 请求要求：必须登录后台，并拥有 audit:read 权限。
// 接口作用：查询后台关键操作审计日志，返回操作人、动作、对象、IP、浏览器信息和操作时间。
apiRouter.get('/admin/audit-logs', requirePermission(permissions.auditRead), listAdminAuditLogs);

// 访问方式：POST http://localhost:9999/api/admin/members
// 请求参数：JSON body { "name": "成员姓名", "email": "成员邮箱", "password": "初始密码", "role": "角色标识" }
// 请求要求：必须登录后台，并拥有 member:manage 权限。
// 接口作用：新增后台成员账号；后端会校验邮箱唯一、密码长度和角色合法性，并加密保存密码。
apiRouter.post('/admin/members', requirePermission(permissions.memberManage), createMember);

// 访问方式：PATCH http://localhost:9999/api/admin/members/:id
// 请求参数：JSON body { "name": "成员姓名", "role": "角色标识" }
// 请求要求：必须登录后台，并拥有 member:manage 权限。
// 接口作用：更新后台成员姓名和角色；禁止修改当前登录账号的角色，并至少保留一个启用的超级管理员。
apiRouter.patch('/admin/members/:id', requirePermission(permissions.memberManage), updateMember);

// 访问方式：PATCH http://localhost:9999/api/admin/members/:id/password
// 请求参数：JSON body { "password": "新密码" }
// 请求要求：必须登录后台，并拥有 member:manage 权限。
// 接口作用：重置后台成员密码；后端会重新生成密码哈希，不返回明文密码。
apiRouter.patch('/admin/members/:id/password', requirePermission(permissions.memberManage), resetMemberPassword);

// 访问方式：PATCH http://localhost:9999/api/admin/members/:id/status
// 请求参数：JSON body { "isActive": true }
// 请求要求：必须登录后台，并拥有 member:manage 权限。
// 接口作用：启用或停用后台成员；禁止停用当前登录账号，并至少保留一个启用的超级管理员。
apiRouter.patch('/admin/members/:id/status', requirePermission(permissions.memberManage), updateMemberStatus);

// 访问方式：GET http://localhost:9999/api/v1/users/me
// 请求要求：必须登录后台，并拥有 dashboard:view 权限。
// 接口作用：用户模块示例接口；当前返回 mock 用户数据，后续接入真实用户体系后再替换。
apiRouter.get('/v1/users/me', requirePermission(permissions.dashboardView), getCurrentUser);
