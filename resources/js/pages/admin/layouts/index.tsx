import { Head, router, useForm } from '@inertiajs/react';
import { FileJson, Map, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    FieldError,
    PageHeader,
    Pagination,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dateTime } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import layoutsRoutes from '@/routes/admin/layouts';

type Layout = {
    id: string;
    name: string;
    version: number;
    schema_version: string;
    status: string;
    validation_status: string;
    nodes_count: number;
    created_at: string;
};

export default function Layouts({ layouts }: { layouts: Paginated<Layout> }) {
    const form = useForm<{ name: string; layout_file: File | null }>({
        name: '',
        layout_file: null,
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(layoutsRoutes.store().url, {
            forceFormData: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title={'Planos'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Configuración de recintos'}
                    title={'Plantillas de planos'}
                    description={
                        'Importa JSON versionado; cada evento recibe su propia copia operativa.'
                    }
                />
                <div className={'grid gap-6 lg:grid-cols-[1fr_360px]'}>
                    <Panel>
                        <div className={'grid gap-3 sm:grid-cols-2'}>
                            {layouts.data.map((layout) => (
                                <article
                                    key={layout.id}
                                    className={'rounded-lg border p-4'}
                                >
                                    <div
                                        className={'flex justify-between gap-3'}
                                    >
                                        <span
                                            className={
                                                'rounded-lg bg-primary/10 p-3'
                                            }
                                        >
                                            <Map />
                                        </span>
                                        <StateBadge status={layout.status} />
                                    </div>
                                    <h2 className={'mt-4 font-bold'}>
                                        {layout.name}{' '}
                                        <span
                                            className={'text-muted-foreground'}
                                        >
                                            v{layout.version}
                                        </span>
                                    </h2>
                                    <p
                                        className={
                                            'mt-1 text-sm text-muted-foreground'
                                        }
                                    >
                                        {layout.nodes_count} nodos · schema{' '}
                                        {layout.schema_version}
                                    </p>
                                    <div
                                        className={
                                            'mt-4 flex items-center justify-between'
                                        }
                                    >
                                        <small
                                            className={'text-muted-foreground'}
                                        >
                                            {dateTime(layout.created_at)}
                                        </small>
                                        <Button
                                            size={'sm'}
                                            variant={'outline'}
                                            onClick={() =>
                                                router.patch(
                                                    layoutsRoutes.toggle(
                                                        layout.id,
                                                    ).url,
                                                )
                                            }
                                        >
                                            {layout.status === 'active'
                                                ? 'Desactivar'
                                                : 'Activar'}
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <Pagination page={layouts} />
                    </Panel>
                    <Panel
                        title={'Importar plantilla'}
                        description={'JSON máximo 2 MB con un arreglo nodes.'}
                    >
                        <form onSubmit={submit} className={'space-y-4'}>
                            <div>
                                <Label>Nombre</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                />
                                <FieldError message={form.errors.name} />
                            </div>
                            <label
                                className={
                                    'grid min-h-40 cursor-pointer place-items-center rounded-xl border border-dashed text-center'
                                }
                            >
                                <span>
                                    <FileJson
                                        className={
                                            'mx-auto mb-3 text-muted-foreground'
                                        }
                                    />
                                    <strong>
                                        {form.data.layout_file?.name ??
                                            'Seleccionar JSON'}
                                    </strong>
                                    <small
                                        className={
                                            'mt-1 block text-muted-foreground'
                                        }
                                    >
                                        key, type, capacity y geometry
                                    </small>
                                </span>
                                <input
                                    type={'file'}
                                    accept={'.json,application/json'}
                                    className={'hidden'}
                                    onChange={(e) =>
                                        form.setData(
                                            'layout_file',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>
                            <FieldError message={form.errors.layout_file} />
                            <Button
                                className={'w-full'}
                                disabled={form.processing}
                            >
                                <Upload />
                                Importar y validar
                            </Button>
                        </form>
                    </Panel>
                </div>
            </div>
        </>
    );
}

Layouts.layout = {
    breadcrumbs: [{ title: 'Planos', href: layoutsRoutes.index() }],
};
