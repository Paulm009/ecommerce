import { Head, useForm } from '@inertiajs/react';
import { Banknote, DoorClosed, DoorOpen, MoveDown, MoveUp } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { dateTime, money } from '@/lib/platform';
import type { Paginated } from '@/lib/platform';
import cash from '@/routes/cash';
import movements from '@/routes/cash/movements';

type Movement = {
    id: string;
    movement_type: string;
    direction: string;
    amount: string;
    description: string;
    created_at: string;
};
type Session = {
    id: string;
    session_number: string;
    status: string;
    opening_amount: string;
    opened_at: string;
    movements: Movement[];
    pos_sales: { sale: { total_amount: string; status: string } }[];
};
type Register = { name: string; code: string };
type History = {
    id: string;
    session_number: string;
    status: string;
    opened_at: string;
    opening_amount: string;
    declared_amount: string | null;
    expected_amount: string | null;
};

export default function Cash({
    register,
    currentSession,
    history,
}: {
    register: Register;
    currentSession: Session | null;
    history: Paginated<History>;
}) {
    const opening = useForm({ opening_amount: '0.00' });
    const movement = useForm({ direction: 'in', amount: '', description: '' });
    const closing = useForm({ declared_amount: '', closing_notes: '' });
    const expected = currentSession
        ? Number(currentSession.opening_amount) +
          currentSession.movements.reduce(
              (sum, item) =>
                  sum +
                  Number(item.amount) * (item.direction === 'in' ? 1 : -1),
              0,
          )
        : 0;

    return (
        <>
            <Head title={'Caja'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Control de efectivo'}
                    title={register.name}
                    description={`Registro ${register.code} · una sola sesión abierta por caja.`}
                    action={
                        <StateBadge
                            status={currentSession?.status ?? 'closed'}
                        />
                    }
                />
                {!currentSession ? (
                    <Panel title={'Abrir caja'} className={'max-w-md'}>
                        <form
                            onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                opening.post(cash.open().url);
                            }}
                            className={'space-y-4'}
                        >
                            <div>
                                <Label>Fondo inicial</Label>
                                <Input
                                    type={'number'}
                                    step={'0.01'}
                                    value={opening.data.opening_amount}
                                    onChange={(e) =>
                                        opening.setData(
                                            'opening_amount',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError
                                    message={opening.errors.opening_amount}
                                />
                            </div>
                            <Button disabled={opening.processing}>
                                <DoorOpen />
                                Abrir sesión
                            </Button>
                        </form>
                    </Panel>
                ) : (
                    <div className={'grid gap-6 xl:grid-cols-[1fr_380px]'}>
                        <div className={'space-y-6'}>
                            <div className={'grid gap-4 sm:grid-cols-3'}>
                                {[
                                    [
                                        'Fondo inicial',
                                        money(currentSession.opening_amount),
                                    ],
                                    [
                                        'Movimientos',
                                        money(
                                            expected -
                                                Number(
                                                    currentSession.opening_amount,
                                                ),
                                        ),
                                    ],
                                    ['Esperado', money(expected)],
                                ].map(([label, value]) => (
                                    <Panel key={label}>
                                        <p
                                            className={
                                                'text-sm text-muted-foreground'
                                            }
                                        >
                                            {label}
                                        </p>
                                        <strong
                                            className={'mt-2 block text-2xl'}
                                        >
                                            {value}
                                        </strong>
                                    </Panel>
                                ))}
                            </div>
                            <Panel title={'Movimientos de la sesión'}>
                                <div className={'space-y-2'}>
                                    {currentSession.movements.map((item) => (
                                        <div
                                            key={item.id}
                                            className={
                                                'flex justify-between rounded-lg border p-3 text-sm'
                                            }
                                        >
                                            <span className={'flex gap-3'}>
                                                {item.direction === 'in' ? (
                                                    <MoveUp
                                                        className={
                                                            'text-emerald-500'
                                                        }
                                                    />
                                                ) : (
                                                    <MoveDown
                                                        className={
                                                            'text-red-500'
                                                        }
                                                    />
                                                )}
                                                {item.description}
                                                <small
                                                    className={
                                                        'block text-muted-foreground'
                                                    }
                                                >
                                                    {dateTime(item.created_at)}
                                                </small>
                                            </span>
                                            <strong>
                                                {item.direction === 'in'
                                                    ? '+'
                                                    : '-'}
                                                {money(item.amount)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        </div>
                        <div className={'space-y-6'}>
                            <Panel title={'Movimiento manual'}>
                                <form
                                    onSubmit={(e: FormEvent) => {
                                        e.preventDefault();
                                        movement.post(
                                            movements.store(currentSession.id)
                                                .url,
                                            {
                                                onSuccess: () =>
                                                    movement.reset(),
                                            },
                                        );
                                    }}
                                    className={'space-y-3'}
                                >
                                    <div className={'grid grid-cols-2 gap-3'}>
                                        <select
                                            className={
                                                'h-9 rounded-md border bg-background px-3 text-sm'
                                            }
                                            value={movement.data.direction}
                                            onChange={(e) =>
                                                movement.setData(
                                                    'direction',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value={'in'}>
                                                Ingreso
                                            </option>
                                            <option value={'out'}>
                                                Salida
                                            </option>
                                        </select>
                                        <Input
                                            type={'number'}
                                            step={'0.01'}
                                            placeholder={'Monto'}
                                            value={movement.data.amount}
                                            onChange={(e) =>
                                                movement.setData(
                                                    'amount',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <Textarea
                                        placeholder={'Descripción y motivo'}
                                        value={movement.data.description}
                                        onChange={(e) =>
                                            movement.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <Button className={'w-full'}>
                                        <Banknote />
                                        Registrar
                                    </Button>
                                </form>
                            </Panel>
                            <Panel title={'Cerrar caja'}>
                                <form
                                    onSubmit={(e: FormEvent) => {
                                        e.preventDefault();
                                        closing.post(
                                            cash.close(currentSession.id).url,
                                        );
                                    }}
                                    className={'space-y-3'}
                                >
                                    <div>
                                        <Label>Monto contado</Label>
                                        <Input
                                            type={'number'}
                                            step={'0.01'}
                                            value={closing.data.declared_amount}
                                            onChange={(e) =>
                                                closing.setData(
                                                    'declared_amount',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <Textarea
                                        placeholder={'Notas de cierre'}
                                        value={closing.data.closing_notes}
                                        onChange={(e) =>
                                            closing.setData(
                                                'closing_notes',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <Button
                                        variant={'destructive'}
                                        className={'w-full'}
                                    >
                                        <DoorClosed />
                                        Cerrar sesión
                                    </Button>
                                </form>
                            </Panel>
                        </div>
                    </div>
                )}
                <Panel title={'Historial'}>
                    <div className={'overflow-x-auto'}>
                        <table className={'w-full text-sm'}>
                            <tbody>
                                {history.data.map((session) => (
                                    <tr key={session.id} className={'border-b'}>
                                        <td className={'py-3 font-bold'}>
                                            {session.session_number}
                                        </td>
                                        <td>{dateTime(session.opened_at)}</td>
                                        <td>
                                            <StateBadge
                                                status={session.status}
                                            />
                                        </td>
                                        <td>{money(session.opening_amount)}</td>
                                        <td>
                                            {session.declared_amount
                                                ? money(session.declared_amount)
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={history} />
                </Panel>
            </div>
        </>
    );
}

Cash.layout = { breadcrumbs: [{ title: 'Caja', href: cash.index() }] };
