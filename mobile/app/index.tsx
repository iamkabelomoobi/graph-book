import { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContacts, type Contact } from "../contexts/ContactsContext";
import { getAvatarPalette, getInitials } from "../lib/avatar";

type Section = {
  title: string;
  data: Contact[];
};

function formatContactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function Index() {
  const router = useRouter();
  const { contacts, loading, error, refreshContacts } = useContacts();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;

    return contacts.filter((contact) => {
      const haystack = [contact.name, contact.email, contact.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [contacts, query]);

  const sections = useMemo<Section[]>(() => {
    const sectionsMap = filteredContacts.reduce((acc, item) => {
      const parts = item.name.trim().split(/\s+/);
      const lastName = parts.length ? parts[parts.length - 1] : parts[0] || "";
      const letter = (lastName[0] || "").toUpperCase() || "#";

      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(item);
      return acc;
    }, {} as Record<string, Contact[]>);

    return Object.keys(sectionsMap)
      .sort()
      .map((key) => ({
        title: key,
        data: sectionsMap[key],
      }));
  }, [filteredContacts]);

  const totalContacts = contacts.length;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshContacts();
    } finally {
      setRefreshing(false);
    }
  }, [refreshContacts]);

  const handleAddContact = () => {
    router.push("/contacts/new");
  };

  const handleOpenContact = (id: string) => {
    router.push({
      pathname: "/contacts/[id]",
      params: { id },
    });
  };

  if (loading && contacts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screenPadding, styles.loadingWrap]}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingTitle}>Fetching contacts...</Text>
          <Text style={styles.loadingSubtitle}>
            Hold tight while we sync your address book.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && contacts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screenPadding, styles.loadingWrap]}>
          <View style={styles.errorState}>
            <View style={styles.errorIconWrap}>
              <Ionicons name="cloud-offline-outline" size={34} color="#F87171" />
            </View>
            <Text style={styles.errorTitle}>We could not reach the server</Text>
            <Text style={styles.errorSubtitle}>
              Check your connection and try again.
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={handleRefresh}
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={18} color="#F8FAFC" />
              <Text style={styles.retryButtonLabel}>Try again</Text>
              <View style={styles.retryButtonSpacer} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1E3A8A"
          />
        }
      >
        <View style={styles.screenPadding}>
          <View style={styles.headerCard}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>My Network</Text>
              <Text style={styles.headerSubtitle}>
                {loading
                  ? "Syncing your contacts..."
                  : `${totalContacts} saved contacts`}
              </Text>
            </View>
            <Pressable
              style={styles.headerAction}
              onPress={handleAddContact}
              accessibilityRole="button"
            >
              <Ionicons name="person-add-outline" size={22} color="#F8FAFC" />
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <Ionicons name="options-outline" size={18} color="#6B7280" />
          </View>

          {error ? (
            <Pressable
              style={styles.errorBanner}
              onPress={handleRefresh}
              accessibilityRole="button"
            >
              <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
              <View style={styles.errorBannerText}>
                <Text style={styles.errorBannerTitle}>
                  Some changes might be out of sync
                </Text>
                <Text style={styles.errorBannerSubtitle}>
                  Tap to try syncing again.
                </Text>
              </View>
              <Ionicons name="refresh" size={18} color="#1E3A8A" />
            </Pressable>
          ) : null}

          <View style={styles.sectionList}>
            {sections.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="search-outline" size={32} color="#64748B" />
                </View>
                <Text style={styles.emptyTitle}>No contacts found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your search or add a new contact to get started.
                </Text>
              </View>
            ) : (
              sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>
                        {section.title}
                      </Text>
                    </View>
                    <View style={styles.sectionDivider} />
                  </View>

                  {section.data.map((contact) => {
                    const initials = getInitials(contact.name);
                    const { backgroundColor, textColor } =
                      getAvatarPalette(contact.name);

                    return (
                      <Pressable
                        key={contact.id}
                        style={styles.contactCard}
                        onPress={() => handleOpenContact(contact.id)}
                        accessibilityRole="button"
                      >
                        <View
                          style={[
                            styles.avatar,
                            { backgroundColor: backgroundColor },
                          ]}
                        >
                          <Text
                            style={[styles.avatarText, { color: textColor }]}
                          >
                            {initials}
                          </Text>
                        </View>
                        <View style={styles.contactContent}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactEmail}>
                            {contact.email}
                          </Text>
                          <View style={styles.metaRow}>
                            <Ionicons
                              name="call-outline"
                              size={15}
                              color="#6B7280"
                            />
                            <Text style={styles.metaValue}>
                              {contact.phone}
                            </Text>
                          </View>
                          <View style={styles.metaRow}>
                            <Ionicons
                              name="time-outline"
                              size={15}
                              color="#6B7280"
                            />
                            <Text style={styles.metaValue}>
                              Updated {formatContactDate(contact.updatedAt)}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#CBD5F5"
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingVertical: 24,
  },
  screenPadding: {
    paddingHorizontal: 24,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  loadingSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  headerCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#CBD5E1",
  },
  headerAction: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(148, 163, 184, 0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorState: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  errorTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  errorSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 28,
    height: 52,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 24,
  },
  retryButtonLabel: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  retryButtonSpacer: {
    width: 12,
  },
  searchBar: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 12,
  },
  errorBanner: {
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  errorBannerText: {
    flex: 1,
    marginHorizontal: 12,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  errorBannerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#B45309",
  },
  sectionList: {
    marginTop: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    flex: 1,
    marginLeft: 12,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  contactContent: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  contactEmail: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  metaValue: {
    fontSize: 13,
    color: "#4B5563",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 48,
    marginTop: 32,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  emptyTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
