import { gql } from "@apollo/client";

export const GET_CONTACTS = gql`
  query GetContacts {
    getContacts {
      id
      name
      email
      phone
      createdAt
      updatedAt
    }
  }
`;
