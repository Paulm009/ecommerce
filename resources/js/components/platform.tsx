import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { statusLabel } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div
            className={
                'flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end'
            }
        >
            <div>
                {eyebrow && (
                    <p
                        className={
                            'text-xs font-bold tracking-[.2em] text-muted-foreground uppercase'
                        }
                    >
                        {eyebrow}
                    </p>
                )}
                <h1 className={'mt-2 text-3xl font-black tracking-tight'}>
                    {title}
                </h1>
                {description && (
                    <p
                        className={
                            'mt-2 max-w-2xl text-sm text-muted-foreground'
                        }
                    >
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export function Panel({
    title,
    description,
    children,
    className = '',
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}
        >
            {title && <h2 className={'text-lg font-bold'}>{title}</h2>}
            {description && (
                <p className={'mt-1 text-sm text-muted-foreground'}>
                    {description}
                </p>
            )}
            <div className={title || description ? 'mt-5' : ''}>{children}</div>
        </section>
    );
}

export function StateBadge({ status }: { status: string }) {
    const positive = [
        'active',
        'published',
        'paid',
        'delivered',
        'resolved',
        'confirmed',
        'valid',
        'open',
    ].includes(status);
    const danger = [
        'expired',
        'cancelled',
        'failed',
        'voided',
        'exhausted',
        'invalid',
    ].includes(status);

    return (
        <Badge
            variant={
                danger ? 'destructive' : positive ? 'default' : 'secondary'
            }
        >
            {statusLabel(status)}
        </Badge>
    );
}

export function Pagination({
    page,
}: {
    page: Pick<
        Paginated<unknown>,
        'prev_page_url' | 'next_page_url' | 'current_page' | 'last_page'
    >;
}) {
    return (
        <div
            className={
                'mt-5 flex items-center justify-between text-sm text-muted-foreground'
            }
        >
            <span>
                Página {page.current_page} de {page.last_page}
            </span>
            <div className={'flex gap-2'}>
                {page.prev_page_url && (
                    <Button asChild size={'sm'} variant={'outline'}>
                        <Link href={page.prev_page_url}>Anterior</Link>
                    </Button>
                )}
                {page.next_page_url && (
                    <Button asChild size={'sm'} variant={'outline'}>
                        <Link href={page.next_page_url}>Siguiente</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className={'mt-1 text-xs text-destructive'}>{message}</p>
    ) : null;
}
