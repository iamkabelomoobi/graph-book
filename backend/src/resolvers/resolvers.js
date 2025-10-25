import Contact from "../models/Contact.js";

export const resolvers = {
  Query: {
    getContacts: async () => await Contact.find(),
    getContact: async (_, { id }) => await Contact.findById(id),
  },
  Mutation: {
    createContact: async (_, { name, email, phone }) => {
      const contact = new Contact({ name, email, phone });
      await contact.save();
      return contact;
    },
    updateContact: async (_, { id, name, email, phone }) => {
      const contact = await Contact.findByIdAndUpdate(
        id,
        { name, email, phone, updatedAt: new Date() },
        { new: true }
      );
      if (!contact) throw new Error("Contact not found");
      return contact;
    },
    deleteContact: async (_, { id }) => {
      const result = await Contact.findByIdAndDelete(id);
      return !!result;
    },
  },
};
