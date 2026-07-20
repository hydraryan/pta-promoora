import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./db.js";
import { seedAdmin } from "./seed.js";

const port = Number(process.env.PORT || 4000);

connectDB()
  .then(async () => {
    await seedAdmin();
    app.listen(port, () => console.log(`[server] listening on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("[server] failed to start:", err);
    process.exit(1);
  });
