import { isAuthGateEnabled } from '../isAuthGateEnabled';

describe('isAuthGateEnabled', () => {
  it.each([
    [undefined, true],
    ['true', true],
    ['false', false],
    ['', true],
    ['FALSE', true],
    ['0', true],
    [' false', true],
  ])('%j のとき %s を返す', (value, expected) => {
    expect(isAuthGateEnabled(value)).toBe(expected);
  });
});
