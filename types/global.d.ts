// Global audio functions for notifications
declare global {
  interface Window {
    enableAudio: () => Promise<boolean>;
    playNotificationSound: () => Promise<boolean>;
    playChatSound: () => Promise<boolean>;
    testChatSound?: () => void;
    clearAllNotifications?: () => void;
    showToast?: (message: string, type?: string, duration?: number, errorId?: string) => number;
  }
}

export {};