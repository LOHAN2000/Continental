import type {
  UserRole,
} from "@/types/auth";

export type NavigationItem = {
  label: string;
  href: string;
  shortLabel: string;
  roles: UserRole[];
};

const allRoles: UserRole[] = [
  "PROPIETARIO",
  "CAJERO",
];

const ownerOnly: UserRole[] = [
  "PROPIETARIO",
];

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    shortLabel: "D",
    href: "/dashboard",
    roles: allRoles,
  },
  {
    label: "Categorías",
    shortLabel: "C",
    href: "/categorias",
    roles: ownerOnly,
  },
  {
    label: "Productos",
    shortLabel: "P",
    href: "/productos",
    roles: allRoles,
  },
  {
    label: "Proveedores",
    shortLabel: "PR",
    href: "/proveedores",
    roles: ownerOnly,
  },
  {
    label: "Compras",
    shortLabel: "CO",
    href: "/compras",
    roles: ownerOnly,
  },
  {
    label: "Lotes",
    shortLabel: "L",
    href: "/lotes",
    roles: ownerOnly,
  },
  {
    label: "Inventario",
    shortLabel: "I",
    href: "/inventario",
    roles: allRoles,
  },
  {
    label: "Ventas",
    shortLabel: "V",
    href: "/ventas",
    roles: allRoles,
  },
  {
    label: "Ajustes",
    shortLabel: "A",
    href: "/ajustes",
    roles: ownerOnly,
  },
  {
    label: "Alertas",
    shortLabel: "AL",
    href: "/alertas",
    roles: allRoles,
  },
  {
    label: "Reportes",
    shortLabel: "R",
    href: "/reportes",
    roles: ownerOnly,
  },
  {
    label: "Usuarios",
    shortLabel: "U",
    href: "/usuarios",
    roles: ownerOnly,
  },
];