import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import keysRoute from "./routes/keys.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", keysRoute);

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});