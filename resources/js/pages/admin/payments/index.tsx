import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { dateTime, money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import paymentsRoutes from '@/routes/admin/payments';

type Incident = {
    id: string;
    incident_type: string;
    status: string;
    expected_amount: string;
    received_amount: string;
    description: string;
    opened_at: string;
    payment_attempt: {
        sale: { public_number: string; total_amount: string; status: string };
    };
};

function ResolveForm({ incident }: { incident: Incident }) {
    const form = useForm({ resolution_notes: '', refund_reference: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(paymentsRoutes.resolve(incident.id).url);
    };

    return (
        <form
            onSubmit={submit}
            className={
                'mt-4 grid gap-3 border-t pt-4 sm:grid-cols-[1fr_220px_auto]'
            }
        >
            <div>
                <Label>Resolución</Label>
                <Textarea
                    value={form.data.resolution_notes}
                    onChange={(e) =>
                        form.setData('resolution_notes', e.target.value)
                    }
                    placeholder={'Resultado de la revisión'}
                />
                <FieldError message={form.errors.resolution_notes} />
            </div>
            <div>
                <Label>Referencia devolución</Label>
                <Input
                    value={form.data.refund_reference}
                    onChange={(e) =>
                        form.setData('refund_reference', e.target.value)
                    }
                    placeholder={'Opcional'}
                />
            </div>
            <Button className={'self-end'} disabled={form.processing}>
                <CheckCircle2 />
                Resolver
            </Button>
        </form>
    );
}

export default function Payments({
    incidents,
    filters,
}: {
    incidents: Paginated<Incident>;
    filters: { status: string };
}) {
    const [status, setStatus] = useState(filters.status);

    return (
        <>
            <Head title={'Incidencias de pago'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Conciliación'}
                    title={'Incidencias de pago'}
                    description={
                        'Pagos confirmados fuera de tiempo que requieren revisión y posible devolución manual.'
                    }
                    action={
                        <select
                            className={
                                'h-9 rounded-md border bg-background px-3 text-sm'
                            }
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get(
                                    paymentsRoutes.index().url,
                                    { status: e.target.value },
                                    { preserveState: true },
                                );
                            }}
                        >
                            <option value={'open'}>Abiertas</option>
                            <option value={'resolved'}>Resueltas</option>
                            <option value={''}>Todas</option>
                        </select>
                    }
                />
                <Panel>
                    <div className={'space-y-4'}>
                        {incidents.data.map((incident) => (
                            <article
                                key={incident.id}
                                className={'rounded-xl border p-5'}
                            >
                                <div
                                    className={
                                        'flex flex-wrap items-start justify-between gap-4'
                                    }
                                >
                                    <div className={'flex gap-3'}>
                                        <span
                                            className={
                                                'rounded-lg bg-amber-500/10 p-3 text-amber-500'
                                            }
                                        >
                                            <AlertTriangle />
                                        </span>
                                        <div>
                                            <strong>
                                                {
                                                    incident.payment_attempt
                                                        .sale.public_number
                                                }
                                            </strong>
                                            <p
                                                className={
                                                    'text-sm text-muted-foreground'
                                                }
                                            >
                                                {incident.incident_type} ·{' '}
                                                {dateTime(incident.opened_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={'text-right'}>
                                        <StateBadge status={incident.status} />
                                        <p className={'mt-2 font-black'}>
                                            {money(incident.received_amount)}
                                        </p>
                                    </div>
                                </div>
                                <p
                                    className={
                                        'mt-4 rounded-lg bg-muted p-3 text-sm'
                                    }
                                >
                                    {incident.description}
                                </p>
                                {incident.status === 'open' && (
                                    <ResolveForm incident={incident} />
                                )}
                            </article>
                        ))}
                        {incidents.data.length === 0 && (
                            <p
                                className={
                                    'py-10 text-center text-muted-foreground'
                                }
                            >
                                No existen incidencias con este estado.
                            </p>
                        )}
                    </div>
                    <Pagination page={incidents} />
                </Panel>
            </div>
        </>
    );
}

Payments.layout = {
    breadcrumbs: [
        { title: 'Incidencias de pago', href: paymentsRoutes.index() },
    ],
};
