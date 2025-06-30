const bookImageService = require("../services/bookImage.service");
const fs = require("node:fs");
const path = require("path");

exports.getImagesByBook = async (req, res) => {
  try {
    const images = await bookImageService.getImagesByBook(req.params.bookId);
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: "Greška kod dohvaćanja slika.", err });
  }
};

exports.addImage = async (req, res) => {
  try {
    const { image: uploadedFile } = req.files;
    const bookId = req.query.bookId;

    // Jedinstveno ime datoteke
    const fileExtension = path.extname(uploadedFile.name);
    const uniqueFileName = `book_${bookId}_${Date.now()}${fileExtension}`;

    // Put za spremanje
    const uploadDir = path.join(__dirname, "../images");
    const filePath = path.join(uploadDir, uniqueFileName);

    // Spremi datoteku koristeći fs.writeFile
    fs.writeFile(filePath, uploadedFile.data, (err) => {
      if (err) {
        console.error(err);
      }
    });

    const relativePath = `/images/${uniqueFileName}`;
    const imageId = await bookImageService.addImage(bookId, relativePath);

    res
      .status(201)
      .json({ message: "slika čitana.", imagePath: relativePath, imageId });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "Greška kod dodavanja slike.", err });
  }
};

exports.editImage = async (req, res) => {
  try {
    const { image: uploadedFile } = req.files;
    const { originaImagePath } = req.query;

    // Jedinstveno ime datoteke
    const fileExtension = path.extname(uploadedFile.name);
    const uniqueFileName = `book_${Date.now()}${fileExtension}`;

    // Put za spremanje
    const uploadDir = path.join(__dirname, "../images");
    const filePath = path.join(uploadDir, uniqueFileName);

    // Spremi datoteku koristeći fs.writeFile
    fs.writeFile(filePath, uploadedFile.data, (err) => {
      if (err) {
        console.error(err);
      }
    });

    const relativePath = `/images/${uniqueFileName}`;
    await bookImageService.editImage(originaImagePath, relativePath);

    res.status(201).json({ message: "slika čitana.", imagePath: relativePath });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "Greška kod dodavanja slike.", err });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const filePath = req.query.imagePath;
    await bookImageService.deleteImage(filePath);

    const uploadDir = path.join(__dirname, "..");
    fs.unlinkSync(path.join(uploadDir, filePath));

    res.json({ message: "Slika obrisana." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška kod brisanja slike.", err });
  }
};
