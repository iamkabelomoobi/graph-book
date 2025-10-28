import { Stack } from "expo-router";
import { ContactsProvider } from "../contexts/ContactsContext";
import { ApolloProvider } from "@apollo/client/react";
import client from "@/lib/apolloClient";

export default function RootLayout() {
  return (
    <ApolloProvider client={client}>
      <ContactsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </ContactsProvider>
    </ApolloProvider>
  );
}
