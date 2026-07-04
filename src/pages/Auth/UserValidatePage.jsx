/* eslint-disable no-unused-vars */
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Redo, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useDispatch } from "react-redux";
import { setValidatedUser } from "../../store/authSlice";

import { useTheme } from "../../ThemeProvider";
import home_bg from "../../assets/home_bg.webp";

import CustomInput from "../../components/CustomInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
// IMPORTS END------

const UserValidatePage = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const { isDarkMode } = useTheme();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    loginId: Yup.string().required("Login ID is required"),
  });

  const { mutate: userValidateMutation, isPending } = useMutation({
    mutationFn: async ({ LoginId }) => {
      let res;
      try {
        res = await fetch(`/api/Login/UserValidate?LoginId=${LoginId}`);
      } catch (error) {
        throw new Error(
          "Server is not responding. Please try again in a moment.",
        );
      }

      let result = {};
      try {
        result = await res.json();
      } catch (error) {
        if (!res.ok) {
          throw new Error(
            "Server is not responding. Please try again in a moment.",
          );
        }
      }

      if (!res.ok || result.statusCode !== 200 || !result.data?.loginId) {
        throw new Error(result.message || "Invalid Login ID");
      }

      return result.data;
    },

    onSuccess: (data, values) => {
      if (rememberMe) {
        localStorage.setItem("rememberedLoginId", values.LoginId);
      } else {
        localStorage.removeItem("rememberedLoginId");
      }

      dispatch(setValidatedUser(data));
      navigate("/login");
    },

    onError: (error) => {
      toast.error(error.message || "Invalid Login ID");
    },
  });

  const formik = useFormik({
    initialValues: {
      loginId: "",
    },
    validationSchema,
    onSubmit: (values) => {
      userValidateMutation({ LoginId: values.loginId });
    },
  });

  useEffect(() => {
    const savedLoginId = localStorage.getItem("rememberedLoginId");
    if (savedLoginId) {
      formik.setFieldValue("loginId", savedLoginId);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row ${
        isDarkMode ? "text-white bg-[#0d0c1a]" : "text-gray-800 bg-white"
      }`}
    >
      {/* Left side image */}
      <div
        className="hidden md:flex md:w-2/2 items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: `url(${home_bg})` }}
      >
        <div
          className={`absolute inset-0 ${
            isDarkMode ? "bg-black/60" : "bg-black/40"
          }`}
        ></div>

        <div className="absolute bottom-6 left-6 z-10 text-white">
          <h3 className="text-lg font-semibold">Digital Invoicing</h3>
          <p className="text-sm text-gray-300 leading-tight">
            Streamline your invoicing with an all-in-one solution
            <br />
            designed for modern businesses.
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Powered by{" "}
            <span className="font-medium text-purple-500">HTAG Solutions.</span>
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 md:p-12 min-h-screen">
        <div className="w-full max-w-md">
          <h1
            className={`flex items-center justify-center gap-1 text-xl font-bold mb-6 tracking-wide underline underline-offset-6 ${
              isDarkMode ? "text-primary" : "text-primary-700"
            }`}
          >
            <ShieldCheck
              className={`w-6 h-6 ${
                isDarkMode ? "text-primary" : "text-primary-700"
              }`}
            />
            <span className="uppercase">HTAG Solutions</span>
          </h1>

          <div className="text-center mb-6">
            <h2
              className={`${
                isDarkMode ? "text-white" : "text-gray-900"
              } text-2xl font-semibold`}
            >
              Welcome to{" "}
              <span
                className={`${
                  isDarkMode ? "text-primary" : "text-primary-700"
                }`}
              >
                Digital Invoicing
              </span>
            </h2>
            <p
              className={`${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              } text-sm mt-1`}
            >
              Please sign in to access your account.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit}>
            <CustomInput
              id="loginId"
              name="loginId"
              type="text"
              required
              value={formik.values.loginId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter your login ID"
              error={formik.touched.loginId && formik.errors.loginId}
            />

            <div className="flex items-center gap-2 mb-6 mt-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className={`${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                } text-sm cursor-pointer select-none`}
              >
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="relative w-full flex items-center justify-center gap-2 text-white bg-linear-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium rounded-md text-sm px-5 py-2.5 transition-all duration-300 shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <LoadingSpinner content="Submitting..." />
              ) : (
                <>
                  Submit <Redo className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserValidatePage;
