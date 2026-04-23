'use client';

/**
 * Base Repository for CRUD operations with localStorage persistence
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected storageKey: string;
  protected data: T[];

  constructor(storageKey: string, initialData: T[] = []) {
    this.storageKey = storageKey;
    this.data = this.loadFromStorage() || initialData;
  }

  protected loadFromStorage(): T[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  protected saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error(`Failed to save ${this.storageKey}:`, e);
    }
  }

  getAll(): T[] {
    return this.data;
  }

  getById(id: string): T | undefined {
    return this.data.find(item => item.id === id);
  }

  create(entity: Omit<T, 'id'>): T {
    const newEntity = {
      ...entity,
      id: this.generateId(),
    } as T;
    this.data.push(newEntity);
    this.saveToStorage();
    return newEntity;
  }

  update(id: string, updates: Partial<Omit<T, 'id'>>): T | null {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.data[index] = { ...this.data[index], ...updates };
    this.saveToStorage();
    return this.data[index];
  }

  delete(id: string): boolean {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  clear(): void {
    this.data = [];
    this.saveToStorage();
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
