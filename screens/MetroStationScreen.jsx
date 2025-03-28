import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity,StyleSheet,Button } from "react-native";
import { gql, useQuery } from "@apollo/client";
import Tts from "react-native-tts";
import Voice from "@react-native-voice/voice";
import { useNavigation } from "@react-navigation/native";

const GET_CURRENT_LOCATION = gql`
  query {
    getCurrentLocation {
      lat
      lng
      address
    }
  }
`;

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

const MetroStationsScreen = () => {
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  
  const { data: locationData, loading: locationLoading, error: locationError } = useQuery(GET_CURRENT_LOCATION);

  const { data, loading, error } = useQuery(GET_NEARBY_STATIONS, {
    variables: userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng, type: "subway_station" }
      : { lat: 0, lng: 0, type: "subway_station" },
    skip: !userLocation,
  });

  useEffect(() => {
    if (locationData?.getCurrentLocation) {
      setUserLocation(locationData.getCurrentLocation);
    }
  }, [locationData]);


  const speakstations=() => {
    if (data?.getNearbyStations?.length > 0) {
      const speechText = data.getNearbyStations
        .map((station, index) => `Station ${index + 1}: ${station.name}, ${station.distance} away.`)
        .join(" ");
      Tts.speak(`Here are the nearby metro or subway stations. ${speechText}`);
    } else if (data && data.getNearbyStations.length === 0) {
      Tts.speak("No nearby metro or subway stations found.");
    }

  };

  useEffect(() => {
    return () => {
      Tts.stop(); // Stops speaking when component unmounts
    };
  }, []);

  if (locationLoading||loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (locationError||error) return <Text>Error fetching current location.</Text>;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Repeat" onPress={speakstations} />
      <Text style={styles.title}>Nearby Metro Stations</Text>
      
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

export default MetroStationsScreen;
