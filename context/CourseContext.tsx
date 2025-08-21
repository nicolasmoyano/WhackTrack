import React, { createContext, useContext, useState } from "react";

export type Course = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type CourseContextValue = {
  courses: Course[];
  setCourses: (c: Course[]) => void;
  selectedCourse: Course | null;
  setSelectedCourse: (c: Course | null) => void;
};

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <CourseContext.Provider
      value={{ courses, setCourses, selectedCourse, setSelectedCourse }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse must be used within CourseProvider");
  return ctx;
}
