import {
  CircleDollarSign,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  MenuSquare,
  MonitorSmartphone,
  Palette,
  ScrollText,
  ShieldCheck,
  SquareDashedMousePointer,
  UsersRound,
  WandSparkles
} from '@lucide/vue'

export const menuIconMap = {
  CircleDollarSign,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  MenuSquare,
  MonitorSmartphone,
  Palette,
  ScrollText,
  ShieldCheck,
  SquareDashedMousePointer,
  UsersRound,
  WandSparkles
}

export function resolveMenuIcon(icon: string | null | undefined) {
  if (!icon || !(icon in menuIconMap)) {
    return SquareDashedMousePointer
  }

  return menuIconMap[icon as keyof typeof menuIconMap]
}
