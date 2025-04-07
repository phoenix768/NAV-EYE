import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { gql, useQuery } from "@apollo/client";
import Tts from "react-native-tts";
import Geolocation from '@react-native-community/geolocation'; // Import Geolocation

const GET_ROUTE = gql`
  query GetRoute($originLat: Float!, $originLng: Float!, $destLat: Float!, $destLng: Float!) {
    getRoute(originLat: $originLat, originLng: $originLng, destLat: $destLat, destLng: $destLng) {
      polyline
      steps {
        instruction
        distance
        duration
      }
    }
  }
`;

const NavigationScreen = () => {
  const route = useRoute();
  const { station, userLocation } = route.params;
  const [userLoc, setUserLoc] = useState(userLocation);
  const [decodedPolyline, setDecodedPolyline] = useState([]);
  const [steps, setSteps] = useState([]);

  const { data, loading, error, refetch } = useQuery(GET_ROUTE, {
    variables: {
      originLat: userLocation.lat,
      originLng: userLocation.lng,
      destLat: station.location.lat,
      destLng: station.location.lng,
    },
  });

  useEffect(() => {
    if (data?.getRoute?.polyline) {
      setDecodedPolyline(decodePolyline(data.getRoute.polyline));
      setSteps(data.getRoute.steps);
      speakSteps(data.getRoute.steps.slice(0, 1)); // Speak first step
    }

    // Automatically refresh the route every 8 seconds
    const interval = setInterval(() => {
      refreshRoute();
    }, 8000);

    // Clean up interval when the component unmounts
    return () => clearInterval(interval);
  }, [data]);

  useFocusEffect(
    React.useCallback(() => {
      // Stop speaking when the screen is unfocused
      return () => {
        Tts.stop(); // Stop speech
      };
    }, [])
  );

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let shift = 0, result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      let deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      let deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += deltaLng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const speakSteps = (stepsToSpeak) => {
    stepsToSpeak.forEach((step, index) => {
      Tts.speak(`Step ${index + 1}: ${step.instruction}. Travel ${step.distance} and this will take approximately ${step.duration}.`);
    });
  };

  const fetchLocation = async () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLoc({ lat: latitude, lng: longitude });
      },
      (error) => console.error("Geolocation Error:", error.message),
      { timeout: 20000 }
    );
  };

  const refreshRoute = async () => {
    fetchLocation();
    // Wait for user location to be updated
    if (userLoc) {
      const { data: refetchedData } = await refetch({
        originLat: userLoc.lat,
        originLng: userLoc.lng,
        destLat: station.location.lat,
        destLng: station.location.lng,
      });

      if (refetchedData?.getRoute?.polyline) {
        setDecodedPolyline(decodePolyline(refetchedData.getRoute.polyline));
        setSteps(refetchedData.getRoute.steps);
        speakSteps(refetchedData.getRoute.steps.slice(0, 1)); // Speak the first step
      }
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) {
    console.log("GraphQL Error:", error);
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Refresh Route Button */}
      <TouchableOpacity style={styles.button} onPress={refreshRoute}>
        <Text style={styles.buttonText}>Refresh Route</Text>
      </TouchableOpacity>

      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }} title="You are here" />
        <Marker coordinate={{ latitude: station.location.lat, longitude: station.location.lng }} title={station.name} />
        {decodedPolyline.length > 0 && <Polyline coordinates={decodedPolyline} strokeWidth={5} strokeColor="blue" />}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'flex-start', // Ensure content is aligned to top
  },
  map: {
    flex: 1,
  },
  button: {
    backgroundColor: '#007BFF', // Blue background color
    paddingVertical: 40, // More vertical padding for a bigger button
    paddingHorizontal: 30, // Horizontal padding for a wider button
    borderRadius: 30, // Rounded corners for a smooth look
    marginTop: 20, // Space from top
    alignSelf: 'center', // Center the button horizontally
    width: '80%', // Adjustable width
     // Add shadow for Android
  },
  buttonText: {
    color: '#fff', // White text color
    fontSize: 18, // Larger text size
    textAlign: 'center', // Center the text
    fontWeight: 'bold', // Make the text bold
  },
});

export default NavigationScreen;
