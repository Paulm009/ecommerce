import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Copy,
    Download,
    FileText,
    Loader2,
    MapPin,
    Share2,
    QrCode,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { dateTime, statusLabel } from '@/lib/platform';
import {
    canvasToPdf,
    canvasToPng,
    downloadBlob,
    renderTicketCanvas,
} from '@/lib/ticket-export';

type ExportAction = 'png' | 'pdf' | 'share';

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
    const [busy, setBusy] = useState<ExportAction | null>(null);
    const event = ticket.occurrence.event;
    const venueText = event.city
        ? `${event.venue_name}, ${event.city}`
        : event.venue_name;
    const fileBase = `entrada-${ticket.public_code}`;

    const runExport = async (action: ExportAction) => {
        setBusy(action);

        try {
            const canvas = await renderTicketCanvas({
                eventName: event.name,
                dateText: dateTime(ticket.occurrence.starts_at),
                venueText,
                qrImage,
                publicCode: ticket.public_code,
                statusText: statusLabel(ticket.status),
                holder: ticket.recipient_name ?? 'Invitado',
                accessText: `${remaining} de ${ticket.quota_total} restantes`,
            });

            if (action === 'pdf') {
                downloadBlob(await canvasToPdf(canvas), `${fileBase}.pdf`);

                return;
            }

            const png = await canvasToPng(canvas);
            const file = new File([png], `${fileBase}.png`, {
                type: 'image/png',
            });

            if (action === 'share' && navigator.canShare?.({ files: [file] })) {
                await navigator
                    .share({
                        files: [file],
                        title: event.name,
                        text: `Mi entrada para ${event.name}`,
                    })
                    .catch(() => undefined);

                return;
            }

            downloadBlob(png, file.name);
        } finally {
            setBusy(null);
        }
    };

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
                                            alt={'Código QR de acceso'}
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
                            {qrImage && (
                                <div
                                    className={
                                        'mt-5 grid w-full gap-3 sm:grid-cols-3'
                                    }
                                >
                                    <Button
                                        size={'lg'}
                                        disabled={busy !== null}
                                        onClick={() => runExport('png')}
                                        className={
                                            'h-12 rounded-xl bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white shadow-lg shadow-brand/30 hover:brightness-110'
                                        }
                                    >
                                        {busy === 'png' ? (
                                            <Loader2
                                                className={'animate-spin'}
                                            />
                                        ) : (
                                            <Download />
                                        )}
                                        Imagen
                                    </Button>
                                    <Button
                                        size={'lg'}
                                        variant={'outline'}
                                        disabled={busy !== null}
                                        onClick={() => runExport('pdf')}
                                        className={
                                            'h-12 rounded-xl border-brand/50 bg-transparent text-white hover:border-brand hover:bg-brand/15 hover:text-white'
                                        }
                                    >
                                        {busy === 'pdf' ? (
                                            <Loader2
                                                className={'animate-spin'}
                                            />
                                        ) : (
                                            <FileText />
                                        )}
                                        PDF
                                    </Button>
                                    <Button
                                        size={'lg'}
                                        disabled={busy !== null}
                                        onClick={() => runExport('share')}
                                        className={
                                            'h-12 rounded-xl bg-[#25D366] font-semibold text-black shadow-lg shadow-[#25D366]/25 hover:bg-[#1ebe5b]'
                                        }
                                    >
                                        {busy === 'share' ? (
                                            <Loader2
                                                className={'animate-spin'}
                                            />
                                        ) : (
                                            <Share2 />
                                        )}
                                        WhatsApp
                                    </Button>
                                </div>
                            )}
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
