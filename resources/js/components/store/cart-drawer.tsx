import { CartView } from '@/components/store/cart-view';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export function CartDrawer({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={'right'}
                className={
                    'w-full gap-0 overflow-x-hidden overflow-y-auto border-white/10 bg-black p-0 text-white sm:max-w-4xl'
                }
            >
                <SheetTitle className={'sr-only'}>Tu carrito</SheetTitle>
                <CartView />
            </SheetContent>
        </Sheet>
    );
}
