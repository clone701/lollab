/**
 * AuthGate を有効にするか。文字列 'false' のときだけ無効。
 * 未設定・その他の値は有効（安全側）
 */
export function isAuthGateEnabled(value: string | undefined): boolean {
  return value !== 'false';
}
