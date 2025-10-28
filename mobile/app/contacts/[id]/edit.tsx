import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContacts } from "../../../contexts/ContactsContext";

type FormState = {
  name: string;
  email: string;
  phone: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
};

export default function EditContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const {
    getContactById,
    updateContact,
    loading,
    refreshContacts,
    isMutating,
  } = useContacts();

  const contactIdParam = params.id;
  const contactId = Array.isArray(contactIdParam)
    ? contactIdParam[0]
    : contactIdParam;

  const contact = useMemo(
    () => (contactId ? getContactById(contactId) : undefined),
    [contactId, getContactById],
  );

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      });
    }
  }, [contact]);

  const setField = useCallback(
    (key: keyof FormState) => (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const handleGoBack = useCallback(() => {
    if (isSubmitting) return;
    router.back();
  }, [isSubmitting, router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshContacts();
    } finally {
      setRefreshing(false);
    }
  }, [refreshContacts]);

  const validate = useCallback(() => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();

    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!trimmedName) {
      nextErrors.name = "Name is required";
    }

    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!trimmedPhone) {
      nextErrors.phone = "Phone is required";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
    };
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!contactId || !contact || isSubmitting) return;
    const payload = validate();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      await updateContact(contactId, payload);
      router.back();
    } catch (error) {
      Alert.alert(
        "Update failed",
        "We could not save your changes. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [contact, contactId, isSubmitting, router, updateContact, validate]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
              <Text style={styles.headerTitle}>Edit Contact</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="person-outline"
                  size={34}
                  color="#1E3A8A"
                />
              </View>
              <Text style={styles.heroTitle}>Fine tune their details</Text>
              <Text style={styles.heroSubtitle}>
                Keep your network up to date with accurate contact info.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Contact details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full name</Text>
                <View
                  style={[
                    styles.inputRow,
                    errors.name ? styles.inputRowError : undefined,
                  ]}
                >
                  <Ionicons name="person-outline" size={18} color="#475569" />
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={setField("name")}
                    placeholder="Courtney Henry"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="next"
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View
                  style={[
                    styles.inputRow,
                    errors.email ? styles.inputRowError : undefined,
                  ]}
                >
                  <Ionicons name="mail-outline" size={18} color="#475569" />
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setField("email")}
                    placeholder="courtney@example.com"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="next"
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <View
                  style={[
                    styles.inputRow,
                    errors.phone ? styles.inputRowError : undefined,
                  ]}
                >
                  <Ionicons name="call-outline" size={18} color="#475569" />
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    keyboardType="phone-pad"
                    onChangeText={setField("phone")}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="done"
                  />
                </View>
                {errors.phone ? (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                ) : null}
              </View>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                isSubmitting || isMutating
                  ? styles.primaryButtonDisabled
                  : undefined,
              ]}
              onPress={handleSave}
              disabled={isSubmitting || isMutating}
              accessibilityRole="button"
            >
              {isSubmitting || isMutating ? (
                <ActivityIndicator size="small" color="#F8FAFC" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#F8FAFC" />
              )}
              <Text style={styles.primaryButtonLabel}>Save changes</Text>
              <View style={styles.primaryButtonSpacer} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 48,
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
  headerSpacer: {
    width: 44,
  },
  heroCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 3,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  formCard: {
    marginTop: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  inputGroup: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputRowError: {
    borderColor: "#F87171",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#0F172A",
  },
  errorText: {
    marginTop: 8,
    color: "#DC2626",
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 28,
    height: 56,
    backgroundColor: "#1E3A8A",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginLeft: 12,
  },
  primaryButtonSpacer: {
    width: 18,
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
});
