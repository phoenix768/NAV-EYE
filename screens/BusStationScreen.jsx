import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Button, Platform, PermissionsAndroid } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { gql, useLazyQuery } from "@apollo/client";
import Tts from "react-native-tts";
import Voice from "@react-native-voice/voice";
import { useNavigation } from "@react-navigation/native";

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
  const [recognizedText, setRecognizedText] = useState("");

  const [getNearbyStations, { data, loading, error }] = useLazyQuery(GET_NEARBY_STATIONS, {
    fetchPolicy: "network-only",
  });

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

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
          console.log("User Location:", latitude, longitude);
        },
        (error) => console.error("Geolocation Error:", error.message),
        { enableHighAccuracy: true, timeout: 20000 }
      );
    };

    fetchLocation();
  }, []);

  const speakstations=() => {
    if (data?.getNearbyStations?.length > 0) {
      const speechText = data.getNearbyStations
        .map((station, index) => `Station ${index + 1}: ${station.name}, ${station.distance} away.`)
        .join(" ");
      Tts.speak(`Here are the nearby bus stations. ${speechText}`);
    } else if (data && data.getNearbyStations.length === 0) {
      Tts.speak("No nearby bus stations found.");
    }
  };
  

  useEffect(() => {
    return () => {
      Tts.stop();
    };
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>Error fetching data.</Text>;
  

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Repeat" onPress={speakstations} />
      <Text style={styles.title}>Nearby Bus Stations</Text>
      
      <FlatList
        data={data?.getNearbyStations || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.stationContainer}>
            <TouchableOpacity onPress={() => Tts.speak(`${item.name}, ${item.distance} away.`)}>
              <Text style={styles.stationName}>{item.name}</Text>
              <Text style={styles.text}>{item.address}</Text>
              <Text style={styles.text}>Distance: {item.distance}</Text>
            </TouchableOpacity>
            <Button
              title="Navigate"
              onPress={() => navigation.navigate("NavigationScreen", { station: item, userLocation })}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { color: "#000", fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  stationContainer: { padding: 15, marginVertical: 5, backgroundColor: "#F0F0F0", borderRadius: 10 },
  stationName: { color: "#000", fontSize: 18, fontWeight: "bold" },
  text: { color: "#000" },
});

export default BusStationsScreen;
