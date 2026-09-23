// src/app/core/services/socket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  /** Staff — conecta con el mismo JWT de las rutas REST. */
  connectAsStaff(token: string): void {
    this.disconnect();
    this.socket = io(environment.socketUrl, { auth: { token } });
  }

  /** Cliente (QR) — conecta con el token de table_sessions. */
  connectAsCustomer(sessionToken: string): void {
    this.disconnect();
    this.socket = io(environment.socketUrl, { auth: { sessionToken } });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /** Suscribirse a un evento — se desuscribe solo cuando el Observable se completa/cancela. */
  on<T = unknown>(event: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (!this.socket) {
        subscriber.error(new Error('Socket no conectado — llama connectAsStaff()/connectAsCustomer() primero.'));
        return;
      }
      const handler = (payload: T) => subscriber.next(payload);
      this.socket.on(event, handler);
      return () => this.socket?.off(event, handler);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}