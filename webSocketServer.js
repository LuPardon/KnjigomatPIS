const express = require("express");
const db = require("./config");
const cluster = require("cluster");
const fileURLToPath = require("url").fileURLToPath;
const availableParallelism = require("os").availableParallelism;
const createAdapter = require("@socket.io/cluster-adapter").createAdapter;
const setupPrimary = require("@socket.io/cluster-adapter").setupPrimary;
const fileUpload = require("express-fileupload");

const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

// Middleware za parsing JSON-a
app.use(express.json());
app.use(fileUpload());

// Cache za korisnička imena da se izbjegnu ponavljajući upiti
const userNameCache = new Map();

// Funkcija za čišćenje cache-a
setInterval(() => {
  if (userNameCache.size > 1000) {
    userNameCache.clear();
  }
}, 30 * 60 * 1000); // 30 minuta

// Funkcija za dohvaćanje korisničkog imena s cache-om
async function getUserName(userId) {
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId);
  }

  try {
    const [userResult] = await db.query(
      "SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users WHERE user_id = ?",
      [userId]
    );

    const userName =
      userResult.length > 0 ? userResult[0].full_name : `User ${userId}`;
    userNameCache.set(userId, userName);
    return userName;
  } catch (error) {
    console.error("Error fetching user name:", error);
    return `User ${userId}`;
  }
}

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 8080 + i,
    });
  }

  setupPrimary();
} else {
  const io = new Server(server, {
    connectionStateRecovery: {},
    adapter: createAdapter(),
    cors: {
      origin: "*", // Za produkciju, ograničeno na specific domene
      methods: ["GET", "POST"],
    },
    // Dodano za stabilnost konekcije
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // API ENDPOINT: Dohvaćanje chat-ova korisnika
  app.get("/api/chats/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const [chats] = await db.query(
        `SELECT 
          c.chat_id,
          c.person1_id,
          c.person2_id,
          CASE 
            WHEN c.person1_id = ? THEN c.person2_id 
            ELSE c.person1_id 
          END as other_person_id,
          (SELECT content FROM messages WHERE chat_id = c.chat_id ORDER BY sent_at DESC LIMIT 1) as last_message,
          (SELECT sent_at FROM messages WHERE chat_id = c.chat_id ORDER BY sent_at DESC LIMIT 1) as last_message_time
        FROM chats c 
        WHERE c.person1_id = ? OR c.person2_id = ?
        ORDER BY last_message_time DESC`,
        [userId, userId, userId]
      );

      res.json(chats);
    } catch (error) {
      console.error("Error fetching user chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // API ENDPOINT: Dohvaćanje poruka određenog chat-a
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    const { chatId } = req.params;

    try {
      const [messages] = await db.query(
        `SELECT message_id, chat_id, sender_id, content, sent_at, borrow_request_id, image_id 
        FROM messages 
        WHERE chat_id = ? 
        ORDER BY sent_at ASC`,
        [chatId]
      );

      // Optimizirano dohvaćanje dodatnih podataka
      await Promise.all(
        messages.map(async (message) => {
          try {
            if (message.image_id) {
              const [imageResult] = await db.query(
                "SELECT image_path FROM book_images WHERE image_id = ?",
                [message.image_id]
              );
              message.imagePath =
                imageResult.length > 0 ? imageResult[0].image_path : null;
            }

            if (message.borrow_request_id) {
              const [borrowRequestResult] = await db.query(
                "SELECT * FROM borrow_requests WHERE borrow_request_id = ?",
                [message.borrow_request_id]
              );
              message.borrowRequest =
                borrowRequestResult.length > 0 ? borrowRequestResult[0] : null;
            }
          } catch (error) {
            console.error(
              `Error processing message ${message.message_id}:`,
              error
            );
          }
        })
      );

      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Funkcija za pronalaženje ili kreiranje chat-a
  async function findOrCreateChat(person1_id, person2_id) {
    try {
      const [existingChats] = await db.query(
        `SELECT chat_id FROM chats 
        WHERE (person1_id = ? AND person2_id = ?) 
           OR (person1_id = ? AND person2_id = ?)`,
        [person1_id, person2_id, person2_id, person1_id]
      );

      if (existingChats.length > 0) {
        return existingChats[0].chat_id;
      }

      const [result] = await db.query(
        "INSERT INTO chats (person1_id, person2_id) VALUES (?, ?)",
        [person1_id, person2_id]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error in findOrCreateChat:", error);
      throw error;
    }
  }

  app.get("/chat", (req, res) => {
    res.sendFile(__dirname + "/index.html");
  });

  // Prati aktivne konekcije za debugging
  let activeConnections = 0;

  io.on("connection", async (socket) => {
    activeConnections++;
    console.log(`User connected (Total: ${activeConnections})`);

    // Korisnik se pridružuje određenom chat room-u
    socket.on("join chat", (chatId) => {
      if (!chatId) return;

      socket.join(`chat_${chatId}`);
      console.log(`User joined chat room: chat_${chatId}`);
    });

    // Optimizirano dohvaćanje korisničkih chat-ova
    socket.on("get user chats", async (data) => {
      if (!data || !data.user_id) {
        socket.emit("user chats", []);
        return;
      }

      const { user_id } = data;
      console.log("Getting user chats for:", user_id);

      try {
        const [chats] = await db.query(
          `SELECT 
            c.chat_id,
            c.person1_id,
            c.person2_id,
            CASE 
              WHEN c.person1_id = ? THEN c.person2_id 
              ELSE c.person1_id 
            END as other_person_id,
            (SELECT content FROM messages WHERE chat_id = c.chat_id ORDER BY sent_at DESC LIMIT 1) as last_message,
            (SELECT sent_at FROM messages WHERE chat_id = c.chat_id ORDER BY sent_at DESC LIMIT 1) as last_message_time
          FROM chats c 
          WHERE c.person1_id = ? OR c.person2_id = ?
          ORDER BY last_message_time DESC`,
          [user_id, user_id, user_id]
        );

        // Optimizirano dohvaćanje imena korisnika
        const chatsWithNames = await Promise.all(
          chats.map(async (chat) => {
            try {
              const otherUserName = await getUserName(chat.other_person_id);
              return {
                ...chat,
                other_user_name: otherUserName,
              };
            } catch (error) {
              console.error(
                `Error fetching user name for chat ${chat.chat_id}:`,
                error
              );
              return {
                ...chat,
                other_user_name: `User ${chat.other_person_id}`,
              };
            }
          })
        );

        socket.emit("user chats", chatsWithNames);
        console.log(`Sent ${chatsWithNames.length} chats for user: ${user_id}`);
      } catch (error) {
        console.error("Error fetching user chats:", error);
        socket.emit("user chats", []);
      }
    });

    // Korisnik napušta chat room
    socket.on("leave chat", (chatId) => {
      if (!chatId) return;

      socket.leave(`chat_${chatId}`);
      console.log(`User left chat room: chat_${chatId}`);
    });

    // Optimizirano slanje poruka
    socket.on("chat message", async (msg, clientOffset, callback) => {
      if (!msg || !msg.sender_id) {
        console.error("Invalid message data");
        return;
      }

      let { sender_id, content, chat_id, recipient_id } = msg;

      try {
        // Ako chat_id nije proslijeđen, pronađi ili kreiraj chat
        if (!chat_id && recipient_id) {
          chat_id = await findOrCreateChat(sender_id, recipient_id);
        }

        if (!chat_id) {
          console.error("No chat_id available");
          return;
        }

        // Automatski pridruži pošiljatelja chat room-u
        const roomName = `chat_${chat_id}`;
        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
        }

        // Spremi poruku u bazu
        const [result] = await db.query(
          "INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)",
          [chat_id, sender_id, content]
        );

        const messageWithId = {
          message_id: result.insertId,
          chat_id: chat_id,
          sender_id: sender_id,
          content: content,
          sent_at: new Date().toISOString(),
        };

        // Pošalji poruku svim korisnicima u tom chat room-u
        io.to(roomName).emit("chat message", messageWithId);

        // Pozovi callback ako postoji
        if (callback) callback();
      } catch (error) {
        console.error("Error processing message:", error);
        if (callback) callback(error);
      }
    });

    // Optimizirano učitavanje poruka chat-a
    socket.on("load chat messages", async (chatId) => {
      if (!chatId) {
        console.log("No chatId provided");
        socket.emit("chat history", []);
        return;
      }

      try {
        const [messages] = await db.query(
          `SELECT message_id, chat_id, sender_id, content, sent_at, borrow_request_id, image_id 
          FROM messages 
          WHERE chat_id = ? 
          ORDER BY sent_at ASC`,
          [chatId]
        );

        console.log(`Loading ${messages.length} messages for chat ${chatId}`);

        // Optimizirano dohvaćanje dodatnih podataka
        const messagesWithDetails = await Promise.all(
          messages.map(async (message) => {
            try {
              // Dodaj ime pošiljatelja
              const senderName = await getUserName(message.sender_id);
              const messageWithName = {
                ...message,
                sender_name: senderName,
              };

              // Dodaj sliku ako postoji
              if (message.image_id) {
                const [imageResult] = await db.query(
                  "SELECT image_path FROM book_images WHERE image_id = ?",
                  [message.image_id]
                );
                messageWithName.imagePath =
                  imageResult.length > 0 ? imageResult[0].image_path : null;
              }

              // Dodaj borrow request ako postoji
              if (message.borrow_request_id) {
                const [borrowRequestResult] = await db.query(
                  "SELECT * FROM borrow_requests WHERE request_id = ?",
                  [message.borrow_request_id]
                );

                if (borrowRequestResult.length > 0) {
                  messageWithName.borrowRequest = borrowRequestResult[0];

                  // Dohvati dodatne informacije o knjizi
                  const [bookResult] = await db.query(
                    "SELECT title, author FROM books WHERE book_id = ?",
                    [messageWithName.borrowRequest.book_id]
                  );

                  if (bookResult.length > 0) {
                    messageWithName.borrowRequest.book_title =
                      bookResult[0].title;
                    messageWithName.borrowRequest.book_author =
                      bookResult[0].author;
                  }

                  // Dohvati sliku knjige
                  const [bookImageResult] = await db.query(
                    "SELECT image_id FROM book_images WHERE book_id = ? LIMIT 1",
                    [messageWithName.borrowRequest.book_id]
                  );

                  if (
                    bookImageResult.length > 0 &&
                    bookImageResult[0].image_id
                  ) {
                    const [imagePathResult] = await db.query(
                      "SELECT image_path FROM images WHERE image_id = ?",
                      [bookImageResult[0].image_id]
                    );

                    if (imagePathResult.length > 0) {
                      messageWithName.borrowRequest.book_image_path =
                        imagePathResult[0].image_path;
                    }
                  }
                }
              }

              return messageWithName;
            } catch (error) {
              console.error(
                `Error processing message ${message.message_id}:`,
                error
              );
              return {
                ...message,
                sender_name: `User ${message.sender_id}`,
              };
            }
          })
        );

        socket.emit("chat history", messagesWithDetails);
      } catch (error) {
        console.error("Error loading chat messages:", error);
        socket.emit("chat history", []);
      }
    });

    // Dodaj heartbeat za stabilnost konekcije
    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("disconnect", (reason) => {
      activeConnections--;
      console.log(`User disconnected (${reason}). Total: ${activeConnections}`);
    });

    // Dodaj error handler
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  server.listen(8080, () => {
    console.log("Server listening on port 8080");
  });
}
