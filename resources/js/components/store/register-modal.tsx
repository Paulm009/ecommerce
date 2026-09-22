import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export type RegisteredData = {
    name: string;
    email: string;
    phone?: string;
};

type RegisterModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialName?: string;
    initialEmail?: string;
    initialPhone?: string;
    onRegistered: (data: RegisteredData) => void;
};

const readCookie = (name: string): string => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : '';
};

export function RegisterModal({
    open,
    onOpenChange,
    initialName = '',
    initialEmail = '',
    initialPhone = '',
    onRegistered,
}: RegisterModalProps) {
    const form = useForm({
        name: initialName,
        email: initialEmail,
        phone: initialPhone,
        password: '',
        password_confirmation: '',
    });
    const [processing, setProcessing] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        form.clearErrors();

        try {
            const response = await fetch(store.url(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
                },
                body: JSON.stringify(form.data),
            });
            const body = await response.json().catch(() => ({}));

            if (response.status === 422 && body.errors) {
                form.setError(
                    Object.fromEntries(
                        Object.entries(body.errors).map(([key, messages]) => [
                            key,
                            Array.isArray(messages)
                                ? messages[0]
                                : String(messages),
                        ]),
                    ) as Partial<Record<keyof typeof form.data, string>>,
                );

                return;
            }

            if (!response.ok) {
                return;
            }

            onOpenChange(false);
            onRegistered({
                name: form.data.name,
                email: form.data.email,
                phone: form.data.phone || undefined,
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    'max-h-[90vh] overflow-y-auto border-white/10 bg-black text-white sm:max-w-md'
                }
            >
                <DialogHeader className={'text-left'}>
                    <DialogTitle className={'text-xl'}>
                        Crea tu contraseña
                    </DialogTitle>
                    <DialogDescription className={'text-zinc-400'}>
                        Completa tu registro para continuar con la compra. Los
                        datos del pedido ya están cargados.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className={'mt-2 space-y-4'}>
                    <div className={'space-y-2'}>
                        <Label>Nombre completo</Label>
                        <Input
                            type={'text'}
                            autoComplete="name"
                            placeholder={'Ana Pérez'}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className={'border-white/10 bg-white/5'}
                        />
                        {form.errors.name && (
                            <p className={'text-xs text-red-400'}>
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className={'space-y-2'}>
                        <Label>Correo</Label>
                        <Input
                            type={'email'}
                            autoComplete="email"
                            placeholder={'ana@ejemplo.com'}
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            className={'border-white/10 bg-white/5'}
                        />
                        {form.errors.email && (
                            <p className={'text-xs text-red-400'}>
                                {form.errors.email}
                            </p>
                        )}
                    </div>
                    <div className={'space-y-2'}>
                        <Label>Contraseña</Label>
                        <PasswordInput
                            autoComplete="new-password"
                            placeholder={'Contraseña'}
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            className={'border-white/10 bg-white/5'}
                        />
                        {form.errors.password && (
                            <p className={'text-xs text-red-400'}>
                                {form.errors.password}
                            </p>
                        )}
                    </div>
                    <div className={'space-y-2'}>
                        <Label>Confirmar contraseña</Label>
                        <PasswordInput
                            autoComplete="new-password"
                            placeholder={'Confirmar contraseña'}
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            className={'border-white/10 bg-white/5'}
                        />
                        {form.errors.password_confirmation && (
                            <p className={'text-xs text-red-400'}>
                                {form.errors.password_confirmation}
                            </p>
                        )}
                    </div>
                    <Button
                        type={'submit'}
                        disabled={processing}
                        className={
                            'w-full bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
                        }
                    >
                        {processing && <Spinner />}
                        Crear cuenta y continuar
                    </Button>
                    <p className={'text-center text-sm text-zinc-500'}>
                        ¿Ya tienes cuenta?{' '}
                        <Link
                            href={login()}
                            className={'text-cyan-300 hover:underline'}
                        >
                            Inicia sesión
                        </Link>
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}