const userService = require("../services/user.service");

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Greška kod dohvaćanja korisnika.", err });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Greška kod dohvaćanja korisnika.", err });
  }
};

exports.createUser = async (req, res) => {
  try {
    const userId = await userService.create(req.body);
    res.status(201).json({ message: "Korisnik kreiran.", userId });
  } catch (err) {
    res.status(500).json({ message: "Greška kod kreiranja korisnika.", err });
  }
};

exports.updateUser = async (req, res) => {
  try {
    await userService.update(req.params.id, req.body);
    res.json({ message: "Korisnik ažuriran." });
  } catch (err) {
    res.status(500).json({ message: "Greška kod ažuriranja korisnika.", err });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userService.delete(req.params.id);
    res.json({ message: "Korisnik obrisan." });
  } catch (err) {
    res.status(500).json({ message: "Greška kod brisanja korisnika.", err });
  }
};
