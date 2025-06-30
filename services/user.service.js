const User = require("../models/User");

const userService = {
  getAll: async () => {
    return await User.getAll();
  },

  getById: async (id) => {
    return await User.getById(id);
  },

  create: async (data) => {
    return await User.create(data);
  },

  update: async (id, data) => {
    await User.update(id, data);
  },

  delete: async (id) => {
    await User.delete(id);
  },
};

module.exports = userService;
