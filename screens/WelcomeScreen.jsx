import React, { useEffect } from "react";
import { View, Text, Button,StyleSheet } from "react-native";
import Tts from "react-native-tts";
import { useQuery, gql } from "@apollo/client";


// GraphQL Query to Get Current Location
const GET_CURRENT_LOCATION = gql`
  query {
    getCurrentLocation {
      lat
      lng
      address
    }
  }
`;

const WelcomeScreen = ({ navigation }) => {
  const { loading, error, data } = useQuery(GET_CURRENT_LOCATION);

  useEffect(() => {
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

  // Speak Current Location when available
  const speaklocation=() => {
    const { lat, lng, address } = data.getCurrentLocation;
              Tts.speak(`Your current location is ${address}.`);

  }

  return (
    <View>
      <Text style={styles.text}>Welcome to the Public Transport App</Text>
      <Button title="Repeat Features" onPress={speakFeatures} />
      {loading && <Text>Fetching location...</Text>}
      {error && <Text>Error fetching location</Text>}
      {data && (
        <>
          
          <Text style={styles.text}>Address: {data.getCurrentLocation.address}</Text>
          <Button
            title="Speak Current Location"
            onPress={speaklocation}
          />
        </>
      )}
      <Button
        
        title="Go to Voice Assistant"
        onPress={() => navigation.navigate("VoiceAssistant")}
      />
      <Button title="Find Train Stations" onPress={() => navigation.navigate("TrainStations")} />
      <Button title="Find Bus Stations" onPress={()=>navigation.navigate("BusStations")}/>
      <Button title="Find Metro Stations" onPress={()=>navigation.navigate("MetroStations")}/>
      <Button title="MAP" onPress={()=>navigation.navigate("MapScreen")}/>
    </View>
  );
};


const styles=StyleSheet.create({
  text:{
    color:"#000000",
  },
  
})

export default WelcomeScreen;
