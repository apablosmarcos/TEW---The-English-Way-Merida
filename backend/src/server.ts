import { createApp } from './app.js';
import { getPort } from './config/env.js';

const app = createApp();
const port = getPort();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
