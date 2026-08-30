import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartDrawer } from '@/components/store/cart-drawer';
import { readCart } from '@/lib/cart';
import { cn } from '@/lib/utils';

export function CartFloatingBubble() {
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [bump, setBump] = useState(false);

    useEffect(() => {
        const sync = () =>
            setCount(
                readCart().reduce((sum, item) => sum + item.quantity, 0),
            );

        sync();
        window.addEventListener('eventa-cart-updated', sync);

        return () => window.removeEventListener('eventa-cart-updated', sync);
    }, []);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const onAdd = () => {
            setBump(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setBump(false), 600);
        };

        window.addEventListener('eventa-cart-item-added', onAdd);

        return () => {
            window.removeEventListener('eventa-cart-item-added', onAdd);
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        const onOpenDrawer = () => setOpen(true);

        window.addEventListener('eventa-cart-open-drawer', onOpenDrawer);

        return () =>
            window.removeEventListener(
                'eventa-cart-open-drawer',
                onOpenDrawer,
            );
    }, []);

    return (
        <>
            <button
                type={'button'}
                onClick={() => setOpen(true)}
                aria-label={'Abrir carrito'}
                className={cn(
                    'fixed right-4 z-40 flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-black/40 transition hover:bg-brand-hover sm:right-6 sm:size-14',
                    'bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6',
                    bump && 'animate-bounce',
                )}
            >
                <ShoppingCart className={'size-5 sm:size-6'} />
                {count > 0 && (
                    <span
                        className={
                            'absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand'
                        }
                    >
                        {count}
                    </span>
                )}
            </button>
            <CartDrawer open={open} onOpenChange={setOpen} />
        </>
    );
}
