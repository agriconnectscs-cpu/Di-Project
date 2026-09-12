import {Table} from 'antd';
import toast from 'react-hot-toast';
import {useEffect, useState} from 'react';
import {motion as Motion, AnimatePresence} from 'framer-motion';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Trash2, Redo, Edit, Loader, Search, AlertCircle} from 'lucide-react';

import {useTheme} from '../../../../ThemeProvider';
import {handleApiResponse} from '../../../../utils/handleApiResponse';

import {usePagePermissions} from '../../../../permissions';

import {useGetAuth} from '../../../../hooks/useGetAuth';
import {useGetUnits} from '../../../../hooks/useGetUnits';
import {useCloseOnEscape} from '../../../../hooks/useCloseOnEscape';
import {useGetProductTypes} from '../../../../hooks/useGetProductTypes';
import {useGetProductCategories} from '../../../../hooks/useGetProductCategories';
import {useGetProductSubCategories} from '../../../../hooks/useGetProductSubCategories';

import SearchBar from '../../../../components/SearchBar';
import CustomInput from '../../../../components/CustomInput';
import SuccessModal from '../../../../components/SuccessModal';
import Breadcrumb from '../../../../components/common/Breadcrumb';
import SelectDropDown from '../../../../components/SelectDropDown';
import TableErrorState from '../../../../components/TableErrorState';
import CustomButton from '../../../../components/common/CustomButton';
import CustomDeleteModal from '../../../../components/CustomDeleteModal';
import ModalActionButtons from '../../../../components/ModalActionButtons';
import ActionButtons from '../../../../components/ActionButtons';
import ProductSettingsModal from './ProductSettingsModal';
// Imports End----------------

