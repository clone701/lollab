/**
 * リクエスト本文を、署名（SHA-256）の対象になるバイト列にする。
 * 本文がなければ空のバイト列。FormData と ReadableStream は内容を確定できないため対象外。
 */
export async function toBodyBytes(
  body: BodyInit | null | undefined
): Promise<BufferSource> {
  if (body === undefined || body === null) return new Uint8Array(0);
  if (typeof body === 'string') return new TextEncoder().encode(body);
  if (body instanceof URLSearchParams) {
    return new TextEncoder().encode(body.toString());
  }
  if (body instanceof Blob) return body.arrayBuffer();
  if (body instanceof ArrayBuffer) return body;
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  throw new TypeError('この形式のリクエスト本文は署名できません');
}
