import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { login, register } from '@/routes';

export default function AuthRequiredDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inicia sesión para continuar</DialogTitle>
                    <DialogDescription>
                        Necesitas una cuenta para generar el pago QR. Inicia
                        sesión o regístrate para completar tu compra.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button asChild variant={'outline'}>
                        <Link href={register()}>Crear cuenta</Link>
                    </Button>
                    <Button asChild className={'bg-brand hover:bg-brand-hover'}>
                        <Link href={login()}>Iniciar sesión</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
