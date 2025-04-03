import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { gql, useLazyQuery } from "@apollo/client";
import Tts from "react-native-tts";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Voice from "@react-native-voice/voice";

const GET_NEARBY_STATIONS = gql`
  query GetNearbyStations($lat: Float!, $lng: Float!, $type: String!) {
    getNearbyStations(lat: $lat, lng: $lng, type: $type) {
      name
      address
      location {
        lat
        lng
      }
      distance
    }
  }
`;

const BusStationsScreen = () => {
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [getNearbyStations, { data, loading, error }] = useLazyQuery(GET_NEARBY_STATIONS, {
    fetchPolicy: "network-only",
  });

  // Request location permission for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Fetch user location
  useEffect(() => {
    const fetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log("Location permission denied");
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          getNearbyStations({ variables: { lat: latitude, lng: longitude, type: "bus_station" } });
        },
        (error) => console.error("Geolocation Error:", error.message),
        { timeout: 30000 }
      );
    };

    fetchLocation();
  }, []);

  const startListening = async () => {
    setIsListening(true);
    await Voice.start("en-US");
  };

  useFocusEffect(
    useCallback(() => {
      Voice.onSpeechResults = (event) => {
        const spokenText = event.value[0]?.toLowerCase().trim();
        if (!spokenText) return;

        if (spokenText === "repeat station") {
          speakStations();
        } else {
          const matchedStation = data?.getNearbyStations?.find((station) =>
            station.name.toLowerCase().includes(spokenText)
          );
          if (matchedStation) {
            navigation.navigate("NavigationScreen", { station: matchedStation, userLocation });
          } else {
            Tts.speak("No matching station found. Please try again.");
          }
        }
      };

      Voice.onSpeechEnd = () => setIsListening(false);

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, [data]));

  const speakStations = () => {
    if (data?.getNearbyStations?.length > 0) {
      const speechText = data.getNearbyStations
        .map((station, index) => `Station ${index + 1}: ${station.name}, ${station.distance} away.`)
        .join(" ");
      
      Tts.speak(`Here are the nearby bus stations. ${speechText}`);
    } else {
      Tts.speak("No nearby bus stations found.");
    }
  };

  useEffect(() => {
    if (data && data.getNearbyStations) {
      if (data.getNearbyStations.length === 0) {
        Tts.speak("No nearby bus stations found.");
      }
    }
  }, [data]);

  useEffect(() => {
    return () => {
      Tts.stop();
    };
  }, []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8b4513" />
      <Text style={styles.loadingText}>Finding nearby stations...</Text>
    </View>
  );
  
  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Error fetching data. Please try again.</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          if (userLocation) {
            getNearbyStations({ 
              variables: { 
                lat: userLocation.lat, 
                lng: userLocation.lng, 
                type: "bus_station" 
              } 
            });
          }
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Bus Stations</Text>
        <Text style={styles.subtitle}>
          {data?.getNearbyStations?.length || 0} stations found nearby
        </Text>
      </View>
      
      <FlatList
        data={data?.getNearbyStations || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stationContainer}
            onPress={() => navigation.navigate("NavigationScreen", { station: item, userLocation })}
          >
            <View style={styles.stationHeader}>
              <Text style={styles.stationName}>{item.name}</Text>
            </View>
            <View style={styles.stationDetails}>
              <Text style={styles.addressText}>{item.address}</Text>
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceText}>{item.distance}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bus stations found nearby</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={[styles.voiceButton, isListening ? styles.listeningButton : {}]}
        onPress={startListening}
      >
        <Text style={styles.buttonText}>{isListening ? "Listening..." : "Voice Search"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faebd7",
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#8b4513",
  },
  subtitle: {
    fontSize: 16,
    color: "#a0522d",
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra space for the button
  },
  stationContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8b4513",
    marginLeft: 10,
    flex: 1,
  },
  stationDetails: {
    marginBottom: 15,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontSize: 14,
    color: "#8b4513",
    marginLeft: 5,
    fontWeight: "500",
  },
  goButtonContainer: {
    backgroundColor: "#8b4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  goButtonText: {
    color: "#faebd7",
    fontWeight: "bold",
    marginRight: 5,
  },
  voiceButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#8b4513",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 65,
    paddingHorizontal: 65,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  listeningButton: {
    backgroundColor: "#a0522d", // Slightly different color when listening
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#faebd7",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#faebd7",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#8b4513",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#faebd7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: "#8b4513",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#8b4513",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#faebd7",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#8b4513",
    textAlign: "center",
  },
});

export default BusStationsScreen;