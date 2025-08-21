import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCourse } from "../../context/CourseContext";

type OverpassElement = {
  id: number;
  type: "way" | "relation";
  tags?: { name?: string };
  center?: { lat: number; lon: number };
};

export default function GolfCoursesScreen() {
  const router = useRouter();
  const { setSelectedCourse, setCourses, courses } = useCourse();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Filter courses client-side by name
  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.name.toLowerCase().includes(q));
  }, [courses, query]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Stockholm bounding box (south, west, north, east)
      const bbox = "59.1,17.6,59.6,18.3";
      const query = `
        [out:json][timeout:25];
        (
          way["leisure"="golf_course"](${bbox});
          relation["leisure"="golf_course"](${bbox});
        );
        out center tags;
      `;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
      const data = await res.json();
      const items = (data.elements as OverpassElement[])
        .filter((el) => el.center && (el.tags?.name ?? "").length > 0)
        .map((el) => ({
          id: String(el.id),
          name: el.tags!.name!,
          latitude: el.center!.lat,
          longitude: el.center!.lon,
        }));
      setCourses(items);
    } catch (e: any) {
      setError(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [setCourses]);

  useEffect(() => {
    // Load once when screen mounts
    fetchCourses();
  }, [fetchCourses]);

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    router.replace("/(tabs)"); // Go back to Home tab
  };

  const statusBarHeight =
    Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <Text style={styles.title}>Golf Courses</Text>

      {/* Search input */}
      <TextInput
        placeholder="Search courses"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.search}
      />

      {loading && (
        <ActivityIndicator size="large" style={{ marginVertical: 16 }} />
      )}
      {error && <Text style={{ color: "red", marginBottom: 12 }}>{error}</Text>}

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        onRefresh={fetchCourses}
        refreshing={loading}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectCourse(item)}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.subText}>
              {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text>
              {query
                ? "No courses match your search."
                : "No courses found. Pull to refresh."}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 18, fontWeight: "600" },
  subText: { fontSize: 12, color: "#555", marginTop: 4 },
});
