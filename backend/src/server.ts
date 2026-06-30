import { createApp } from './app.ts';
import { getPort } from './config/env.ts';

const app = createApp();
const port = getPort();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
