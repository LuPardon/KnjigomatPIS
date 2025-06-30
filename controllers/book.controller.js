const fs = require("node:fs");
const path = require("path");
const bookService = require("../services/book.service");
const bookImageService = require("../services/bookImage.service");

exports.getBooks = async (req, res) => {
  try {
    const books = await bookService.getAllBooks();
    res.json(books);
  } catch (error) {
    console.error("Greška u getBooks:", error);
    res.status(500).json({ message: "Greška pri dohvaćanju knjiga.", error });
  }
};
exports.getBooksByUserId = async (req, res) => {
  const userId = req.params.userId;

  try {
    const books = await bookService.getBooksByUserId(userId);
    res.json(books);
  } catch (err) {
    console.error("Greška u getBooksByUserId:", err);
    res
      .status(500)
      .json({ message: "Greška kod dohvaćanja knjiga korisnika.", err });
  }
};

exports.getOtherUsersBooksByUserId = async (req, res) => {
  const userId = req.params.userId;

  try {
    const books = await bookService.getOtherUsersBooksByUserId(userId);
    res.json(books);
  } catch (err) {
    console.error("Greška u getOtherUsersBooksByUserId:", err);
    res.status(500).json({
      message: "Greška kod dohvaćanja knjiga ostalih korisnika.",
      err,
    });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Knjiga nije pronađena." });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Greška pri dohvaćanju knjige.", error });
  }
};

exports.createBook = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    const bookId = await bookService.createBook(JSON.parse(req.body.book));
    console.log("Book created with ID:", bookId);

    // Provjeri da li postoje slike
    if (req.files && req.files.images) {
      let { images } = req.files;

      // Ako nije array, napravi array
      if (!Array.isArray(images)) {
        images = [images];
      }

      console.log("Processing", images.length, "images");

      for (const uploadedFile of images) {
        try {
          // Jedinstveno ime datoteke
          const fileExtension = path.extname(uploadedFile.name);
          const uniqueFileName = `book_${bookId}_${Date.now()}${fileExtension}`;

          // Put za spremanje
          const uploadDir = path.join(__dirname, "../images");
          const filePath = path.join(uploadDir, uniqueFileName);

          // Spremi datoteku koristeći fs.writeFile
          await new Promise((resolve, reject) => {
            fs.writeFile(filePath, uploadedFile.data, (err) => {
              if (err) {
                console.error("Error saving file:", err);
                reject(err);
              } else {
                console.log("File saved:", uniqueFileName);
                resolve();
              }
            });
          });

          const relativePath = `/images/${uniqueFileName}`;
          const imageId = await bookImageService.addImage(bookId, relativePath);
          console.log("Image added to database:", imageId);
        } catch (fileError) {
          console.error("Error processing image file:", fileError);
          // Nastavi s ostalim slikama ako jedna ne uspije
        }
      }
    } else {
      console.log("No images received in request");
    }

    res.status(201).json({
      message: "Knjiga dodana.",
      bookId: bookId,
      imagesProcessed:
        req.files && req.files.images
          ? Array.isArray(req.files.images)
            ? req.files.images.length
            : 1
          : 0,
    });
  } catch (error) {
    console.error("Greška u createBook:", error);
    res
      .status(500)
      .json({ message: "Greška pri dodavanju knjige.", error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    console.log("Update book pozvan za ID:", req.params.id);
    console.log("Podaci za update:", req.body);

    // Provjeri da li postoji book_id
    if (!req.params.id) {
      return res.status(400).json({ message: "Book ID je obavezan." });
    }

    // Provjeri da li postoji knjiga
    const existingBook = await bookService.getBookById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ message: "Knjiga nije pronađena." });
    }

    await bookService.updateBook(req.params.id, req.body);
    res.json({ message: "Knjiga ažurirana." });
  } catch (error) {
    console.error("Greška u updateBook kontroleru:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Greška pri ažuriranju knjige.",
      error: error.message,
      details: error.stack,
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    await bookService.deleteBook(req.params.id);
    res.status(204).json({ message: "Knjiga obrisana." });
  } catch (error) {
    res.status(500).json({ message: "Greška pri brisanju knjige.", error });
  }
};
