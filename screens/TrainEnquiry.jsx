import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";

const TrainEnquiry = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#faebd7" />
      <Text style={styles.title}>Train Enquiry</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("TrainInfo")}>
        <Text style={styles.buttonText}>Train Info</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("TrainsBetweenStations")}>
        <Text style={styles.buttonText}>Trains Between Stations</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faebd7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#a0522d",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#8b4513",
    paddingVertical: 100, // Reduced for better alignment
    paddingHorizontal: 40,
    borderRadius: 15,
    marginVertical: 15,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#faebd7",
  },
});

export default TrainEnquiry;