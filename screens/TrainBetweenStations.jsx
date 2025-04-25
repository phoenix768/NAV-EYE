import { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  AccessibilityInfo,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  SafeAreaView
} from "react-native";
import DatePicker from "react-native-date-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Voice from "@react-native-voice/voice";
import Tts from "react-native-tts";
import { IP_ADDRESS } from '@env';


const TrainsBetweenStations = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [trains, setTrains] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [inputField, setInputField] = useState(null);
  const [screenReaderActive, setScreenReaderActive] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
    Tts.speak("You are on the Train Between stations screen.Provide destination and departure stations along with date with the help of voice input buttons");
  }, []);
  // Check if screen reader is enabled
  useEffect(() => {
    const checkScreenReader = async () => {
      const isActive = await AccessibilityInfo.isScreenReaderEnabled();
      setScreenReaderActive(isActive);
    };
    
    checkScreenReader();
    
    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      isActive => {
        setScreenReaderActive(isActive);
      }
    );
    
    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5); // Slower speech rate for better comprehension
    Tts.setDefaultPitch(1.0);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Helper function to announce content via TTS
  const announce = (message) => {
    Tts.stop();
    Tts.speak(message);
  };

  // Helper function to parse spoken date in various formats
  const parseSpokenDate = (dateText) => {
    try {
      // Try to handle formats like "11 January 2025" or "January 11 2025" or "11 Jan 2025"
      // First, normalize the input by ensuring spaces between components
      const normalizedText = dateText
        .replace(/(\d+)(st|nd|rd|th)?/g, '$1 ') // Handle "11th January" -> "11 January"
        .replace(/,/g, ' ')                      // Remove commas
        .replace(/\s+/g, ' ')                   // Normalize spaces
        .trim();
      
      // Array of month names and their three-letter abbreviations
      const months = [
        ["january", "jan"],
        ["february", "feb"],
        ["march", "mar"],
        ["april", "apr"],
        ["may", "may"],
        ["june", "jun"],
        ["july", "jul"],
        ["august", "aug"],
        ["september", "sep"],
        ["october", "oct"],
        ["november", "nov"],
        ["december", "dec"]
      ];
      
      let day, month, year;
      const parts = normalizedText.toLowerCase().split(' ');
      
      // Extract day, month, and year from the parts
      parts.forEach(part => {
        // Check if part is a number for day or year
        if (/^\d+$/.test(part)) {
          if (parseInt(part) > 31) {
            year = parseInt(part);
          } else {
            day = parseInt(part);
          }
        } 
        // Check if part is a month name
        else {
          for (let i = 0; i < months.length; i++) {
            if (months[i].includes(part)) {
              month = i + 1; // Month index + 1 (January is 1)
              break;
            }
          }
        }
      });
      
      // Handle year if it's missing or incomplete
      const currentYear = new Date().getFullYear();
      if (!year) {
        year = currentYear;
      } else if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
      
      // Validate all parts are present
      if (!day || !month || !year) {
        throw new Error("Incomplete date");
      }
      
      // Create date object and validate it's a real date
      const parsedDate = new Date(year, month - 1, day);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date");
      }
      
      return parsedDate;
    } catch (error) {
      console.error("Date parsing error:", error);
      return null;
    }
  };

  // Format date as YYYY-MM-DD
  const formatDateForAPI = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for spoken feedback
  const formatDateForSpeech = (dateObj) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  };

  // Set up voice recognition listeners
  // Set up voice recognition listeners
