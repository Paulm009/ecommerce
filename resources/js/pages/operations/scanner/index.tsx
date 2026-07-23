import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Camera,
    CameraOff,
    CheckCircle2,
    ScanLine,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    FieldError,
    PageHeader,
    Panel,
    StateBadge,
} from '@/components/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateTime } from '@/lib/platform';
import scanner from '@/routes/scanner';

type Occurrence = {
    id: string;
    starts_at: string;
    status: string;
    event: { name: string };
};
type Scan = {
    id: string;
    scan_result: string;
    scanned_at: string;
    quota_after: number | null;
    ticket: { public_code: string } | null;
};

type BarcodeDetectorInstance = {
    detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options: {
    formats: string[];
}) => BarcodeDetectorInstance;

export default function Scanner({
    occurrences,
    history,
}: {
    occurrences: Occurrence[];
    history: Scan[];
}) {
    const flash = usePage<{
        flash: { scanResult: { result: string; remaining: number } | null };
    }>().props.flash;
    const form = useForm({ token: '' });
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectorTimerRef = useRef<number | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraMessage, setCameraMessage] = useState<string | null>(null);
    const [occurrence = { id: '' }] = occurrences;
    const selected = form.data.token.includes('|')
        ? form.data.token.split('|')[0]
        : form.data.token;
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ token: data.token.trim() }));
        form.post(
            scanner.scan(
                (document.getElementById('occurrence') as HTMLSelectElement)
                    .value,
            ).url,
            { preserveScroll: true, onSuccess: () => form.reset() },
        );
    };
    const stopCamera = () => {
        if (detectorTimerRef.current !== null) {
            window.clearInterval(detectorTimerRef.current);
            detectorTimerRef.current = null;
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraActive(false);
    };
    const startCamera = async () => {
        setCameraMessage(null);
        const Detector = (
            window as typeof window & {
                BarcodeDetector?: BarcodeDetectorConstructor;
            }
        ).BarcodeDetector;

        if (!Detector || !navigator.mediaDevices?.getUserMedia) {
            setCameraMessage(
                'La lectura QR directa no esta disponible. Pega el token o escribe el codigo publico.',
            );

            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;
            setCameraActive(true);

            if (!videoRef.current) {
                return;
            }

            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            const detector = new Detector({ formats: ['qr_code'] });
            detectorTimerRef.current = window.setInterval(async () => {
                if (!videoRef.current) {
                    return;
                }

                const [result] = await detector.detect(videoRef.current);

                if (result?.rawValue) {
                    form.setData('token', result.rawValue);
                    stopCamera();
                    setCameraMessage('Codigo leido. Presiona Validar entrada.');
                }
            }, 600);
        } catch {
            stopCamera();
            setCameraMessage(
                'No fue posible abrir la camara. Revisa el permiso del navegador.',
            );
        }
    };

    useEffect(
        () => () => {
            if (detectorTimerRef.current !== null) {
                window.clearInterval(detectorTimerRef.current);
            }

            streamRef.current?.getTracks().forEach((track) => track.stop());
        },
        [],
    );

    return (
        <>
            <Head title={'Escáner'} />
            <div className={'flex flex-1 flex-col gap-6 p-4 sm:p-6'}>
                <PageHeader
                    eyebrow={'Control de acceso'}
                    title={'Escáner de entradas'}
                    description={
                        'Valida el token, la función y el cupo restante dentro de una transacción.'
                    }
                />
                <div className={'grid gap-6 lg:grid-cols-[420px_1fr]'}>
                    <Panel title={'Registrar acceso'}>
                        <form onSubmit={submit} className={'space-y-4'}>
                            <div>
                                <label className={'text-sm font-medium'}>
                                    Función
                                </label>
                                <select
                                    id={'occurrence'}
                                    defaultValue={occurrence.id}
                                    className={
                                        'mt-2 h-10 w-full rounded-md border bg-background px-3'
                                    }
                                >
                                    {occurrences.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.event.name} ·{' '}
                                            {dateTime(item.starts_at)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={'text-sm font-medium'}>
                                    Token QR o cÃ³digo pÃºblico
                                </label>
                                <Input
                                    autoFocus
                                    value={form.data.token}
                                    onChange={(e) =>
                                        form.setData('token', e.target.value)
                                    }
                                    placeholder={
                                        'Escanea el QR o escribe EVT-...'
                                    }
                                    className={'mt-2 font-mono'}
                                />
                                <FieldError message={form.errors.token} />
                            </div>
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                className={
                                    cameraActive
                                        ? 'aspect-video w-full rounded-xl bg-black object-cover'
                                        : 'hidden'
                                }
                            />
                            <Button
                                type={'button'}
                                variant={'outline'}
                                className={'w-full'}
                                onClick={
                                    cameraActive ? stopCamera : startCamera
                                }
                            >
                                {cameraActive ? <CameraOff /> : <Camera />}
                                {cameraActive
                                    ? 'Cerrar camara'
                                    : 'Escanear con camara'}
                            </Button>
                            {cameraMessage && (
                                <p className={'text-sm text-muted-foreground'}>
                                    {cameraMessage}
                                </p>
                            )}
                            <Button
                                className={'h-12 w-full text-base'}
                                disabled={form.processing || !selected}
                            >
                                <ScanLine />
                                Validar entrada
                            </Button>
                        </form>
                        {flash.scanResult && (
                            <div
                                className={`mt-5 rounded-xl p-5 text-center ${flash.scanResult.result === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}
                            >
                                {flash.scanResult.result === 'accepted' ? (
                                    <CheckCircle2
                                        className={'mx-auto size-12'}
                                    />
                                ) : (
                                    <XCircle className={'mx-auto size-12'} />
                                )}
                                <strong className={'mt-3 block text-xl'}>
                                    {flash.scanResult.result === 'accepted'
                                        ? 'Acceso permitido'
                                        : 'Acceso rechazado'}
                                </strong>
                                <span className={'text-sm'}>
                                    {flash.scanResult.remaining} usos restantes
                                </span>
                            </div>
                        )}
                    </Panel>
                    <Panel title={'Últimos escaneos'}>
                        <div className={'overflow-x-auto'}>
                            <table className={'w-full text-sm'}>
                                <thead>
                                    <tr
                                        className={
                                            'border-b text-left text-muted-foreground'
                                        }
                                    >
                                        <th className={'pb-3'}>Entrada</th>
                                        <th>Resultado</th>
                                        <th>Restante</th>
                                        <th>Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((scan) => (
                                        <tr
                                            key={scan.id}
                                            className={'border-b last:border-0'}
                                        >
                                            <td className={'py-3 font-mono'}>
                                                {scan.ticket?.public_code ??
                                                    'No identificada'}
                                            </td>
                                            <td>
                                                <StateBadge
                                                    status={scan.scan_result}
                                                />
                                            </td>
                                            <td>{scan.quota_after ?? '—'}</td>
                                            <td>{dateTime(scan.scanned_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
            </div>
        </>
    );
}

Scanner.layout = { breadcrumbs: [{ title: 'Escáner', href: scanner.index() }] };
