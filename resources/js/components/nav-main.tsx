import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel className="mb-2 text-xs font-bold tracking-[.25em] uppercase">
                Menú
            </SidebarGroupLabel>
            <SidebarMenu className="gap-2">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className={
                                'h-12 gap-3 rounded-xl px-4 text-lg transition-all duration-200 hover:bg-brand/15 hover:text-foreground data-[active=true]:bg-gradient-to-r data-[active=true]:from-brand data-[active=true]:to-brand-dark data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-brand/30 [&>svg]:size-6 [&>svg]:transition-transform group-data-[collapsible=icon]:[&>svg]:size-4 hover:[&>svg]:scale-110'
                            }
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
