import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarClock,
    Package,
    ShoppingBag,
    Sparkles,
    Ticket,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/platform';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { dateTime, money } from '@/lib/platform';
import { account } from '@/routes';
import eventsRoutes from '@/routes/events';
import store from '@/routes/store';
import type { Auth } from '@/types';

type NextTicket = {
    event_name: string;
    starts_at: string;
};

const memberSince = (isoDate: string) =>
    new Intl.DateTimeFormat('es-BO', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(isoDate));

const StatCard = ({
    icon: Icon,
    value,
    label,
    detail,
    compact = false,
}: {
    icon: LucideIcon;
    value: React.ReactNode;
    label: string;
    detail: string;
    compact?: boolean;
}) => (
    <div
        className={
            'group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-brand/15 via-card to-card p-6 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1.5 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/25'
        }
    >
        <div
            aria-hidden
            className={
                'absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-dark via-brand to-brand-light opacity-70 transition group-hover:opacity-100'
            }
        />
        <div
            aria-hidden
            className={
                'absolute -top-10 -right-10 size-40 rounded-full bg-brand/20 blur-3xl transition duration-500 group-hover:bg-brand/40'
            }
        />
        <Icon
            aria-hidden
            className={
                'absolute -right-6 -bottom-6 size-36 rotate-12 text-brand/10 transition duration-500 group-hover:rotate-0 group-hover:text-brand/20'
            }
            strokeWidth={1.25}
        />
        <div className={'relative flex items-center justify-between gap-3'}>
            <p
                className={
                    'text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase'
                }
            >
                {label}
            </p>
            <span
                className={
                    'grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white shadow-lg ring-1 shadow-brand/40 ring-white/20 transition duration-300 group-hover:scale-110 group-hover:rotate-6'
                }
            >
                <Icon className={'size-6'} />
            </span>
        </div>
        <p
            className={
                'relative mt-6 font-display leading-none tracking-wide text-foreground ' +
                (compact ? 'text-2xl sm:text-3xl' : 'text-5xl sm:text-6xl')
            }
        >
            {value}
        </p>
        <p className={'relative mt-4 truncate text-sm text-muted-foreground'}>
            {detail}
        </p>
    </div>
);

const ActionTile = ({
    href,
    icon: Icon,
    title,
    subtitle,
    variant,
}: {
    href: ReturnType<typeof store.index>;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    variant: 'primary' | 'secondary';
}) => (
    <Link
        href={href}
        className={
            'group relative flex flex-1 items-center gap-4 overflow-hidden rounded-3xl p-5 text-white transition duration-300 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-brand/50 focus-visible:outline-none ' +
            (variant === 'primary'
                ? 'bg-gradient-to-br from-brand-light via-brand to-brand-dark shadow-xl shadow-brand/40 hover:shadow-2xl hover:shadow-brand/60'
                : 'border border-brand/40 bg-gradient-to-br from-zinc-900 via-black to-brand-dark/60 shadow-xl shadow-black/40 hover:border-brand hover:shadow-2xl hover:shadow-brand/30')
        }
    >
        <span
            aria-hidden
            className={
                'absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[300%]'
            }
        />
        <span
            className={
                'relative grid size-14 shrink-0 place-items-center rounded-2xl ring-1 ring-white/25 transition duration-300 group-hover:scale-110 group-hover:-rotate-6 ' +
                (variant === 'primary'
                    ? 'bg-white/15 backdrop-blur'
                    : 'bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/40')
            }
        >
            <Icon className={'size-7'} />
        </span>
        <span className={'relative min-w-0 flex-1'}>
            <span
                className={
                    'block font-display text-2xl leading-none tracking-wide uppercase sm:text-3xl'
                }
            >
                {title}
            </span>
            <span className={'mt-1.5 block text-sm text-white/75'}>
                {subtitle}
            </span>
        </span>
        <ArrowUpRight
            className={
                'relative size-7 shrink-0 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1'
            }
        />
    </Link>
);

