import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Button } from "react-native";
import { gql, useQuery } from "@apollo/client";
import Tts from "react-native-tts";
import { useNavigation } from "@react-navigation/native";

// GraphQL Queries
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

const TrainStationsScreen = () => {
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);

  const { data: locationData, loading: locationLoading, error: locationError } = useQuery(GET_CURRENT_LOCATION);

  const { data, loading, error } = useQuery(GET_NEARBY_STATIONS, {
    variables: userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng, type: "train_station" }
      : { lat: 0, lng: 0, type: "train_station" },
    skip: !userLocation,
  });

  useEffect(() => {
    if (locationData?.getCurrentLocation) {
      setUserLocation(locationData.getCurrentLocation);
    }
  }, [locationData]);

  const speakStations = () => {
    if (data?.getNearbyStations?.length > 0) {
      const speechText = data.getNearbyStations
        .map((station, index) => `Station ${index + 1}: ${station.name}, ${station.distance} away.`)
        .join(" ");
      Tts.speak(`Here are the nearby train stations. ${speechText}`);
    } else {
      Tts.speak("No nearby train stations found.");
    }
  };

  useEffect(() => {
    return () => {
      Tts.stop();
    };
  }, []);

  if (locationLoading || loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (locationError || error) return <Text>Error fetching data.</Text>;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Repeat" onPress={speakStations} />
      <Text style={styles.title}>Nearby Train Stations</Text>
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

export default TrainStationsScreen;
