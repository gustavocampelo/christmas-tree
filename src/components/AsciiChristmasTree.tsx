import { useEffect, useRef } from 'react';
import { SceneClock } from '../engine/animation';
import { getGeometry } from '../engine/geometry';
import { AsciiRenderer } from '../engine/renderer';
import { CONFIG } from '../engine/config';
import type { Diagnostics, SceneOptions } from '../engine/types';

export interface SceneHandle { restart(): void; exportPng(): void }
interface Props {
  options: SceneOptions;
  initialTime: number;
  controller: React.RefObject<SceneHandle | null>;
  onDiagnostics: (diagnostics: Diagnostics) => void;
  onStage: (stage: string) => void;
}

export function AsciiChristmasTree({ options, initialTime, controller, onDiagnostics, onStage }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ options, onDiagnostics, onStage });
  useEffect(() => { live.current = { options, onDiagnostics, onStage }; }, [options, onDiagnostics, onStage]);

  useEffect(() => {
    const element = canvas.current!;
    const geometry = getGeometry();
    const clock = new SceneClock(initialTime, live.current.options.paused);
    const renderer = new AsciiRenderer(element, geometry);
    let disposed = false, frame = 0, dirty = true, lastReport = 0, frames = 0, frameTime = 0, lastFrame: number | null = null;
    let previousStage = '', width = 1, height = 1;
    let previousOptions = live.current.options;
    const resize = () => {
      const bounds = element.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      renderer.resize(width, height, live.current.options.quality);
      dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const visibility = () => { clock.suspend(); dirty = true; lastFrame = null; };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', resize);
    controller.current = {
      restart() { clock.reset(); dirty = true; },
      exportPng() { renderer.render(clock.time, clock.angle, live.current.options.snow); renderer.exportPng(clock.time); },
    };

    function loop(now: number) {
      if (disposed) return;
      const settings = live.current.options;
      if (settings !== previousOptions) {
        if (clock.paused !== settings.paused) clock.setPaused(settings.paused);
        clock.speed = settings.speed;
        renderer.resize(width, height, settings.quality);
        previousOptions = settings; dirty = true;
      }
      if (!document.hidden) clock.tick(now);
      if (!document.hidden && (dirty || !clock.paused)) {
        renderer.render(clock.time, clock.angle, settings.snow);
        dirty = false;
      }
      if (!document.hidden && !clock.paused && lastFrame !== null) { frames++; frameTime += (now - lastFrame) / 1000; }
      lastFrame = now;
      if (now - lastReport > 400) {
        const stage = clock.time < CONFIG.timeline.foliageEnd ? 'Construindo a árvore' : clock.time < CONFIG.timeline.complete ? 'Acendendo o Natal' : 'Uma noite de Natal';
        if (stage !== previousStage) { live.current.onStage(stage); previousStage = stage; }
        if (settings.debug) live.current.onDiagnostics({
          fps: frameTime ? frames / frameTime : 0, time: clock.time,
          points: geometry.count, sampled: renderer.sampled, cells: renderer.cells,
          angle: clock.angle, speed: clock.speed, quality: settings.quality, renderMs: renderer.renderMs,
        });
        frames = 0; frameTime = 0; lastReport = now;
      }
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('resize', resize);
      controller.current = null;
    };
    // Own exactly one clock/renderer/RAF per mount. Options are read through live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, initialTime]);

  return <canvas ref={canvas} className="block h-full w-full" role="img" aria-label="Árvore de Natal tridimensional em caracteres ASCII, com bolas vermelhas e douradas, luzes, estrela, presentes e neve." />;
}
