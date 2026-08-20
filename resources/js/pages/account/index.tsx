import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Package,
    ShoppingBag,
    Ticket,
    Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/platform';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
    icon,
    value,
    label,
    detail,
}: {
    icon: React.ReactNode;
    value: React.ReactNode;
    label: string;
    detail: string;
}) => (
    <div
        className={
            'group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40'
        }
    >
        <div
            aria-hidden
            className={
                'absolute -top-6 -right-6 size-24 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/25'
            }
        />
        <div className={'relative flex items-start justify-between'}>
            <div>
                <p className={'text-sm text-muted-foreground'}>{label}</p>
                <p className={'mt-2 text-2xl font-black'}>{value}</p>
            </div>
            <span
                className={
                    'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/30'
                }
            >
                {icon}
            </span>
        </div>
        <p className={'relative mt-4 truncate text-xs text-muted-foreground'}>
            {detail}
        </p>
    </div>
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
                    <div
                        className={
                            'relative flex flex-col gap-5 overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between'
                        }
                    >
                        <div className={'flex items-center gap-4'}>
                            <Avatar
                                className={'size-14 border-2 border-brand/30'}
                            >
                                <AvatarImage
                                    src={auth.user.avatar}
                                    alt={auth.user.name}
                                />
                                <AvatarFallback
                                    className={
                                        'bg-gradient-to-br from-brand to-brand-dark text-base font-bold text-white'
                                    }
                                >
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className={'text-lg font-black'}>
                                    {auth.user.name}
                                </p>
                                <p className={'text-sm text-muted-foreground'}>
                                    {auth.user.email}
                                </p>
                                <p
                                    className={
                                        'mt-1 text-xs text-muted-foreground'
                                    }
                                >
                                    Cliente desde{' '}
                                    {memberSince(auth.user.created_at)}
                                </p>
                            </div>
                        </div>
                        <div className={'flex flex-wrap gap-2'}>
                            <Button asChild variant={'outline'}>
                                <Link href={eventsRoutes.index()}>
                                    <CalendarClock className={'size-4'} />
                                    Explorar eventos
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className={
                                    'bg-brand text-white hover:bg-brand-hover'
                                }
                            >
                                <Link href={store.index()}>
                                    <ShoppingBag className={'size-4'} />
                                    Ir a la tienda
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
                <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'}>
                    <StatCard
                        icon={<Ticket className={'size-5'} />}
                        value={ticketsCount}
                        label={'Entradas'}
                        detail={'Asociadas a tu correo'}
                    />
                    <StatCard
                        icon={<Package className={'size-5'} />}
                        value={ordersCount}
                        label={'Pedidos'}
                        detail={'Compras de productos'}
                    />
                    <StatCard
                        icon={<Wallet className={'size-5'} />}
                        value={money(totalSpent)}
                        label={'Total en compras'}
                        detail={'Pedidos pagados'}
                    />
                    <StatCard
                        icon={<CalendarClock className={'size-5'} />}
                        value={
                            <span className={'text-lg leading-tight'}>
                                {nextTicket
                                    ? dateTime(nextTicket.starts_at)
                                    : 'Ninguna'}
                            </span>
                        }
                        label={'Próxima función'}
                        detail={
                            nextTicket
                                ? nextTicket.event_name
                                : 'No tienes eventos próximos'
                        }
                    />
                </div>
            </div>
        </>
    );
}

Account.layout = {
    breadcrumbs: [{ title: 'Mi perfil', href: account() }],
};
