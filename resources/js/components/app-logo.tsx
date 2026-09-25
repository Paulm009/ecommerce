import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white shadow-lg ring-1 shadow-brand/40 ring-white/20 group-data-[collapsible=icon]:size-8">
                <AppLogoIcon className="size-6 text-white group-data-[collapsible=icon]:size-5" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate font-display text-3xl leading-none tracking-wider uppercase">
                    {name}
                </span>
            </div>
        </>
    );
}
