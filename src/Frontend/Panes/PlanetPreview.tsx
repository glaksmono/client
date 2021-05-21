import { EMPTY_LOCATION_ID } from '@darkforest_eth/constants';
import { Planet, PlanetType } from '@darkforest_eth/types';
import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { MineRenderer } from '../Renderers/GameRenderer/Entities/MineRenderer';
import PlanetRenderer from '../Renderers/GameRenderer/Entities/PlanetRenderer';
import { QuasarRenderer } from '../Renderers/GameRenderer/Entities/QuasarRenderer';
import { RuinsRenderer } from '../Renderers/GameRenderer/Entities/RuinsRenderer';
import { SpacetimeRipRenderer } from '../Renderers/GameRenderer/Entities/SpacetimeRipRenderer';
import { WebGLManager } from '../Renderers/GameRenderer/WebGL/WebGLManager';
import { PlanetIcons } from '../Renderers/PlanetscapeRenderer/PlanetIcons';
import dfstyles from '../Styles/dfstyles';

const PlanetPreviewWrapper = styled.div<{ size: number }>`
  ${({ size }) => `
  position: relative;

  width: ${size}px;
  height: ${size}px;
  border: 1px solid white;

  background: ${dfstyles.game.canvasbg};

  canvas {
    display: none;
    &:last-child {
      display: block;
      width: ${size}px;
      height: ${size}px;
    }
  }
`}
`;

/*
 * Renders the planet preview (thumb in planet context menu)
 */

class PlanetPreviewRenderer extends WebGLManager {
  planet: Planet | undefined;

  frameRequestId: number;

  planetRenderer: PlanetRenderer;
  mineRenderer: MineRenderer;
  quasarRenderer: QuasarRenderer;
  spacetimeRipRenderer: SpacetimeRipRenderer;
  ruinsRenderer: RuinsRenderer;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.planetRenderer = new PlanetRenderer(this);
    this.mineRenderer = new MineRenderer(this);
    this.quasarRenderer = new QuasarRenderer(this);
    this.spacetimeRipRenderer = new SpacetimeRipRenderer(this);
    this.ruinsRenderer = new RuinsRenderer(this);

    this.gl.enable(this.gl.DEPTH_TEST);

    this.flushOnce();

    this.loop();
  }

  public destroy() {
    window.cancelAnimationFrame(this.frameRequestId);
  }

  public setPlanet(planet: Planet | undefined) {
    this.planet = planet;
  }

  // fixes https://github.com/darkforest-eth/darkforest/issues/1062
  private flushOnce() {
    this.planetRenderer.queuePlanetBodyScreen(
      {
        locationId: EMPTY_LOCATION_ID,
      } as Planet,
      10,
      0,
      0,
      0,
      0
    );
    this.planetRenderer.flush();
  }

  private loop() {
    this.clear();
    this.draw();

    this.frameRequestId = window.requestAnimationFrame(this.loop);
  }

  public clear(): void {
    const gl = this.gl;
    super.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  private draw(): void {
    if (!this.planet) return;
    const {
      planetRenderer: pR,
      mineRenderer: mR,
      quasarRenderer: qR,
      spacetimeRipRenderer: sR,
      ruinsRenderer: rR,
    } = this;
    const margin = 10;

    const dim = this.canvas.width;

    const x1 = margin;
    const y1 = margin;
    const x2 = dim - margin;
    const y2 = dim - margin;

    if (this.planet.planetType === PlanetType.SILVER_MINE) {
      mR.queueMineScreen(this.planet, { x: dim / 2, y: dim / 2 }, (dim - margin) / 2, -1);
      mR.flush();
    } else if (this.planet.planetType === PlanetType.SILVER_BANK) {
      qR.queueQuasarScreen(this.planet, { x: dim / 2, y: dim / 2 }, (0.5 * (dim - margin)) / 2, -1);
      qR.flush();
    } else if (this.planet.planetType === PlanetType.TRADING_POST) {
      sR.queueRipScreen(this.planet, { x: dim / 2, y: dim / 2 }, (0.5 * (dim - margin)) / 2, -1);
      sR.flush();
    } else if (this.planet.planetType === PlanetType.RUINS) {
      rR.queueRuinsScreen(this.planet, { x: dim / 2, y: dim / 2 }, (0.5 * (dim - margin)) / 2, -1);
      rR.flush();
    } else {
      pR.queuePlanetBodyScreen(this.planet, dim / 2, x1, y1, x2, y2);
      pR.flush();
    }
  }
}

export function PlanetPreviewImage({
  selected,
  size,
}: {
  selected: Planet | undefined;
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [renderer, setRenderer] = useState<PlanetPreviewRenderer | undefined>(undefined);

  // sync ref to renderer
  useEffect(() => {
    if (canvasRef.current) setRenderer(new PlanetPreviewRenderer(canvasRef.current));
  }, [canvasRef]);

  // sync planet to renderer
  useEffect(() => {
    renderer?.setPlanet(selected);

    console.log('setting planet: ', selected);
  }, [selected, renderer]);
  return <canvas ref={canvasRef} width={size} height={size}></canvas>;
}

export function PlanetPreview({ selected, size }: { selected: Planet | undefined; size: number }) {
  return (
    <PlanetPreviewWrapper size={size}>
      <PlanetIcons planet={selected} />
      <PlanetPreviewImage selected={selected} size={size} />
    </PlanetPreviewWrapper>
  );
}