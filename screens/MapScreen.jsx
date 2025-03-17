import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useQuery, gql } from "@apollo/client";
import MapViewDirections from "react-native-maps-directions";

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

const GET_ROUTE = gql`
  query GetRoute($origin: String!, $destination: String!) {
    getRoute(origin: $origin, destination: $destination) {
      summary
      steps {
        instruction
        distance
        duration
      }
    }
  }
`;

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

const MapScreen = ({ route }) => {
  const { station } = route.params; // Get selected station
  const { loading, error, data } = useQuery(GET_CURRENT_LOCATION);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    if (data?.getCurrentLocation) {
      fetchRoute(data.getCurrentLocation, station);
    }
  }, [data]);

  const fetchRoute = async (origin, destination) => {
    const response = await fetch("http://localhost:5000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
            getRoute(origin: "${origin.lat},${origin.lng}", destination: "${destination.location.lat},${destination.location.lng}") {
              summary
              steps {
                instruction
                distance
                duration
              }
            }
          }
        `,
      }),
    });
    const result = await response.json();
    setRouteData(result.data.getRoute);
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>Error loading location.</Text>;

  const userLocation = {
    latitude: data.getCurrentLocation.lat,
    longitude: data.getCurrentLocation.lng,
  };

  const stationLocation = {
    latitude: station.location.lat,
    longitude: station.location.lng,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* User Marker */}
        <Marker coordinate={userLocation} title="Your Location" pinColor="blue" />
        
        {/* Station Marker */}
        <Marker coordinate={stationLocation} title={station.name} pinColor="red" />

        {/* Route Path */}
        {routeData && (
          <MapViewDirections
            origin={userLocation}
            destination={stationLocation}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
      </MapView>

      {/* Route Instructions */}
      {routeData && (
        <View style={styles.infoBox}>
          <Text style={styles.heading}>Route Summary</Text>
          {routeData.steps.map((step, index) => (
            <Text key={index} style={styles.text}>{step.instruction}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get("window").width, height: Dimensions.get("window").height * 0.6 },
  infoBox: { padding: 10, backgroundColor: "white" },
  heading: { fontSize: 18, fontWeight: "bold" },
  text: { fontSize: 14 },
});

export default MapScreen;
