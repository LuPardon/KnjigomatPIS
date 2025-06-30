require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const { auth, requiresAuth } = require("express-openid-connect");

const app = express();

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bookRoutes = require("./routes/book.routes");
const userRoutes = require("./routes/user.routes");
const bookImageRoutes = require("./routes/bookImage.routes");
const borrowRequestRoutes = require("./routes/borrowRequest.routes");
const exchangeHistoryRoutes = require("./routes/exchangeHistory.routes");
const messageRoutes = require("./routes/message.routes");
const notificationRoutes = require("./routes/notification.routes");

//auth0
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    baseURL: "http://localhost:3000",
    clientID: "jCg7BEhst5LrESF1XgdUnupkTT7xIbQ2",
    issuerBaseURL: "https://dev-l82m10ihxsexnmhy.eu.auth0.com",
    secret: "dFHqnIp7-oBBzMIsh2FAxG_ikCafjJPn3A7Js6YZNGvDy1uHgi4mVs48GMSJViFA",
  })
);

app.get("/", (req, res) => {
  res.send(
    req.oidc.isAuthenticated() ? "Prijavljena sam" : "Nisam prijavljena"
  );
});

app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user, null, 2));
});


app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookImages", bookImageRoutes);
app.use("/api/borrowRequests", borrowRequestRoutes);
app.use("/api/exchangeHistory", exchangeHistoryRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// sve rute za slike
app.use("/images", express.static("images"));
const path = require("path");
app.use("/images", express.static(path.join(__dirname, "images")));
//40l images folder radi bez obzira na to odakle se pokreće server

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));
