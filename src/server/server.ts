import { WebSocketServer } from 'ws';
import express from "express"
import { join } from 'path';
import { Logger } from '../core/logger';
import { Subject } from 'rxjs';
import { WsCommand } from '../shared/ws-command';
import { WsEmission } from '../shared/ws-emission';
import { nanoid } from 'nanoid';

const PORT = 3155;
const CLIENT_ID_KEY = "ws-client-id";

const app = express();

app.use(express.static(join(__dirname, "../client")));

const server = app.listen(PORT, () => {
  Logger.system(`HTTP server listening at: http://localhost:${PORT}`);
  // Logger.system(`(Ctrl+Click to open link in browser)`);
  // Logger.system("");
});

export class WSServer {

  logger = {
    debug: (...msgs: any[]) => {
      if (false) console.log(...msgs);
    },
    log: (...msgs: any[]) => console.log(...msgs),
    warn: (...msgs: any[]) => console.warn(...msgs),
    error: (...msgs: any[]) => console.error(...msgs),
  };

  wss: WebSocketServer;
  clients = new Map<string, WebSocket>();

  private _messages = new Subject<{ clientId: string, msg: WsCommand }>();
  public messages$ = this._messages.asObservable();

  constructor() {

    this.wss = new WebSocketServer({
      // port: opts?.port || 9000,
      // noServer: true,
      server: server,
    });

    this.wss.on("error", (err) => {
      this.logger.error("WS error:", err);
    });
    
    this.wss.on('connection', (ws) => {
      const id = nanoid(10);
      this.logger.log(`WS connection opened, id: ${id}`);
      (ws as any)[CLIENT_ID_KEY] = id;
      
      ws.on("error", (err) => {
        this.logger.log(`WS connection error: ${err}`);
      });

      ws.on("close", (code, reason) => {
        this.logger.log(`WS connection closed, id: ${id}, code: ${code}`);
      });

      ws.on('message', (rawData) => {
        this.logger.debug(`WS data: ${rawData}`);
        const data = rawData.toString();
        if (!data.startsWith("{")) {
          // Not a JSON object, discard it for now
          return;
        }
        const msg = JSON.parse(data) as WsCommand;
        // msg.clientId = id;
        this._messages.next({ clientId: id, msg });
      });
      
      // ws.send('Hello there');
      
    });

    this.wss.on("listening", () => {
      console.log(`Websocket server listening at: ws://localhost:${PORT}`);
      console.log("");
    });

  }

  async sendRaw(clientId: string, message: string) {
    return new Promise<void>((resolve, reject) => {

      let foundClient = false;
      for (const ws of this.wss.clients) {
        const id = (ws as any)[CLIENT_ID_KEY] as string;
        if (clientId === id) {
          foundClient = true;
          ws.send(message, (err) => {
            if (err) {
              // reject(err);
              this.logger.warn("Error:", err);
              resolve();
            } else {
              resolve();
            }
          });
          break;
        }
      }

      if (!foundClient) {
        if (clientId) {
          this.logger.warn(`Error: WS send: client with id "${clientId}" not found`);
        }
        resolve();
      }

    });
  }

  broadcastRaw(message: string) {
    this.wss.clients.forEach(ws => {
      ws.send(message);
    });
  }

  async send(clientId: string, msg: WsEmission) {
    return this.sendRaw(clientId, JSON.stringify(msg));
  }

  async broadcast(msg: WsEmission) {
    return this.broadcastRaw(JSON.stringify(msg));
  }

}
