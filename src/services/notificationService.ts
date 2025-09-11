interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

class NotificationService {
  private hasPermission = false;

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.hasPermission = true;
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  showNotification(options: NotificationOptions) {
    if (!this.hasPermission) {
      console.warn('Notifications not permitted');
      return null;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      requireInteraction: options.requireInteraction || false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        options.onClick?.();
        notification.close();
      };
    }

    // Auto close after 10 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return notification;
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();