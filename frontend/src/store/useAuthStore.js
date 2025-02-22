import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/"
export const useAuthStore = create((set, get) => (
    {
        authUser: null,
        isSigningUp: false,
        isLoggingIn: false,
        isUpdatingProfile: false,
        onlineUsers: [],
        socket: null,

        isCheckingAuth: true,
        checkAuth: async () => {
            try {
                const res = await axiosInstance.get("/auth/check");
                set({ authUser: res.data });
                get().connectSocket();
            } catch (error) {
                console.log('Error in checkAuth: ', error);
                set({ authUser: null })
            }
            finally {
                set({ isCheckingAuth: false })
            }
        },
        signup: async (data) => {
            set({ isSigningUp: true });
            try {
                const res = await axiosInstance.post("/auth/signup", data);
                set({ authUser: res.data });
                toast.success("Account created Successfully");
                get().connectSocket();
            } catch (error) {
                toast.error(error.response.data.message);
            } finally {
                set({ isSigningUp: false });
            }
        },
        login: async (data) => {
            set({ isLoggingIn: true });
            try {
                const res = await axiosInstance.post("/auth/login", data);
                set({ authUser: res.data });
                toast.success("User logged in Successfully");
                get().connectSocket();
            } catch (error) {
                toast.error(error.response.data.message);
            } finally {
                set({ isLoggingIn: false });
            }
        },
        logout: async () => {
            try {
                await axiosInstance.post("/auth/logout");
                set({ authUser: null });
                toast.success("Logged out Successfully");
                get().disconnectSocket();
            } catch (error) {
                toast.error(error.response.data.message);
            }
        },
        updateProfile: async (data) => {
            set({ isUpdatingProfile: true });
            try {
                const res = await axiosInstance.put('/auth/update-profile', data);
                set({ authUser: res.data });
                console.log('updated successfully...', res.data);
                toast.success("Profile Updated Successfully");
            } catch (error) {
                console.log("Error in update profile");
                toast.error(error.response.data.message);
            } finally {
                set({ isUpdatingProfile: false })
            }
        },
        connectSocket: () => {
            const { authUser } = get();
            if (!authUser || get().socket?.connected) return;

            const socket = io(BASE_URL, {
                query: {
                    userId: authUser._id,
                }
            });
            socket.on("getOnlineUsers", (userIds) => {
                set({ onlineUsers: userIds });
            })
            socket.connect();
            set({ socket: socket });
        },
        disconnectSocket: () => {
            if (get().socket?.connected) get().socket.disconnect();
        }
    })
)