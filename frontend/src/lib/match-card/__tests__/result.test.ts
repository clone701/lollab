import { getResultClass, getResultLabel } from '..';

describe('試合カードの勝敗の表示', () => {
  it('リメイクは勝敗より優先して「リメイク」と控えめな色', () => {
    expect(getResultLabel(true, true)).toBe('リメイク');
    expect(getResultLabel(false, true)).toBe('リメイク');
    expect(getResultClass(true, true)).toBe('text-fg-muted');
  });

  it('それ以外は勝利・敗北と勝敗の色', () => {
    expect(getResultLabel(true, false)).toBe('勝利');
    expect(getResultLabel(false, false)).toBe('敗北');
    expect(getResultClass(true, false)).toBe('text-win');
    expect(getResultClass(false, false)).toBe('text-loss');
  });
});