export default function Account({
    ticketsCount,
    ordersCount,
    totalSpent,
    nextTicket,
}: {
    ticketsCount: number;
    ordersCount: number;
    totalSpent: string;
    nextTicket: NextTicket | null;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const getInitials = useInitials();
    const firstName = auth.user?.name.split(' ')[0];

    return (
        <>
            <Head title={'Mi perfil'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Portal del cliente'}
                    title={firstName ? `Hola, ${firstName}` : 'Mi perfil'}
                    description={
                        'Consulta tus entradas, cupos disponibles y pedidos de productos asociados a tu correo.'
                    }
                />
                {auth.user && (
                    <div className={'grid gap-4 lg:grid-cols-5'}>
                        <div
                            className={
                                'relative flex items-center gap-5 overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/30 via-brand-dark/20 to-card p-6 shadow-xl shadow-brand/10 sm:p-8 lg:col-span-3'
                            }
                        >
                            <div
                                aria-hidden
                                className={
                                    'absolute -top-20 -left-20 size-64 rounded-full bg-brand/30 blur-3xl'
                                }
                            />
                            <div
                                aria-hidden
                                className={
                                    'absolute -right-16 -bottom-24 size-72 rounded-full bg-brand-dark/40 blur-3xl'
                                }
                            />
                            <div className={'relative shrink-0'}>
                                <span
                                    aria-hidden
                                    className={
                                        'absolute -inset-1.5 rounded-full bg-gradient-to-br from-brand-light via-brand to-brand-dark opacity-80 blur-sm'
                                    }
                                />
                                <Avatar
                                    className={
                                        'relative size-20 border-4 border-background sm:size-24'
                                    }
                                >
                                    <AvatarImage
                                        src={auth.user.avatar}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback
                                        className={
                                            'bg-gradient-to-br from-brand to-brand-dark font-display text-3xl tracking-wide text-white'
                                        }
                                    >
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className={'relative min-w-0'}>
                                <span
                                    className={
                                        'inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-brand-light uppercase'
                                    }
                                >
                                    <Sparkles className={'size-3.5'} />
                                    Cliente desde{' '}
                                    {memberSince(auth.user.created_at)}
                                </span>
                                <p
                                    className={
                                        'mt-3 truncate font-display text-3xl leading-none tracking-wide text-foreground uppercase sm:text-4xl'
                                    }
                                >
                                    {auth.user.name}
                                </p>
                                <p
                                    className={
                                        'mt-2 truncate text-sm text-muted-foreground'
                                    }
                                >
                                    {auth.user.email}
                                </p>
                            </div>
                        </div>
                        <div className={'flex flex-col gap-4 lg:col-span-2'}>
                            <ActionTile
                                href={store.index()}
                                icon={ShoppingBag}
                                title={'Ir a la tienda'}
                                subtitle={'Productos y merch oficial'}
                                variant={'primary'}
                            />
                            <ActionTile
                                href={eventsRoutes.index()}
                                icon={CalendarClock}
                                title={'Explorar eventos'}
                                subtitle={'Encuentra tu próxima función'}
                                variant={'secondary'}
                            />
                        </div>
                    </div>
                )}
                <div className={'grid gap-5 sm:grid-cols-2 xl:grid-cols-4'}>
                    <StatCard
                        icon={Ticket}
                        value={ticketsCount}
                        label={'Entradas'}
                        detail={'Asociadas a tu correo'}
                    />
                    <StatCard
                        icon={Package}
                        value={ordersCount}
                        label={'Pedidos'}
                        detail={'Compras de productos'}
                    />
                    <StatCard
                        icon={Wallet}
                        value={money(totalSpent)}
                        label={'Total en compras'}
                        detail={'Pedidos pagados'}
                        compact
                    />
                    <StatCard
                        icon={CalendarClock}
                        value={
                            nextTicket
                                ? dateTime(nextTicket.starts_at)
                                : 'Ninguna'
                        }
                        label={'Próxima función'}
                        detail={
                            nextTicket
                                ? nextTicket.event_name
                                : 'No tienes eventos próximos'
                        }
                        compact
                    />
                </div>
            </div>
        </>
    );
}

Account.layout = {
    breadcrumbs: [{ title: 'Mi perfil', href: account() }],
};
