import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import Voice from "@react-native-voice/voice";
import Tts from "react-native-tts";
import { IP_ADDRESS } from '@env';


const TrainInfo = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { trainNo: paramTrainNo } = route.params || {};
  const [trainNo, setTrainNo] = useState(paramTrainNo || "");
  const [trainData, setTrainData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (trainNo) {
      getTrainDetails();
      getRouteDetails();
    }
  }, [trainNo]);

  useFocusEffect(
    useCallback(() => {
      Voice.onSpeechResults = (event) => {
        const spokenText = event.value[0]?.replace(/\D/g, "");
        if (spokenText) {
          setTrainNo(spokenText);
          Tts.speak(`You said train number ${spokenText}. Fetching details now.`);
          getTrainDetails();
          getRouteDetails();
        }
      };

      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        Tts.stop();
      };
    }, [])
  );

  const getTrainDetails = async () => {
    if (!trainNo) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/trains/getTrain?trainNo=${trainNo}`
      );
      const data = await response.json();
      console.log("Train Info:", data);
      setTrainData(data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching train details:", error);
      setTrainData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getRouteDetails = async () => {
    if (!trainNo) return;
    
    try {
      
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/trains/getRoute?trainNo=${trainNo}`
      );
      const data = await response.json();
      console.log("Route Info:", data);
      setRouteData(data.success ? data.data : null);
    } catch (error) {
      console.error("Error fetching route details:", error);
      setRouteData(null);
    }
  };

  const startListening = async () => {
    setIsListening(true);
    try {
      await Voice.start("en-US");
    } catch (error) {
      console.error("Voice recognition error:", error);
      setIsListening(false);
    }
  };

  const speakRouteDetails = () => {
    if (routeData && routeData.length > 0) {
      Tts.speak(`Route details for train number ${trainNo}`);
      routeData.forEach((station, index) => {
        Tts.speak(
          `Station ${station.source_stn_name}, arrival at ${station.arrive}, departure at ${station.depart}.`
        );
      });
    } else {
      Tts.speak("No route details available.");
    }
  };

  const speakTrainDetails = () => {
    if (trainData) {
      Tts.speak(
        `Train ${trainData.train_name} with number ${trainData.train_no} runs from ${trainData.from_stn_name} to ${trainData.to_stn_name}. It departs at ${trainData.from_time} and arrives at ${trainData.to_time}. Total journey time is ${trainData.travel_time} hours.`
      );
    } else {
      Tts.speak("No train details available.");
    }
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListHeaderComponent={
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Train Information</Text>
            <Text style={styles.subtitle}>Get details about any train</Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Enter Train Number"
              value={trainNo}
              onChangeText={setTrainNo}
              style={styles.input}
              keyboardType="numeric"
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.searchButton, isLoading && styles.disabledButton]} 
                onPress={getTrainDetails}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Loading..." : "Search"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.voiceButton, isListening && styles.listeningButton]} 
                onPress={startListening}
              >
                <Text style={styles.buttonText}>
                  {isListening ? "🎤 Listening..." : " Speak train number"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {trainData ? (
            <View style={styles.infoContainer}>
              <Text style={styles.header}>
                🚆 {trainData.train_name} ({trainData.train_no})
              </Text>
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>From</Text>
                  <Text style={styles.infoValue}>{trainData.from_stn_name}</Text>
                  <Text style={styles.infoDetail}>({trainData.from_stn_code})</Text>
                  <Text style={styles.timeValue}>{trainData.from_time}</Text>
                </View>
                
                <View style={styles.journeyInfo}>
                  <Text style={styles.journeyTime}>⏱️ {trainData.travel_time} hrs</Text>
                  <View style={styles.journeyLine}>
                    <View style={styles.dot}></View>
                    <View style={styles.line}></View>
                    <View style={styles.dot}></View>
                  </View>
                </View>
                
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>To</Text>
                  <Text style={styles.infoValue}>{trainData.to_stn_name}</Text>
                  <Text style={styles.infoDetail}>({trainData.to_stn_code})</Text>
                  <Text style={styles.timeValue}>{trainData.to_time}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={speakTrainDetails}>
                  <Text style={styles.actionButtonText}>Train Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={speakRouteDetails}>
                  <Text style={styles.actionButtonText}>Train Route</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            trainNo && !isLoading && <Text style={styles.error}>❌ No data found for this train number.</Text>
          )}

          {routeData && routeData.length > 0 && (
            <View style={styles.routeContainer}>
              <Text style={styles.routeTitle}>Complete Route</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Station</Text>
                <Text style={styles.tableHeaderCell}>Arrival</Text>
                <Text style={styles.tableHeaderCell}>Departure</Text>
              </View>
            </View>
          )}
        </>
      }
      data={routeData || []}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <View style={[
          styles.tableRow, 
          index % 2 === 0 ? styles.evenRow : styles.oddRow,
          index === 0 ? styles.firstStationRow : null,
          index === (routeData?.length - 1) ? styles.lastStationRow : null
        ]}>
          <View style={{ flex: 2 }}>
            <Text style={styles.stationName}>{item.source_stn_name}</Text>
            <Text style={styles.stationCode}>({item.source_stn_code})</Text>
          </View>
          <Text style={styles.tableCell}>{item.arrive}</Text>
          <Text style={styles.tableCell}>{item.depart}</Text>
        </View>
      )}
      ListFooterComponent={<View style={{ height: 50 }} />}
    />
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16
  },
  headerContainer: {
    marginBottom: 20,
    paddingTop: 10
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8b4513",
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 5
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  input: {
    borderBottomWidth: 2,
    borderColor: "#8b4513",
    marginBottom: 15,
    padding: 10,
    fontSize: 18,
    color: "#000"
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  searchButton: {
    backgroundColor: "#8b4513",
    paddingVertical: 64,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 0.3,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  voiceButton: {
    backgroundColor: "#d2691e",
    paddingVertical: 64,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  disabledButton: {
    backgroundColor: "#cccccc"
  },
  listeningButton: {
    backgroundColor: "#ff6347"
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff"
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15
  },
  infoCol: {
    flex: 1,
    alignItems: "center"
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },
  infoDetail: {
    fontSize: 14,
    color: "#666"
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8b4513",
    marginTop: 5
  },
  journeyInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 15
  },
  journeyTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  journeyLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%"
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8b4513"
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "#8b4513"
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  actionButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 60,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 0.48,
    alignItems: "center"
  },
  actionButtonText: {
    fontSize: 20,
    color: "#333"
  },
  routeContainer: {
    marginTop: 8,
    marginBottom: 8
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#8b4513",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center"
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    backgroundColor: "#fff"
  },
  evenRow: {
    backgroundColor: "#fff"
  },
  oddRow: {
    backgroundColor: "#f9f9f9"
  },
  firstStationRow: {
    borderTopWidth: 0
  },
  lastStationRow: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  stationName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333"
  },
  stationCode: {
    fontSize: 13,
    color: "#666"
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    textAlign: "center"
  },
  error: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginVertical: 15,
    backgroundColor: "#fde2e2",
    padding: 12,
    borderRadius: 8
  }
});

export default TrainInfo;