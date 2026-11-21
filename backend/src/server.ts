import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`Servidor RepasoApp corriendo en puerto ${env.port}`);
});