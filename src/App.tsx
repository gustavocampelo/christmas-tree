import { useCallback, useEffect, useRef, useState } from 'react';
import { AsciiChristmasTree, type SceneHandle } from './components/AsciiChristmasTree';
import { Icon, SceneControls } from './components/SceneControls';
import { initialState } from './engine/animation';
import { CONFIG, type Quality } from './engine/config';
import { clamp, mod, TAU } from './engine/math';
import type { Action, Diagnostics, SceneOptions } from './engine/types';

export default function App() {
  const [initial] = useState(() => initialState(window.location.search, window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [options, setOptions] = useState<SceneOptions>({ ...initial, speed: CONFIG.rotation.speed });
  const [stats, setStats] = useState<Diagnostics | null>(null);
  const [stage, setStage] = useState(initial.time >= 10 ? 'Uma noite de Natal' : 'Construindo a árvore');
  const controller = useRef<SceneHandle | null>(null);
  const action = useCallback((command: Action) => {
    if (command === 'export') { controller.current?.exportPng(); return; }
    if (command === 'restart') {
      controller.current?.restart();
      setOptions(current => ({ ...current, paused: false }));
      return;
    }
    setOptions(current => {
      if (command === 'pause') return { ...current, paused: !current.paused };
      if (command === 'snow') return { ...current, snow: !current.snow };
      if (command === 'debug') return { ...current, debug: !current.debug };
      return { ...current, speed: clamp(current.speed + (command === 'faster' ? 1 : -1) * CONFIG.rotation.step, 0, CONFIG.rotation.max) };
    });
  }, []);
  const quality = useCallback((value: Quality) => setOptions(current => ({ ...current, quality: value })), []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.closest('input, select, textarea, button, a, [contenteditable="true"], [role="textbox"]'))) return;
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const keys: Record<string, Action> = { ' ': 'pause', r: 'restart', n: 'snow', d: 'debug', ArrowLeft: 'slower', ArrowRight: 'faster' };
      const command = keys[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (command) { event.preventDefault(); action(command); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [action]);

  return <main className="relative flex h-dvh min-h-80 w-full flex-col overflow-hidden bg-[#06090d] text-[#e5e2da]">
    <header className="z-10 flex shrink-0 items-center justify-between px-5 pb-1 pt-5 sm:px-9 sm:pt-7">
      <div className="flex items-center gap-3">
        <span className="text-[#ceac70]"><Icon name="star" className="h-[18px] w-[18px]" /></span>
        <h1 className="text-[11px] font-medium tracking-[0.24em] sm:text-xs">NOITE DE NATAL</h1>
        <span className="hidden border-l border-white/15 pl-3 font-mono text-[10px] tracking-widest text-[#747c80] sm:block">EM ASCII</span>
      </div>
      <span className="hidden font-mono text-[9px] tracking-[0.16em] text-[#65716d] min-[380px]:block sm:text-[10px]" aria-hidden="true">{options.paused ? 'INSTANTE SUSPENSO' : 'CARACTERE POR CARACTERE'}</span>
    </header>

    <section className="relative min-h-0 flex-1" aria-label="Cena de Natal">
      <AsciiChristmasTree options={options} initialTime={initial.time} controller={controller} onDiagnostics={setStats} onStage={setStage} />
      {options.debug && <aside className="absolute left-3 top-3 max-w-[calc(100%-24px)] rounded-lg border border-white/10 bg-[#080c12]/95 p-3 font-mono text-[10px] leading-[1.8] text-[#a2b4b0] sm:left-8" aria-label="Diagnóstico da renderização">
        <div className="mb-1 flex items-center justify-between gap-8 text-[#dfc294]"><span>DIAGNÓSTICO</span><button className="rounded px-1 focus-visible:outline-2 focus-visible:outline-[#dfba77]" onClick={() => action('debug')} aria-label="Fechar diagnóstico">×</button></div>
        <dl className="grid grid-cols-[auto_auto] gap-x-6 tabular-nums">
          <dt>FPS</dt><dd data-testid="fps">{options.paused ? 'Pausado' : stats?.fps.toFixed(0) ?? '—'}</dd>
          <dt>Tempo</dt><dd data-testid="time">{stats?.time.toFixed(2) ?? initial.time.toFixed(2)} s</dd>
          <dt>Pontos</dt><dd>{stats?.points.toLocaleString('pt-BR') ?? '—'}</dd>
          <dt>Amostrados</dt><dd>{stats?.sampled.toLocaleString('pt-BR') ?? '—'}</dd>
          <dt>Células</dt><dd data-testid="cells">{stats?.cells.toLocaleString('pt-BR') ?? '—'}</dd>
          <dt>Rotação</dt><dd>{stats ? (mod(stats.angle, TAU) * 180 / Math.PI).toFixed(1) : '0'}°</dd>
          <dt>Velocidade</dt><dd>{(options.speed * 180 / Math.PI).toFixed(1)}°/s</dd>
          <dt>Qualidade</dt><dd>{CONFIG.qualities[options.quality].label}</dd>
          <dt>Renderização</dt><dd>{stats?.renderMs.toFixed(1) ?? '—'} ms</dd>
        </dl>
        <button onClick={() => action('export')} className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded border border-[#dfc294]/20 text-[#dfc294] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#dfba77]"><Icon name="download" />Salvar PNG</button>
      </aside>}
    </section>

    <footer className="z-10 flex shrink-0 flex-col items-center gap-3 px-3 pb-4 sm:gap-4 sm:pb-6">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#818c85]" role="status" aria-live="polite"><span className={`h-1 w-1 rounded-full ${options.paused ? 'bg-[#9e987f]' : 'bg-[#85a98e]'}`} />{options.paused ? 'Um instante para contemplar' : stage}</div>
      <SceneControls options={options} onAction={action} onQuality={quality} />
      <p className="hidden font-mono text-[9px] tracking-[0.04em] text-[#5d656c] sm:block"><span className="text-[#858b90]">ESPAÇO</span> pausa <span className="mx-2 text-[#41494e]">/</span><span className="text-[#858b90]">R</span> recomeça <span className="mx-2 text-[#41494e]">/</span><span className="text-[#858b90]">← →</span> rotação <span className="mx-2 text-[#41494e]">/</span><span className="text-[#858b90]">N</span> neve <span className="mx-2 text-[#41494e]">/</span><span className="text-[#858b90]">D</span> diagnóstico</p>
    </footer>
  </main>;
}
