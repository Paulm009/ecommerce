import { Head } from '@inertiajs/react';
import type { ProductDetail } from '@/components/store/product-detail-view';
import { ProductDetailView } from '@/components/store/product-detail-view';

export default function StoreShow({ product }: { product: ProductDetail }) {
    return (
        <>
            <Head title={product.name} />
            <ProductDetailView product={product} />
        </>
    );
}
