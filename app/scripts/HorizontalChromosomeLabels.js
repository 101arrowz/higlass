import boxIntersect from 'box-intersect';
import { scaleLinear } from 'd3-scale';
import * as PIXI from 'pixi.js';

import { PixiTrack } from './PixiTrack';
import { ChromosomeInfo } from './ChromosomeInfo';
import { SearchField } from './search_field';

import { absToChr, pixiTextToSvg, svgLine } from './utils';

const TICK_WIDTH = 200;
const TICK_HEIGHT = 6;
const TICK_TEXT_SEPARATION = 2;
const TICK_COLOR = '#777777';

class HorizontalChromosomeLabels extends PixiTrack {
  constructor(scene, server, uid, handleTilesetInfoReceived, options, animate, chromInfoPath) {
    super(scene, server, uid, handleTilesetInfoReceived, options, animate);

    this.searchField = null;
    this.chromInfo = null;

    this.gTicks = {};
    this.tickTexts = {};

    this.textFontSize = '12px';
    this.textFontFamily = 'Arial';
    this.textFontColor = '#777777';

    this.animate = animate;

    let chromSizesPath = chromInfoPath;

    if (!chromSizesPath) {
      chromSizesPath = `${server}/chrom-sizes/?id=${uid}`;
    }

    ChromosomeInfo(chromSizesPath, (newChromInfo) => {
      this.chromInfo = newChromInfo;
      //

      this.searchField = new SearchField(this.chromInfo);

      this.texts = [];

      for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
        const textStr = this.chromInfo.cumPositions[i].chr;
        this.gTicks[textStr] = new PIXI.Graphics();

        // create the array that will store tick TEXT objects
        if (!this.tickTexts[textStr]) { this.tickTexts[textStr] = []; }

        const text = new PIXI.Text(textStr,
          { fontSize: this.textFontSize, fontFamily: this.textFontFamily, fill: this.textFontColor },
        );

        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        text.visible = false;

        // give each string a random hash so that some get hidden
        // when there's overlaps
        text.hashValue = Math.random();

        this.pMain.addChild(text);
        this.pMain.addChild(this.gTicks[textStr]);

        this.texts.push(text);
      }

      this.draw();
      this.animate();
    });
  }

  drawTicks(cumPos) {
    const graphics = this.gTicks[cumPos.chr];

    this.gTicks[cumPos.chr].visible = true;
    this.gTicks[cumPos.chr].clear();

    const chromLen = +this.chromInfo.chromLengths[cumPos.chr];

    const vpLeft = Math.max(this._xScale(cumPos.pos), 0);
    const vpRight = Math.min(this._xScale(cumPos.pos + chromLen), this.dimensions[0]);

    const numTicks = (vpRight - vpLeft) / TICK_WIDTH;

    // what is the domain of this chromosome that is visible?
    const xScale = scaleLinear().domain([
      Math.max(1, this._xScale.invert(0) - cumPos.pos),
      Math.min(chromLen, this._xScale.invert(this.dimensions[0]) - cumPos.pos)])
      .range(vpLeft, vpRight);


    // calculate a certain number of ticks
    const ticks = xScale.ticks(numTicks);
    const tickFormat = xScale.tickFormat(numTicks);
    const tickTexts = this.tickTexts[cumPos.chr];


    while (tickTexts.length <= ticks.length) {
      const newText = new PIXI.Text('',
        { fontSize: '12px', fontFamily: 'Helvetica Neue', fill: '#777777' });
      tickTexts.push(newText);
      this.gTicks[cumPos.chr].addChild(newText);
    }

    let i = 0;
    while (i < ticks.length) {
      tickTexts[i].visible = true;

      tickTexts[i].anchor.x = 0.5;
      tickTexts[i].anchor.y = 1;

      if (this.flipText) { tickTexts[i].scale.x = -1; }

      // draw the tick labels
      tickTexts[i].x = this._xScale(cumPos.pos + ticks[i]);
      tickTexts[i].y = this.dimensions[1] - (TICK_HEIGHT + TICK_TEXT_SEPARATION);

      if (ticks[i] == 0) { tickTexts[i].text = `${cumPos.chr}:1`; } else { tickTexts[i].text = `${cumPos.chr}:${tickFormat(ticks[i])}`; }

      graphics.lineStyle(1, TICK_COLOR, 1);

      // draw the tick lines
      graphics.moveTo(this._xScale(cumPos.pos + ticks[i]), this.dimensions[1]);
      graphics.lineTo(this._xScale(cumPos.pos + ticks[i]), this.dimensions[1] - TICK_HEIGHT);


      i += 1;
    }

    while (i < tickTexts.length) {
      // we don't need this text so we'll turn it off for now
      tickTexts[i].visible = false;

      i += 1;
    }

    const ticksDrawn = ticks.length;

    /*
        if (ticks.length == 1) {
            // if we just have one tick visible, then we'll display the chromosomes
            // individually
            tickTexts[0].visible = false;

        }

        */
    return ticks.length;
  }

  draw() {
    const leftChrom = null;
    const rightChrom = null;
    const topChrom = null;
    const bottomChrom = null;

    this.allTexts = [];

    if (!this.texts) { return; }

    if (!this.searchField) { return; }

    const x1 = absToChr(this._xScale.domain()[0], this.chromInfo);
    const x2 = absToChr(this._xScale.domain()[1], this.chromInfo);

    for (let i = 0; i < this.texts.length; i++) {
      this.texts[i].visible = false;
      this.gTicks[this.chromInfo.cumPositions[i].chr].visible = false;
    }

    for (let i = x1[3]; i <= x2[3]; i++) {
      const xCumPos = this.chromInfo.cumPositions[i];

      const midX = xCumPos.pos + this.chromInfo.chromLengths[xCumPos.chr] / 2;

      const viewportMidX = this._xScale(midX);

      const text = this.texts[i];

      text.anchor.y = 1;
      text.x = viewportMidX;
      text.y = this.dimensions[1] - TICK_TEXT_SEPARATION - TICK_HEIGHT;
      text.updateTransform();

      if (this.flipText) { text.scale.x = -1; }

      const bbox = text.getBounds();
      // text.y -= bbox.height;

      // make sure the chrosome label fits in the x range
      /* Not necessary because chromosome labels only get drawn
            if (viewportMidX + bbox.width / 2  > this.dimensions[0]) {
                text.x -= (viewportMidX + bbox.width / 2) - this.dimensions[0];
            } else if (viewportMidX - bbox.width / 2 < 0) {
                //
                text.x -= (viewportMidX - bbox.width / 2);
            }
            */


      const numTicksDrawn = this.drawTicks(xCumPos);


      // only show chromsome labels if there's no ticks drawn
      if (numTicksDrawn > 0) { text.visible = false; } else { text.visible = true; }


      this.allTexts.push({ importance: this.texts[i].hashValue, text: this.texts[i], caption: null });
    }

    // define the edge chromosome which are visible
    this.hideOverlaps(this.allTexts);
  }

  hideOverlaps(allTexts) {
    let allBoxes = []; // store the bounding boxes of the text objects so we can
    // calculate overlaps
    allBoxes = allTexts.map((val) => {
      const text = val.text;
      text.updateTransform();
      const b = text.getBounds();
      const box = [b.x, b.y, b.x + b.width, b.y + b.height];

      return box;
    });

    const result = boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        // console.log('hiding:', allTexts[j].caption)
        allTexts[j].text.visible = 0;
      } else {
        // console.log('hiding:', allTexts[i].caption)
        allTexts[i].text.visible = 0;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  refreshTiles() {
    // dummy function that is called by LeftTrackModifier
  }

  exportSVG() {
    let track = null,
      base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }
    base.setAttribute('class', 'chromosome-labels');

    const output = document.createElement('g');
    track.appendChild(output);

    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    for (const text of this.allTexts) {
      if (!text.text.visible) { continue; }

      const g = pixiTextToSvg(text.text);
      output.appendChild(g);
    }

    for (const key in this.tickTexts) {
      for (const text of this.tickTexts[key]) {
        const g = pixiTextToSvg(text);

        for (let key in this.tickTexts) {
          for (let text of this.tickTexts[key]) {
            let g = PIXITextToSvg(text);
            output.appendChild(g);

            g = svgLine(
              text.x,
              this.dimensions[1],
              text.x,
              this.dimensions[1] - TICK_HEIGHT,
              1,
              TICK_COLOR
            );

            output.appendChild(g);
          }
        }
      }

      return [base, track];
    }
  }
}

export default HorizontalChromosomeLabels;
