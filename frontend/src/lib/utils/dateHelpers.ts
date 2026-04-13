/**
 * 日付ヘルパー関数
 * 
 * 日付のフォーマット機能を提供
 */

/**
 * ISO 8601形式の日付文字列を日本語形式にフォーマット
 * 
 * @param dateString - ISO 8601形式の日付文字列
 * @returns フォーマットされた日付文字列（例: 2024/01/15 14:30）
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
}
