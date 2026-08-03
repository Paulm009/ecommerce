import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    LayoutDashboard,
    Menu,
    ShoppingBag,
    ShoppingCart,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { account, dashboard, home, login } from '@/routes';
import events from '@/routes/events';
import store from '@/routes/store';
import type { Auth } from '@/types';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const { auth } = usePage<{ auth: Auth }>().props;
    const authenticatedDestination =
        auth.user?.user_type === 'customer' ? account() : dashboard();

    return (
        <div className={'min-h-screen bg-black text-white'}>
            <header
                className={
                    'sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl'
                }
            >
                <div
                    className={
                        'mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6'
                    }
                >
                    <Link
                        href={home()}
                        className={'flex items-center gap-2.5'}
                        aria-label={'TiketMark · Inicio'}
                    >
                        <img
                            src={'/logo.svg'}
                            alt={'TiketMark'}
                            className={'h-9 w-auto'}
                        />
                        <span
                            className={
                                'text-xl font-black tracking-tight text-brand'
                            }
                        >
                            TiketMark
                        </span>
                    </Link>
                    <nav
                        className={
                            'hidden items-center gap-8 text-sm font-medium md:flex'
                        }
                    >
                        <Link
                            href={events.index()}
                            className={
                                'text-zinc-300 transition hover:text-white'
                            }
                        >
                            Eventos
                        </Link>
                        <Link
                            href={store.index()}
                            className={
                                'text-zinc-300 transition hover:text-white'
                            }
                        >
                            Tienda
                        </Link>
                        <Link
                            href={store.cart()}
                            className={
                                'text-zinc-300 transition hover:text-white'
                            }
                        >
                            Carrito
                        </Link>
                    </nav>
                    <div className={'hidden items-center gap-3 md:flex'}>
                        {auth.user ? (
                            <Button
                                asChild
                                variant={'outline'}
                                className={'border-white/15 bg-transparent'}
                            >
                                <Link href={authenticatedDestination}>
                                    <LayoutDashboard
                                        className={'mr-2 size-4'}
                                    />
                                    Panel
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                asChild
                                className={
                                    'bg-brand text-white hover:bg-brand-hover'
                                }
                            >
                                <Link href={login()}>Ingresar</Link>
                            </Button>
                        )}
                    </div>
                    <button
                        type={'button'}
                        className={'md:hidden'}
                        onClick={() => setOpen(!open)}
                        aria-label={'Abrir navegación'}
                    >
                        {open ? <X /> : <Menu />}
                    </button>
                </div>
                {open && (
                    <nav
                        className={
                            'space-y-2 border-t border-white/10 px-4 py-4 md:hidden'
                        }
                    >
                        <Link
                            href={events.index()}
                            className={
                                'flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5'
                            }
                        >
                            <CalendarDays className={'size-4'} />
                            Eventos
                        </Link>
                        <Link
                            href={store.index()}
                            className={
                                'flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5'
                            }
                        >
                            <ShoppingBag className={'size-4'} />
                            Tienda
                        </Link>
                        <Link
                            href={store.cart()}
                            className={
                                'flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5'
                            }
                        >
                            <ShoppingCart className={'size-4'} />
                            Carrito
                        </Link>
                        <Link
                            href={
                                auth.user ? authenticatedDestination : login()
                            }
                            className={
                                'flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5'
                            }
                        >
                            <LayoutDashboard className={'size-4'} />
                            {auth.user ? 'Panel' : 'Ingresar'}
                        </Link>
                    </nav>
                )}
            </header>
            <main>{children}</main>
            <footer
                className={
                    'border-t border-white/10 py-10 text-center text-sm text-zinc-500'
                }
            >
                TiketMark · Eventos, entradas y productos en un solo lugar.
            </footer>
        </div>
    );
}
