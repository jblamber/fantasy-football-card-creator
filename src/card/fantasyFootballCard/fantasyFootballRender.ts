/*
  Lightweight TypeScript renderer for Blood Bowl cards.
  This module is framework-agnostic and can be imported into a React + TypeScript src.
  It contains no Bootstrap dependency and is UI/CSS-agnostic (you can style hosting React components with Tailwind CSS).

  Usage in React (example):

    import { useEffect, useRef } from 'react';
    import { renderCard, type CardData, type ImageAssets } from './cardRenderer';

    function CardCanvas({ data, assets }: { data: CardData; assets: ImageAssets }) {
      const ref = useRef<HTMLCanvasElement | null>(null);
      useEffect(() => {
        const canvas = ref.current!;
        const ctx = canvas.getContext('2d')!;
        renderCard(ctx, data, assets);
      }, [data, assets]);
      return (
        <div className="w-full flex justify-center">
          <canvas ref={ref} width={1125} height={1575} className="shadow-lg rounded" />
        </div>
      );
    }

  Tailwind friendly: apply classes to the wrapping elements; this renderer only draws on canvas.
*/

import {FantasyFootballPlayerData} from "../../types";
import * as QRCode from 'qrcode';

export type StatValue = string | number; // e.g., "3+" or 4

export interface ModelImageProperties {
    offsetX: number; // px
    offsetY: number; // px
    scalePercent: number; // 100 = 1.0
}

export interface FantasyFootballCardData extends FantasyFootballPlayerData {

    removeBorder?: boolean;

    // Player image
    imageUrl?: string; // optional; you can alternatively pass a preloaded image in assets
    imageProperties: ModelImageProperties;
}

export interface ImageAssets {
    // Backgrounds and frame elements
    bg1: CanvasImageSource; // textured background
    frame: CanvasImageSource;
    star_frame: CanvasImageSource;
    border?: CanvasImageSource;

    // Numerals (if you wish to mimic original number rendering via images). Optional.
    // If omitted, numbers are rendered as text.
    numbers?: Record<string, CanvasImageSource>; // keys like '0'..'9','plus'

    // Optional already-loaded player image to skip URL loading per render
    playerImage?: CanvasImageSource;
}

export interface FontOptions {
    nameFont?: string; // e.g., "48px franklin-gothic-book"
    teamFont?: string;
    footerFont?: string;
    bodyFont?: string; // will be resized as needed
    positionFont?: string;
    costFont?: string;
    devLabelFont?: string;
    statFont?: string;
}

export interface ColorOptions {
    text?: string; // default black
    title?: string; // default white
    shadow?: string; // default black
}

export interface RenderOptions<fontOptions extends FontOptions, colorOptions extends ColorOptions> {
    // Canvas base design resolution used by the original src
    designWidth?: number; // default 1125
    designHeight?: number; // default 1575

    // Text settings
    fonts?: fontOptions
    colors?: colorOptions

    // QR code settings
    showQrCode?: boolean; // default true
    qrSize?: number; // in design-space px (default 180)
    qrPadding?: number; // distance from card edges in design-space px (default 24)
    qrPlateRadius?: number; // rounded corner radius for plate (default 12)
    qrPlateFill?: string; // background plate color behind QR (default 'rgba(255,255,255,0.9)')
    qrPlateStroke?: string; // outline color (default 'rgba(0,0,0,0.35)')
}

const defaultFonts: Required<FontOptions> = {
    nameFont: 'italic 100px brothers-regular',
    teamFont: 'italic 60px brothers-regular',
    footerFont: '28px franklin-gothic-book',
    bodyFont: '36px franklin-gothic-book',
    positionFont: '80px brothers-regular',
    costFont: '40px brothers-regular',
    devLabelFont: '28px franklin-gothic-book',
    statFont: '64px franklin-gothic-book',
}

const defaultColors: Required<ColorOptions> = {
    text: 'black',
    title: '#eeeeee',
    shadow: 'black',
}

export type AllOptions = Required<RenderOptions<Required<FontOptions>, Required<ColorOptions>>>

