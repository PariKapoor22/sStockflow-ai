type NetworkListener = (isOnline: boolean, mode: 'online' | 'offline' | 'spotty') => void;

class ConnectivityService {
  private isOnlineState: boolean = false;
  private mode: 'online' | 'offline' | 'spotty' = 'offline';
  private listeners: Set<NetworkListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleBrowserNetworkChange(true));
      window.addEventListener('offline', () => this.handleBrowserNetworkChange(false));
    }
  }

  private handleBrowserNetworkChange(browserOnline: boolean) {
    if (this.mode === 'offline') {
      // If manually set to tactical offline simulation, stay offline
      return;
    }
    this.isOnlineState = browserOnline;
    this.notifyListeners();
  }

  public setMode(mode: 'online' | 'offline' | 'spotty') {
    this.mode = mode;
    if (mode === 'online') {
      this.isOnlineState = true;
    } else if (mode === 'offline') {
      this.isOnlineState = false;
    } else {
      // spotty
      this.isOnlineState = true;
    }
    this.notifyListeners();
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public getMode(): 'online' | 'offline' | 'spotty' {
    return this.mode;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnlineState, this.mode);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.isOnlineState, this.mode));
  }
}

export const connectivityService = new ConnectivityService();