useEffect(() => {
  // First destroy any existing instance when inputField changes
  Voice.destroy().then(() => {
    console.log("Voice destroyed before reinitializing");
  }).catch(e => console.error("Error destroying Voice:", e));
  
  // Define handlers
  const onSpeechResults = (event) => {
    const spokenText = event.value[0]?.trim();
    if (!spokenText) return;

    if (inputField === "from") {
      setFrom(spokenText.toUpperCase());
      announce(`From station set to ${spokenText}.`);
    } else if (inputField === "to") {
      setTo(spokenText.toUpperCase());
      announce(`To station set to ${spokenText}.`);
    } else if (inputField === "date") {
      const parsedDate = parseSpokenDate(spokenText);
      if (parsedDate) {
        setDate(parsedDate);
        announce(`Date set to ${formatDateForSpeech(parsedDate)}.`);
      } else {
        announce("Sorry, I couldn't understand that date. Please try again with a format like 11 January 2025.");
      }
    }
    setIsListening(false);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechError = (error) => {
    console.error("Speech recognition error:", error);
    setIsListening(false);
    announce("I couldn't hear that. Please try again.");
  };

  // Add listeners
  Voice.onSpeechResults = onSpeechResults;
  Voice.onSpeechEnd = onSpeechEnd;
  Voice.onSpeechError = onSpeechError;

  // Clean up
  return () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };
}, [inputField]); // Keep inputField dependency
  // Reset voice recognition when screen gains focus
  // Replace your current useFocusEffect with this
  useFocusEffect(
    useCallback(() => {
      // Reset voice state when returning to this screen
      setIsListening(false);
      
      // Announce screen when it gains focus for screen reader users
      if (screenReaderActive) {
        setTimeout(() => {
          announce("Train search screen. Use voice controls to find trains between stations.");
        }, 1000);
      }
      
      return () => {
        // Cancel any active voice recognition when leaving screen
        if (isListening) {
          Voice.cancel();
        }
        Voice.destroy().then(() => console.log('Voice destroyed on screen unfocus'));
        Tts.stop();
      };
    }, [screenReaderActive]) // Remove isListening from dependencies
  );

  const startListening = async (field) => {
    try {
      // If already listening for the same field, cancel and restart
      if (isListening && inputField === field) {
        await Voice.cancel();
        setIsListening(false);
        
        // Short delay before restarting
        setTimeout(() => {
          setInputField(field);
          setIsListening(true);
          
          Voice.start("en-US").catch(error => {
            console.error("Voice recognition restart error:", error);
            setIsListening(false);
            announce("Voice recognition failed to restart. Please try again.");
          });
        }, 500);
        return;
      }
      
      // Cancel any ongoing voice recognition
      if (isListening) {
        await Voice.cancel();
      }
      
      // Reset state for new input attempt
      setInputField(field);
      setIsListening(true);
      
      // Provide guidance based on the field
      
      
      // Start voice recognition after a short delay
      setTimeout(() => {
        Voice.start("en-US").catch(error => {
          console.error("Voice recognition start error:", error);
          setIsListening(false);
          announce("Voice recognition failed to start. Please try again.");
        });
      }, 300);
      
    } catch (error) {
      console.error("Voice recognition error:", error);
      setIsListening(false);
      announce("There was a problem with voice recognition. Please try again.");
    }
  };


  const fetchTrains = async () => {
    try {
      announce("Searching for trains. Please wait.");
      
      const formattedDate = formatDateForAPI(date);
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/trains/getTrainOn?from=${from}&to=${to}&date=${formattedDate}`
      );
      const data = await response.json();
      
      const trainsData = data.success && Array.isArray(data.data) ? data.data : [];
      setTrains(trainsData);
      
      if (trainsData.length > 0) {
        announce(`Found ${trainsData.length} trains from ${from} to ${to} on ${formatDateForSpeech(date)}. Swipe to explore the results.Press the train if you want to know its details.`);
      } else {
        announce(`No trains found from ${from} to ${to} on ${formatDateForSpeech(date)}. Please try different stations or date.`);
      }
    } catch (error) {
      console.error("Error fetching trains:", error);
      setTrains([]);
      announce("There was an error searching for trains. Please check your internet connection and try again.");
    }
  };

  const renderTrainItem = ({ item }) => {
    const trainInfo = `${item.train_base.train_name}, train number ${item.train_base.train_no}. Departs from ${item.train_base.from_stn_name} at ${item.train_base.from_time}. Arrives at ${item.train_base.to_stn_name} at ${item.train_base.to_time}. Travel time ${item.train_base.travel_time} hours.`;
    
    const navigateToTrainDetails = () => {
      navigation.navigate("TrainInfo", { trainNo: item.train_base.train_no });
    };
    
    return (
      <TouchableOpacity
        style={styles.trainItem}
        onPress={navigateToTrainDetails}
        accessible={true}
        accessibilityLabel={trainInfo}
        accessibilityRole="button"
        accessibilityHint="Double tap to view train details"
      >
        <Text style={styles.trainName}>{item.train_base.train_name} - {item.train_base.train_no}</Text>
        <View style={styles.journeyDetails}>
          <View style={styles.stationTime}>
            <Text style={styles.time}>{item.train_base.from_time}</Text>
            <Text style={styles.station}>{item.train_base.from_stn_name} ({item.train_base.from_stn_code})</Text>
          </View>
          
          <View style={styles.journeyLine}>
            <View style={styles.line} />
            <Text style={styles.duration}>{item.train_base.travel_time} hrs</Text>
            <View style={styles.line} />
          </View>
          
          <View style={styles.stationTime}>
            <Text style={styles.time}>{item.train_base.to_time}</Text>
            <Text style={styles.station}>{item.train_base.to_stn_name} ({item.train_base.to_stn_code})</Text>
          </View>
        </View>
        
      </TouchableOpacity>
    );
  };

  // When no trains are found
  const renderEmptyList = () => {
    if (trains.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No trains found.</Text>
          <Text style={styles.emptyTextDetail}>Try different stations or date.</Text>
        </View>
      );
    }
    return null;
  };


  // Create header component for FlatList
  const ListHeaderComponent = () => (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Find Trains</Text>
        <Text style={styles.subHeaderText}>Use voice commands to search for trains</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>From Station</Text>
        <TextInput 
          
          placeholder="Enter departure station" 
          value={from} 
          onChangeText={setFrom} 
          style={styles.textInput}
          placeholderTextColor="#666"
          // accessible={true}
          accessibilityLabel="From station input"
          accessibilityHint="Enter departure station code or name"
          
        />
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && inputField === "from" ? styles.listeningButton : null]}
          onPress={() => startListening("from")}
          disabled={isListening}
          accessible={true}
          accessibilityLabel="Speak departure station"
          accessibilityRole="button"
          accessibilityHint="Activate to speak your departure station"
        >
          <Text style={styles.voiceButtonText}>
            {isListening && inputField === "from" ? "Listening..." : "🎤 Speak From Station"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>To Station</Text>
        <TextInput 
          placeholder="Enter destination station" 
          value={to} 
          onChangeText={setTo} 
          style={styles.textInput}
          placeholderTextColor="#666"
          accessible={true}
          accessibilityLabel="To station input"
          accessibilityHint="Enter destination station code or name"
        />
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && inputField === "to" ? styles.listeningButton : null]}
          onPress={() => startListening("to")}
          disabled={isListening}
          accessible={true}
          accessibilityLabel="Speak destination station"
          accessibilityRole="button"
          accessibilityHint="Activate to speak your destination station"
        >
          <Text style={styles.voiceButtonText}>
            {isListening && inputField === "to" ? "Listening..." : "🎤 Speak To Station"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Travel Date</Text>
        <Text 
          style={styles.dateDisplay}
          accessible={true}
          accessibilityLabel={`Selected date is ${formatDateForSpeech(date)}`}
        >
          {formatDateForSpeech(date)}
        </Text>
        
        <View style={styles.dateButtonsContainer}>
          <TouchableOpacity 
            style={styles.dateButton1}
            onPress={() => setOpen(true)}
            accessible={true}
            accessibilityLabel="Select date using calendar"
            accessibilityRole="button"
            accessibilityHint="Opens date picker calendar"
          >
            <Text style={styles.dateButtonText}>📅</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dateButton, isListening && inputField === "date" ? styles.listeningButton : null]}
            onPress={() => startListening("date")}
            disabled={isListening}
            accessible={true}
            accessibilityLabel="Speak travel date"
            accessibilityRole="button"
            accessibilityHint="Activate to speak your travel date"
          >
            <Text style={styles.dateButtonText}>
              {isListening && inputField === "date" ? "Listening..." : "🎤 Speak Date"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <DatePicker 
          modal 
          open={open} 
          date={date} 
          mode="date" 
          minimumDate={new Date()} 
          onConfirm={(selectedDate) => {
            setOpen(false);
            setDate(selectedDate);
            if (screenReaderActive) {
              announce(`Date set to ${formatDateForSpeech(selectedDate)}`);
            }
          }}
          onCancel={() => setOpen(false)}
          accessibilityLabel="Date picker"
        />
      </View>
      
      <TouchableOpacity 
        style={styles.searchButton}
        onPress={fetchTrains}
        disabled={!from || !to}
        accessible={true}
        accessibilityLabel="Find trains"
        accessibilityRole="button"
        accessibilityHint="Search for trains with the selected criteria"
      >
        <Text style={styles.searchButtonText}>🔍 Find Trains</Text>
      </TouchableOpacity>
      
      {trains.length > 0 && (
        <Text 
          style={styles.resultsHeader}
          accessible={true}
          accessibilityLabel={`Found ${trains.length} trains from ${from} to ${to}`}
        >
          {trains.length} Trains Found
        </Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={trains}
        keyExtractor={(item) => item.train_base.train_no}
        renderItem={renderTrainItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={[
          styles.contentContainer,
          trains.length === 0 && styles.emptyContentContainer
        ]}
        ListFooterComponent={<View style={styles.footer} />}
      />
    </SafeAreaView>
  );
};

// Get screen dimensions
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d2691e',
    marginBottom: 6,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: 10,
  },
  dateDisplay: {
    fontSize: 18,
    color: '#000',
    padding: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton1: {
    backgroundColor: '#4682b4',
    paddingVertical: 45,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.1,
  },
  dateButton: {
    backgroundColor: '#4682b4',
    paddingVertical: 45,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.85,
  },
  dateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 25,


  },
  voiceButton: {
    backgroundColor: '#d2691e',
    paddingVertical: 45,
    borderRadius: 8,
    alignItems: 'center',
  },
  voiceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 25,
  },
  listeningButton: {
    backgroundColor: '#ff4500',
  },
  searchButton: {
    backgroundColor: '#2e8b57',
    paddingVertical: 45,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 25,
  },
  resultsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  trainItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  trainName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d2691e',
    marginBottom: 15,
  },
  journeyDetails: {
    marginBottom: 15,
  },
  stationTime: {
    marginBottom: 5,
    marginTop: 5,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  station: {
    fontSize: 16,
    color: '#444',
  },
  journeyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#d2691e',
  },
  duration: {
    paddingHorizontal: 8,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptyTextDetail: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  footer: {
    height: 20,
  }
});

export default TrainsBetweenStations;