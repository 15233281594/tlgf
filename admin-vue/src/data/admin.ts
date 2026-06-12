export const dashboardTabs = [
  { id: 'permission-overview', label: '权限概览' },
  { id: 'site-policy', label: '客户端策略' },
  { id: 'data-scope', label: '数据范围' },
  { id: 'audit-log', label: '审计日志' }
]

export const metrics = [
  { label: '权限角色', value: '4', desc: '超级管理员 / 运营 / 财务 / 客服' },
  { label: '待办订单', value: '18', desc: '优先处理支付后履约' },
  { label: '页面草稿', value: '3', desc: '首页、价格、支付说明' },
  { label: '风控提醒', value: '2', desc: '登录地点与支付审核异常' }
]

export const permissionRows = [
  { module: '页面装修', admin: '可编辑', finance: '只读', service: '无权限' },
  { module: '订单履约', admin: '全部', finance: '只读金额', service: '处理订单' },
  { module: '支付审核', admin: '全部', finance: '审核', service: '无权限' },
  { module: '成员账号', admin: '管理', finance: '无权限', service: '无权限' }
]

export const builderBlocks = [
  { title: '首页首屏', desc: '标题、主按钮、背景素材、活动入口' },
  { title: '价格矩阵', desc: '段位区间、加急策略、优惠文案' },
  { title: '下单流程', desc: '表单字段、联系方式、支付说明' },
  { title: '信任背书', desc: '服务保障、交付说明、常见问题' }
]
