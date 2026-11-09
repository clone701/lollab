import { calcTooltipPosition } from '..';

const viewport = { width: 1000, height: 800 };
const panel = { width: 200, height: 100 };

describe('calcTooltipPosition', () => {
  it('トリガーの下の中央に出す', () => {
    const trigger = { top: 100, left: 400, width: 40, height: 40 };
    expect(calcTooltipPosition(trigger, panel, viewport)).toEqual({
      top: 148,
      left: 320,
      placement: 'bottom',
    });
  });

  it('下にはみ出すと上に出す', () => {
    const trigger = { top: 700, left: 400, width: 40, height: 40 };
    const pos = calcTooltipPosition(trigger, panel, viewport);
    expect(pos.placement).toBe('top');
    expect(pos.top + panel.height).toBeLessThanOrEqual(trigger.top);
  });

  it('上にも収まらないときは下に出す', () => {
    const small = { width: 1000, height: 150 };
    const trigger = { top: 60, left: 400, width: 40, height: 40 };
    expect(calcTooltipPosition(trigger, panel, small).placement).toBe('bottom');
  });

  it('右端で画面内に収める', () => {
    const trigger = { top: 100, left: 960, width: 40, height: 40 };
    const pos = calcTooltipPosition(trigger, panel, viewport);
    expect(pos.left + panel.width).toBeLessThanOrEqual(viewport.width);
  });

  it('左端で画面内に収める', () => {
    const trigger = { top: 100, left: 0, width: 40, height: 40 };
    expect(
      calcTooltipPosition(trigger, panel, viewport).left
    ).toBeGreaterThanOrEqual(0);
  });

  it('パネルが画面より大きくても left は 0 未満にならない', () => {
    const trigger = { top: 100, left: 100, width: 40, height: 40 };
    const wide = { width: 1500, height: 100 };
    expect(
      calcTooltipPosition(trigger, wide, viewport).left
    ).toBeGreaterThanOrEqual(0);
  });
});
