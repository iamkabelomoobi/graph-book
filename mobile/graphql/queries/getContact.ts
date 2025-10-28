import { gql } from "@apollo/client";

export const GET_CONTACT = gql`
  query GetContact($id: ID!) {
    getContact(id: $id) {
      id
      name
      email
      phone
      createdAt
      updatedAt
    }
  }
`;
