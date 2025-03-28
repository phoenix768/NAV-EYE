import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import Tts from "react-native-tts";
import Voice from "@react-native-voice/voice";
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
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");

  useEffect(() => {
    Tts.setDefaultLanguage("en-US");
    Tts.speak("Welcome to the Public Transport App. Say a keyword to navigate.");

    Voice.onSpeechResults = (event) => {
      if (event.value) {
        const command = event.value[0].toLowerCase();
        handleVoiceCommand(command);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setIsListening(true);
      setRecognizedText("");
      await Voice.start("en-US");
    } catch (error) {
      console.error("Error starting voice recognition:", error);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      await Voice.stop();
    } catch (error) {
      console.error("Error stopping voice recognition:", error);
    }
  };

  const handleVoiceCommand = (command) => {
    setRecognizedText(command);
    stopListening();

    if (command.includes("train")) {
      navigation.navigate("TrainStations");
    } else if (command.includes("bus")) {
      navigation.navigate("BusStations");
    } else if (command.includes("metro")) {
      navigation.navigate("MetroStations");
    } else if (command.includes("map")) {
      navigation.navigate("MapScreen");
    } else if (command.includes("voice assistant")) {
      navigation.navigate("VoiceAssistant");
    } else if (command.includes("current location")) {
      speakLocation();
    } else {
      Tts.speak("Sorry, I didn't understand. Please try again.");
    }
  };

  const speakFeatures = () => {
    const features = [
      "Say train to find train stations",
      "Say bus to find bus stations",
      "Say metro to find metro stations",
      "Say map to open the map",
      "Say voice assistant to open the voice assistant",
      "Say current location to hear your current location",
    ];
    Tts.speak("Here are the available features.");
    features.forEach((feature) => Tts.speak(feature));
  };

  const speakLocation = () => {
    if (data && data.getCurrentLocation) {
      const { address } = data.getCurrentLocation;
      Tts.speak(`Your current location is ${address}.`);
    } else {
      Tts.speak("Sorry, I couldn't retrieve your current location.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Public Transport App</Text>
      <Button title="Repeat Features" onPress={speakFeatures} />
      {loading && <Text>Fetching location...</Text>}
      {error && <Text>Error fetching location</Text>}
      {data && (
        <>
          <Text style={styles.text}>Address: {data.getCurrentLocation.address}</Text>
        </>
      )}
      <Button title="Start Voice Command" onPress={startListening} />
      {isListening && <Text style={styles.listeningText}>Listening...</Text>}
      {recognizedText !== "" && <Text style={styles.recognizedText}>You said: {recognizedText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 18,
    color: "#000",
    marginBottom: 10,
  },
  listeningText: {
    fontSize: 16,
    color: "blue",
    marginTop: 10,
  },
  recognizedText: {
    fontSize: 16,
    color: "green",
    marginTop: 10,
  },
});

export default WelcomeScreen;
