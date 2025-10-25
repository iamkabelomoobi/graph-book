import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Contact {
    id: ID!
    name: String!
    email: String!
    phone: String!
    createdAt: String!
    updatedAt: String!
  }
  type Query {
    getContacts: [Contact!]!
    getContact(id: ID!): Contact
  }
  type Mutation {
    createContact(name: String!, email: String!, phone: String!): Contact!
    updateContact(id: ID!, name: String, email: String, phone: String): Contact!
    deleteContact(id: ID!): Boolean!
  }
`;
