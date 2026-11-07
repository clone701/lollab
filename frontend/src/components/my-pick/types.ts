/** トーストを出す関数（既存の useToast の showToast と同じ形） */
export type ShowToast = (
  message: string,
  type: 'success' | 'error' | 'info'
) => void;
