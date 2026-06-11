// 汇总并注册后端 API 路由。
import { Router } from 'express';
import { getCurrentAdmin, login, logout } from '../modules/auth/auth.controller.js';
import { getHealth } from '../modules/health/health.controller.js';
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

// 访问方式：GET http://localhost:9999/api/v1/users/me
// 接口作用：用户模块示例接口；当前返回 mock 用户数据，后续接入真实用户体系后再替换。
apiRouter.get('/v1/users/me', getCurrentUser);
