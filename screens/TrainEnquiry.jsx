import React from "react";
import { View, Button, StyleSheet } from "react-native";

const TrainEnquiry = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Button title="Train Info" onPress={() => navigation.navigate("TrainInfo")} />
      <Button title="Trains Between Stations" onPress={() => navigation.navigate("TrainsBetweenStations")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
});

export default TrainEnquiry;
