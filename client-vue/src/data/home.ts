export interface PricePlan {
  tier: string
  range: string
  price: string
  unit: string
  tone: string
  features: string[]
}

export interface ServiceHighlight {
  badge: string
  title: string
  description: string
}

export interface WorkflowStep {
  label: string
  title: string
  description: string
}

export const pricePlans: PricePlan[] = [
  {
    tier: '黑铁 / 青铜',
    range: '基础区间',
    price: '¥18',
    unit: '起 / 小段',
    tone: 'iron',
    features: ['适合低分段维护', '支持指定时段', '进度截图同步'],
  },
  {
    tier: '白银 / 黄金',
    range: '常规区间',
    price: '¥28',
    unit: '起 / 小段',
    tone: 'gold',
    features: ['排单速度快', '可选单排或双排', '异常局沟通处理'],
  },
  {
    tier: '铂金 / 翡翠',
    range: '热门区间',
    price: '¥45',
    unit: '起 / 小段',
    tone: 'emerald',
    features: ['主力业务区间', '目标段位报价', '完成后复盘说明'],
  },
  {
    tier: '钻石以上',
    range: '高段区间',
    price: '面议',
    unit: '按账号评估',
    tone: 'diamond',
    features: ['账号状态评估', '专人接待', '按难度定制方案'],
  },
]

export const serviceHighlights: ServiceHighlight[] = [
  {
    badge: '主推',
    title: '掉分陪练',
    description: '根据当前段位、隐藏分和目标区间评估报价，适合需要段位状态调整的玩家。',
  },
  {
    badge: '娱乐',
    title: '陪玩开黑',
    description: '峡谷、极地、云顶等多模式陪玩，声音、位置、时间段均可提前沟通。',
  },
  {
    badge: '维护',
    title: '账号状态服务',
    description: '定位赛、补分、胜率状态和连败后的节奏恢复，按实际情况给出方案。',
  },
]

export const workflowSteps: WorkflowStep[] = [
  {
    label: '01',
    title: '提交段位和目标',
    description: '提供当前段位、目标区间、服务器和可操作时间，先做价格评估。',
  },
  {
    label: '02',
    title: '确认方案并排单',
    description: '确认业务类型、预计周期和注意事项，安排合适的接单人员。',
  },
  {
    label: '03',
    title: '过程同步',
    description: '订单进度、异常对局和完成节点及时同步，减少来回追问。',
  },
  {
    label: '04',
    title: '完成交付',
    description: '核对最终段位、场次和截图记录，后续需要复盘或续单可继续跟进。',
  },
]
