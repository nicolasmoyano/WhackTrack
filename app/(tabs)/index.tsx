/* eslint-disable @typescript-eslint/no-unused-vars */
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { useCourse } from "../../context/CourseContext";

const CLUBS = [
  "Driver",
  "3W",
  "5W",
  "4I",
  "5I",
  "6I",
  "7I",
  "8I",
  "9I",
  "PW",
  "GW",
  "SW",
  "LW",
  "Putter",
];

type Coord = { latitude: number; longitude: number };
type Shot = {
  id: string;
  club: string;
  start: Coord;
  end: Coord;
  distance: number; // meters
};

export const screenOptions = {
  tabBarStyle: { display: "none" },
};

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<Coord | null>(null);
  const [endPoint, setEndPoint] = useState<Coord | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [holeCount, setHoleCount] = useState(9);
  const [currentHole, setCurrentHole] = useState(1);
  const [shotsByHole, setShotsByHole] = useState<Shot[][]>(
    Array.from({ length: 9 }, () => [])
  );
  const [swingCounts, setSwingCounts] = useState<number[]>(
    Array.from({ length: 9 }, () => 0)
  );
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<Coord | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const { selectedCourse, courses } = useCourse();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (selectedCourse && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedCourse.latitude,
          longitude: selectedCourse.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        },
        1000
      );
    }
  }, [selectedCourse]);

  // Calculate distance in meters using Haversine formula
  function calculateDistance(start: Coord, end: Coord) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    const lat1 = toRad(start.latitude);
    const lat2 = toRad(end.latitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Set start point from current location
  const handleSetStart = () => {
    if (location) {
      const newStart = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setStartPoint(newStart);
      if (endPoint) {
        const dist = calculateDistance(newStart, endPoint);
        setDistance(dist);
      }
    }
  };

  // Set start or end point from modal
  const handleSetPoint = (type: "start" | "end") => {
    if (selectedCoord) {
      if (type === "start") {
        setStartPoint(selectedCoord);
        if (endPoint) {
          const dist = calculateDistance(selectedCoord, endPoint);
          setDistance(dist);
        }
      } else {
        setEndPoint(selectedCoord);
        if (startPoint) {
          const dist = calculateDistance(startPoint, selectedCoord);
          setDistance(dist);
        }
      }
    }
    setModalVisible(false);
    setSelectedCoord(null);
  };

  // Set end point by tapping the map
  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setEndPoint({ latitude, longitude });
    if (startPoint) {
      const dist = calculateDistance(startPoint, { latitude, longitude });
      setDistance(dist);
    }
  };

  // Show modal on long press
  const handleMapLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedCoord({ latitude, longitude });
    setModalVisible(true);
  };

  let region;
  if (selectedCourse) {
    region = {
      latitude: selectedCourse.latitude,
      longitude: selectedCourse.longitude,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    };
  } else if (location) {
    region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  } else {
    region = {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  // Add swing for current hole
  const handleSwing = () => {
    setSwingCounts((counts) => {
      const updated = [...counts];
      updated[currentHole - 1] = updated[currentHole - 1] + 1;
      return updated;
    });
  };

  // Remove last shot for current hole and update swing count
  const handleResetSwing = () => {
    setShotsByHole((prev) => {
      const updated = [...prev];
      updated[currentHole - 1] = updated[currentHole - 1].slice(0, -1);
      return updated;
    });
    setSwingCounts((counts) => {
      const updated = [...counts];
      updated[currentHole - 1] = Math.max(0, updated[currentHole - 1] - 1);
      return updated;
    });
  };

  const handleResetPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setDistance(null);
  };

  // When toggling hole count, reset shots, swing counts, and current hole
  const handleToggleHoleCount = (count: number) => {
    setHoleCount(count);
    setCurrentHole(1);
    setShotsByHole(Array.from({ length: count }, () => []));
    setSwingCounts(Array.from({ length: count }, () => 0));
  };

  // Record shot for current hole and update swing count
  const handleRecordShot = useCallback(() => {
    if (!startPoint || !endPoint || !selectedClub) return;
    const dist = calculateDistance(startPoint, endPoint);
    const shot: Shot = {
      id: String(Date.now()),
      club: selectedClub,
      start: startPoint,
      end: endPoint,
      distance: dist,
    };
    setShotsByHole((prev) => {
      const updated = [...prev];
      updated[currentHole - 1] = [...updated[currentHole - 1], shot];
      return updated;
    });
    setSwingCounts((counts) => {
      const updated = [...counts];
      updated[currentHole - 1] = updated[currentHole - 1] + 1;
      return updated;
    });
    setStartPoint(endPoint);
    setEndPoint(null);
    setDistance(null);
  }, [startPoint, endPoint, selectedClub, currentHole]);

  return (
    <>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          onPress={handleMapPress}
          onLongPress={handleMapLongPress}
          mapType="satellite"
        >
          {startPoint && (
            <Marker
              coordinate={startPoint}
              pinColor="green"
              title="Start Point"
            />
          )}
          {endPoint && (
            <>
              <Marker coordinate={endPoint} pinColor="red" title="End Point">
                {distance !== null && (
                  <View
                    style={{
                      backgroundColor: "rgba(37,99,235,0.95)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 16,
                      marginBottom: 32,
                      alignSelf: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      {distance.toFixed(1)} m
                    </Text>
                  </View>
                )}
              </Marker>
              <Circle
                center={endPoint}
                radius={1} // meters
                strokeColor="rgba(239,68,68,0.8)"
                fillColor="rgba(239,68,68,0.3)"
                zIndex={2}
              />
            </>
          )}
          {courses.map((c) => (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitude, longitude: c.longitude }}
              pinColor="gold"
              title={c.name}
            />
          ))}
          {startPoint && endPoint && (
            <Polyline
              coordinates={[startPoint, endPoint]}
              strokeColor="#2563eb"
              strokeWidth={4}
            />
          )}
        </MapView>
        <View
          style={{
            position: "absolute",
            top: 64,
            left: 24,
            zIndex: 10,
            padding: 8,
            borderRadius: 16,
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "rgba(82, 168, 255, 0.5)",
          }}
        >
          {/* Settings button (now at the top) */}
          <TouchableOpacity
            style={{
              backgroundColor: "rgb(255, 255, 255)",
              borderRadius: 24,
              padding: 10,
              marginBottom: 16,
              elevation: 4,
            }}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="settings-outline" size={16} color="#2563eb" />
          </TouchableOpacity>

          {/* Center to my location button */}
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              borderRadius: 24,
              padding: 10,
              marginBottom: 16,
              elevation: 4,
            }}
            onPress={() => {
              if (location && mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  1000
                );
              }
            }}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={16}
              color="#2563eb"
            />
          </TouchableOpacity>

          {/* Set Start Point button */}
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(37,99,235,0.8)",
              borderRadius: 24,
              padding: 10,
              marginBottom: 16,
              elevation: 4,
            }}
            onPress={handleSetStart}
          >
            <Ionicons name="flag-outline" size={16} color="#fff" />
          </TouchableOpacity>

          {/* Reset Points button */}
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(239,68,68,0.8)",
              borderRadius: 24,
              padding: 10,
              elevation: 4,
            }}
            onPress={handleResetPoints}
          >
            <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingTop: 4,
              paddingBottom: 32,
            }}
          >
            {/* Hole navigation and toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                width: "100%",
              }}
            >
              {/* Previous Button */}
              <Button
                className="bg-white rounded-full shadow-black shadow-sm"
                variant="solid"
                onPress={() => setCurrentHole((h) => Math.max(1, h - 1))}
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#2563eb" />
              </Button>

              {/* Hole count and swings */}
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ fontSize: 18 }}>
                  {currentHole} / {holeCount}
                </Text>
                <Text
                  style={{ fontSize: 16, color: "#2563eb", fontWeight: "bold" }}
                >
                  Swings: {swingCounts[currentHole - 1] || 0}
                </Text>
              </View>

              {/* Next Button */}
              <Button
                className="bg-white rounded-full shadow-black shadow-sm"
                variant="solid"
                onPress={() =>
                  setCurrentHole((h) => Math.min(holeCount, h + 1))
                }
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "visible",
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="#2563eb" />
              </Button>
            </View>

            {/* HOLE SELECTORS */}

            {/* <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginVertical: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => handleToggleHoleCount(9)}
                style={{
                  backgroundColor: holeCount === 9 ? "#2563eb" : "#fff",
                  borderColor: "#2563eb",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: holeCount === 9 ? "#fff" : "#2563eb",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  9 Holes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleToggleHoleCount(18)}
                style={{
                  backgroundColor: holeCount === 18 ? "#2563eb" : "#fff",
                  borderColor: "#2563eb",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}
              >
                <Text
                  style={{
                    color: holeCount === 18 ? "#fff" : "#2563eb",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  18 Holes
                </Text>
              </TouchableOpacity>
            </View> */}

            {/* {distance !== null && (
              <Box className="mt-2">
                <Heading className="text-gray-600 text-3xl">
                  Distance: {distance.toFixed(2)} meters
                </Heading>
              </Box>
            )} */}
            <Box className="mt-4">
              <Heading className="text-base">Select Club</Heading>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {CLUBS.map((club) => (
                  <TouchableOpacity
                    key={club}
                    onPress={() => setSelectedClub(club)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: selectedClub === club ? "#2563eb" : "#ddd",
                      backgroundColor:
                        selectedClub === club ? "rgba(37,99,235,0.1)" : "white",
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: selectedClub === club ? "#2563eb" : "#111",
                      }}
                    >
                      {club}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button
                className="bg-white rounded-full shadow-black shadow-sm"
                variant="solid"
                onPress={handleRecordShot}
                disabled={!selectedClub || !startPoint || !endPoint}
              >
                <ButtonText>
                  {selectedClub
                    ? `Add swing (${selectedClub})`
                    : "Select Club to swing"}
                </ButtonText>
              </Button>
            </Box>
            <Box className="mt-4">
              <HStack className="space-between mt-2" space="md">
                <Button
                  className="bg-white rounded-full shadow-black shadow-sm"
                  variant="solid"
                  onPress={handleSwing}
                >
                  <ButtonText>Add Swing</ButtonText>
                </Button>
                <Button
                  className="bg-white rounded-full shadow-black shadow-sm"
                  variant="solid"
                  onPress={handleResetSwing}
                >
                  <ButtonText>Reset Swings</ButtonText>
                </Button>
              </HStack>
            </Box>

            {shotsByHole[currentHole - 1] &&
              shotsByHole[currentHole - 1].length > 0 && (
                <Box className="mt-4">
                  <Heading className="text-base">
                    Shot History (Hole {currentHole})
                  </Heading>
                  {/* Show a message if on the final hole */}
                  {currentHole === holeCount && (
                    <Text
                      style={{
                        color: "#2563eb",
                        fontWeight: "bold",
                        marginBottom: 8,
                      }}
                    >
                      Final Hole — keep recording your shots!
                    </Text>
                  )}
                  {shotsByHole[currentHole - 1].map((s, idx) => (
                    <View
                      key={s.id}
                      style={{
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        {idx + 1}. {s.club} — {s.distance.toFixed(1)} m
                      </Text>
                    </View>
                  ))}
                </Box>
              )}
          </ScrollView>
        </View>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: 24,
              borderRadius: 12,
              minWidth: 220,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
            >
              Set Point
            </Text>
            <TouchableOpacity
              onPress={() => handleSetPoint("start")}
              style={{
                padding: 12,
                backgroundColor: "#4ade80",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: "#02471b",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Set as Start Point
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSetPoint("end")}
              style={{
                padding: 12,
                backgroundColor: "#f87171",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Set as End Point
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ padding: 8, marginTop: 12 }}
            >
              <Text style={{ color: "#64748b", textAlign: "center" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              padding: 24,
              borderRadius: 12,
              minWidth: 220,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
            >
              Game Settings
            </Text>
            <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
              Hole Count
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  handleToggleHoleCount(9);
                  setSettingsVisible(false);
                }}
                style={{
                  backgroundColor: holeCount === 9 ? "#2563eb" : "#fff",
                  borderColor: "#2563eb",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: holeCount === 9 ? "#fff" : "#2563eb",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  9 Holes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleToggleHoleCount(18);
                  setSettingsVisible(false);
                }}
                style={{
                  backgroundColor: holeCount === 18 ? "#2563eb" : "#fff",
                  borderColor: "#2563eb",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}
              >
                <Text
                  style={{
                    color: holeCount === 18 ? "#fff" : "#2563eb",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  18 Holes
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
              style={{ padding: 8, marginTop: 12 }}
            >
              <Text style={{ color: "#64748b", textAlign: "center" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get("window").width,
    height: 480,
    marginBottom: 16,
  },
});
