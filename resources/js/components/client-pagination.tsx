import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const MOBILE_PAGE_SIZE = 5;

export function useMobilePagination<T>(items: T[]) {
    const isMobile = useIsMobile();
    const [page, setPage] = useState(1);
    const pageCount = isMobile
        ? Math.max(1, Math.ceil(items.length / MOBILE_PAGE_SIZE))
        : 1;
    const currentPage = Math.min(page, pageCount);
    const visibleItems = isMobile
        ? items.slice(
              (currentPage - 1) * MOBILE_PAGE_SIZE,
              currentPage * MOBILE_PAGE_SIZE,
          )
        : items;
    const goToPage = (next: number) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return { visibleItems, currentPage, pageCount, goToPage, setPage };
}

export function ClientPagination({
    page,
    pageCount,
    onChange,
    label,
}: {
    page: number;
    pageCount: number;
    onChange: (page: number) => void;
    label: string;
}) {
    if (pageCount <= 1) {
        return null;
    }

    return (
        <nav
            aria-label={label}
            className={'mt-6 flex items-center justify-between gap-2'}
        >
            <Button
                variant={'outline'}
                size={'icon'}
                aria-label={'Página anterior'}
                disabled={page === 1}
                onClick={() => onChange(page - 1)}
                className={
                    'size-12 rounded-2xl border-brand/40 bg-brand/10 hover:bg-brand/20'
                }
            >
                <ChevronLeft className={'size-6'} />
            </Button>
            <div className={'flex flex-wrap justify-center gap-2'}>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                    (number) => (
                        <button
                            key={number}
                            type={'button'}
                            aria-current={number === page ? 'page' : undefined}
                            onClick={() => onChange(number)}
                            className={
                                'grid size-12 place-items-center rounded-2xl font-display text-xl transition ' +
                                (number === page
                                    ? 'bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white shadow-lg shadow-brand/40'
                                    : 'border border-foreground/10 bg-card text-muted-foreground hover:border-brand/50 hover:text-foreground')
                            }
                        >
                            {number}
                        </button>
                    ),
                )}
            </div>
            <Button
                variant={'outline'}
                size={'icon'}
                aria-label={'Página siguiente'}
                disabled={page === pageCount}
                onClick={() => onChange(page + 1)}
                className={
                    'size-12 rounded-2xl border-brand/40 bg-brand/10 hover:bg-brand/20'
                }
            >
                <ChevronRight className={'size-6'} />
            </Button>
        </nav>
    );
}
