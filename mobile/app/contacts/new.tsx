import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContacts } from "../../contexts/ContactsContext";

type FormState = {
  name: string;
  email: string;
  phone: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  phone: "",
};

export default function NewContactScreen() {
  const router = useRouter();
  const { addContact } = useContacts();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField =
    (key: keyof FormState) =>
    (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  const handleGoBack = () => {
    if (isSubmitting) return;
    router.back();
  };

  const validate = () => {
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
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const payload = validate();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const newId = await addContact(payload);
      if (!newId) {
        throw new Error("Missing id");
      }
      router.replace({
        pathname: "/contacts/[id]",
        params: { id: newId },
      });
    } catch (error) {
      Alert.alert(
        "Something went wrong",
        "We could not create the contact. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
              <Text style={styles.headerTitle}>Add Contact</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="person-circle-outline"
                  size={40}
                  color="#1E3A8A"
                />
              </View>
              <Text style={styles.heroTitle}>Create someone new</Text>
              <Text style={styles.heroSubtitle}>
                Capture the essentials to keep important people close.
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
                isSubmitting ? styles.primaryButtonDisabled : undefined,
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#F8FAFC" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#F8FAFC" />
              )}
              <Text style={styles.primaryButtonLabel}>Save contact</Text>
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
});
