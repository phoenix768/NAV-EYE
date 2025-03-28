import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Platform, PermissionsAndroid } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import Tts from "react-native-tts";
import { useLazyQuery, gql } from "@apollo/client";

// GraphQL Query to Get Address from Coordinates
const GET_ADDRESS_FROM_COORDINATES = gql`
  query GetAddress($lat: Float!, $lng: Float!) {
    getAddressFromCoordinates(lat: $lat, lng: $lng)
  }
`;

const WelcomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [getAddress, { loading, error, data }] = useLazyQuery(GET_ADDRESS_FROM_COORDINATES);

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Location permission denied");
        return false;
      }
    }
    return true;
  };

  // Fetch location and get address
  useEffect(() => {
    const fetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          getAddress({ variables: { lat: latitude, lng: longitude } });
          console.log(latitude,longitude);
        },
        (error) => console.error(error.message),
        { enableHighAccuracy: true, timeout: 20000 }
      );
    };

    fetchLocation();
    Tts.setDefaultLanguage("en-US");
    Tts.speak("Welcome to the Public Transport App. Press 1 to hear the features.");
  }, []);

  const speakFeatures = () => {
    const features = [
      "Press 1 for your current location",
      "Press 2 for nearby train stations",
      "Press 3 for nearby bus stations",
      "Press 4 for nearby metro stations",
      "Press 5 for navigation to the station",
      "Press 6 for train or bus schedules",
      "Press 7 for transfer options",
    ];
    Tts.speak("Here are the features available.");
    features.forEach((feature) => Tts.speak(feature));
  };

  // Speak current location when available
  const speakLocation = () => {
    if (data?.getAddressFromCoordinates) {
      Tts.speak(`Your current location is ${data.getAddressFromCoordinates}.`);
    } else {
      Tts.speak("Fetching your location, please wait.");
    }
  };

  return (
    <View>
      <Text style={styles.text}>Welcome to the Public Transport App</Text>
      <Button title="Repeat Features" onPress={speakFeatures} />
      {loading && <Text>Fetching location...</Text>}
      {error && <Text>Error fetching location</Text>}
      {data && (
        <>
          <Text style={styles.text}>Address: {data.getAddressFromCoordinates}</Text>
          <Button title="Speak Current Location" onPress={speakLocation} />
        </>
      )}
      <Button title="Go to Voice Assistant" onPress={() => navigation.navigate("VoiceAssistant")} />
      <Button title="Find Train Stations" onPress={() => navigation.navigate("TrainStations")} />
      <Button title="Find Bus Stations" onPress={() => navigation.navigate("BusStations")} />
      <Button title="Find Metro Stations" onPress={() => navigation.navigate("MetroStations")} />
      <Button title="Train Enquiry" onPress={()=>navigation.navigate("TrainEnquiry")}/>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#000000",
  },
});

export default WelcomeScreen;