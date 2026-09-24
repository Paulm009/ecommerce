import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="relative flex h-20 shrink-0 items-center gap-2 bg-gradient-to-r from-brand/10 via-transparent to-transparent px-6 transition-[width,height] ease-linear after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-brand/60 after:via-brand/10 after:to-transparent md:h-16 md:px-4 md:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-3 md:gap-2 max-md:[&_ol]:gap-2.5 max-md:[&_ol]:text-lg">
                <SidebarTrigger className="-ml-1 size-11 rounded-xl border border-brand/30 bg-brand/10 md:size-7 md:rounded-md md:border-0 md:bg-transparent max-md:[&_svg]:size-6" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
