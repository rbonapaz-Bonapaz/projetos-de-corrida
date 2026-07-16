/**
 * Emissor de eventos customizado para o ambiente de navegador.
 * Evita o uso do módulo 'events' do Node.js para prevenir Internal Server Errors.
 */
type ErrorCallback = (error: any) => void;

class SimpleEmitter {
  private listeners: { [event: string]: ErrorCallback[] } = {};

  on(event: string, callback: ErrorCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const errorEmitter = new SimpleEmitter();
