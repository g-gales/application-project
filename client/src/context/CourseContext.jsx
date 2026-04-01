import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axiosConfig";
import toast from "react-hot-toast";
import { CourseContext } from "../hooks/useCourses";

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/courses");
      const data = Array.isArray(res.data) ? res.data : [];
      setCourses(data);
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setError(err.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
      toast.error("Failed to load courses.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setCourses([]);
      return;
    }

    fetchCourses();

    return () => {
      setCourses([]);
    };
  }, [user, fetchCourses]);

  const addCourse = async (courseData) => {
    try {
      const response = await api.post("/courses", courseData);
      const savedCourse = response.data.data
        ? response.data.data.course
        : response.data;
      setCourses((prev) => [savedCourse, ...(prev || [])]);
      toast.success("Course added successfully.");

      return { success: true, data: savedCourse };
    } catch (err) {
      toast.error("Failed to add course.");
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
      toast.success("Course updated successfully.");

      return { success: true, data: updatedCourse };
    } catch (err) {
      toast.error("Failed to update course.");
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
      toast.success("Course deleted successfully.");

      return { success: true };
    } catch (err) {
      toast.error("Failed to delete course.");
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
