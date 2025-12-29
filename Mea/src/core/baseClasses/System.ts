// src/core/baseClasses/System.ts

export default class System {
  // Keeps one instance per System class (singleton pattern)
  private static registry: WeakMap<Function, System> = new WeakMap();

  // Whether the system is enabled
  protected enabled: boolean = true;

  // Optional callback when mode changes
  protected modeChangeCallback?: (mode: string) => void;

  // Protected constructor so only subclasses can create instances
  protected constructor() {
    this.enabled = true;
  }

  /**
   * Creates a system instance if it does not exist,
   * otherwise returns the existing one.
   */
  static createReference(this: any, ...args: any[]): any {
    const existing = System.registry.get(this);
    if (existing) return existing;

    const instance = new this(...args);
    System.registry.set(this, instance);
    return instance;
  }

  /**
   * Returns an existing system instance.
   * Throws error if not created yet.
   */
  static getReference(this: any): any {
    const existing = System.registry.get(this);
    if (!existing) {
      throw new Error(
        `${this.name} instance not created. Call createReference first.`
      );
    }
    return existing;
  }

  // Lifecycle hooks (meant to be overridden)

  init(_dependencies: any): void {}

  update(_deltaTime: number): void {}

  activate(): void {}

  deactivate(): void {}

  dispose(): void {}

  /**
   * Handle events from the event system
   * Return true if event is handled, false otherwise
   */
  handleEvent(_category: string, _eventData: any): boolean {
    return false;
  }
}
