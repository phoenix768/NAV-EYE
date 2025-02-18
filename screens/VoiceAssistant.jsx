import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, PermissionsAndroid, Platform } from "react-native";
import Voice from "@react-native-voice/voice";

const VoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => {
      setIsListening(false);  // Make sure to set isListening to false when speech ends
    };
    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        setSpokenText(event.value[0]); // Store the recognized text
      } 
    };

    const androidPermissionChecking = async () => {
      if (Platform.OS === "android") {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        console.log(hasPermission);
      }
    };

    androidPermissionChecking();

    return () => {
      // Clean up event listeners
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Function to start voice recognition
  const startListening = async () => {
    try {
      setSpokenText(""); // Clear previous text
      if (Voice) {
        await Voice.start("en-US"); // Start listening
      } else {
        console.error("Voice module is not initialized properly.");
      }
    } catch (error) {
      console.error("Error starting voice recognition", error);
    }
  };

  // Function to stop voice recognition
  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false); // Stop listening when manually pressed
    } catch (error) {
      console.error("Error stopping voice recognition", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Input</Text>
      <Button
        title={isListening ? "Listening..." : "Start Listening"}
        onPress={startListening}
        disabled={isListening} // Disable the "Start Listening" button while listening
      />
      <Button
        title="Stop Listening"
        onPress={stopListening}
        disabled={!isListening} // Disable the "Stop Listening" button if not listening
      />
      <Text style={styles.output}>Recognized Text: {spokenText}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  output: {
    marginTop: 20,
    fontSize: 16,
    color: "blue",
  },
});

export default VoiceInput;
