import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Button } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRoute } from "@react-navigation/native";
import { gql, useQuery } from "@apollo/client";
import Tts from "react-native-tts";

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
      speakSteps(data.getRoute.steps.slice(0, 3)); // Speak first 3 steps
    }
  }, [data]);

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

  const refreshRoute = async () => {
    const newUserLocation = await getCurrentLocation(); // Implement this function to get updated location
    await refetch({
      originLat: newUserLocation.lat,
      originLng: newUserLocation.lng,
      destLat: station.location.lat,
      destLng: station.location.lng,
    });
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) {
    console.log("GraphQL Error:", error);
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
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
      <Button title="Refresh Route" onPress={refreshRoute} />
    </View>
  );
};

export default NavigationScreen;
