import { Head } from '@inertiajs/react';
import { CartView } from '@/components/store/cart-view';

export default function StoreCart() {
    return (
        <>
            <Head title={'Carrito'} />
            <CartView />
        </>
    );
}
