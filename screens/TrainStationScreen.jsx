import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity,StyleSheet,Button } from "react-native";
import { gql, useQuery } from "@apollo/client";
import Tts from "react-native-tts";

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
  const [userLocation, setUserLocation] = useState(null);

  // Fetch user's current location
  const { data: locationData, loading: locationLoading, error: locationError } = useQuery(GET_CURRENT_LOCATION);

  // Fetch nearby train stations when user's location is available
  const { data, loading, error } = useQuery(GET_NEARBY_STATIONS, {
    variables: userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng, type: "train_station" }
      : { lat: 0, lng: 0, type: "train_station" }, // Prevents query errors
    skip: !userLocation, // Skips query until user location is available
  });

  // Set user location once fetched
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
      Tts.speak(`Here are the nearby train stations. ${speechText}`);
    } else if (data && data.getNearbyStations.length === 0) {
      Tts.speak("No nearby train stations found.");
    }

  };
  // Speak out train stations when data is available
  

  useEffect(() => {
    return () => {
      Tts.stop(); // Stops speaking when component unmounts
    };
  }, []);

  if (locationLoading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (locationError) return <Text>Error fetching current location.</Text>;
  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>Error loading train stations.</Text>;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title="Repeat"
        onPress={speakstations}
      />
      <Text style={{ color:"#000000",fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>Nearby Train Stations</Text>
      
      {data?.getNearbyStations && data.getNearbyStations.length > 0 ? (
        <FlatList
          data={data.getNearbyStations}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                padding: 15,
                marginVertical: 5,
                backgroundColor: "09122C",
                borderRadius: 10,
              }}
              onPress={() => Tts.speak(`${item.name}, ${item.distance} away.`)}
            >
              <Text style={{color:"#000000", fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
              <Text style={styles.text}>{item.address}</Text>
              <Text style={{ color:"#000000",fontWeight: "bold" }}>Distance: {item.distance}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.text}>No nearby train stations found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  text:{
    color:"#000000"
  }

})

export default TrainStationsScreen;
