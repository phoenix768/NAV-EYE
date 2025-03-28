import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";

const TrainInfo = () => {
  const route = useRoute();
  const { trainNo: paramTrainNo } = route.params || {}; // Get trainNo from navigation
  const [trainNo, setTrainNo] = useState(paramTrainNo || ""); // Set it as default
  const [trainData, setTrainData] = useState(null);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    if (trainNo) {
      getTrainDetails();
      getRouteDetails();
    }
  }, [trainNo]);

  const getTrainDetails = async () => {
    try {
      const response = await fetch(
        `http://172.20.13.109:3000/trains/getTrain?trainNo=${trainNo}`
      );
      const data = await response.json();
      console.log("Train Info:", data);
      setTrainData(data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching train details:", error);
      setTrainData(null);
    }
  };

  const getRouteDetails = async () => {
    try {
      const response = await fetch(
        `http://172.20.13.109:3000/trains/getRoute?trainNo=${trainNo}`
      );
      const data = await response.json();
      console.log("Route Info:", data);
      setRouteData(data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching route details:", error);
      setRouteData(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        placeholder="Enter Train Number"
        value={trainNo}
        onChangeText={setTrainNo}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Get Train Info" onPress={getTrainDetails} />

      {trainData ? (
        <View style={styles.infoContainer}>
          <Text style={styles.header}>
            🚆 {trainData.train_name} ({trainData.train_no})
          </Text>
          <Text style={styles.info}>🚉 From: {trainData.from_stn_name} ({trainData.from_stn_code})</Text>
          <Text style={styles.info}>📍 Departure: {trainData.from_time}</Text>
          <Text style={styles.info}>🚆 To: {trainData.to_stn_name} ({trainData.to_stn_code})</Text>
          <Text style={styles.info}>📍 Arrival: {trainData.to_time}</Text>
          <Text style={styles.info}>⏳ Travel Time: {trainData.travel_time} hrs</Text>
        </View>
      ) : (
        trainData !== null && <Text style={styles.error}>❌ No data found for this train number.</Text>
      )}

      {routeData && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeHeader}>Route Details</Text>
          <FlatList
            data={routeData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.source_stn_name}({item.source_stn_code})</Text>
                <Text style={styles.tableCell}>{item.arrive}</Text>
                <Text style={styles.tableCell}>{item.depart}</Text>
              </View>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderBottomWidth: 1, marginBottom: 10, padding: 8, color:'#000000'},
  infoContainer: { marginTop: 20, padding: 10, backgroundColor: "#f0f0f0", borderRadius: 8 },
  header: { fontSize: 18, fontWeight: "bold", color: "#000" },
  info: { fontSize: 16, color: "#0000f0" },
  error: { fontSize: 16, color: "red", marginTop: 10 },
  routeContainer: { marginTop: 20, padding: 20, backgroundColor: "#f0f0f0", marginBottom: 20,borderRadius: 8 },
  routeHeader: { fontSize: 18, fontWeight: "bold", textAlign: "center", color: "#333" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 4 },
  tableCell: { flex: 1, fontSize: 14, color: "#333", textAlign: "center" },
});

export default TrainInfo;
