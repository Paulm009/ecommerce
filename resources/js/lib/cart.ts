export type CartItem = {
    product_variant_id: string;
    product_name: string;
    variant_name: string | null;
    sku: string;
    quantity: number;
    unit_price: string;
    available_quantity: number;
};

const cartKey = 'eventa-product-cart';

export const readCart = (): CartItem[] => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const parsed = JSON.parse(window.localStorage.getItem(cartKey) ?? '[]');

        return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
        return [];
    }
};

export const writeCart = (items: CartItem[]) => {
    window.localStorage.setItem(cartKey, JSON.stringify(items));
    window.dispatchEvent(new Event('eventa-cart-updated'));
};

export const addCartItem = (item: CartItem) => {
    const items = readCart();
    const existing = items.find(
        (candidate) => candidate.product_variant_id === item.product_variant_id,
    );

    if (existing) {
        existing.quantity = Math.min(
            existing.available_quantity,
            existing.quantity + item.quantity,
        );
        writeCart(items);

        return;
    }

    writeCart([...items, item]);
};

export const clearCart = () => writeCart([]);
