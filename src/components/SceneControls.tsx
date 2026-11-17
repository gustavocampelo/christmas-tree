import type { ReactNode } from 'react';
import { CONFIG, type Quality } from '../engine/config';
import type { Action, SceneOptions } from '../engine/types';

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    pause: <><path d="M8 5v14M16 5v14" /></>,
    play: <path d="m8 5 11 7-11 7Z" />,
    restart: <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></>,
    snow: <><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4" /></>,
    minus: <path d="M6 12h12" />,
    plus: <path d="M6 12h12M12 6v12" />,
    debug: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 18" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
    star: <path d="m12 2 2.8 6.3 6.9.7-5.2 4.6 1.5 6.7-6-3.5-6 3.5 1.5-6.7L2.3 9l6.9-.7Z" />,
  };
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const buttonClass = 'inline-flex h-10 min-w-9 items-center justify-center gap-2 rounded-lg px-2 text-xs text-[#b6b9bd] transition-colors hover:bg-white/5 hover:text-[#f0d5a3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dfba77] disabled:cursor-default disabled:opacity-30 sm:min-w-10 sm:px-3';

export function SceneControls({ options, onAction, onQuality }: { options: SceneOptions; onAction: (action: Action) => void; onQuality: (quality: Quality) => void }) {
  return <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-2xl border border-white/[0.09] bg-[#0c1015] p-1.5 shadow-[0_10px_40px_#0003]" aria-label="Controles da cena" role="group">
    <button className={`${buttonClass} bg-white/[0.045] !text-[#dfc294]`} onClick={() => onAction('pause')} aria-label={options.paused ? 'Retomar animação' : 'Pausar animação'} title="Pausar ou retomar (Espaço)"><Icon name={options.paused ? 'play' : 'pause'} /><span className="hidden sm:inline">{options.paused ? 'Retomar' : 'Pausar'}</span></button>
    <button className={buttonClass} onClick={() => onAction('restart')} aria-label="Reiniciar sequência" title="Reiniciar (R)"><Icon name="restart" /></button>
    <span className="mx-1 h-4 w-px bg-white/10" aria-hidden="true" />
    <button className={`${buttonClass} ${options.snow ? '!text-[#dfc294]' : ''}`} onClick={() => onAction('snow')} aria-pressed={options.snow} aria-label="Neve" title="Ativar ou desativar neve (N)"><Icon name="snow" /><span className="hidden sm:inline">Neve</span></button>
    <div className="flex items-center" aria-label="Velocidade de rotação">
      <button className={`${buttonClass} !min-w-7 !px-1 sm:!min-w-8`} disabled={options.speed <= 0} onClick={() => onAction('slower')} aria-label="Diminuir velocidade de rotação" title="Diminuir rotação (←)"><Icon name="minus" /></button>
      <output className="w-8 text-center font-mono text-[10px] tabular-nums text-[#939b9c] sm:w-9" aria-label="Velocidade relativa">{(options.speed / CONFIG.rotation.speed).toFixed(2).replace('.', ',')}×</output>
      <button className={`${buttonClass} !min-w-7 !px-1 sm:!min-w-8`} disabled={options.speed >= CONFIG.rotation.max} onClick={() => onAction('faster')} aria-label="Aumentar velocidade de rotação" title="Aumentar rotação (→)"><Icon name="plus" /></button>
    </div>
    <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" aria-hidden="true" />
    <label className="sr-only" htmlFor="quality">Qualidade</label>
    <select id="quality" value={options.quality} onChange={event => onQuality(event.target.value as Quality)} className="h-10 max-w-18 rounded-lg border-0 bg-[#0c1015] pl-2 pr-1 text-xs text-[#b6b9bd] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#dfba77] sm:max-w-20" title="Qualidade da cena">
      <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
    </select>
    <button className={`${buttonClass} !px-2 ${options.debug ? '!text-[#dfc294]' : ''}`} onClick={() => onAction('debug')} aria-pressed={options.debug} aria-label="Diagnóstico" title="Diagnóstico (D)"><Icon name="debug" /></button>
  </div>;
}
