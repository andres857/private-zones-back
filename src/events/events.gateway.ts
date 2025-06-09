import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  // El namespace es opcional pero recomendado para organizar
  namespace: '/events',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.query.token; // Así puedes leer el token que envías
    this.logger.log(`Client connected: ${client.id}, with token: ${token}`);
    // Aquí podrías validar el token y desconectar si no es válido
    // client.disconnect();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): void {
    this.logger.log(`Message from client ${client.id}:`, payload);
    // Re-emitir el mensaje a todos los clientes conectados a este namespace
    this.server.emit('messageToClient', { from: client.id, data: payload });
  }
}