/* eslint-disable react-hooks/exhaustive-deps */
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, selectValidatedUser } from "../../store/authSlice";

import home_bg from "../../assets/home_bg.webp";
import { useTheme } from "../../ThemeProvider";

import CustomInput from "../../components/CustomInput";
import CustomSelect from "../../components/CustomSelect";
import LoadingSpinner from "../../components/common/LoadingSpinner";
// IMPORTS END-----

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const { isDarkMode } = useTheme();

  const [fiscalYears, setFiscalYears] = useState([]);
  const [locations, setLocations] = useState([]);
  const [connections, setConnections] = useState([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const validatedUser = useSelector(selectValidatedUser);

  // Validation Schema
  const validationSchema = Yup.object({
    loginPassword: Yup.string().required("Password is required"),
    loginAppClientFiscalYearId: Yup.string().when([], {
      is: () => fiscalYears.length > 0,
      then: (schema) => schema.required("Fiscal Year is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    loginAppClientConnectionId: Yup.string().when([], {
      is: () => connections.length > 0,
      then: (schema) => schema.required("Connection is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    loginAppClientLocationId: Yup.string().when([], {
      is: () => locations.length > 1,
      then: (schema) => schema.required("Location is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const { mutate: loginMutation, isPending } = useMutation({
    mutationFn: async (values) => {
      const queryParams = new URLSearchParams({
        LoginAppClientProductId: values.loginAppClientProductId,
        LoginAppClientLocationId: values.loginAppClientLocationId,
        LoginAppClientFiscalYearId: values.loginAppClientFiscalYearId,
        LoginAppClientConnectionId: values.loginAppClientConnectionId,
        LoginId: values.loginId,
        LoginPassword: values.loginPassword,
      });

      const res = await fetch(
        `/api/Login/UserAndPasswordValidate?${queryParams.toString()}`,
      );
      const data = await res.json();

      if (!res.ok || data.statusCode !== 200 || !data.data?.loginId) {
        throw new Error(data.message || "Invalid email or password");
      }

      return data;
    },

    onSuccess: (data, values) => {
      if (rememberMe) {
        localStorage.setItem("rememberedLoginPassword", values.loginPassword);
      } else {
        localStorage.removeItem("rememberedLoginPassword");
      }

      dispatch(loginSuccess(data));
      navigate("/");
    },

    onError: (error) => {
      toast.error(error.message || "Invalid email or password");
    },
  });

  const formik = useFormik({
    initialValues: {
      loginId: "",
      loginPassword: "",
      loginAppClientProductId: "",
      loginAppClientLocationId: "",
      loginAppClientFiscalYearId: "",
      loginAppClientConnectionId: "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (locations.length === 0) {
        toast.error(
          <div className="flex flex-col">
            <span>Location not found!</span>
            <span className="text-xs opacity-80">
              Please contact the software adminstration
            </span>
          </div>,
        );
        return;
      }
      if (fiscalYears.length === 0) {
        toast.error(
          <div className="flex flex-col">
            <span>Fiscal Year not found!</span>
            <span className="text-xs opacity-80">
              Please contact the software adminstration
            </span>
          </div>,
        );
        return;
      }
      if (connections.length === 0) {
        toast.error(
          <div className="flex flex-col">
            <span>Connection not found!</span>
            <span className="text-xs opacity-80">
              Please contact the software adminstration
            </span>
          </div>,
        );
        return;
      }

      if ("Notification" in window) {
        Notification.requestPermission();
      }
      loginMutation(values);
    },
  });

  useEffect(() => {
    const savedUser = validatedUser || {};

    if (savedUser?.loginId) {
      formik.setFieldValue("loginId", savedUser.loginId);
      formik.setFieldValue(
        "loginAppClientProductId",
        savedUser.loginAppClientProductId || "",
      );

      if (savedUser.loginAppClientProduct?.appClientProductLocations) {
        const locs = [
          ...savedUser.loginAppClientProduct.appClientProductLocations,
        ].reverse();
        setLocations(locs);
        formik.setFieldValue(
          "loginAppClientLocationId",
          locs[0]?.appClientLocationId || "",
        );
      }

      if (savedUser.loginAppClientProduct?.appClientFiscalYears) {
        const fys = savedUser.loginAppClientProduct.appClientFiscalYears;
        setFiscalYears(fys);
        formik.setFieldValue(
          "loginAppClientFiscalYearId",
          fys[0]?.appClientFiscalYearId || "",
        );
      }

      if (savedUser.loginAppClientProduct?.appClientConnections) {
        const conns = savedUser.loginAppClientProduct.appClientConnections;
        setConnections(conns);
        formik.setFieldValue(
          "loginAppClientConnectionId",
          conns[0]?.appClientConnectionId || "",
        );
      }
    }
  }, [validatedUser]);

  useEffect(() => {
    const savedLoginPassword = localStorage.getItem("rememberedLoginPassword");
    if (savedLoginPassword) {
      formik.setFieldValue("loginPassword", savedLoginPassword);
      setRememberMe(true);
    }
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row ${
        isDarkMode ? "text-white bg-[#0d0c1a]" : "text-gray-800 bg-white"
      }`}
    >
      {/* Left side */}
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
            <span className="font-medium text-purple-400">HTAG Solutions</span>
          </p>
        </div>
      </div>

      {/* Right side login form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 md:p-12 min-h-screen">
        <div className="w-full max-w-md">
          <h1
            className={`flex items-center justify-center gap-1 text-xl font-bold mb-6 sm:mb-4 tracking-wide underline underline-offset-6 uppercase ${
              isDarkMode ? "text-purple-500" : "text-purple-700"
            }`}
          >
            <ShieldCheck
              className={`w-5 h-5 ${
                isDarkMode ? "text-purple-500" : "text-purple-700"
              }`}
            />
            HTAG Solutions
          </h1>

          <div className="text-center mb-6">
            <h2
              className={`text-2xl font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Welcome to{" "}
              <span
                className={isDarkMode ? "text-purple-400" : "text-purple-700"}
              >
                Digital Invoicing
              </span>
            </h2>
            <p
              className={`text-sm mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Sign in to access your account and manage invoices
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-3">
            {/* Login ID */}
            <div className="grid grid-cols-1 gap-3">
              <CustomInput
                id="loginId"
                type="text"
                name="loginId"
                value={formik.values.loginId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your login ID"
                disabled
                required
                error={formik.touched.loginId && formik.errors.loginId}
              />

              {/* Password */}
              <CustomInput
                id="loginPassword"
                name="loginPassword"
                type="password"
                value={formik.values.loginPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your password"
                required
                error={
                  formik.touched.loginPassword && formik.errors.loginPassword
                }
              />
            </div>

            {/* Selects */}
            {(locations.length > 1 || connections.length > 1) && (
              <div
                className={`grid grid-cols-1 ${locations.length > 1 && connections.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-3 sm:gap-2`}
              >
                {locations.length > 1 && (
                  <CustomSelect
                    id="loginLocation"
                    label="Location"
                    required
                    value={formik.values.loginAppClientLocationId}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "loginAppClientLocationId",
                        e.target.value,
                      )
                    }
                    options={locations.map((loc) => ({
                      value: loc.appClientLocationId,
                      label: loc.appClientLocation?.locationName,
                    }))}
                    error={
                      formik.touched.loginAppClientLocationId &&
                      formik.errors.loginAppClientLocationId
                    }
                  />
                )}

                {connections.length > 1 && (
                  <CustomSelect
                    id="loginConnection"
                    label="Connection"
                    required
                    value={formik.values.loginAppClientConnectionId}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "loginAppClientConnectionId",
                        e.target.value,
                      )
                    }
                    options={connections.map((conn) => ({
                      value: conn.appClientConnectionId,
                      label: conn.appConnectionType?.appConnectionTypeName,
                    }))}
                    error={
                      formik.touched.loginAppClientConnectionId &&
                      formik.errors.loginAppClientConnectionId
                    }
                  />
                )}
              </div>
            )}

            {fiscalYears.length > 1 && (
              <CustomSelect
                id="loginFiscalYear"
                label="Fiscal Year"
                required
                value={formik.values.loginAppClientFiscalYearId}
                onChange={(e) =>
                  formik.setFieldValue(
                    "loginAppClientFiscalYearId",
                    e.target.value,
                  )
                }
                options={fiscalYears.map((fy) => ({
                  value: fy.appClientFiscalYearId,
                  label: fy.fiscalYearName,
                }))}
                error={
                  formik.touched.loginAppClientFiscalYearId &&
                  formik.errors.loginAppClientFiscalYearId
                }
              />
            )}

            <div className="flex items-center gap-2 mb-4">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className={`text-sm cursor-pointer select-none ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Remember Me
              </label>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 text-white bg-linear-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium rounded-lg text-sm px-5 py-2.5 transition-all duration-300 shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isPending ? (
                  <LoadingSpinner content="Logging in..." />
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          {/* Back link */}
          <div className="mt-6 sm:mt-4">
            <Link
              to="/UserValidate/login"
              className={`group inline-flex items-center gap-1 text-sm transition-colors duration-200 ${
                isDarkMode
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowLeft
                size={12}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span className="relative after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-purple-500 after:transition-all after:duration-300 group-hover:after:w-full">
                Back
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
