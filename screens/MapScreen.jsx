import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Geolocation from "react-native-geolocation-service";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = "AIzaSyDsRJWDkVXFuzxx_uf_nxq8HcVsGJIIOOM"; // Replace with your API Key

const MapScreen = ({ route }) => {
  const { destination } = route.params; // Get destination station details
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      },
      (error) => console.log(error),
      { enableHighAccuracy: true }
    );
  }, []);

  if (!userLocation) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={userLocation}
        showsUserLocation={true}
      >
        <Marker coordinate={userLocation} title="Your Location" />
        <Marker coordinate={destination} title="Destination" />

        {/* Route Line */}
        <MapViewDirections
          origin={userLocation}
          destination={destination}
          apikey={GOOGLE_API_KEY}
          strokeWidth={5}
          strokeColor="blue"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

export default MapScreen;
