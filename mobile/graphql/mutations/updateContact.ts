import { gql } from "@apollo/client";

export const UPDATE_CONTACT = gql`
  mutation UpdateContact(
    $id: ID!
    $name: String
    $email: String
    $phone: String
  ) {
    updateContact(id: $id, name: $name, email: $email, phone: $phone) {
      id
      name
      email
      phone
      createdAt
      updatedAt
    }
  }
`;
