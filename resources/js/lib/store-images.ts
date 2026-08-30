// El backend no expone fotos de producto. Acá se asigna una imagen local
// (public/images/store) a cada producto según su slug.

const CATALOG_IMAGES = [
    '/images/store/prod1.jpg',
    '/images/store/prod2.jpg',
    '/images/store/prod3.jpg',
    '/images/store/prod4.jpg',
    '/images/store/prod5.jpg',
    '/images/store/prod6.jpg',
    '/images/store/prod7.jpg',
    '/images/store/prod8.jpg',
    '/images/store/prod9.jpg',
    '/images/store/prod10.jpg',
];

const BY_SLUG: Record<string, string> = {
    'polera-eventa-tour': '/images/store/prod1.jpg',
    'gorra-festival': '/images/store/prod2.jpg',
    'poster-numerado': '/images/store/prod3.jpg',
    'buzo-con-capucha': '/images/store/prod4.jpg',
    'tote-bag-lona': '/images/store/prod5.jpg',
    'sticker-pack': '/images/store/prod6.jpg',
    'taza-ceramica': '/images/store/prod7.jpg',
    'pin-esmaltado': '/images/store/prod8.jpg',
    'bandana-estampada': '/images/store/prod9.jpg',
    'camiseta-tie-dye': '/images/store/prod10.jpg',
};

/** Imagen local estable para un producto (misma imagen siempre para el mismo slug). */
export function storeProductImage(slug: string): string {
    if (slug in BY_SLUG) {
        return BY_SLUG[slug];
    }

    let hash = 0;

    for (let index = 0; index < slug.length; index += 1) {
        hash = (hash * 31 + slug.charCodeAt(index)) | 0;
    }

    return CATALOG_IMAGES[Math.abs(hash) % CATALOG_IMAGES.length];
}
