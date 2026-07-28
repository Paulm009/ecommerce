import { Head, useForm } from '@inertiajs/react';
import { Clock3, LockKeyhole, TicketCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dateTime, money } from '@/lib/platform';
import reservations from '@/routes/reservations';

type Reservation = {
    id: string;
    status: string;
    selection_expires_at: string;
    occurrence: { event: { name: string } };
    items: {
        id: string;
        quantity: number;
        unit_price_snapshot: string;
        line_subtotal: string;
        ticket_type: { name: string };
        location: { label: string };
    }[];
};

export default function ReservationShow({
    reservation,
}: {
    reservation: Reservation;
}) {
    const [remaining, setRemaining] = useState(0);
    const form = useForm({
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        buyer_identity_document: '',
        promotion_code: '',
    });
    useEffect(() => {
        const tick = () =>
            setRemaining(
                Math.max(
                    0,
                    Math.floor(
                        (new Date(reservation.selection_expires_at).getTime() -
                            Date.now()) /
                            1000,
                    ),
                ),
            );
        tick();
        const timer = window.setInterval(tick, 1000);

        return () => window.clearInterval(timer);
    }, [reservation.selection_expires_at]);
    const total = reservation.items.reduce(
        (sum, item) => sum + Number(item.line_subtotal),
        0,
    );

    return (
        <>
            <Head title={'Completar reserva'} />
            <section
                className={
                    'mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px]'
                }
            >
                <div>
                    <div
                        className={
                            'mb-8 flex items-center gap-3 text-brand-light'
                        }
                    >
                        <TicketCheck />
                        <span className={'font-bold'}>Reserva protegida</span>
                    </div>
                    <h1 className={'text-4xl font-black'}>
                        Completa tus datos
                    </h1>
                    <p className={'mt-3 text-zinc-400'}>
                        Usaremos esta información para emitir y enviar tus
                        entradas.
                    </p>
                    <div className={'mt-8 grid gap-5 sm:grid-cols-2'}>
                        {[
                            [
                                'buyer_name',
                                'Nombre completo',
                                'Ana Pérez',
                                'text',
                            ],
                            [
                                'buyer_email',
                                'Correo electrónico',
                                'ana@ejemplo.com',
                                'email',
                            ],
                            ['buyer_phone', 'Teléfono', '+591 70000000', 'tel'],
                            [
                                'buyer_identity_document',
                                'Documento de identidad',
                                '1234567',
                                'text',
                            ],
                        ].map(([field, label, placeholder, type]) => (
                            <div key={field} className={'space-y-2'}>
                                <Label htmlFor={field}>{label}</Label>
                                <Input
                                    id={field}
                                    type={type}
                                    placeholder={placeholder}
                                    value={
                                        form.data[
                                            field as keyof typeof form.data
                                        ]
                                    }
                                    onChange={(e) =>
                                        form.setData(
                                            field as keyof typeof form.data,
                                            e.target.value,
                                        )
                                    }
                                    className={'border-white/10 bg-white/5'}
                                />
                                {form.errors[
                                    field as keyof typeof form.errors
                                ] && (
                                    <p className={'text-sm text-red-400'}>
                                        {
                                            form.errors[
                                                field as keyof typeof form.errors
                                            ]
                                        }
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={'mt-5 space-y-2'}>
                        <Label htmlFor={'promotion_code'}>
                            Código promocional
                        </Label>
                        <Input
                            id={'promotion_code'}
                            placeholder={'Ej. FUEGO10'}
                            value={form.data.promotion_code}
                            onChange={(event) =>
                                form.setData(
                                    'promotion_code',
                                    event.target.value.toUpperCase(),
                                )
                            }
                            className={'border-white/10 bg-white/5 uppercase'}
                        />
                        {form.errors.promotion_code && (
                            <p className={'text-sm text-red-400'}>
                                {form.errors.promotion_code}
                            </p>
                        )}
                    </div>
                    <div
                        className={
                            'mt-8 rounded-xl border border-white/10 bg-white/[.03] p-5 text-sm leading-6 text-zinc-400'
                        }
                    >
                        <LockKeyhole
                            className={'mb-3 size-5 text-emerald-400'}
                        />
                        Tus datos se usan exclusivamente para procesar la
                        compra, el acceso al evento y las notificaciones
                        operativas.
                    </div>
                </div>
                <aside
                    className={
                        'h-fit rounded-2xl border border-white/10 bg-white/[.04] p-6 lg:sticky lg:top-24'
                    }
                >
                    <div
                        className={`flex items-center justify-between rounded-xl p-4 ${remaining > 0 ? 'bg-amber-300/10 text-amber-200' : 'bg-red-500/10 text-red-300'}`}
                    >
                        <span className={'flex items-center gap-2 text-sm'}>
                            <Clock3 className={'size-4'} />
                            Tiempo restante
                        </span>
                        <strong>
                            {Math.floor(remaining / 60)}:
                            {String(remaining % 60).padStart(2, '0')}
                        </strong>
                    </div>
                    <h2 className={'mt-6 text-xl font-black'}>
                        {reservation.occurrence.event.name}
                    </h2>
                    <p className={'mt-1 text-xs text-zinc-500'}>
                        Vence {dateTime(reservation.selection_expires_at)}
                    </p>
                    <div className={'mt-5 space-y-4'}>
                        {reservation.items.map((item) => (
                            <div
                                key={item.id}
                                className={
                                    'flex justify-between gap-4 border-t border-white/10 pt-4 text-sm'
                                }
                            >
                                <span>
                                    {item.quantity} × {item.ticket_type.name}
                                    <small className={'block text-zinc-500'}>
                                        {item.location.label}
                                    </small>
                                </span>
                                <strong>{money(item.line_subtotal)}</strong>
                            </div>
                        ))}
                    </div>
                    <div
                        className={
                            'mt-6 flex justify-between border-t border-white/10 pt-5 text-lg'
                        }
                    >
                        <span>Total</span>
                        <strong>{money(total)}</strong>
                    </div>
                    <Button
                        className={
                            'mt-6 w-full bg-brand text-white hover:bg-brand-hover'
                        }
                        disabled={
                            form.processing ||
                            remaining === 0 ||
                            reservation.status !== 'temporary_selection'
                        }
                        onClick={() =>
                            form.post(reservations.confirm(reservation.id).url)
                        }
                    >
                        Continuar al pago QR
                    </Button>
                </aside>
            </section>
        </>
    );
}
