import { createApp } from './app/server.js';
import { env } from './app/env.js';

const app = createApp();

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Mini Jira Backend] Servidor escuchando en puerto ${PORT}`);
  console.log(`Entorno: ${env.NODE_ENV}`);
});
