import { useState, useEffect, useCallback } from "react";
import api from "../api/axiosConfig";
import { CourseContext } from "../hooks/useCourses";

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/courses");
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setError(err.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const addCourse = async (courseData) => {
    try {
      const response = await api.post("/courses", courseData);
      const savedCourse = response.data.data
        ? response.data.data.course
        : response.data;
      setCourses((prev) => [savedCourse, ...(prev || [])]);
      return { success: true, data: savedCourse };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Server Error",
      };
    }
  };

  const updateCourse = async (id, courseData) => {
    try {
      const response = await api.patch(`/courses/${id}`, courseData);
      const updatedCourse = response.data.data
        ? response.data.data.course
        : response.data;
      setCourses((prev) =>
        (prev || []).map((c) => (c._id === id ? updatedCourse : c)),
      );
      return { success: true, data: updatedCourse };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Server Error",
      };
    }
  };

  const deleteCourse = async (id) => {
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Delete failed",
      };
    }
  };

  const value = {
    courses,
    setCourses,
    isLoading,
    error,
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
  };

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
};
