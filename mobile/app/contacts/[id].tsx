import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContacts } from "../../contexts/ContactsContext";
import { getAvatarPalette, getInitials } from "../../lib/avatar";

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ContactDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const {
    getContactById,
    deleteContact,
    loading,
    refreshContacts,
    isMutating,
  } = useContacts();
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const contactIdParam = params.id;
  const contactId = Array.isArray(contactIdParam)
    ? contactIdParam[0]
    : contactIdParam;

  const contact = useMemo(
    () => (contactId ? getContactById(contactId) : undefined),
    [contactId, getContactById],
  );

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    if (!contactId) return;
    router.push({
      pathname: "/contacts/[id]/edit",
      params: { id: contactId },
    });
  }, [contactId, router]);

  const handleCall = useCallback(() => {
    if (!contact?.phone) return;
    Linking.openURL(`tel:${contact.phone}`);
  }, [contact]);

  const handleEmail = useCallback(() => {
    if (!contact?.email) return;
    Linking.openURL(`mailto:${contact.email}`);
  }, [contact]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshContacts();
    } finally {
      setRefreshing(false);
    }
  }, [refreshContacts]);

  const requestDelete = useCallback(() => {
    if (!contact) return;

    Alert.alert(
      "Delete contact",
      `Are you sure you want to remove ${contact.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setIsDeleting(true);
            void (async () => {
              try {
                await deleteContact(contact.id);
                router.replace("/");
              } catch (error) {
                Alert.alert(
                  "Delete failed",
                  "We could not remove this contact. Please try again.",
                );
              } finally {
                setIsDeleting(false);
              }
            })();
          },
        },
      ],
    );
  }, [contact, deleteContact, router]);

  if (loading && !contact) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screenPadding, styles.centerWrap]}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingTitle}>Loading contact...</Text>
          <Text style={styles.loadingSubtitle}>
            Fetching the latest details from the server.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contact) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screenPadding, styles.centerWrap]}>
          <Pressable
            style={styles.headerButton}
            onPress={handleGoBack}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color="#1E293B" />
          </Pressable>
          <View style={styles.missingCard}>
            <Ionicons name="alert-circle-outline" size={36} color="#9CA3AF" />
            <Text style={styles.missingTitle}>Contact not found</Text>
            <Text style={styles.missingSubtitle}>
              It may have been removed. Try refreshing your contact list.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={handleRefresh}
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={18} color="#F8FAFC" />
              <Text style={styles.primaryButtonLabel}>Refresh contacts</Text>
              <View style={styles.primaryButtonSpacer} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const initials = getInitials(contact.name);
  const { backgroundColor, textColor } = getAvatarPalette(contact.name);
  const deleting = isDeleting || isMutating;
  const callDisabled = !contact.phone || deleting;
  const emailDisabled = !contact.email || deleting;

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
          <View style={styles.headerRow}>
            <Pressable
              style={styles.headerButton}
              onPress={handleGoBack}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={20} color="#1E293B" />
            </Pressable>
            <Text style={styles.headerTitle}>Contact</Text>
            <Pressable
              style={styles.headerButton}
              onPress={handleEdit}
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={18} color="#1E293B" />
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View
              style={[styles.avatarLarge, { backgroundColor: backgroundColor }]}
            >
              <Text style={[styles.avatarLargeText, { color: textColor }]}>
                {initials}
              </Text>
            </View>
            <Text style={styles.heroName}>{contact.name}</Text>
            <Text style={styles.heroEmail}>{contact.email}</Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.heroMetaText}>
                Updated {formatDateLabel(contact.updatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={[
                styles.actionButton,
                styles.callButton,
                callDisabled ? styles.actionButtonDisabled : undefined,
              ]}
              onPress={handleCall}
              disabled={callDisabled}
              accessibilityRole="button"
            >
              <Ionicons name="call-outline" size={18} color="#1E3A8A" />
              <Text style={styles.actionButtonLabel}>Call</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                styles.emailButton,
                emailDisabled ? styles.actionButtonDisabled : undefined,
              ]}
              onPress={handleEmail}
              disabled={emailDisabled}
              accessibilityRole="button"
            >
              <Ionicons name="mail-outline" size={18} color="#1E3A8A" />
              <Text style={styles.actionButtonLabel}>Email</Text>
            </Pressable>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Contact info</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="call-outline" size={18} color="#1E3A8A" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{contact.phone}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="mail-outline" size={18} color="#1E3A8A" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{contact.email}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {formatDateLabel(contact.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[
              styles.dangerButton,
              deleting ? styles.dangerButtonDisabled : undefined,
            ]}
            onPress={requestDelete}
            disabled={deleting}
            accessibilityRole="button"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FEE2E2" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#FEE2E2" />
            )}
            <Text style={styles.dangerButtonLabel}>Delete contact</Text>
            <View style={styles.dangerButtonSpacer} />
          </Pressable>
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
    paddingBottom: 48,
    paddingTop: 24,
  },
  screenPadding: {
    paddingHorizontal: 24,
  },
  centerWrap: {
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
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  heroCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: "700",
  },
  heroName: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  heroEmail: {
    marginTop: 8,
    fontSize: 15,
    color: "#475569",
  },
  heroMetaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  heroMetaText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#64748B",
  },
  actionsRow: {
    marginTop: 28,
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  callButton: {
    marginRight: 16,
  },
  emailButton: {
    marginLeft: 16,
  },
  actionButtonLabel: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  detailsCard: {
    marginTop: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  detailIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  detailValue: {
    marginTop: 6,
    fontSize: 15,
    color: "#0F172A",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginTop: 20,
  },
  dangerButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#7F1D1D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 2,
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  dangerButtonLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#FEE2E2",
  },
  dangerButtonSpacer: {
    width: 12,
  },
  missingCard: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
  },
  missingSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  primaryButton: {
    marginTop: 28,
    height: 56,
    backgroundColor: "#1E3A8A",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryButtonLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  primaryButtonSpacer: {
    width: 18,
  },
});
