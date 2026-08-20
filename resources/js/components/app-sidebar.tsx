import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    Banknote,
    Boxes,
    CalendarDays,
    CreditCard,
    LayoutGrid,
    Map,
    PackageCheck,
    ScanLine,
    Settings,
    ShoppingBag,
    ShoppingCart,
    TicketCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { account, dashboard } from '@/routes';
import adminEvents from '@/routes/admin/events';
import inventory from '@/routes/admin/inventory';
import layouts from '@/routes/admin/layouts';
import orders from '@/routes/admin/orders';
import payments from '@/routes/admin/payments';
import products from '@/routes/admin/products';
import adminTickets from '@/routes/admin/tickets';
import users from '@/routes/admin/users';
import cash from '@/routes/cash';
import companySettings from '@/routes/company-settings';
import courtesies from '@/routes/courtesies';
import publicEvents from '@/routes/events';
import pos from '@/routes/pos';
import scanner from '@/routes/scanner';
import store from '@/routes/store';
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const can = (permission: string) => auth.permissions?.includes(permission);
    const isCustomer = auth.user?.user_type === 'customer';
    const homeHref = isCustomer ? account() : dashboard();
    const customerNavItems: NavItem[] = [
        { title: 'Mis compras', href: account(), icon: LayoutGrid },
        { title: 'Eventos', href: publicEvents.index(), icon: CalendarDays },
        { title: 'Tienda', href: store.index(), icon: ShoppingBag },
    ];
    const staffNavItems: NavItem[] = [
        can('dashboard.view') && {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        can('events.manage') && {
            title: 'Eventos',
            href: adminEvents.index(),
            icon: CalendarDays,
        },
        can('tickets.issue') && {
            title: 'Venta de entradas',
            href: publicEvents.index(),
            icon: TicketCheck,
        },
        can('tickets.view') && {
            title: 'Entradas emitidas',
            href: adminTickets.index(),
            icon: TicketCheck,
        },
        can('layouts.manage') && {
            title: 'Planos',
            href: layouts.index(),
            icon: Map,
        },
        can('tickets.issue_courtesy') && {
            title: 'Cortesías',
            href: courtesies.index(),
            icon: TicketCheck,
        },
        can('access.scan') && {
            title: 'Escáner',
            href: scanner.index(),
            icon: ScanLine,
        },
        can('products.manage') && {
            title: 'Productos',
            href: products.index(),
            icon: Archive,
        },
        can('inventory.view') && {
            title: 'Inventario',
            href: inventory.index(),
            icon: Boxes,
        },
        can('orders.manage') && {
            title: 'Pedidos',
            href: orders.index(),
            icon: PackageCheck,
        },
        can('payments.review_incidents') && {
            title: 'Pagos',
            href: payments.index(),
            icon: CreditCard,
        },
        can('pos.sell') && {
            title: 'Punto de venta',
            href: pos.index(),
            icon: ShoppingCart,
        },
        can('cash.manage') && {
            title: 'Caja',
            href: cash.index(),
            icon: Banknote,
        },
        can('users.manage') && {
            title: 'Usuarios',
            href: users.index(),
            icon: Users,
        },
    ].filter(Boolean) as NavItem[];
    const mainNavItems = isCustomer ? customerNavItems : staffNavItems;
    const footerNavItems: NavItem[] = can('settings.manage')
        ? [
              {
                  title: 'Configuración',
                  href: companySettings.edit(),
                  icon: Settings,
              },
          ]
        : [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
