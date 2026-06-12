import type { PermissionCatalogItem } from './permission'

export type AdminMenu = {
  id: number
  parentId: number | null
  menuKey: string
  title: string
  menuType: 'domain' | 'menu'
  icon: string | null
  routeName: string | null
  permissionKey: string | null
  groupTitle: string | null
  badge: string | null
  sortOrder: number
  isVisible: boolean
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
  children?: AdminMenu[]
}

export type AdminNavigationResponse = {
  menus: AdminMenu[]
}

export type AdminMenuManagementResponse = {
  menus: AdminMenu[]
  tree: AdminMenu[]
  permissionCatalog: PermissionCatalogItem[]
}

export type AdminMenuMutationResponse = {
  menu: AdminMenu
}

export type AdminMenuPayload = {
  parentId: number | null
  menuKey: string
  title: string
  menuType: 'domain' | 'menu'
  icon: string
  routeName: string
  permissionKey: string
  groupTitle: string
  badge: string
  sortOrder: number
  isVisible: boolean
  isActive: boolean
}

export type DeleteMenuResponse = {
  deleted: boolean
}
