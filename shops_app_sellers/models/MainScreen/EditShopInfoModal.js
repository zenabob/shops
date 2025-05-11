import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";

const getDirection = (text) => {
  if (!text) return "ltr";
  const rtlChars = /[\u0590-\u05FF\u0600-\u06FF]/g;
  const match = text.match(rtlChars);
  return match && match.length > text.length / 2 ? "rtl" : "ltr";
};

const EditShopInfoModal = ({
  visible,
  draftShopData,
  editErrors,
  onClose,
  onSave,
  onChange,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.editingModal}>
            <Text style={styles.modalTitle}>Edit Shop Info</Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  textAlign:
                    getDirection(draftShopData?.name) === "rtl"
                      ? "right"
                      : "left",
                  writingDirection: getDirection(draftShopData?.name),
                },
              ]}
              placeholder="Shop Name"
              value={draftShopData?.name}
              onChangeText={(text) => onChange("name", text)}
            />
            {editErrors.name !== "" && (
              <Text style={styles.errorText}>{editErrors.name}</Text>
            )}

            <TextInput
              style={[
                styles.modalInput,
                {
                  textAlign:
                    getDirection(draftShopData?.location) === "rtl"
                      ? "right"
                      : "left",
                  writingDirection: getDirection(draftShopData?.location),
                },
              ]}
              placeholder="Location"
              value={draftShopData?.location}
              onChangeText={(text) => onChange("location", text)}
            />
            {editErrors.location !== "" && (
              <Text style={styles.errorText}>{editErrors.location}</Text>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, marginRight: 5 }]}
                onPress={onSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1, marginLeft: 5 }]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  editingModal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#899499",
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#EEEEEE",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditShopInfoModal;
