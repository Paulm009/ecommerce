import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Copy,
    MapPin,
    QrCode,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dateTime, statusLabel } from '@/lib/platform';

type Ticket = {
    public_code: string;
    status: string;
    quota_total: number;
    quota_used: number;
    recipient_name: string | null;
    occurrence: {
        starts_at: string;
        event: { name: string; venue_name: string; city: string | null };
    };
    entitlements: { id: string; quantity: number }[];
};

export default function TicketShow({
    ticket,
    qrToken,
    qrImage,
}: {
    ticket: Ticket;
    qrToken: string;
    qrImage: string;
}) {
    const remaining = ticket.quota_total - ticket.quota_used;

    return (
        <>
            <Head title={ticket.public_code} />
            <section className={'mx-auto max-w-2xl px-4 py-14 sm:px-6'}>
                <div
                    className={
                        'overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04]'
                    }
                >
                    <div
                        className={
                            'bg-gradient-to-br from-brand to-brand-dark p-8 text-white'
                        }
                    >
                        <p
                            className={
                                'text-sm font-black tracking-[.25em] uppercase'
                            }
                        >
                            Entrada digital
                        </p>
                        <h1 className={'mt-5 text-4xl font-black'}>
                            {ticket.occurrence.event.name}
                        </h1>
                        <p className={'mt-5 flex gap-2'}>
                            <CalendarDays className={'size-5'} />
                            {dateTime(ticket.occurrence.starts_at)}
                        </p>
                        <p className={'mt-2 flex gap-2'}>
                            <MapPin className={'size-5'} />
                            {ticket.occurrence.event.venue_name}
                            {ticket.occurrence.event.city
                                ? `, ${ticket.occurrence.event.city}`
                                : ''}
                        </p>
                    </div>
                    <div className={'p-8'}>
                        <div className={'flex flex-col items-center'}>
                            <div
                                className={
                                    'grid aspect-square w-full max-w-xs place-items-center rounded-2xl bg-white p-6 text-zinc-950'
                                }
                            >
                                <div className={'text-center break-all'}>
                                    {qrImage ? (
                                        <img
                                            src={qrImage}
                                            alt={'CÃ³digo QR de acceso'}
                                            className={
                                                'mx-auto aspect-square w-full'
                                            }
                                        />
                                    ) : (
                                        <QrCode className={'mx-auto size-36'} />
                                    )}
                                    <p
                                        className={
                                            'mt-4 font-mono text-[9px] leading-3'
                                        }
                                    >
                                        {qrToken}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={'ghost'}
                                className={'mt-3'}
                                onClick={() =>
                                    navigator.clipboard.writeText(qrToken)
                                }
                            >
                                <Copy />
                                Copiar token de acceso
                            </Button>
                        </div>
                        <div
                            className={
                                'mt-7 grid grid-cols-2 gap-4 rounded-xl border border-white/10 p-5 text-sm'
                            }
                        >
                            <div>
                                <p className={'text-zinc-500'}>Código</p>
                                <strong>{ticket.public_code}</strong>
                            </div>
                            <div>
                                <p className={'text-zinc-500'}>Estado</p>
                                <strong className={'capitalize'}>
                                    {statusLabel(ticket.status)}
                                </strong>
                            </div>
                            <div>
                                <p className={'text-zinc-500'}>Titular</p>
                                <strong>
                                    {ticket.recipient_name ?? 'Invitado'}
                                </strong>
                            </div>
                            <div>
                                <p className={'text-zinc-500'}>Ingresos</p>
                                <strong>
                                    {remaining} de {ticket.quota_total}{' '}
                                    restantes
                                </strong>
                            </div>
                        </div>
                        <p className={'mt-5 flex gap-2 text-sm text-zinc-400'}>
                            {remaining > 0 ? (
                                <CheckCircle2
                                    className={'size-5 text-emerald-400'}
                                />
                            ) : (
                                <Users className={'size-5 text-zinc-500'} />
                            )}
                            Presenta este código al personal de acceso. Cada
                            escaneo consume un ingreso disponible.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
