import React, { useEffect } from "react";
import { View, Text, Button } from "react-native";
import Tts from "react-native-tts";

const WelcomeScreen = ({navigation}) => {
  useEffect(() => {
    Tts.setDefaultLanguage("en-US"); // Set the language
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

  return (
    <View>
      <Text>Welcome to the Public Transport App</Text>
      <Button title="Repeat Features" onPress={speakFeatures} />
      <Button
        title="Go to Voice Assistant"
        onPress={() => navigation.navigate("VoiceAssistant")}
      />
    </View>
  );
};

export default WelcomeScreen;
