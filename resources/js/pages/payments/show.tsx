import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Copy,
    QrCode,
    RefreshCw,
    TriangleAlert,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { dateTime, money, statusLabel } from '@/lib/platform';
import payments from '@/routes/payments';

type Payment = {
    id: string;
    amount: string;
    currency_code: string;
    status: string;
    qr_expires_at: string;
    provider_reference: string | null;
    sale: { public_number: string; status: string };
};

export default function PaymentShow({
    payment,
    qrPayload,
    qrImage,
    canSimulate,
    tickets,
}: {
    payment: Payment;
    qrPayload: string | null;
    qrImage: string | null;
    canSimulate: boolean;
    tickets: { public_code: string; url: string }[];
}) {
    const [checking, setChecking] = useState(false);
    const paid = payment.status === 'paid' && payment.sale.status === 'paid';
    useEffect(() => {
        if (paid) {
            return;
        }

        const timer = window.setInterval(async () => {
            const response = await fetch(payments.status(payment.id).url, {
                headers: { Accept: 'application/json' },
            });
            const result = await response.json();

            if (result.status === 'paid') {
                router.reload({ only: ['payment', 'tickets'] });
            }
        }, 4000);

        return () => window.clearInterval(timer);
    }, [paid, payment.id]);
    const refresh = async () => {
        setChecking(true);
        await fetch(payments.status(payment.id).url, {
            headers: { Accept: 'application/json' },
        });
        router.reload({
            only: ['payment', 'tickets'],
            onFinish: () => setChecking(false),
        });
    };

    return (
        <>
            <Head title={paid ? 'Pago confirmado' : 'Completa tu pago'} />
            <section className={'mx-auto max-w-3xl px-4 py-16 sm:px-6'}>
                <div
                    className={
                        'rounded-[2rem] border border-white/10 bg-white/[.04] p-7 sm:p-10'
                    }
                >
                    {paid ? (
                        <div className={'text-center'}>
                            <CheckCircle2
                                className={'mx-auto size-16 text-emerald-400'}
                            />
                            <h1 className={'mt-5 text-4xl font-black'}>
                                Pago confirmado
                            </h1>
                            <p className={'mt-3 text-zinc-400'}>
                                La operación {payment.sale.public_number} fue
                                procesada correctamente.
                            </p>
                            {tickets.length > 0 && (
                                <div className={'mt-8 space-y-3'}>
                                    {tickets.map((ticket) => (
                                        <Button
                                            key={ticket.public_code}
                                            asChild
                                            className={
                                                'w-full bg-brand text-white hover:bg-brand-hover'
                                            }
                                        >
                                            <Link href={ticket.url}>
                                                Ver entrada {ticket.public_code}
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {tickets.length === 0 && (
                                <p
                                    className={
                                        'mt-8 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200'
                                    }
                                >
                                    Tu pedido ya está confirmado. Conserva el
                                    número {payment.sale.public_number}.
                                </p>
                            )}
                        </div>
                    ) : payment.sale.status === 'payment_incident' ? (
                        <div className={'text-center'}>
                            <TriangleAlert
                                className={'mx-auto size-16 text-amber-400'}
                            />
                            <h1 className={'mt-5 text-3xl font-black'}>
                                Pago en revisión
                            </h1>
                            <p className={'mt-3 text-zinc-400'}>
                                La confirmación llegó fuera de tiempo. El equipo
                                administrativo revisará la devolución.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={'text-center'}>
                                <p
                                    className={
                                        'text-sm font-bold tracking-[.2em] text-brand-light uppercase'
                                    }
                                >
                                    Pago QR
                                </p>
                                <h1 className={'mt-3 text-4xl font-black'}>
                                    {money(
                                        payment.amount,
                                        payment.currency_code,
                                    )}
                                </h1>
                                <p className={'mt-2 text-zinc-400'}>
                                    Escanea desde la app de tu banco
                                </p>
                            </div>
                            <div
                                className={
                                    'mx-auto mt-8 grid aspect-square max-w-xs place-items-center rounded-3xl bg-white p-7 text-zinc-950 shadow-2xl'
                                }
                            >
                                <div className={'w-full text-center break-all'}>
                                    {qrImage ? (
                                        <img
                                            src={qrImage}
                                            alt={'CÃ³digo QR de pago'}
                                            className={
                                                'mx-auto aspect-square w-full'
                                            }
                                        />
                                    ) : (
                                        <QrCode className={'mx-auto size-36'} />
                                    )}
                                    <p
                                        className={
                                            'mt-4 font-mono text-[10px] leading-4'
                                        }
                                    >
                                        {qrPayload}
                                    </p>
                                </div>
                            </div>
                            <div
                                className={
                                    'mt-7 flex flex-col items-center gap-3 text-sm text-zinc-400'
                                }
                            >
                                <span className={'flex items-center gap-2'}>
                                    <Clock3 className={'size-4'} />
                                    Vence {dateTime(payment.qr_expires_at)}
                                </span>
                                <button
                                    type={'button'}
                                    className={
                                        'flex items-center gap-2 hover:text-white'
                                    }
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            qrPayload ?? '',
                                        )
                                    }
                                >
                                    <Copy className={'size-4'} />
                                    Copiar datos QR
                                </button>
                            </div>
                            <div
                                className={
                                    'mt-8 flex flex-col gap-3 sm:flex-row'
                                }
                            >
                                <Button
                                    variant={'outline'}
                                    className={
                                        'flex-1 border-white/15 bg-transparent'
                                    }
                                    disabled={checking}
                                    onClick={refresh}
                                >
                                    <RefreshCw
                                        className={
                                            checking ? 'animate-spin' : ''
                                        }
                                    />
                                    Verificar pago
                                </Button>
                                {canSimulate && (
                                    <Button
                                        className={
                                            'flex-1 bg-brand text-white hover:bg-brand-hover'
                                        }
                                        onClick={() =>
                                            router.post(
                                                payments.simulate(payment.id)
                                                    .url,
                                            )
                                        }
                                    >
                                        Simular confirmación
                                    </Button>
                                )}
                            </div>
                            <p
                                className={
                                    'mt-5 text-center text-xs text-zinc-600'
                                }
                            >
                                Estado: {statusLabel(payment.status)} · Ref.{' '}
                                {payment.provider_reference}
                            </p>
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
