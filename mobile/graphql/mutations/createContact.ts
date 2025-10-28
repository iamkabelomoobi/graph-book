import { gql } from "@apollo/client";

export const CREATE_CONTACT = gql`
  mutation CreateContact($name: String!, $email: String!, $phone: String!) {
    createContact(name: $name, email: $email, phone: $phone) {
      id
      name
      email
      phone
      createdAt
      updatedAt
    }
  }
`;
