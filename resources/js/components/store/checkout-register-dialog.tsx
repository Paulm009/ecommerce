import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CheckoutRegisterDialog({
    open,
    onOpenChange,
    processing,
    password,
    passwordConfirmation,
    errors,
    onPasswordChange,
    onPasswordConfirmationChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    processing: boolean;
    password: string;
    passwordConfirmation: string;
    errors: {
        buyer_email?: string;
        password?: string;
        password_confirmation?: string;
    };
    onPasswordChange: (value: string) => void;
    onPasswordConfirmationChange: (value: string) => void;
    onSubmit: () => void;
}) {
    const submit = (event: FormEvent) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crea tu cuenta para continuar</DialogTitle>
                    <DialogDescription>
                        Con tus datos crearemos tu cuenta. Solo elige una
                        contraseña para completar tu compra.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className={'space-y-4'}>
                    {errors.buyer_email && (
                        <p className={'text-sm text-red-400'}>
                            {errors.buyer_email}
                        </p>
                    )}
                    <div className={'space-y-2'}>
                        <Label htmlFor={'checkout-password'}>Contraseña</Label>
                        <Input
                            id={'checkout-password'}
                            type={'password'}
                            autoComplete={'new-password'}
                            value={password}
                            onChange={(event) =>
                                onPasswordChange(event.target.value)
                            }
                            className={'border-white/10 bg-white/5'}
                        />
                        {errors.password && (
                            <p className={'text-xs text-red-400'}>
                                {errors.password}
                            </p>
                        )}
                    </div>
                    <div className={'space-y-2'}>
                        <Label htmlFor={'checkout-password-confirmation'}>
                            Confirmar contraseña
                        </Label>
                        <Input
                            id={'checkout-password-confirmation'}
                            type={'password'}
                            autoComplete={'new-password'}
                            value={passwordConfirmation}
                            onChange={(event) =>
                                onPasswordConfirmationChange(event.target.value)
                            }
                            className={'border-white/10 bg-white/5'}
                        />
                        {errors.password_confirmation && (
                            <p className={'text-xs text-red-400'}>
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type={'button'}
                            variant={'outline'}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type={'submit'}
                            disabled={processing}
                            className={'bg-brand hover:bg-brand-hover'}
                        >
                            Crear cuenta y pagar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
