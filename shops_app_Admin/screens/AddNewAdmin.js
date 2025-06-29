import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { API_BASE_URL } from "../config"; 

const AddNewAdmin = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async () => {
    let tempErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,14}$/;

if (!form.email.trim()) {
  tempErrors.email = "Email is required";
} else if (!emailRegex.test(form.email)) {
  tempErrors.email = "Invalid email format";
}

if (!form.password.trim()) {
  tempErrors.password = "Password is required";
} else if (!passwordRegex.test(form.password)) {
  tempErrors.password = "Password must be 6-14 characters, include upper/lowercase letters, a number, and a symbol";
}

if (form.password !== form.confirmPassword) {
  tempErrors.confirmPassword = "Passwords do not match";
}


    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Admin account created.");
        setForm({ email: "", password: "", confirmPassword: "" });
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      Alert.alert("Error", "Failed to connect to the server.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Admin</Text>

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#A9A9A9"
        keyboardType="email-address"
        onChangeText={(text) => handleChange("email", text)}
        value={form.email}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password"
        placeholderTextColor="#A9A9A9"
        secureTextEntry
        onChangeText={(text) => handleChange("password", text)}
        value={form.password}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TextInput
        style={[styles.input, errors.confirmPassword && styles.inputError]}
        placeholder="Confirm Password"
        placeholderTextColor="#A9A9A9"
        secureTextEntry
        onChangeText={(text) => handleChange("confirmPassword", text)}
        value={form.confirmPassword}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Create Admin</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 50,
    color: "#77BBA2",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#77BBA2",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#77BBA2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default AddNewAdmin;
