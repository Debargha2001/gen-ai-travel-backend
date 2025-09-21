// Load environment variables first, before any other imports

import { listen as HttpListen } from "./bin/http.js";
import { config } from "./utils/config.js";

const PORT = parseInt(config.get("PORT"), 10) || 3000;

HttpListen(PORT);