export const defaultOptions: Required<RenderOptions<Required<FontOptions>, Required<ColorOptions>>> = {
    designWidth: 1125,
    designHeight: 1575,
    fonts: defaultFonts,
    colors: defaultColors,
    showQrCode: true,
    qrSize: 180,
    qrPadding: 24,
    qrPlateRadius: 12,
    qrPlateFill: 'rgba(255,255,255,0.92)',
    qrPlateStroke: 'rgba(0,0,0,0.35)'
};

export async function renderCard(
    ctx: CanvasRenderingContext2D,
    data: FantasyFootballCardData,
    assets: ImageAssets,
    opts: AllOptions
): Promise<void> {

    const {canvas} = ctx;
    // Scale to current canvas size while keeping original design coordinates working
    const scaleX = canvas.width / opts.designWidth;
    const scaleY = canvas.height / opts.designHeight;

    // Helper to draw in design space
    const withDesignSpace = <T, >(fn: () => T): T => {
        ctx.save();
        ctx.scale(scaleX, scaleY);
        const result = fn();
        ctx.restore();
        return result;
    };

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    withDesignSpace(() => {
        ctx.drawImage(assets.bg1, 0, 0, opts.designWidth, opts.designHeight);
    });

    // Optional player image
    let playerImg: CanvasImageSource | undefined = assets.playerImage;
    if (!playerImg && data.imageUrl) {
        try {
            playerImg = await loadImage(data.imageUrl);
        } catch {
            // ignore load error; proceed without model image
        }
    }
    if (playerImg) {
        withDesignSpace(() => {
            const scale = (data.imageProperties?.scalePercent ?? 100) / 100;
            const width = (playerImg as any).width ? (playerImg as any).width * scale : undefined;
            const height = (playerImg as any).height ? (playerImg as any).height * scale : undefined;
            const x = 175 + (data.imageProperties?.offsetX ?? 0);
            const y = 50 + (data.imageProperties?.offsetY ?? 0);

            if (width && height) {
                ctx.drawImage(playerImg!, x, y, width, height);
            } else {
                // Draw without scaling info if dimensions are unknown (ImageBitmap may have width/height)
                ctx.drawImage(playerImg!, x, y as number);
            }
        });
    }

    // Frame + border
    withDesignSpace(() => {
        const frame = data.playerType === 'star' ? assets.star_frame : assets.frame;
        ctx.drawImage(frame, 0, 0, opts.designWidth, opts.designHeight);
        if (!data.removeBorder && assets.border) {
            ctx.drawImage(assets.border, 0, 0, opts.designWidth, opts.designHeight);
        }
    });

    // Text blocks
    withDesignSpace(() => {
        ctx.fillStyle = opts.colors.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Name
        ctx.rotate(-6 * Math.PI / 180);
        ctx.font = opts.fonts.nameFont;
        ctx.fillStyle = opts.colors.shadow;
        fillText(ctx, data.cardName, 70, 260);
        ctx.fillStyle = opts.colors.title;
        fillText(ctx, data.cardName, 75, 260);

        // Team name
        ctx.font = opts.fonts.teamFont;
        ctx.fillStyle = opts.colors.shadow;
        fillText(ctx, data.teamName, 100, 190);
        ctx.fillStyle = opts.colors.title;
        fillText(ctx, data.teamName, 105, 190);
        ctx.rotate(6 * Math.PI / 180);

        // Footer
        ctx.font = opts.fonts.footerFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        fillText(ctx, data.footer, 595, 1500);

        // Body text, dynamic wrapping and size scaling similar to original
        const yStart = data.playerType === 'star' ? 670 : 1020;

        drawWrappedParagraph(ctx, data.skillsAndTraits ?? '', 365, yStart, {
            baseFont: opts.fonts.bodyFont,
            maxLines: 3,
            fitWidth: 650,
            minFontPx: 24,
            expandToFourLinesThreshold: 140,
        });


        if (data.playerType === 'star') {
            if (data.playsFor) drawWrappedParagraph(ctx, data.playsFor, 365, 840, {
                baseFont: opts.fonts.bodyFont,
                maxLines: 1,
                fitWidth: 400,
                fillStyle: opts.colors.text
            });
            if (data.specialRules) drawWrappedParagraph(ctx, data.specialRules, 365, 1250, {
                baseFont: opts.fonts.bodyFont,
                maxLines: 3,
                fitWidth: 400,
                fillStyle: opts.colors.text
            });
        } else {
            // Position
            const positionSuffix = data.number !== undefined ? ` #${data.number}` : '';
            ctx.font = opts.fonts.positionFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = opts.colors.shadow;
            fillText(ctx, `${data.positionName}${positionSuffix}`, 595, 1425);
            ctx.fillStyle = opts.colors.title;
            fillText(ctx, `${data.positionName}${positionSuffix}`, 590, 1420);


            // Development labels
            ctx.font = opts.fonts.devLabelFont;
            ctx.fillStyle = opts.colors.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            if (data.primary) fillText(ctx, data.primary, 365, 1250);
            if (data.secondary) fillText(ctx, data.secondary, 365, 1300);


            if (data.cost) {
                ctx.font = opts.fonts.costFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = opts.colors.shadow;
                fillText(ctx, data.cost ?? '', 205, 1395);
                ctx.fillStyle = opts.colors.title;
                fillText(ctx, data.cost ?? '', 205, 1390);
            }
        }
    });

    // Stats – either using images from assets.numbers or drawn as text
    withDesignSpace(() => {
        const useImages = !!assets.numbers;

        const drawStat = (val: StatValue, x: number, y: number, suffixPlus: boolean) => {
            if (useImages) {
                drawNumberImages(ctx, String(val), x, y, suffixPlus, assets.numbers!);
            } else {
                ctx.font = opts.fonts.statFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                fillText(ctx, suffixPlus ? `${val}+` : String(val), x, y);
            }
        };

        // MA, ST, AG+, PA+, AV+
        drawStat(data.ma, 220, 385, false);
        drawStat(data.st, 220, 585, false);
        drawStat(data.ag, 240, 785, true);
        drawStat(data.pa, 240, 985, true);
        drawStat(data.av, 240, 1185, true);
    });

    // QR code in bottom-right
    await drawQrCode(ctx, data, opts);
}

