import { WebSocketServer } from 'ws';
import express from "express"
import { join } from 'path';
import { Logger } from '../core/logger';

const PORT = 3155;

const app = express();

app.use(express.static(join(__dirname, "../client")));

const server = app.listen(PORT, () => {
  Logger.system(`HTTP server listening at: http://localhost:${PORT}`);
  // Logger.system(`(Ctrl+Click to open link in browser)`);
  // Logger.system("");
});
