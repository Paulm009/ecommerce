import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { ProductDetail } from './product-detail-view';
import { ProductDetailView } from './product-detail-view';

export function ProductDetailModal({
    product,
    onOpenChange,
}: {
    product: (ProductDetail & { slug: string }) | null;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={product !== null} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    'max-h-[90vh] overflow-y-auto border-white/10 bg-black p-0 text-white sm:max-w-4xl'
                }
            >
                {product && (
                    <ProductDetailView key={product.slug} product={product} />
                )}
            </DialogContent>
        </Dialog>
    );
}
