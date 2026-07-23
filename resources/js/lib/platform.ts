export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export const money = (value: string | number, currency = 'BOB') =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(
        Number(value),
    );

export const dateTime = (value: string) =>
    new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

export const sessionToken = () => {
    if (typeof window === 'undefined') {
        return 'server-rendered-session-token';
    }

    const existing = window.sessionStorage.getItem('commerce-session-token');

    if (existing) {
        return existing;
    }

    const created = crypto.randomUUID();
    window.sessionStorage.setItem('commerce-session-token', created);

    return created;
};

export const statusLabel = (status: string) =>
    ({
        draft: 'Borrador',
        published: 'Publicado',
        active: 'Activo',
        inactive: 'Inactivo',
        paid: 'Pagado',
        pending: 'Pendiente',
        pending_payment: 'Pendiente de pago',
        temporary_selection: 'Selección temporal',
        expired: 'Expirado',
        delivered: 'Entregado',
        open: 'Abierto',
        closed: 'Cerrado',
        resolved: 'Resuelto',
        exhausted: 'Agotado',
        voided: 'Anulado',
    })[status] ?? status;