const ProductRegPageV1 = () => {
  const queryClient = useQueryClient();

  const {loginAccessToken} = useGetAuth();
  const {isDarkMode} = useTheme();

  const {canAdd, canEdit, canDelete, permission} = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedProductForSetting, setSelectedProductForSetting] =
    useState(null);
  const [confirmModal, setConfirmModal] = useState({open: false, id: null});
  const [deletingId, setDeletingId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchedHsCode, setSearchedHsCode] = useState('');

  const [newProduct, setNewProduct] = useState({
    productId: '',
    productName: '',
    productCode: '',
    productTypeId: '',
    productTypeName: '',
    productCategoryId: '',
    productCategoryName: '',
    productSubCategoryId: '',
    productSubCategoryName: '',
    productStyleId: null,
    productRefNo: '',
    orderUnitId: '',
    seqNo: 0,
  });

  //  Fetch Data
  const {data: units = []} = useGetUnits({
    enabled: !!addModal,
    queryKey: ['units', loginAccessToken, addModal],
  });

  const {productTypes = []} = useGetProductTypes({
    enabled: !!addModal,
  });
  const {data: productCategories = []} = useGetProductCategories({
    enabled: !!addModal,
  });
  const {data: productSubCategories = []} = useGetProductSubCategories({
    enabled: !!addModal,
  });

  const {
    data: products = [],
    isLoading: productIsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/DI/Product/GetList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
          accept: 'text/plain',
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res);
      return result.data || [];
    },

    enabled: !!loginAccessToken,

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  //  Mapped Products
  const mappedProducts = products
    ? products.map((item, i) => ({
        ...item,
        key: item.productId || i,
        sr: i + 1,
        orderUnitName: item.unitShortName || 'N/A',
      }))
    : [];

  // Fetch single product by ID
  const {data: productById, isLoading: productIdisLoading} = useQuery({
    queryKey: ['productById', newProduct.productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/DI/Product/GetById?Id=${newProduct.productId}`,
        {
          headers: {
            accept: 'text/plain',
            Authorization: `Bearer ${loginAccessToken}`,
          },
        }
      );

      return handleApiResponse(res, 'Failed to fetch product details');
    },
    enabled: !!newProduct.productId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (productById?.data) {
      const p = productById.data;

      setNewProduct((prev) => ({
        ...prev,
        productName: p.productName || '',
        productCode: p.productCode || '',
        productRefNo: p.productRefNo || '',
        productTypeId: Number(p.productTypeId) || '',
        productCategoryId: Number(p.productCategoryId) || '',
        productSubCategoryId: Number(p.productSubCategoryId) || '',
        productTypeName: p.productTypeName || '',
        productCategoryName: p.productCategoryName || '',
        productSubCategoryName: p.productSubCategoryName || '',
        productStyleId: p.productStyleId || null,
        orderUnitId: p.orderUnitId || '',
      }));

      setAddModal(true);
    }
  }, [productById]);

  // Fetch Auto Code
  const {data: autoCodeResponse, isLoading: autoCodeIsLoading} = useQuery({
    queryKey: [
      'productAutoCode',
      newProduct.productSubCategoryId,
      loginAccessToken,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/DI/Product/GetAutoProductCode?ProductSubCategoryId=${newProduct.productSubCategoryId}`,
        {
          headers: {
            accept: 'text/plain',
            Authorization: `Bearer ${loginAccessToken}`,
          },
        }
      );
      const result = await handleApiResponse(res, 'Failed to fetch auto code');
      return result.data;
    },
    enabled:
      !!loginAccessToken &&
      addModal &&
      !!newProduct.productSubCategoryId &&
      !newProduct.productId,

    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (autoCodeResponse) {
      setNewProduct((prev) => ({...prev, productCode: autoCodeResponse}));
    }
  }, [autoCodeResponse]);

  // Fetch HS Codes
  const {data: hsCodesList = []} = useQuery({
    queryKey: ['hsCodesList'],
    queryFn: async () => {
      const res = await fetch('/api/DI/FBRData/GetItemDescCodes', {
        headers: {
          accept: 'text/plain',
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      const result = await handleApiResponse(res, 'Failed to fetch HS Codes');
      return result.data || [];
    },
    enabled: !!loginAccessToken && addModal,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const matchedHsCode = hsCodesList.find(
    (item) => item.hS_CODE === searchedHsCode
  );

  //  Save / Update Products Mutation
  const {mutate: saveProduct, isPending} = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/DI/Product/Save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, 'Failed to save product');
    },

    onSuccess: (result) => {
      toast.success(result?.message || 'Product saved successfully');
      queryClient.invalidateQueries(['products']);
      handleCloseModal();
    },

    onError: (err) => toast.error(err.message || 'Error saving record'),
    retry: false,
  });

  const handleAddProduct = () => {
    const {
      productId,
      productCode,
      productName,
      productCategoryId,
      productTypeId,
      productRefNo,
      productSubCategoryId,
      orderUnitId,
    } = newProduct;

    if (
      !productCode ||
      !productName ||
      !productCategoryId ||
      !productTypeId ||
      !productSubCategoryId ||
      !productRefNo ||
      !orderUnitId
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    saveProduct({
      productId: productId || 0,
      productCode,
      productRefNo,
      productName,
      productTypeId: Number(productTypeId),
      productCategoryId: Number(productCategoryId),
      productSubCategoryId: Number(productSubCategoryId),
      orderUnitId: Number(orderUnitId),
      productStyleId: newProduct.productStyleId || null,
    });
  };

  //  Delete Product Mutation
  const {mutate: deleteProduct} = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/DI/Product/DeleteById?id=${id}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${loginAccessToken}`},
      });

      await handleApiResponse(res, 'Failed to delete product');
      return id;
    },

    onSuccess: (deletedId) => {
      setSuccessModalOpen(true);
      queryClient.setQueryData(['products'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((product) => product.productId !== deletedId);
      });
    },

    onError: (err) => toast.error(err.message),
  });

  // Bulk Delete Product Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (selectedIds) => {
      const payload = selectedIds.map((id) => ({
        productId: id,
        productTypeId: 0,
        productCategoryId: 0,
        productSubCategoryId: 0,
        productName: '',
        productCategoryName: '',
        productSubCategoryName: '',
        productCode: '',
        productRefNo: '',
        seqNo: 0,
        rowVersionLong: 0,
        ProductClientAreaRequests: [],
        DeletedProductClientAreaRequests: [],
      }));

      const res = await fetch('/api/DI/Product/DeleteAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      await handleApiResponse(res, 'Failed to delete products');
      return selectedIds;
    },

    onMutate: () => setBulkDeleting(true),

    onSuccess: (deletedIds) => {
      setBulkDeleteModal(false);
      queryClient.setQueryData(['products'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(
          (product) => !deletedIds.includes(product.productId)
        );
      });

      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
    },

    onError: (err) => toast.error(err.message),
    onSettled: () => setBulkDeleting(false),
  });

  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, 'No permission to delete products')) {
      setBulkDeleteModal(false);
      return;
    }
    bulkDeleteMutation.mutate(selectedRowKeys);
  };

  /** Handlers */
  const handleDeleteClick = (id) => setConfirmModal({open: true, id});

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    setDeletingId(confirmModal.id);
    deleteProduct(confirmModal.id, {
      onSettled: () => setDeletingId(null),
    });
    setConfirmModal({open: false, id: null});
  };

  const handleCancelDelete = () => setConfirmModal({open: false, id: null});

  const handleCloseModal = () => {
    setAddModal(false);
    setNewProduct({
      productId: '',
      productCode: '',
      productRefNo: '',
      productName: '',
      productTypeId: '',
      productTypeName: '',
      productCategoryId: '',
      productCategoryName: '',
      productSubCategoryId: '',
      productSubCategoryName: '',
      productStyleId: null,
      orderUnitId: '',
      seqNo: 0,
    });
    setSearchedHsCode('');
  };

  useCloseOnEscape(addModal, handleCloseModal);

  // Disable scroll when modal is open
  useEffect(() => {
    if (addModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [addModal]);

  const filteredData = mappedProducts?.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      (item.productName || '').toLowerCase().includes(search) ||
      (item.productCategoryName || '').toLowerCase().includes(search) ||
      (item.productSubCategoryName || '').toLowerCase().includes(search) ||
      (item.productCode || '').toLowerCase().includes(search) ||
      (item.productRefNo || '').toLowerCase().includes(search)
    );
  });

  //  Table Columns
  const columns = [
    {
      title: 'Sr.',
      dataIndex: 'sr',
      width: 70,
      sorter: (a, b) => a.sr - b.sr,
      className: 'text-center',
    },
    {
      title: 'Code',
      dataIndex: 'productCode',
      sorter: (a, b) => a.productCode.localeCompare(b.productCode),
      width: 125,
      ellipsis: true,
      className: 'text-center',
    },
    {
      title: 'HS Code',
      dataIndex: 'productRefNo',
      sorter: (a, b) => a.productRefNo.localeCompare(b.productRefNo),
      width: 90,
      ellipsis: true,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      sorter: (a, b) => a.productName.localeCompare(b.productName),
      ellipsis: true,
      width: 280,
      render: (text) => <span title={text}>{text}</span>,
    },
    {
      title: 'Unit',
      dataIndex: 'orderUnitName',
      sorter: (a, b) => a.orderUnitName.localeCompare(b.orderUnitName),
      ellipsis: true,
      width: 80,
    },
    {
      title: 'Category',
      dataIndex: 'productCategoryName',
      width: 200,
      sorter: (a, b) =>
        a.productCategoryName.localeCompare(b.productCategoryName),
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium text-left truncate max-w-50">
            {record.productCategoryName || 'N/A'}
          </span>
          <span className="text-xs text-gray-500 text-left truncate max-w-50 -mt-1">
            {record.productSubCategoryName || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <ActionButtons
          record={record}
          darkMode={isDarkMode}
          isEditLoading={
            productIdisLoading && newProduct.productId === record.productId
          }
          isDeleteLoading={deletingId === record.key}
          onSettings={(rec) => {
            setSelectedProductForSetting(rec);
            setSettingsModalOpen(true);
          }}
          onEdit={(rec) => {
            if (!permission(canEdit, 'No permission to edit product')) return;
            setNewProduct((prev) => ({
              ...prev,
              productId: rec.productId,
            }));
          }}
          onDelete={(rec) => {
            if (!permission(canDelete, 'No permission to delete product'))
              return;
            handleDeleteClick(rec.key);
          }}
        />
      ),
    },
  ];

  // Filter Sub Categories based on selected Category
  const filteredSubCategories = productSubCategories?.filter(
    (sub) => sub.productCategoryId === Number(newProduct.productCategoryId)
  );

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200  ${
          isDarkMode ? ' bg-[#141025]' : 'bg-gray-100'
        }`}
      >
        {/* 1 */}
        <Breadcrumb />

        {/* 2 */}
        <CustomButton
          onClick={() => {
            if (!permission(canAdd, 'No permission to add new product')) return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add New Product"
          disabled={productIsLoading}
          className={productIsLoading ? 'opacity-50 cursor-not-allowed' : ''}
        />
      </div>

      {isError && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <TableErrorState isError={isError} message={error?.message} />
        </div>
      )}

      {!isError && (
        <Table
          loading={productIsLoading}
          columns={columns}
          dataSource={filteredData}
          scroll={{x: true}}
          bordered
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              name: `product-${record.key}`,
              id: `product-${record.key}`,
            }),
          }}
          rowClassName={() =>
            'hover:bg-[#1b122b]/30 !h-10 [&>td]:!py-1.5 [&>td]:!px-2'
          }
          pagination={{
            total: filteredData?.length || 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 10,
          }}
          title={() => (
            <div className="flex items-center justify-between">
              <div
                className={`text-md mt-2 sm:mt-1 font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Total Records: {filteredData?.length || 0}
              </div>

              <SearchBar
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Search Products..."
              />
            </div>
          )}
          footer={() =>
            selectedRowKeys.length > 0 && (
              <div className="flex justify-end">
                <CustomButton
                  icon={Trash2}
                  onClick={() => {
                    if (
                      !permission(canDelete, 'No permission to delete products')
                    )
                      return;
                    setBulkDeleteModal(true);
                  }}
                  disabled={bulkDeleting}
                  isDarkMode={isDarkMode}
                  title={`Delete Selected (${selectedRowKeys.length})`}
                  className="my-2"
                />
              </div>
            )
          }
        />
      )}

      <AnimatePresence>
        {addModal && (
          <Motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
              isDarkMode ? 'bg-black/50' : 'bg-gray-900/10'
            }`}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
          >
            <Motion.div
              className={`relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border px-5 sm:px-6 py-8 select-none ${
                isDarkMode
                  ? 'bg-[#1A162B] text-white border-purple-600/10'
                  : 'bg-white text-gray-800 border-gray-200'
              }`}
              initial={{scale: 0.9, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              exit={{scale: 0.9, opacity: 0}}
            >
              <h2
                className={`flex items-center gap-2 text-lg font-semibold mb-5 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-700'
                }`}
              >
                <Edit size={18} />
                {newProduct.productId ? 'Edit Product' : 'Add Product'}
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  <div className="col-span-2 lg:col-span-1">
                    <SelectDropDown
                      id="productType"
                      label="Product Type"
                      value={newProduct.productTypeId}
                      placeholder="Choose type"
                      required
                      options={productTypes.map((type) => ({
                        label: type.criteriaName,
                        value: type.criteriaSubTypeId,
                      }))}
                      onChange={(value) =>
                        setNewProduct({...newProduct, productTypeId: value})
                      }
                    />
                  </div>

                  <div className="col-span-1 lg:col-span-1 mt-1 sm:mt-0">
                    <SelectDropDown
                      id="productCategoryId"
                      label="Category"
                      placeholder="Choose category"
                      value={newProduct.productCategoryId}
                      required
                      options={productCategories.map((type) => ({
                        label: type.productCategoryName,
                        value: type.productCategoryId,
                      }))}
                      onChange={(value) =>
                        setNewProduct({
                          ...newProduct,
                          productCategoryId: value,
                          productSubCategoryId: '',
                        })
                      }
                    />
                  </div>

                  <div className="col-span-1 lg:col-span-1 mt-1 sm:mt-0">
                    <SelectDropDown
                      id="productSubCategoryId"
                      label="Sub-Category"
                      placeholder="Choose sub-category"
                      value={newProduct.productSubCategoryId}
                      required
                      options={filteredSubCategories.map((sub) => ({
                        label: sub.productSubCategoryName,
                        value: sub.productSubCategoryId,
                      }))}
                      onChange={(value) =>
                        setNewProduct({
                          ...newProduct,
                          productSubCategoryId: value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <CustomInput
                    id="productName"
                    label="Product Name"
                    value={newProduct.productName}
                    placeholder="Enter full product name"
                    required
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        productName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  <div className="col-span-1 lg:col-span-1">
                    <CustomInput
                      id="productCode"
                      label="Product Code (SKU)"
                      placeholder="e.g. 00-001-0002"
                      value={newProduct.productCode}
                      isLoading={autoCodeIsLoading}
                      disabled={autoCodeIsLoading}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          productCode: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="relative group col-span-1 lg:col-span-1">
                    <CustomInput
                      id="productRefNo"
                      label="HS Code"
                      value={newProduct.productRefNo}
                      placeholder="e.g. 0000.00"
                      required
                      inputClassName="pr-12"
                      onChange={(e) => {
                        setNewProduct({
                          ...newProduct,
                          productRefNo: e.target.value,
                        });
                        if (searchedHsCode) setSearchedHsCode('');
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setSearchedHsCode(newProduct.productRefNo)}
                      className={`absolute right-2 bottom-1.5 h-7 w-7 rounded-full transition-all duration-300 flex items-center justify-center outline-none
                        ${
                          !newProduct.productRefNo
                            ? 'cursor-not-allowed opacity-50'
                            : isDarkMode
                              ? 'text-purple-300 hover:bg-purple-500/30 focus:bg-purple-500/30 cursor-pointer active:scale-95'
                              : 'text-purple-600 hover:bg-purple-200 focus:bg-purple-200 cursor-pointer active:scale-95'
                        }
                      `}
                      disabled={!newProduct.productRefNo}
                      title="Search HS Code Description"
                    >
                      <Search size={18} />
                    </button>
                  </div>

                  <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                    <SelectDropDown
                      id="orderUnitId"
                      label="Order Unit"
                      placeholder="Choose unit"
                      value={newProduct.orderUnitId}
                      required
                      options={units.map((u) => ({
                        label: u.unitName,
                        value: u.unitId,
                      }))}
                      onChange={(value) =>
                        setNewProduct({
                          ...newProduct,
                          orderUnitId: value,
                        })
                      }
                    />
                  </div>
                </div>

                {searchedHsCode && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label
                      className={`block text-xs font-semibold mb-1 ml-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      HS Code Description
                    </label>
                    <div
                      className={`p-3 rounded-xl border text-sm leading-relaxed flex items-start gap-2 ${
                        matchedHsCode
                          ? isDarkMode
                            ? 'bg-purple-900/10 border-purple-500/20 text-gray-200'
                            : 'bg-purple-50 border-purple-200 text-gray-700'
                          : isDarkMode
                            ? 'bg-red-900/10 border-red-500/20 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-600'
                      }`}
                    >
                      {!matchedHsCode && (
                        <div className="mt-0.5">
                          <AlertCircle size={16} />
                        </div>
                      )}
                      {matchedHsCode
                        ? matchedHsCode.description
                        : 'Description not available for this Code.'}
                    </div>
                  </div>
                )}
              </div>

              <ModalActionButtons
                onCancel={handleCloseModal}
                onSubmit={handleAddProduct}
                isDarkMode={isDarkMode}
                isSubmitting={isPending}
                submitText={newProduct.productId ? 'Update' : 'Save'}
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Single Delete Modal */}
      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Bulk Delete Modal */}
      <CustomDeleteModal
        open={bulkDeleteModal}
        loading={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      <SuccessModal
        open={successModalOpen}
        message="Product deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />

      <ProductSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          setSelectedProductForSetting(null);
        }}
        product={selectedProductForSetting}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default ProductRegPageV1;
