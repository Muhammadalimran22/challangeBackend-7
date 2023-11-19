require("dotenv").config();
const express = require("express");
const Sentry = require("@sentry/node");
const app = express();
const morgan = require("morgan");
const path = require("path");
const { PORT = 3000, SENTRY_DSN, ENV } = process.env;

app.use(morgan("dev"));
app.use(express.json());

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  environment: ENV,
});
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "views")));

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.on("connection", (client) => {
  console.log("new user connected!");

  // Tambahkan username ke dalam objek client
  client.on("add user", (username) => {
    client.username = username;
  });

  // subscribe topik 'chat message'
  client.on("chat message", (msg) => {
    // Kirim pesan beserta nama pengguna
    io.emit("chat message", `${client.username}: ${msg}`);
  });
});
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/auth", require("./routes/resetPassword.routes"));

app.use(Sentry.Handlers.errorHandler());
// 404 error handling
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: "Not Found",
    data: null,
  });
});

// 500 error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    status: false,
    message: "Internal Server Error",
    data: err.message,
  });
});

app.listen(PORT, () => console.log("server nyala", PORT));
