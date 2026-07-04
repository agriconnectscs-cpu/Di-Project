import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Edit, Redo, Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSelector } from "react-redux";
import { selectValidatedUser } from "../../../../../../store/authSlice";

import { useGetAuth } from "../../../../../../hooks/useGetAuth";
import useGlobalFilter from "../../../../../../hooks/useGlobalFilter";
import { useUploadFiles } from "../../../../../../hooks/useUploadFiles";
import { useGetUserList } from "../../../../../../hooks/useGetUserList";
import { useShortcutManager } from "../../../../../../hooks/useShortcutManager";

import { useTheme } from "../../../../../../ThemeProvider";
import { handleApiResponse } from "../../../../../../utils/handleApiResponse";

import CustomTable from "../../../../../../components/CustomTable";
import CustomInput from "../../../../../../components/CustomInput";
import UploadFiles from "../../../../../../components/UploadFiles";
import SuccessModal from "../../../../../../components/SuccessModal";
import ActionButtons from "../../../../../../components/ActionButtons";
import Breadcrumb from "../../../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../../../components/SelectDropDown";
import CustomButton from "../../../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../../../components/CustomDeleteModal";
import ModalActionButtons from "../../../../../../components/ModalActionButtons";
// Imports End------

// --- Validation Functions ---
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidCellNo = (cellNo) => {
  const phoneRegex = /^((\+92)|(92)|(03))\d{9}$/;
  const strippedCellNo = cellNo.replace(/[\s-]/g, "");
  return phoneRegex.test(strippedCellNo);
};

// ---  Generate Login ID from applicationUser + domain ---
const buildLoginId = (applicationUser, domain) => {
  if (!applicationUser || !domain) return "";

  const cleanName = applicationUser
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");

  return `${cleanName}${domain}`;
};

const UserRegistrationPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const validatedUser = useSelector(selectValidatedUser);
  const domain = validatedUser?.loginDomain || "";

  // UI State
  const [openForm, setOpenForm] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Modal & Feedback State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Modal & Feedback State
  const [editingUserId, setEditingUserId] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState("info");

  const [newUser, setNewUser] = useState({
    userId: 0,
    appClientProductId: 0,
    appUserName: "",
    loginId: "",
    loginPassword: "",
    userEmail: "",
    userCellNo: "",
    applicationUser: "",
    applicationDomain: "",
    userImageURL: "",
    fileBase64String: "",
    fileName: "",
    userRoleRequests: [],
    deletedUserRoleRequests: [],
    rowVersionLong: 0,
    userTypeId: null,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isLocalSaving, setIsLocalSaving] = useState(false);

  const { uploadFiles, isPending: isUploading } = useUploadFiles();

  // Auto-generate loginId when creating or editing a user
  useEffect(() => {
    if (newUser.applicationUser) {
      const generatedLoginId = buildLoginId(newUser.applicationUser, domain);

      setNewUser((prev) => {
        if (prev.loginId === generatedLoginId) return prev;
        return {
          ...prev,
          loginId: generatedLoginId,
          applicationDomain: domain,
        };
      });
    }
  }, [newUser.applicationUser, domain]);

  // Fetch User List
  const {
    data: userList = [],
    isLoading: isLoadingUserList,
    error,
    isError,
  } = useGetUserList();

  // Fetch full user details by ID
  const { data: userById, isLoading: isLoadingUserById } = useQuery({
    queryKey: ["userById", editingUserId],
    enabled: !!editingUserId && !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch(`/api/ADM/User/GetById?Id=${editingUserId}`, {
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      const result = await handleApiResponse(res);
      return result?.data;
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (userById) {
      setSelectedFile(null);
      setNewUser({
        userId: userById.userId || 0,
        appClientProductId: userById.appClientProductId || 0,
        applicationUser: userById.applicationUser || "",
        applicationDomain: userById.applicationDomain || "",
        appUserName: userById.appUserName || "",
        loginId: userById.loginId || "",
        loginPassword: userById.loginPassword || "",
        userImageURL: userById.userImageURL || "",
        userEmail: userById.userEmail || "",
        userCellNo: userById.userCellNo || "",
        fileBase64String: "",
        fileName: "",
        userRoleRequests: userById.userRoleRequests || [],
        deletedUserRoleRequests: [],
        rowVersionLong: userById.rowVersionLong || 0,
        userTypeId: userById.userTypeId || null,
      });
    }
  }, [userById]);

  //  Fetch Role List
  const { data: userRoleList = [], isLoading: roleListIsLoading } = useQuery({
    queryKey: ["userRoleList", loginAccessToken, newUser.userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/ADM/User/GetDetailForUserRole?UserId=${newUser.userId || 0}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );

      const result = await handleApiResponse(res, "Failed to fetch roles");
      if (!result.data || !Array.isArray(result.data)) {
        return [];
      }

      return result.data.map((item, index) => ({
        key: String(item.roleId ?? index),
        sr: index + 1,
        roleId: item.roleId,
        userId: item.userId,
        userRoleId: item.userRoleId,
        roleName: item.roleName,
        isChecked: Boolean(item.isChecked),
        rowVersionLong: item.rowVersionLong,
      }));
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch User Type List
  const { data: userTypeList = [] } = useQuery({
    queryKey: ["userTypeList", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DBO/Data/GetCriteriaForUserType", {
        method: "GET",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      const result = await handleApiResponse(res, "Failed to fetch user types");
      if (!result.data || !Array.isArray(result.data)) return [];

      return result.data.map((item) => ({
        value: item.criteriaSubTypeId,
        label: item.criteriaName,
      }));
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Sync selectedRowKeys when userRoleList loads
  useEffect(() => {
    if (userRoleList.length > 0) {
      const initialSelected = userRoleList
        .filter((item) => item.isChecked)
        .map((item) => item.key);
      setSelectedRowKeys(initialSelected);
    }
  }, [userRoleList]);

  // Save User Mutation
  const { mutate: saveUser, isPending: isSaving } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/User/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, "Failed to save record");
    },

    onSuccess: (result) => {
      toast.success(result?.message);
      queryClient.invalidateQueries({
        queryKey: ["userList", loginAccessToken],
      });
      handleCloseModal();
    },

    onError: (err) => toast.error(err.message || "Error saving record"),
    retry: false,
  });

  const handleSaveUser = async () => {
    setIsLocalSaving(true);

    if (newUser.userEmail && !isValidEmail(newUser.userEmail)) {
      toast.error("Please enter a valid email address.");
      setIsLocalSaving(false);
      return;
    }

    if (!isValidCellNo(newUser.userCellNo)) {
      toast.error(
        "Please enter a valid phone number (e.g., 03xxxxxxxxx or 923xxxxxxxxx).",
      );
      setIsLocalSaving(false);
      return;
    }

    let userImageURL = newUser.userImageURL;
    let userThumbImageURL = newUser.userThumbImageURL;

    if (selectedFile) {
      try {
        const uploadResult = await uploadFiles({
          file: selectedFile,
          pathUrl: "UserImages",
        });
        userImageURL = uploadResult.webPURL;
        userThumbImageURL = uploadResult.thumbnailURL;
      } catch {
        setIsLocalSaving(false);
        return;
      }
    }

    const deletedUserRoleRequests = userRoleList
      .filter((item) => item.userRoleId && !selectedRowKeys.includes(item.key))
      .map((item) => ({
        userRoleId: item.userRoleId,
        userId: Number(newUser.userId) || 0,
        roleId: Number(item.roleId),
        rowVersionLong: item.rowVersionLong || 0,
      }));

    const userRoleRequests = selectedRowKeys.map((key) => {
      const item = userRoleList.find((r) => r.key === key);
      return {
        userRoleId: item?.userRoleId || 0,
        userId: Number(newUser.userId) || 0,
        roleId: Number(item.roleId),
        rowVersionLong: item?.rowVersionLong || 0,
      };
    });

    const payload = {
      userId: Number(newUser.userId) || 0,
      appClientProductId: Number(newUser.appClientProductId) || 0,
      applicationUser: newUser.applicationUser || "",
      applicationDomain: newUser.applicationDomain || "",
      appUserName: newUser.appUserName,
      loginId: newUser.loginId,
      loginPassword: newUser.loginPassword,
      userImageURL: userImageURL || "",
      userThumbImageURL: userThumbImageURL || "",
      userEmail: newUser.userEmail || "",
      userCellNo: newUser.userCellNo || "",
      rowVersionLong: newUser.rowVersionLong || 0,
      userRoleRequests,
      deletedUserRoleRequests,
      userTypeId: newUser.userTypeId || null,
    };

    saveUser(payload);
    setIsLocalSaving(false);
  };

  // Delete User Mutation
  const { mutate: deleteUser } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/ADM/User/DeleteById?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      await handleApiResponse(res, "Failed to delete user");
      return id;
    },
    onSuccess: () => {
      setSuccessModalOpen(true);
      queryClient.invalidateQueries({
        queryKey: ["userList", loginAccessToken],
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleConfirmDelete = () => {
    if (confirmModal.id) {
      setDeletingId(confirmModal.id);
      deleteUser(confirmModal.id, {
        onSettled: () => {
          setDeletingId(null);
          setConfirmModal({ open: false, id: null, name: "" });
        },
      });
    }
  };

  const handleCancelDelete = () =>
    setConfirmModal({ open: false, id: null, name: "" });

  const handleCloseModal = () => {
    setOpenForm(false);
    setIsLocalSaving(false);
    setSelectedFile(null);
    setNewUser({
      userId: 0,
      appClientProductId: 0,
      appUserName: "",
      loginId: "",
      loginPassword: "",
      userImageURL: "",
      userEmail: "",
      userCellNo: "",
      applicationUser: "",
      applicationDomain: "",
      userThumbImageURL: "",
      userRoleRequests: [],
      deletedUserRoleRequests: [],
      rowVersionLong: 0,
      userTypeId: null,
    });
    setSelectedRowKeys([]);
    setEditingUserId(null);
    setActiveFormTab("info");
  };

  const firstInputRef = useShortcutManager({
    isOpen: openForm,
    onOpen: () => setOpenForm(true),
    onClose: handleCloseModal,
    onSubmit: handleSaveUser,
    onEditLastAdded: () => {
      const lastUser = filteredData[0];
      if (lastUser) {
        setEditingUserId(lastUser.userId);
        setOpenForm(true);
      }
    },
    onDeleteLastAdded: () => {
      const lastUser = filteredData[0];
      if (lastUser) {
        handleDeleteClick(lastUser.key, lastUser.appUserName);
      }
    },
  });

  const handleDeleteClick = (id, name) =>
    setConfirmModal({ open: true, id, name });

  const isFormValid = () => {
    return (
      newUser.applicationUser &&
      newUser.appUserName &&
      newUser.loginId &&
      newUser.loginPassword &&
      newUser.userCellNo?.trim()
    );
  };

  // Filtered Data For Table
  const filteredData = useGlobalFilter(userList, globalSearch, [
    "sr",
    "appUserName",
    "loginId",
    "applicationUser",
    "applicationDomain",
    "createdOn",
    "userEmail",
    "userCellNo",
    "userTypeName",
  ]);

  const modalData = useGlobalFilter(userRoleList, modalSearch, [
    "sr",
    "roleName",
  ]);

  //  Table Columns
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 60,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Image",
      dataIndex: "userImageURL",
      width: 80,
      align: "center",
      render: (_, record) =>
        record.userThumbImageURL || record.userImageURL ? (
          <img
            src={record.userThumbImageURL || record.userImageURL}
            alt="Category"
            className="w-24 h-10 object-contain rounded cursor-zoom-in"
            onClick={() => window.open(record.userImageURL, "_blank")}
          />
        ) : (
          <span className="text-gray-500 text-center">No Image</span>
        ),
    },
    {
      title: "User Type",
      dataIndex: "userTypeName",
      sorter: (a, b) =>
        (a.userTypeName || "").localeCompare(b.userTypeName || ""),
      render: (text) => text || "N/A",
    },
    {
      title: "User Name",
      dataIndex: "appUserName",
      sorter: (a, b) => a.appUserName.localeCompare(b.appUserName),
    },
    {
      title: "Login Id",
      dataIndex: "loginId",
      sorter: (a, b) => a.loginId.localeCompare(b.loginId),
    },
    {
      title: "Email",
      dataIndex: "userEmail",
      render: (text) => text || "N/A",
      sorter: (a, b) => (a.userEmail || "").localeCompare(b.userEmail || ""),
    },
    {
      title: "Cell No",
      dataIndex: "userCellNo",
      sorter: (a, b) => a.userCellNo.localeCompare(b.userCellNo),
      render: (text) => <div className="text-right">{text}</div>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          isEditLoading={isLoadingUserById && editingUserId === record.userId}
          isDeleteLoading={deletingId === record.key}
          darkMode={isDarkMode}
          onEdit={(rec) => {
            setEditingUserId(rec.userId);
            setOpenForm(true);
          }}
          onDelete={(rec) => handleDeleteClick(rec.key, rec.appUserName)}
        />
      ),
    },
  ];

  const modalColumns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 80,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Role",
      dataIndex: "roleName",
      sorter: (a, b) => a.roleName.localeCompare(b.roleName),
    },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />

        {openForm ? (
          <ModalActionButtons
            onCancel={handleCloseModal}
            onSubmit={handleSaveUser}
            isDarkMode={isDarkMode}
            isSubmitting={isLocalSaving || isSaving || isUploading}
            isDisabled={!isFormValid() || activeFormTab !== "info"}
            submitText={newUser.userId ? "Update User" : "Save User"}
            className="mt-0!"
          />
        ) : (
          <CustomButton
            onClick={() => setOpenForm(true)}
            icon={Redo}
            isDarkMode={isDarkMode}
            title="Add New User"
            disabled={isLoadingUserList}
            className={isLoadingUserList ? "opacity-50 cursor-not-allowed" : ""}
          />
        )}
      </div>

      {/* Table */}
      {!openForm && (
        <CustomTable
          error={error}
          isError={isError}
          loading={isLoadingUserList}
          columns={columns}
          dataSource={filteredData}
          rowKey="userId"
          isDarkMode={isDarkMode}
          globalSearch={globalSearch}
          onSearchChange={setGlobalSearch}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      )}

      {openForm && (
        <div className="my-5 rounded-xl">
          <div
            className={`p-3 sm:p-6 rounded-lg border ${
              isDarkMode
                ? "bg-[#141025] border-gray-800"
                : "bg-white border-gray-200"
            }`}
          >
            <h2
              className={`flex items-center gap-2 text-lg font-semibold mb-4 ${
                isDarkMode ? "text-purple-400" : "text-primary-600"
              }`}
            >
              <Edit size={18} />
              {newUser.userId ? "Edit User" : "Add New User"}
            </h2>
            <>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Form Fields Section */}
                <div className="w-full md:w-2/3 grid grid-cols-2 sm:grid-cols-2 gap-3 space-y-2">
                  <div className="col-span-2">
                    <SelectDropDown
                      ref={firstInputRef}
                      required
                      label="User Type"
                      value={newUser.userTypeId}
                      onChange={(value) =>
                        setNewUser({
                          ...newUser,
                          userTypeId: value,
                        })
                      }
                      options={userTypeList}
                      allowClear={false}
                    />
                  </div>

                  <CustomInput
                    label="Application User"
                    value={newUser.applicationUser}
                    required
                    placeholder="Enter application user"
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        applicationUser: e.target.value,
                      })
                    }
                  />

                  <CustomInput
                    label="Login ID"
                    value={newUser.loginId}
                    disabled
                    required
                    placeholder="Enter login ID"
                    onChange={(e) =>
                      setNewUser({ ...newUser, loginId: e.target.value })
                    }
                  />

                  <CustomInput
                    label="User Display Name"
                    value={newUser.appUserName}
                    placeholder="Enter user name"
                    required
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        appUserName: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Password"
                    type="password"
                    passwordClassName="top-5"
                    value={newUser.loginPassword}
                    required={!newUser.userId}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        loginPassword: e.target.value,
                      })
                    }
                    placeholder="Enter password"
                  />

                  <CustomInput
                    label="Email"
                    type="email"
                    value={newUser.userEmail}
                    placeholder="Enter email"
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        userEmail: e.target.value,
                      })
                    }
                  />

                  <CustomInput
                    label="Phone"
                    required
                    inputMode="numeric"
                    placeholder="03xx xxxxxxx"
                    value={newUser.userCellNo}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        userCellNo: e.target.value,
                      })
                    }
                  />

                  <div className="hidden">
                    <CustomInput
                      label="Application Domain"
                      value={domain}
                      disabled
                      placeholder="Enter application domain"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <div className="w-full" style={{ height: "310px" }}>
                    <UploadFiles
                      label=""
                      value={newUser?.userImageURL}
                      imageUrlKey="userImageURL"
                      darkMode={isDarkMode}
                      previewHeight={260}
                      onChange={(val) => {
                        setSelectedFile(val.file);
                        setNewUser((prev) => ({
                          ...prev,
                          fileName: val.fileName,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Assign User Roles
                  </h3>
                </div>
                <CustomTable
                  loading={roleListIsLoading}
                  columns={modalColumns}
                  dataSource={modalData}
                  rowKey="key"
                  isDarkMode={isDarkMode}
                  globalSearch={modalSearch}
                  onSearchChange={setModalSearch}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                  }}
                  onRow={(record) => ({
                    onClick: () => {
                      setSelectedRowKeys((prev) =>
                        prev.includes(record.key)
                          ? prev.filter((k) => k !== record.key)
                          : [...prev, record.key],
                      );
                    },
                  })}
                  pagination={{
                    pageSize: 5,
                  }}
                />
              </div>
            </>
          </div>
        </div>
      )}

      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        title={confirmModal.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <SuccessModal
        open={successModalOpen}
        message="User deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default UserRegistrationPage;
