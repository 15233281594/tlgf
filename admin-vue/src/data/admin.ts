import {
  CircleDollarSign,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  UsersRound,
  WandSparkles
} from '@lucide/vue'

export const primaryDomains = [
  { id: 'operation', label: '运营中台', icon: LayoutDashboard },
  { id: 'permission', label: '权限中心', icon: ShieldCheck },
  { id: 'client', label: '客户端', icon: MonitorSmartphone },
  { id: 'finance', label: '交易财务', icon: CircleDollarSign }
]

export const moduleGroups = [
  {
    title: '核心业务',
    items: [
      { id: 'dashboard', label: '业务工作台', icon: Gauge, badge: '' },
      { id: 'orders', label: '订单履约', icon: FileText, badge: '18' },
      { id: 'payment', label: '支付审核', icon: CircleDollarSign, badge: '6' }
    ]
  },
  {
    title: '低代码配置',
    items: [
      { id: 'site-builder', label: '页面装修', icon: WandSparkles, badge: '' },
      { id: 'theme', label: '模板主题', icon: Palette, badge: '' }
    ]
  },
  {
    title: '权限与协同',
    items: [
      { id: 'roles', label: '角色权限', icon: KeyRound, badge: '优先' },
      { id: 'members', label: '成员账号', icon: UsersRound, badge: '' }
    ]
  }
]

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
