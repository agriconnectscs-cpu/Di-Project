import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: JSON.parse(localStorage.getItem("LoggedInUser")) || null,
  validatedUser: JSON.parse(localStorage.getItem("validatedUser")) || null,
  isLoggedIn: !!localStorage.getItem("LoggedInUser"),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setValidatedUser: (state, action) => {
      state.validatedUser = action.payload;
      localStorage.setItem("validatedUser", JSON.stringify(action.payload));
    },
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isLoggedIn = true;
      localStorage.setItem("LoggedInUser", JSON.stringify(action.payload));
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.validatedUser = null;
      state.isLoggedIn = false;
      localStorage.removeItem("LoggedInUser");
      localStorage.removeItem("validatedUser");
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = !!action.payload;
      if (action.payload) {
        localStorage.setItem("LoggedInUser", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("LoggedInUser");
      }
    },
  },
});

export const {
  setValidatedUser,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
} = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectValidatedUser = (state) => state.auth.validatedUser;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
