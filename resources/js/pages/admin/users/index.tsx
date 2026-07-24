import { Head, router, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
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
import usersRoutes from '@/routes/admin/users';

type User = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    created_at: string;
    roles: { id: string; name: string; code: string }[];
};
type Role = { id: string; name: string; code: string };

export default function Users({
    users,
    roles,
}: {
    users: Paginated<User>;
    roles: Role[];
}) {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role_ids: roles[0] ? [roles[0].id] : [],
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(usersRoutes.store().url, { onSuccess: () => form.reset() });
    };

    return (
        <>
            <Head title={'Usuarios'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Seguridad'}
                    title={'Usuarios internos'}
                    description={
                        'Cuentas de operación con permisos heredados desde sus roles.'
                    }
                />
                <div className={'grid gap-6 xl:grid-cols-[1fr_380px]'}>
                    <Panel>
                        <div className={'overflow-x-auto'}>
                            <table className={'w-full text-sm'}>
                                <thead>
                                    <tr
                                        className={
                                            'border-b text-left text-muted-foreground'
                                        }
                                    >
                                        <th className={'pb-3'}>Usuario</th>
                                        <th>Roles</th>
                                        <th>Estado</th>
                                        <th>Alta</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className={'border-b last:border-0'}
                                        >
                                            <td className={'py-4'}>
                                                <strong>{user.name}</strong>
                                                <small
                                                    className={
                                                        'block text-muted-foreground'
                                                    }
                                                >
                                                    {user.email}
                                                </small>
                                            </td>
                                            <td>
                                                {user.roles
                                                    .map((role) => role.name)
                                                    .join(', ')}
                                            </td>
                                            <td>
                                                <StateBadge
                                                    status={user.status}
                                                />
                                            </td>
                                            <td>{dateTime(user.created_at)}</td>
                                            <td>
                                                <Button
                                                    size={'sm'}
                                                    variant={'outline'}
                                                    onClick={() =>
                                                        router.patch(
                                                            usersRoutes.toggle(
                                                                user.id,
                                                            ).url,
                                                        )
                                                    }
                                                >
                                                    {user.status === 'active'
                                                        ? 'Desactivar'
                                                        : 'Activar'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={users} />
                    </Panel>
                    <Panel title={'Crear usuario'}>
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
                            <div>
                                <Label>Correo</Label>
                                <Input
                                    type={'email'}
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                />
                                <FieldError message={form.errors.email} />
                            </div>
                            <div>
                                <Label>Teléfono</Label>
                                <Input
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Rol</Label>
                                <select
                                    className={
                                        'h-9 w-full rounded-md border bg-background px-3 text-sm'
                                    }
                                    value={form.data.role_ids[0] ?? ''}
                                    onChange={(e) =>
                                        form.setData('role_ids', [
                                            e.target.value,
                                        ])
                                    }
                                >
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={'grid grid-cols-2 gap-3'}>
                                <div>
                                    <Label>Contraseña</Label>
                                    <Input
                                        type={'password'}
                                        value={form.data.password}
                                        onChange={(e) =>
                                            form.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Confirmar</Label>
                                    <Input
                                        type={'password'}
                                        value={form.data.password_confirmation}
                                        onChange={(e) =>
                                            form.setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <FieldError message={form.errors.password} />
                            <Button
                                className={'w-full'}
                                disabled={form.processing}
                            >
                                <UserPlus />
                                Crear cuenta
                            </Button>
                        </form>
                    </Panel>
                </div>
            </div>
        </>
    );
}

Users.layout = {
    breadcrumbs: [{ title: 'Usuarios', href: usersRoutes.index() }],
};
