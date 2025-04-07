import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, SafeAreaView, StatusBar, Modal, TouchableWithoutFeedback} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Geolocation from "@react-native-community/geolocation";
import Tts from "react-native-tts";
import Voice from "@react-native-voice/voice";
import { useLazyQuery, gql } from "@apollo/client";

const GET_ADDRESS_FROM_COORDINATES = gql`
  query GetAddress($lat: Float!, $lng: Float!) {
    getAddressFromCoordinates(lat: $lat, lng: $lng) {
      formatted_address
      areas
      landmarks {
        name
      }
    }
  }
`;

const WelcomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [getAddress, { data }] = useLazyQuery(GET_ADDRESS_FROM_COORDINATES);
  const [modalVisible, setModalVisible] = useState(false); // State for Modal visibility

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  useEffect(() => {
    const fetchLocation = async () => {
      if (!(await requestLocationPermission())) return;

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          getAddress({ variables: { lat: latitude, lng: longitude } });
        },
        (error) => console.error(error.message),
        { timeout:20000}
      );
    };

    fetchLocation();
    Tts.setDefaultLanguage("en-US");
    Tts.speak("Welcome to the Public Transport App. Press Repeat features button to hear the features. Press voice input button to access those features.");
  }, []);

  const speakLocation = () => {
    if (data?.getAddressFromCoordinates) {
      const { formatted_address, areas, landmarks } = data.getAddressFromCoordinates;
  
      let speechOutput = `Your current location is ${formatted_address}.`;
  
      if (areas.length > 0 && areas[0] !== "No areas found") {
        speechOutput += ` You are in the area of ${areas.join(", ")}.`;
      }
  
      if (landmarks.length > 0) {
        speechOutput += " Nearby landmarks include ";
        speechOutput += landmarks.map(lm => `${lm.name}`).join(", ") + ".";
      }
  
      Tts.speak(speechOutput);
  
      // Show Modal after speaking the location
      setModalVisible(true);
    } else {
      Tts.speak("Fetching your location, please wait.");
    }
  };

  const speakFeatures = () => {
    const features = [
      "Speak current location to know your current location",
      "Speak train station to get nearby train stations",
      "Speak bus station to get nearby bus stations",
      "Speak metro station to get nearby metro stations",
      "Speak train enquiry for train enquiry",
    ];
    Tts.speak("Here are the features available.");
    features.forEach((feature) => Tts.speak(feature));
  };

  const startVoiceRecognition = async () => {
    try {
      await Voice.start("en-US");
    } catch (error) {
      console.error("Voice recognition error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      Voice.onSpeechResults = (event) => {
        const spokenText = event.value[0].toLowerCase();
        
        if (spokenText.includes("train station")||spokenText.includes("railway station")) {
          navigation.navigate("TrainStations");
        } else if (spokenText.includes("bus station")) {
          navigation.navigate("BusStations");
        } else if (spokenText.includes("metro station")||spokenText.includes("subway station")) {
          navigation.navigate("MetroStations");
        } else if (spokenText.includes("train enquiry")) {
          navigation.navigate("TrainEnquiry");
        } else if (spokenText.includes("current location")) {
          speakLocation();
        } else if (spokenText.includes("voice")) {
          navigation.navigate("VoiceAssistant");
        } else {
          Tts.speak("Sorry, I didn't understand. Please try again.");
        }
      };

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <Text style={styles.title}>Welcome to Public Transport App</Text>
      
      {/* Modal for Location Info */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Your Current Location</Text>
              <Text style={styles.modalText}>Location: {data?.getAddressFromCoordinates?.formatted_address}</Text>
              <Text style={styles.modalText}>Area: {data?.getAddressFromCoordinates?.areas.join(", ") || "No area found"}</Text>
              <Text style={styles.modalText}>Nearby Landmarks:{'\n📍'}{data?.getAddressFromCoordinates?.landmarks.map(lm => lm.name).join("\n📍") || "No landmarks found"}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <TouchableOpacity style={styles.button} onPress={speakFeatures}>
        <Text style={styles.buttonText}>Repeat Features</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={startVoiceRecognition}>
        <Text style={styles.buttonText}>Voice Input</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faebd7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#a0522d",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#8b4513",
    paddingVertical: 100,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginVertical: 15,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#faebd7",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent background
  },
  modalContent: {
    backgroundColor: "#faebd7",
    padding: 40,
    borderRadius: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a0522d",
    marginBottom: 30,
  },
  modalText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 18,
  },
});

export default WelcomeScreen;
