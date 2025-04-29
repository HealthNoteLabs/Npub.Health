/**
 * A browser-compatible event emitter implementation
 * to replace Node.js's 'events' module
 */
export class EventEmitter {
  private events: Record<string, Function[]> = {};

  /**
   * Register an event listener
   */
  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Alias for on() to maintain compatibility with Node.js EventEmitter
   */
  addListener(event: string, listener: Function): this {
    return this.on(event, listener);
  }

  /**
   * Register a one-time event listener
   */
  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   */
  off(event: string, listener: Function): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
    return this;
  }

  /**
   * Remove a listener - alias for off() to maintain compatibility with Node.js EventEmitter
   */
  removeListener(event: string, listener: Function): this {
    return this.off(event, listener);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach(listener => {
        listener(...args);
      });
      return true;
    }
    return false;
  }

  /**
   * Get listeners for an event
   */
  listeners(event: string): Function[] {
    return this.events[event] || [];
  }

  /**
   * Get event names with listeners
   */
  eventNames(): (string)[] {
    return Object.keys(this.events);
  }

  /**
   * Get maximum number of listeners for an event
   * Note: This is a stub that always returns Infinity as we don't implement listener limits
   */
  getMaxListeners(): number {
    return Infinity;
  }

  /**
   * Set maximum number of listeners for an event
   * Note: This is a stub that returns this as we don't implement listener limits
   */
  setMaxListeners(n: number): this {
    return this;
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }

  /**
   * Add a listener to the beginning of the listeners array
   * Note: This is a simplified implementation that adds to the beginning
   */
  prependListener(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].unshift(listener);
    return this;
  }

  /**
   * Add a one-time listener to the beginning of the listeners array
   */
  prependOnceListener(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.prependListener(event, onceWrapper);
  }
}

export default EventEmitter; 