import { Head, router } from '@inertiajs/react';
import { Mail, Search, TicketX } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import ticketsRoutes from '@/routes/admin/tickets';

type Ticket = {
    id: string;
    public_code: string;
    status: string;
    quota_total: number;
    quota_used: number;
    recipient_name: string | null;
    recipient_email: string | null;
    issued_at: string;
    last_sent_at: string | null;
    scans_count: number;
    occurrence: { starts_at: string; event: { name: string } };
};

export default function Tickets({
    tickets,
    filters,
}: {
    tickets: Paginated<Ticket>;
    filters: { search: string; status: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const filter = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            ticketsRoutes.index().url,
            { search, status },
            { preserveState: true, replace: true },
        );
    };
    const voidTicket = (ticket: Ticket) => {
        const reason = window.prompt('Indica el motivo de anulación');

        if (reason) {
            router.patch(ticketsRoutes.void(ticket.id).url, { reason });
        }
    };

    return (
        <>
            <Head title={'Entradas emitidas'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Boletería'}
                    title={'Entradas emitidas'}
                    description={
                        'Consulta cupos, accesos, reenvíos y anulaciones con trazabilidad.'
                    }
                />
                <Panel>
                    <form
                        onSubmit={filter}
                        className={'mb-5 flex flex-col gap-2 sm:flex-row'}
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={'Código, titular o correo'}
                        />
                        <select
                            className={
                                'h-9 rounded-md border bg-background px-3 text-sm'
                            }
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value={''}>Todos los estados</option>
                            <option value={'active'}>Activas</option>
                            <option value={'exhausted'}>Agotadas</option>
                            <option value={'voided'}>Anuladas</option>
                        </select>
                        <Button>
                            <Search />
                            Buscar
                        </Button>
                    </form>
                    <div className={'space-y-3'}>
                        {tickets.data.map((ticket) => (
                            <article
                                key={ticket.id}
                                className={'rounded-xl border p-4'}
                            >
                                <div
                                    className={
                                        'flex flex-wrap items-start justify-between gap-4'
                                    }
                                >
                                    <div>
                                        <strong className={'font-mono'}>
                                            {ticket.public_code}
                                        </strong>
                                        <p className={'mt-1 text-sm'}>
                                            {ticket.occurrence.event.name}
                                        </p>
                                        <p
                                            className={
                                                'text-xs text-muted-foreground'
                                            }
                                        >
                                            {dateTime(
                                                ticket.occurrence.starts_at,
                                            )}
                                        </p>
                                    </div>
                                    <StateBadge status={ticket.status} />
                                </div>
                                <div
                                    className={
                                        'mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-4'
                                    }
                                >
                                    <div>
                                        <span
                                            className={'text-muted-foreground'}
                                        >
                                            Titular
                                        </span>
                                        <strong className={'block'}>
                                            {ticket.recipient_name ??
                                                'Sin nombre'}
                                        </strong>
                                        <small>{ticket.recipient_email}</small>
                                    </div>
                                    <div>
                                        <span
                                            className={'text-muted-foreground'}
                                        >
                                            Cupos
                                        </span>
                                        <strong className={'block'}>
                                            {ticket.quota_used} usados ·{' '}
                                            {ticket.quota_total -
                                                ticket.quota_used}{' '}
                                            restantes
                                        </strong>
                                    </div>
                                    <div>
                                        <span
                                            className={'text-muted-foreground'}
                                        >
                                            Escaneos
                                        </span>
                                        <strong className={'block'}>
                                            {ticket.scans_count}
                                        </strong>
                                        <small>
                                            Emitida {dateTime(ticket.issued_at)}
                                        </small>
                                    </div>
                                    <div
                                        className={
                                            'flex items-center justify-end gap-2'
                                        }
                                    >
                                        <Button
                                            size={'sm'}
                                            variant={'outline'}
                                            disabled={!ticket.recipient_email}
                                            onClick={() =>
                                                router.post(
                                                    ticketsRoutes.resend(
                                                        ticket.id,
                                                    ).url,
                                                )
                                            }
                                        >
                                            <Mail />
                                            Reenviar
                                        </Button>
                                        {ticket.status !== 'voided' && (
                                            <Button
                                                size={'sm'}
                                                variant={'destructive'}
                                                onClick={() =>
                                                    voidTicket(ticket)
                                                }
                                            >
                                                <TicketX />
                                                Anular
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <Pagination page={tickets} />
                </Panel>
            </div>
        </>
    );
}

Tickets.layout = {
    breadcrumbs: [{ title: 'Entradas emitidas', href: ticketsRoutes.index() }],
};
