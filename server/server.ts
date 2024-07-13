const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
require("dotenv").config();

const indexRouter = require("./routes/indexRouter");

app.use(cors());
app.use(express.json());

app.use((req: any, res: any, next: any) => {
  console.log("Request:", req.method, req.url);
  next();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use("/api", indexRouter);
