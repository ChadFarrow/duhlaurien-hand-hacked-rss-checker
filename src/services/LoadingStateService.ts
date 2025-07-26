interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error?: string;
}

class LoadingStateService {
  private listeners = new Map<string, Set<(state: LoadingState) => void>>();
  private states = new Map<string, LoadingState>();

  // Subscribe to loading state changes for a specific resource
  subscribe(resourceId: string, callback: (state: LoadingState) => void): () => void {
    if (!this.listeners.has(resourceId)) {
      this.listeners.set(resourceId, new Set());
    }
    
    this.listeners.get(resourceId)!.add(callback);
    
    // Send current state if it exists
    const currentState = this.states.get(resourceId);
    if (currentState) {
      callback(currentState);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(resourceId)?.delete(callback);
    };
  }

  // Update loading state for a resource
  setState(resourceId: string, state: Partial<LoadingState>): void {
    const currentState = this.states.get(resourceId) || {
      isLoading: false,
      progress: 0,
      message: ''
    };
    
    const newState = { ...currentState, ...state };
    this.states.set(resourceId, newState);
    
    // Notify all listeners
    const listeners = this.listeners.get(resourceId);
    if (listeners) {
      listeners.forEach(callback => callback(newState));
    }
  }

  // Start loading for a resource
  startLoading(resourceId: string, message: string = 'Loading...'): void {
    this.setState(resourceId, {
      isLoading: true,
      progress: 0,
      message,
      error: undefined
    });
  }

  // Update progress for a resource
  updateProgress(resourceId: string, progress: number, message?: string): void {
    const update: Partial<LoadingState> = { progress };
    if (message) update.message = message;
    this.setState(resourceId, update);
  }

  // Complete loading for a resource
  completeLoading(resourceId: string, message: string = 'Complete'): void {
    this.setState(resourceId, {
      isLoading: false,
      progress: 100,
      message,
      error: undefined
    });
  }

  // Set error state for a resource
  setError(resourceId: string, error: string): void {
    this.setState(resourceId, {
      isLoading: false,
      error,
      message: 'Failed to load'
    });
  }

  // Get current state for a resource
  getState(resourceId: string): LoadingState | null {
    return this.states.get(resourceId) || null;
  }

  // Clear state for a resource
  clearState(resourceId: string): void {
    this.states.delete(resourceId);
    this.listeners.delete(resourceId);
  }
}

export const loadingStateService = new LoadingStateService();
export type { LoadingState };