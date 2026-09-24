export type TicketExportData = {
    eventName: string;
    dateText: string;
    venueText: string;
    qrImage: string;
    publicCode: string;
    statusText: string;
    holder: string;
    accessText: string;
};

const WIDTH = 1080;
const HEIGHT = 1780;
const MARGIN = 40;
const HEADER_HEIGHT = 560;
const DISPLAY_FONT = "'Anton', 'Instrument Sans', sans-serif";
const SANS_FONT = "'Instrument Sans', ui-sans-serif, sans-serif";

const loadImage = async (src: string) => {
    const image = new Image();
    image.src = src;
    await image.decode();

    return image;
};

const wrapLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number,
) => {
    const lines: string[] = [];
    let current = '';

    for (const word of text.split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;

        if (ctx.measureText(candidate).width <= maxWidth || !current) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }

    if (current) {
        lines.push(current);
    }

    if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        kept[maxLines - 1] = `${kept[maxLines - 1]}…`;

        return kept;
    }

    return lines;
};

const setSpacing = (ctx: CanvasRenderingContext2D, spacing: string) => {
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = spacing;
    }
};

export async function renderTicketCanvas(
    data: TicketExportData,
): Promise<HTMLCanvasElement> {
    await Promise.all([
        document.fonts.load(`96px ${DISPLAY_FONT}`),
        document.fonts.load(`700 36px ${SANS_FONT}`),
    ]).catch(() => undefined);
    const qr = await loadImage(data.qrImage);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d')!;
    const cardWidth = WIDTH - MARGIN * 2;
    const cardHeight = HEIGHT - MARGIN * 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(MARGIN, MARGIN, cardWidth, cardHeight, 48);
    ctx.clip();

    ctx.fillStyle = '#161616';
    ctx.fillRect(MARGIN, MARGIN, cardWidth, cardHeight);

    const header = ctx.createLinearGradient(
        MARGIN,
        MARGIN,
        WIDTH - MARGIN,
        MARGIN + HEADER_HEIGHT,
    );
    header.addColorStop(0, '#f0554d');
    header.addColorStop(0.45, '#d11f16');
    header.addColorStop(1, '#7c1916');
    ctx.fillStyle = header;
    ctx.fillRect(MARGIN, MARGIN, cardWidth, HEADER_HEIGHT);

    const glow = ctx.createRadialGradient(900, 120, 0, 900, 120, 420);
    glow.addColorStop(0, 'rgba(255,255,255,0.22)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(MARGIN, MARGIN, cardWidth, HEADER_HEIGHT);
    ctx.restore();

    const left = MARGIN + 72;
    const textWidth = cardWidth - 144;

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 28px ${SANS_FONT}`;
    setSpacing(ctx, '8px');
    ctx.fillText('ENTRADA DIGITAL', left, MARGIN + 110);
    setSpacing(ctx, '2px');

    ctx.fillStyle = '#ffffff';
    ctx.font = `96px ${DISPLAY_FONT}`;
    const titleLines = wrapLines(
        ctx,
        data.eventName.toUpperCase(),
        textWidth,
        2,
    );
    titleLines.forEach((line, index) =>
        ctx.fillText(line, left, MARGIN + 220 + index * 104),
    );
    setSpacing(ctx, '0px');

    const infoTop = MARGIN + 220 + titleLines.length * 104 + 10;
    ctx.font = `500 34px ${SANS_FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(data.dateText, left, infoTop);
    ctx.fillText(
        wrapLines(ctx, data.venueText, textWidth, 1)[0] ?? '',
        left,
        infoTop + 54,
    );

    const perforationY = MARGIN + HEADER_HEIGHT;
    ctx.fillStyle = '#000000';

    for (const x of [MARGIN, WIDTH - MARGIN]) {
        ctx.beginPath();
        ctx.arc(x, perforationY, 32, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 16]);
    ctx.beginPath();
    ctx.moveTo(MARGIN + 48, perforationY);
    ctx.lineTo(WIDTH - MARGIN - 48, perforationY);
    ctx.stroke();
    ctx.setLineDash([]);

    const qrBox = 560;
    const qrX = (WIDTH - qrBox) / 2;
    const qrY = perforationY + 70;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrBox, qrBox, 40);
    ctx.fill();
    ctx.drawImage(qr, qrX + 30, qrY + 30, qrBox - 60, qrBox - 60);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0554d';
    ctx.font = `600 36px ui-monospace, 'SFMono-Regular', monospace`;
    setSpacing(ctx, '4px');
    ctx.fillText(data.publicCode, WIDTH / 2, qrY + qrBox + 70);
    setSpacing(ctx, '0px');
    ctx.textAlign = 'left';

    const gridTop = qrY + qrBox + 130;
    const colWidth = textWidth / 2;
    const cells: [string, string][] = [
        ['TITULAR', data.holder],
        ['ESTADO', data.statusText],
        ['INGRESOS', data.accessText],
    ];
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(left - 32, gridTop - 20, textWidth + 64, 250, 28);
    ctx.stroke();
    cells.forEach(([label, value], index) => {
        const x = left + (index % 2) * colWidth;
        const y = gridTop + 40 + Math.floor(index / 2) * 110;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `700 22px ${SANS_FONT}`;
        setSpacing(ctx, '4px');
        ctx.fillText(label, x, y);
        setSpacing(ctx, '0px');
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 34px ${SANS_FONT}`;
        ctx.fillText(
            wrapLines(ctx, value, colWidth - 24, 1)[0] ?? '',
            x,
            y + 46,
        );
    });

    const footerY = HEIGHT - MARGIN - 60;
    ctx.fillStyle = '#d11f16';
    ctx.font = `48px ${DISPLAY_FONT}`;
    setSpacing(ctx, '3px');
    ctx.fillText('TIKETMARK', left, footerY);
    setSpacing(ctx, '0px');
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `500 24px ${SANS_FONT}`;
    ctx.fillText(
        'Presenta este QR en el acceso',
        left + textWidth,
        footerY - 8,
    );
    ctx.textAlign = 'left';

    return canvas;
}

const canvasToBlob = (
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number,
) =>
    new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error('toBlob failed')),
            type,
            quality,
        ),
    );

export const canvasToPng = (canvas: HTMLCanvasElement) =>
    canvasToBlob(canvas, 'image/png');

export async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
    const jpeg = new Uint8Array(
        await (await canvasToBlob(canvas, 'image/jpeg', 0.95)).arrayBuffer(),
    );
    const pageWidth = 396;
    const pageHeight = Math.round((pageWidth * canvas.height) / canvas.width);
    const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];
    const offsets: number[] = [];
    let length = 0;
    const push = (chunk: string | Uint8Array) => {
        const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
        parts.push(bytes);
        length += bytes.length;
    };
    const object = (body: () => void) => {
        offsets.push(length);
        push(`${offsets.length} 0 obj\n`);
        body();
        push('\nendobj\n');
    };

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    object(() => push('<< /Type /Catalog /Pages 2 0 R >>'));
    object(() => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    object(() =>
        push(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
        ),
    );
    object(() => {
        push(
            `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
        );
        push(jpeg);
        push('\nendstream');
    });
    object(() =>
        push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`),
    );

    const xrefOffset = length;
    push(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
    offsets.forEach((offset) =>
        push(`${String(offset).padStart(10, '0')} 00000 n \n`),
    );
    push(
        `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    );

    return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
