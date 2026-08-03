import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CreditCard,
    ScanLine,
    ShoppingBag,
    Sparkles,
    TicketCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import events from '@/routes/events';
import store from '@/routes/store';

export default function Welcome() {
    return (
        <>
            <Head title={'Entradas y experiencias'} />
            <section
                className={'relative overflow-hidden border-b border-white/10'}
            >
                <div
                    className={
                        'absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(209,31,22,.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(124,25,22,.22),transparent_40%)]'
                    }
                />
                <div
                    className={
                        'relative mx-auto grid min-h-[76vh] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr]'
                    }
                >
                    <div>
                        <div
                            className={
                                'mb-6 inline-flex items-center gap-2 rounded-full border border-brand-light/30 bg-brand/10 px-4 py-2 text-sm text-brand-light'
                            }
                        >
                            <Sparkles className={'size-4'} /> Tu próxima
                            experiencia comienza aquí
                        </div>
                        <h1
                            className={
                                'max-w-4xl text-5xl leading-[.95] font-black tracking-[-.05em] sm:text-7xl'
                            }
                        >
                            Vive el evento.{' '}
                            <span className={'text-brand'}>
                                Nosotros resolvemos el resto.
                            </span>
                        </h1>
                        <p
                            className={
                                'mt-7 max-w-2xl text-lg leading-8 text-zinc-400'
                            }
                        >
                            Compra entradas, elige tu ubicación, paga con QR y
                            recibe tu acceso digital. También encuentra
                            productos oficiales y retíralos con un flujo simple
                            y seguro.
                        </p>
                        <div className={'mt-9 flex flex-wrap gap-3'}>
                            <Button
                                asChild
                                size={'lg'}
                                className={
                                    'bg-brand text-white hover:bg-brand-hover'
                                }
                            >
                                <Link href={events.index()}>
                                    Explorar eventos <ArrowRight />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size={'lg'}
                                variant={'outline'}
                                className={'border-white/15 bg-transparent'}
                            >
                                <Link href={store.index()}>
                                    Visitar tienda <ShoppingBag />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className={'relative mx-auto w-full max-w-lg'}>
                        <div
                            className={
                                'rotate-2 rounded-[2rem] border border-white/15 bg-white/[.07] p-5 shadow-2xl shadow-brand/20 backdrop-blur'
                            }
                        >
                            <div
                                className={
                                    'aspect-[4/3] rounded-[1.4rem] bg-gradient-to-br from-brand via-brand-dark to-black p-8 text-white'
                                }
                            >
                                <CalendarDays className={'size-12'} />
                                <p
                                    className={
                                        'mt-20 text-sm font-bold tracking-[.25em] uppercase'
                                    }
                                >
                                    Experiencia en vivo
                                </p>
                                <p className={'mt-2 text-4xl font-black'}>
                                    Todo en un solo ticket.
                                </p>
                            </div>
                            <div
                                className={
                                    'grid grid-cols-3 gap-3 pt-5 text-center text-xs text-zinc-400'
                                }
                            >
                                <span>
                                    <TicketCheck
                                        className={
                                            'mx-auto mb-2 text-brand-light'
                                        }
                                    />
                                    Elige
                                </span>
                                <span>
                                    <CreditCard
                                        className={
                                            'mx-auto mb-2 text-brand-light'
                                        }
                                    />
                                    Paga
                                </span>
                                <span>
                                    <ScanLine
                                        className={
                                            'mx-auto mb-2 text-brand-light'
                                        }
                                    />
                                    Ingresa
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className={'mx-auto max-w-7xl px-4 py-20 sm:px-6'}>
                <p
                    className={
                        'text-sm font-bold tracking-[.25em] text-brand uppercase'
                    }
                >
                    Plataforma integral
                </p>
                <h2
                    className={'mt-3 max-w-2xl text-3xl font-black sm:text-5xl'}
                >
                    Una compra clara de principio a fin.
                </h2>
                <div className={'mt-10 grid gap-4 md:grid-cols-3'}>
                    {[
                        [
                            'Entradas a tu manera',
                            'Ubicaciones individuales, mesas y entradas con múltiples usos.',
                        ],
                        [
                            'Pago QR inmediato',
                            'Reserva protegida mientras completas el pago y confirmación automática.',
                        ],
                        [
                            'Tienda oficial',
                            'Stock en tiempo real para compra web y punto de venta.',
                        ],
                    ].map(([title, copy], index) => (
                        <article
                            key={title}
                            className={
                                'rounded-2xl border border-white/10 bg-white/[.03] p-7 transition hover:border-brand/40'
                            }
                        >
                            <span className={'text-sm font-black text-brand'}>
                                0{index + 1}
                            </span>
                            <h3 className={'mt-8 text-xl font-bold'}>
                                {title}
                            </h3>
                            <p className={'mt-3 leading-7 text-zinc-400'}>
                                {copy}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}
