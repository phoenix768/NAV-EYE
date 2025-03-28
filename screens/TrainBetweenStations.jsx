import { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import { useNavigation } from "@react-navigation/native";

const TrainsBetweenStations = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date()); // Default date: today
  const [open, setOpen] = useState(false); // Controls calendar visibility
  const [trains, setTrains] = useState([]);
  const navigation = useNavigation();

  const getTrainsBetweenStations = async () => {
    try {
      const formattedDate = date.toISOString().split("T")[0]; // Convert date to YYYY-MM-DD format
      const response = await fetch(
        `http://172.20.13.109:3000/trains/getTrainOn?from=${from}&to=${to}&date=${formattedDate}`
      );
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching trains:", error);
    }
  };

  const fetchTrains = async () => {
    const data = await getTrainsBetweenStations();
    if (data?.success && Array.isArray(data.data)) {
      setTrains(data.data);
    } else {
      setTrains([]);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="From" value={from} onChangeText={setFrom} style={styles.textInput} />
      <TextInput placeholder="To" value={to} onChangeText={setTo} style={styles.textInput} />

      {/* Open Date Picker */}
      <Button title="Select Date" onPress={() => setOpen(true)} />
      <Text style={styles.dateText}>Selected Date: {date.toISOString().split("T")[0]}</Text>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => setOpen(false)}
      />

      <Button title="Find Trains" onPress={fetchTrains} />

      <FlatList
        data={trains}
        keyExtractor={(item) => item.train_base.train_no}
        renderItem={({ item }) => (
          <View style={styles.trainItem}>
            <Text style={styles.text}>{item.train_base.train_name} - {item.train_base.train_no}</Text>
            <Text style={styles.text}>From: {item.train_base.from_stn_name} ({item.train_base.from_stn_code}) at {item.train_base.from_time}</Text>
            <Text style={styles.text}>To: {item.train_base.to_stn_name} ({item.train_base.to_stn_code}) at {item.train_base.to_time}</Text>
            <Text style={styles.text}>Travel Time: {item.train_base.travel_time} hrs</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("TrainInfo", { trainNo: item.train_base.train_no })}
            >
              <Text style={styles.buttonText}>View Train Info</Text>
            </TouchableOpacity>

          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  textInput: { borderBottomWidth: 1, marginBottom: 10, padding: 8, color: "#000" },
  dateText: { marginVertical: 10, fontSize: 16, color: "#000" },
  text: { color: "#000" },
  trainItem: {borderBottomWidth: 6,padding: 15, marginVertical: 15, backgroundColor: "#F0F0F0"},
  button: {
    backgroundColor: "blue",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
});

export default TrainsBetweenStations;
