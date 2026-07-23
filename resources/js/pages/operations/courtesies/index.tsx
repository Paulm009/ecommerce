import { Head, useForm } from '@inertiajs/react';
import { Gift, TicketCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    FieldError,
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dateTime } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import courtesies from '@/routes/courtesies';

type Occurrence = {
    id: string;
    starts_at: string;
    event: { name: string };
    ticket_types: {
        id: string;
        name: string;
        inventory: { available_quantity: number | null } | null;
    }[];
    layout: {
        locations: {
            id: string;
            label: string;
            inventory: { available_quantity: number } | null;
        }[];
    };
};
type Batch = {
    id: string;
    public_number: string;
    recipient_name: string | null;
    recipient_email: string | null;
    reason: string | null;
    issued_at: string;
    occurrence: { event: { name: string } };
    tickets: {
        id: string;
        public_code: string;
        quota_total: number;
        quota_used: number;
        status: string;
    }[];
};

export default function Courtesies({
    occurrences,
    batches,
}: {
    occurrences: Occurrence[];
    batches: Paginated<Batch>;
}) {
    const first = occurrences[0];
    const form = useForm({
        occurrence_id: first?.id ?? '',
        recipient_name: '',
        recipient_email: '',
        recipient_phone: '',
        reason: '',
        items: [
            {
                event_location_id: first?.layout.locations[0]?.id ?? '',
                ticket_type_id: first?.ticket_types[0]?.id ?? '',
                quantity: 1,
            },
        ],
    });
    const occurrence =
        occurrences.find((item) => item.id === form.data.occurrence_id) ??
        first;
    const selectOccurrence = (id: string) => {
        const selected = occurrences.find((item) => item.id === id);
        form.setData({
            ...form.data,
            occurrence_id: id,
            items: [
                {
                    event_location_id: selected?.layout.locations[0]?.id ?? '',
                    ticket_type_id: selected?.ticket_types[0]?.id ?? '',
                    quantity: 1,
                },
            ],
        });
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            recipient_name: data.recipient_name,
            recipient_email: data.recipient_email,
            recipient_phone: data.recipient_phone,
            reason: data.reason,
            items: data.items,
        }));
        form.post(courtesies.store(form.data.occurrence_id).url, {
            onSuccess: () =>
                form.reset(
                    'recipient_name',
                    'recipient_email',
                    'recipient_phone',
                    'reason',
                ),
        });
    };

    return (
        <>
            <Head title={'Cortesías'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Boletería'}
                    title={'Emisión de cortesías'}
                    description={
                        'Emite entradas sin venta, descontando cupo real y conservando trazabilidad.'
                    }
                />
                <div className={'grid gap-6 xl:grid-cols-[400px_1fr]'}>
                    <Panel title={'Nueva cortesía'}>
                        <form onSubmit={submit} className={'space-y-4'}>
                            <div>
                                <Label>Función</Label>
                                <select
                                    className={
                                        'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.occurrence_id}
                                    onChange={(e) =>
                                        selectOccurrence(e.target.value)
                                    }
                                >
                                    {occurrences.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.event.name} ·{' '}
                                            {dateTime(item.starts_at)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Destinatario</Label>
                                <Input
                                    value={form.data.recipient_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'recipient_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className={'grid grid-cols-2 gap-3'}>
                                <Input
                                    type={'email'}
                                    placeholder={'Correo'}
                                    value={form.data.recipient_email}
                                    onChange={(e) =>
                                        form.setData(
                                            'recipient_email',
                                            e.target.value,
                                        )
                                    }
                                />
                                <Input
                                    placeholder={'Teléfono'}
                                    value={form.data.recipient_phone}
                                    onChange={(e) =>
                                        form.setData(
                                            'recipient_phone',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label>Ubicación</Label>
                                <select
                                    className={
                                        'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.items[0].event_location_id}
                                    onChange={(e) =>
                                        form.setData('items', [
                                            {
                                                ...form.data.items[0],
                                                event_location_id:
                                                    e.target.value,
                                            },
                                        ])
                                    }
                                >
                                    {occurrence?.layout.locations.map(
                                        (item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.label} ·{' '}
                                                {item.inventory
                                                    ?.available_quantity ??
                                                    0}{' '}
                                                disp.
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <div className={'grid grid-cols-[1fr_100px] gap-3'}>
                                <select
                                    className={
                                        'h-9 rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.items[0].ticket_type_id}
                                    onChange={(e) =>
                                        form.setData('items', [
                                            {
                                                ...form.data.items[0],
                                                ticket_type_id: e.target.value,
                                            },
                                        ])
                                    }
                                >
                                    {occurrence?.ticket_types.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type={'number'}
                                    min={1}
                                    value={form.data.items[0].quantity}
                                    onChange={(e) =>
                                        form.setData('items', [
                                            {
                                                ...form.data.items[0],
                                                quantity: Number(
                                                    e.target.value,
                                                ),
                                            },
                                        ])
                                    }
                                />
                            </div>
                            <Textarea
                                placeholder={'Motivo o autorización'}
                                value={form.data.reason}
                                onChange={(e) =>
                                    form.setData('reason', e.target.value)
                                }
                            />
                            {Object.values(form.errors).map((error) => (
                                <FieldError
                                    key={error as string}
                                    message={error as string}
                                />
                            ))}
                            <Button
                                className={'w-full'}
                                disabled={form.processing || !occurrence}
                            >
                                <Gift />
                                Emitir cortesía
                            </Button>
                        </form>
                    </Panel>
                    <Panel title={'Lotes emitidos'}>
                        <div className={'space-y-3'}>
                            {batches.data.map((batch) => (
                                <article
                                    key={batch.id}
                                    className={'rounded-xl border p-4'}
                                >
                                    <div
                                        className={
                                            'flex flex-wrap justify-between gap-3'
                                        }
                                    >
                                        <div className={'flex gap-3'}>
                                            <span
                                                className={
                                                    'rounded-lg bg-primary/10 p-3'
                                                }
                                            >
                                                <TicketCheck />
                                            </span>
                                            <div>
                                                <strong>
                                                    {batch.public_number}
                                                </strong>
                                                <p
                                                    className={
                                                        'text-sm text-muted-foreground'
                                                    }
                                                >
                                                    {
                                                        batch.occurrence.event
                                                            .name
                                                    }{' '}
                                                    · {batch.recipient_name}
                                                </p>
                                            </div>
                                        </div>
                                        <small
                                            className={'text-muted-foreground'}
                                        >
                                            {dateTime(batch.issued_at)}
                                        </small>
                                    </div>
                                    <div
                                        className={'mt-4 flex flex-wrap gap-2'}
                                    >
                                        {batch.tickets.map((ticket) => (
                                            <span
                                                key={ticket.id}
                                                className={
                                                    'rounded-md bg-muted px-3 py-2 text-xs'
                                                }
                                            >
                                                {ticket.public_code} ·{' '}
                                                {ticket.quota_used}/
                                                {ticket.quota_total}{' '}
                                                <StateBadge
                                                    status={ticket.status}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                        <Pagination page={batches} />
                    </Panel>
                </div>
            </div>
        </>
    );
}

Courtesies.layout = {
    breadcrumbs: [{ title: 'Cortesías', href: courtesies.index() }],
};
