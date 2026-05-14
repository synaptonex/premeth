'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Pen, Eraser, Trash2, Download, Undo2, Redo2, Grid3x3, FileText,
} from 'lucide-react';

type Tool = 'pen' | 'eraser';

const COLORS = ['#f7f3ec', '#3ee089', '#e23b3b', '#60a5fa', '#fbbf24', '#c084fc'];
const SIZES = [2, 4, 8, 14];

export default function ScratchpadPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const futureRef = useRef<ImageData[]>([]);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [size, setSize] = useState<number>(SIZES[1]);
  const [showGrid, setShowGrid] = useState(true);
  const [showLines, setShowLines] = useState(false);

  // ─── Canvas setup + resize ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      // Preserve the existing drawing across resize.
      const prev = canvas.width > 0 ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;

      const parent = canvas.parentElement!;
      const ratio = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (prev) ctx.putImageData(prev, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Push current canvas state to history (called on stroke end)
  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 30) historyRef.current.shift();
    futureRef.current = [];
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    if (historyRef.current.length < 2) return;
    const current = historyRef.current.pop()!;
    futureRef.current.push(current);
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
  }, []);

  const redo = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(next);
    ctx.putImageData(next, 0, 0);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    snapshot();
  }, [snapshot]);

  // Take an initial snapshot once the canvas is ready
  useEffect(() => {
    const t = setTimeout(snapshot, 0);
    return () => clearTimeout(t);
  }, [snapshot]);

  // ─── Drawing ────────────────────────────────────────────────────────────────
  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = pointFromEvent(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    const last = lastRef.current;
    if (!ctx || !last) return;
    const p = pointFromEvent(e);

    ctx.globalCompositeOperation =
      tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? size * 2.5 : size;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  }

  function onPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    snapshot();
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && e.shiftKey) { e.preventDefault(); redo(); }
      else if (e.key.toLowerCase() === 'p') setTool('pen');
      else if (e.key.toLowerCase() === 'e') setTool('eraser');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Save as PNG
  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `premeth-scratchpad-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  const backgroundClasses = [
    showGrid ? 'bg-grid' : '',
    showLines ? 'bg-lines' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6">
          <span className="text-xs uppercase tracking-widest text-meth">Scratchpad</span>
          <h1 className="font-display text-4xl md:text-5xl text-paper tracking-tight mt-2">
            Sketch it out.
          </h1>
          <p className="text-ink-400 mt-2 max-w-xl">
            Free-body diagrams, organic structures, working-out — same tab as your
            paper. Works with touch, mouse, and stylus.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4 rounded-xl border border-ink-800 bg-ink-900/40 p-2">
          <ToolBtn
            active={tool === 'pen'}
            onClick={() => setTool('pen')}
            label="Pen (P)"
            icon={<Pen className="h-4 w-4" />}
          />
          <ToolBtn
            active={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            label="Eraser (E)"
            icon={<Eraser className="h-4 w-4" />}
          />

          <Divider />

          {/* Color swatches */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                className={`h-7 w-7 rounded-full border tx-color ${
                  color === c && tool === 'pen' ? 'border-paper' : 'border-ink-700'
                }`}
                style={{
                  background: c,
                  transform: color === c && tool === 'pen' ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 160ms var(--ease-out), border-color 160ms var(--ease-out)',
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <Divider />

          {/* Brush sizes */}
          <div className="flex items-center gap-1">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h-8 w-8 rounded-md grid place-items-center border tx-color ${
                  size === s ? 'border-meth bg-meth/10' : 'border-ink-800 hover:border-ink-700'
                }`}
                aria-label={`Brush size ${s}`}
                title={`${s}px`}
              >
                <span
                  className="rounded-full bg-paper"
                  style={{ width: s, height: s }}
                />
              </button>
            ))}
          </div>

          <Divider />

          <ToolBtn
            active={showGrid}
            onClick={() => setShowGrid((v) => !v)}
            label="Grid"
            icon={<Grid3x3 className="h-4 w-4" />}
          />
          <ToolBtn
            active={showLines}
            onClick={() => setShowLines((v) => !v)}
            label="Lined"
            icon={<FileText className="h-4 w-4" />}
          />

          <Divider />

          <ToolBtn onClick={undo} label="Undo (⌘Z)" icon={<Undo2 className="h-4 w-4" />} />
          <ToolBtn onClick={redo} label="Redo (⌘⇧Z)" icon={<Redo2 className="h-4 w-4" />} />

          <div className="flex-1" />

          <button
            onClick={download}
            className="press inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-ink-800 text-ink-300 hover:text-meth hover:border-meth/40 tx-color"
          >
            <Download className="h-4 w-4" /> Download PNG
          </button>
          <button
            onClick={() => { if (confirm('Clear the whole canvas?')) clear(); }}
            className="press inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-ink-800 text-ink-300 hover:text-crimson hover:border-crimson/40 tx-color"
          >
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        </div>

        {/* Canvas */}
        <div className={`relative h-[60vh] rounded-xl border border-ink-800 overflow-hidden ${backgroundClasses}`}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0 touch-none"
            style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          />
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Shortcuts: <kbd className="kbd-sm">P</kbd> pen ·{' '}
          <kbd className="kbd-sm">E</kbd> eraser ·{' '}
          <kbd className="kbd-sm">⌘Z</kbd> undo ·{' '}
          <kbd className="kbd-sm">⌘⇧Z</kbd> redo
        </p>
      </main>

      <Footer />
    </>
  );
}

function ToolBtn({
  onClick, active, label, icon,
}: {
  onClick: () => void; active?: boolean; label: string; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`press h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs border tx-color ${
        active
          ? 'border-meth/40 bg-meth/10 text-meth'
          : 'border-ink-800 text-ink-300 hover:border-ink-700 hover:text-paper'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label.split(' ')[0]}</span>
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="h-5 w-px bg-ink-800" />;
}