function drawWrappedParagraph(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    opts: {
        baseFont: string;
        maxLines: number;
        fitWidth: number;
        minFontPx?: number;
        expandToFourLinesThreshold?: number;
        fillStyle?: string
    }
) {
    const minFontPx = opts.minFontPx ?? 24;
    const expandThresh = opts.expandToFourLinesThreshold ?? Infinity;

    // Parse base font size
    const basePxMatch = opts.baseFont.match(/(\d+)px/);
    const basePx = basePxMatch ? parseInt(basePxMatch[1], 10) : 36;

    let fontPx = basePx;
    let maxLines = opts.maxLines;
    if (text.length > expandThresh) maxLines = Math.max(maxLines, 4);

    let lines = wordWrap(ctx, text, opts.fitWidth, `${fontPx}px ${fontFamilyFrom(opts.baseFont)}`);
    while (lines.length > maxLines && fontPx > minFontPx) {
        fontPx -= 2;
        const fitWidthScaled = opts.fitWidth / (fontPx / basePx);
        lines = wordWrap(ctx, text, fitWidthScaled, `${fontPx}px ${fontFamilyFrom(opts.baseFont)}`);
    }
    fontPx = Math.max(fontPx, minFontPx);

    ctx.font = `${fontPx}px ${fontFamilyFrom(opts.baseFont)}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.fillStyle ?? 'black';
    lines.forEach((line, idx) => fillText(ctx, line, x, y + idx * fontPx * 1.2));
}

function wordWrap(ctx: CanvasRenderingContext2D, text: string, fitWidth: number, font: string): string[] {
    ctx.save();
    ctx.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        const w = ctx.measureText(test).width;
        if (w <= fitWidth) {
            line = test;
        } else {
            if (line) lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
}

function fontFamilyFrom(font: string): string {
    // Extract the family part after the size; naive but adequate for our composed defaults
    const parts = font.split(/\s+/);
    if (!parts.length) return 'sans-serif';
    const pxIdx = parts.findIndex(p => /px$/.test(p));
    return pxIdx >= 0 ? parts.slice(pxIdx + 1).join(' ') || 'sans-serif' : 'sans-serif';
}

function fillText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    ctx.fillText(text ?? '', x, y);
}

function drawNumberImages(
    ctx: CanvasRenderingContext2D,
    value: string,
    x: number,
    y: number,
    suffixPlus: boolean,
    atlas: Record<string, CanvasImageSource>
) {

    const str = suffixPlus && !/\+$/.test(value) ? `${value}+` : value;
    const chars = str.split('');
    // Simple horizontal layout centered at (x,y)
    const images = chars.map(c => atlas[c]).filter(Boolean);
    if (images.length === 0) return;

    const widthSum = images.reduce((s, img: any) => s + (img.width ?? 0), 0);
    let cx = x - widthSum / 2;
    for (const img of images as any[]) {
        const w = img.width ?? 0;
        const h = img.height ?? 0;
        ctx.drawImage(img, cx, y - h / 2, w, h);
        cx += w;
    }
}

function buildQrPayload(data: FantasyFootballCardData): string {
    // Compact payload with key fields; avoid very long strings for QR reliability
    const p = {
        v: 1,
        t: 'ffc',
        n: data.cardName ?? '',
        tm: data.teamName ?? '',
        pt: data.playerType ?? '',
        pos: data.positionName ?? '',
        ma: String(data.ma ?? ''),
        st: String(data.st ?? ''),
        ag: String(data.ag ?? ''),
        pa: String(data.pa ?? ''),
        av: String(data.av ?? ''),
        cost: data.cost ?? '',
        skills: data.skillsAndTraits ?? '',
        footer: data.footer ?? ''
    };
    try {
        return JSON.stringify(p);
    } catch {
        return '';
    }
}

async function drawQrCode(ctx: CanvasRenderingContext2D, data: FantasyFootballCardData, opts: AllOptions) {
    if (!opts.showQrCode) return;

    const {canvas} = ctx;
    const sizeDesign = opts.qrSize ?? 180;
    const paddingDesign = opts.qrPadding ?? 24;
    const plateRadius = opts.qrPlateRadius ?? 12;
    const plateFill = opts.qrPlateFill ?? 'rgba(255,255,255,0.92)';
    const plateStroke = opts.qrPlateStroke ?? 'rgba(0,0,0,0.35)';

    // Convert design-space to device-space
    const scaleX = canvas.width / opts.designWidth;
    const scaleY = canvas.height / opts.designHeight;
    const sizeDevice = Math.round(sizeDesign * Math.min(scaleX, scaleY));
    const padX = Math.round(paddingDesign * scaleX);
    const padY = Math.round(paddingDesign * scaleY);

    const x = canvas.width - padX - sizeDevice;
    const y = canvas.height - padY - sizeDevice;

    // Background plate slightly larger than QR
    const platePad = Math.round(10 * Math.min(scaleX, scaleY));
    const plateX = x - platePad;
    const plateY = y - platePad;
    const plateW = sizeDevice + platePad * 2;
    const plateH = sizeDevice + platePad * 2;

    // Draw plate
    ctx.save();
    ctx.beginPath();
    const r = Math.round(plateRadius * Math.min(scaleX, scaleY));
    roundRect(ctx, plateX, plateY, plateW, plateH, r);
    ctx.fillStyle = plateFill;
    ctx.fill();
    ctx.strokeStyle = plateStroke;
    ctx.lineWidth = Math.max(1, Math.round(2 * Math.min(scaleX, scaleY)));
    ctx.stroke();
    ctx.restore();

    // Generate QR to offscreen canvas
    const text = buildQrPayload(data);
    const off = document.createElement('canvas');
    off.width = sizeDevice;
    off.height = sizeDevice;
    try {
        await QRCode.toCanvas(off, text, {
            errorCorrectionLevel: 'M',
            margin: 0,
            width: sizeDevice,
            color: {dark: '#000000', light: '#FFFFFF'}
        });
    } catch (e) {
        // On failure, skip gracefully
        return;
    }

    // Draw QR
    ctx.drawImage(off, x, y, sizeDevice, sizeDevice);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}