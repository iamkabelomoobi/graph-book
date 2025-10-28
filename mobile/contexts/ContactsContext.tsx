import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_CONTACTS } from "../graphql/queries/getContacts";
import { CREATE_CONTACT } from "../graphql/mutations/createContact";
import { UPDATE_CONTACT } from "../graphql/mutations/updateContact";
import { DELETE_CONTACT } from "../graphql/mutations/deleteContact";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactDraft = Pick<Contact, "name" | "email" | "phone">;

type CreateContactResponse = {
  createContact: Contact;
};

type UpdateContactResponse = {
  updateContact: Contact;
};

type DeleteContactResponse = {
  deleteContact: boolean;
};

type UpdateContactVariables = {
  id: string;
} & ContactDraft;

type ContactsContextValue = {
  contacts: Contact[];
  loading: boolean;
  error?: Error;
  isMutating: boolean;
  refreshContacts: () => Promise<void>;
  addContact: (draft: ContactDraft) => Promise<string | undefined>;
  updateContact: (id: string, draft: ContactDraft) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
};

const ContactsContext = createContext<ContactsContextValue | undefined>(
  undefined,
);

type ContactsProviderProps = {
  children: ReactNode;
};

export function ContactsProvider({ children }: ContactsProviderProps) {
  const { data, loading, error, refetch } = useQuery<{
    getContacts: Contact[];
  }>(GET_CONTACTS);

  const [createContact, { loading: creating }] = useMutation<
    CreateContactResponse,
    ContactDraft
  >(CREATE_CONTACT);
  const [updateContactMutation, { loading: updating }] = useMutation<
    UpdateContactResponse,
    UpdateContactVariables
  >(UPDATE_CONTACT);
  const [deleteContactMutation, { loading: deleting }] = useMutation<
    DeleteContactResponse,
    { id: string }
  >(DELETE_CONTACT);

  const refreshContacts = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const addContact = useCallback(
    async (draft: ContactDraft) => {
      const response = await createContact({
        variables: {
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
        },
      });

      await refreshContacts();

      return response.data?.createContact.id;
    },
    [createContact, refreshContacts],
  );

  const updateContact = useCallback(
    async (id: string, draft: ContactDraft) => {
      await updateContactMutation({
        variables: {
          id,
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
        },
      });

      await refreshContacts();
    },
    [refreshContacts, updateContactMutation],
  );

  const deleteContact = useCallback(
    async (id: string) => {
      await deleteContactMutation({
        variables: { id },
      });

      await refreshContacts();
    },
    [deleteContactMutation, refreshContacts],
  );

  const value = useMemo<ContactsContextValue>(
    () => {
      const contacts: Contact[] = data?.getContacts ?? [];

      return {
        contacts,
        loading,
        error,
        isMutating: creating || updating || deleting,
        refreshContacts,
        addContact,
        updateContact,
        deleteContact,
        getContactById: (id: string) =>
          contacts.find((contact) => contact.id === id),
      };
    },
    [
      addContact,
      creating,
      deleteContact,
      deleting,
      error,
      loading,
      refreshContacts,
      updateContact,
      updating,
      data?.getContacts,
    ],
  );

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error("useContacts must be used within a ContactsProvider");
  }
  return context;
}
