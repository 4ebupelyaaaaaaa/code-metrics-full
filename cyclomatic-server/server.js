require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models/index");

const { router: authRouter, authCheck } = require("./routes/auth.routes");

const cyclomaticRouter = require("./routes/cyclomatic.routes");
const nestingRouter = require("./routes/nesting.routes");
const depthRouter = require("./routes/depth.routes");
const cognitiveRouter = require("./routes/cognitive.routes");
const inheritanceRouter = require("./routes/inheritance.routes.js");
const maintainabilityRouter = require("./routes/maintainability.routes.js");
const commentsRouter = require("./routes/comments.routes.js");
const readabilityRouter = require("./routes/readability.routes.js");
const historyRouter = require("./routes/history.routes.js");
const reportRouter = require("./routes/report.routes.js");
const app = express();

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRouter);
app.get("/api/protected", authCheck, (req, res) => {
  res.json({ message: `Вы вошли как ${req.user.login}` });
});

app.use("/api/report", cyclomaticRouter);
app.use("/api/report", nestingRouter);
app.use("/api/report", depthRouter);
app.use("/api/report", cognitiveRouter);
app.use("/api/report", inheritanceRouter);
app.use("/api/report", maintainabilityRouter);
app.use("/api/report", commentsRouter);
app.use("/api/report", readabilityRouter);
app.use("/api/report", readabilityRouter);
app.use("/api/history", historyRouter);
app.use("/api/report", reportRouter);

app.use(
  "/static/reports",
  express.static(path.join(__dirname, "static/reports"))
);

// Синхронизация с БД
const PORT = process.env.PORT || 5000;
db.sequelize.sync().then(() => {
  console.log("DB connected and synced");
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
});
