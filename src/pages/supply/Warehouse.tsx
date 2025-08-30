import { useState, useEffect} from 'react'; 
import { Package, Search, Plus, Eye, Edit, Trash2, X, Save, ShoppingCart, FileText, Download, Loader2, Printer } from 'lucide-react';
import { warehouseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/utils/exportUtils';
export default function Warehouse() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [showDispenseDetailsModal, setShowDispenseDetailsModal] = useState(false);
  const [selectedDispenseOrder, setSelectedDispenseOrder] = useState<any>(null);

const domainName = "https://your-domain.com"; 



const openImageModal = (src) => {
  setModalSrc(src);
  setModalVisible(true);
};

const closeImageModal = () => {
  setModalVisible(false);
};
  // Add Item Form State
  const [addFormData, setAddFormData] = useState({
    itemNumber: '',
    itemName: '',
    receivedQty: '',
    issuedQty: '',
    availableQty: '',
    minQuantity: '',
    purchaseValue: '',
    deliveryDate: '',
    supplierName: '',
    beneficiaryFacility: '',
    notes: ''
  });

  // Edit Item Form State
  const [editFormData, setEditFormData] = useState({
    itemNumber: '',
    itemName: '',
    receivedQty: '',
    issuedQty: '',
    availableQty: '',
    minQuantity: '',
    purchaseValue: '',
    deliveryDate: '',
    supplierName: '',
    beneficiaryFacility: '',
    notes: ''
  });

  // Withdraw Order Form State
  const [withdrawFormData, setWithdrawFormData] = useState({
    itemNumber: '',
    itemName: '',
    beneficiaryFacility: '',
    requestStatus: 'مفتوح تحت الاجراء',
    withdrawQty: '',
    withdrawDate: '',
    recipientName: '',
    recipientContact: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [inventoryResponse, facilitiesResponse] = await Promise.all([
          warehouseApi.getInventory(),
          reportsApi.getFacilities()
        ]);

        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }

        if (facilitiesResponse.success) {
          setFacilities(facilitiesResponse.data || []);
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "فشل في تحميل بيانات المستودع",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredItems = inventoryItems.filter(item =>
    item.itemName?.includes(searchTerm) || item.itemNumber?.includes(searchTerm)
  );

  // Calculate total inventory value using corrected formula
  const calculateTotalInventoryValue = () => {
    return inventoryItems.reduce((sum, item) => {
      const purchaseValue = parseFloat(item.purchaseValue) || 0;
      const receivedQty = parseFloat(item.receivedQty) || 1; // Avoid division by zero
      const availableQty = parseFloat(item.availableQty) || 0;
      
      // Calculate unit price and multiply by available quantity
      const unitPrice = purchaseValue / receivedQty;
      const itemValue = unitPrice * availableQty;
      
      return sum + itemValue;
    }, 0);
  };

  // Calculate available quantity automatically
  const calculateAvailableQty = (received: string, issued: string) => {
    const receivedNum = parseFloat(received) || 0;
    const issuedNum = parseFloat(issued) || 0;
    return Math.max(0, receivedNum - issuedNum);
  };

  // Print withdrawal order function
  const handlePrintWithdrawalOrder = (order: any) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>أمر صرف رقم ${order.orderNumber}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              direction: rtl; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #333; 
              margin-bottom: 10px; 
              font-size: 28px;
              font-weight: bold;
            }
            .header p { 
              color: #666; 
              font-size: 14px;
            }
            .order-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-item {
              background: white;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #ddd;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .info-value {
              font-size: 16px;
              color: #333;
            }
            .status {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
            }
            .status-completed {
              background-color: #d4edda;
              color: #155724;
            }
            .status-pending {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-rejected {
              background-color: #f8d7da;
              color: #721c24;
            }
            .notes-section {
              margin-top: 30px;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>أمر صرف من المستودع</h1>
            <p>رقم الأمر: <strong>${order.orderNumber || 'غير محدد'}</strong></p>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </div>
          
          <div class="order-info">
            <h2 style="margin-top: 0; color: #333;">معلومات الصنف</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">رقم الصنف:</div>
                <div class="info-value">${selectedItem?.itemNumber || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">اسم الصنف:</div>
                <div class="info-value">${selectedItem?.itemName || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الشركة الموردة:</div>
                <div class="info-value">${selectedItem?.supplierName || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الكمية المتاحة قبل الصرف:</div>
                <div class="info-value">${selectedItem?.availableQty || 0}</div>
              </div>
            </div>
          </div>

          <div class="order-info">
            <h2 style="margin-top: 0; color: #333;">تفاصيل الصرف</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">الجهة المستفيدة:</div>
                <div class="info-value">${order.beneficiaryFacility || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الكمية المصروفة:</div>
                <div class="info-value">${order.withdrawQty || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاريخ الصرف:</div>
                <div class="info-value">${order.withdrawDate || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">حالة الطلب:</div>
                <div class="info-value">
                  <span class="status ${
                    order.requestStatus === 'تم الصرف' ? 'status-completed' :
                    order.requestStatus === 'مرفوض' ? 'status-rejected' : 'status-pending'
                  }">
                    ${order.requestStatus || 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="order-info">
            <h2 style="margin-top: 0; color: #333;">معلومات المستلم</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">اسم المستلم:</div>
                <div class="info-value">${order.recipientName || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">رقم التواصل:</div>
                <div class="info-value">${order.recipientContact || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاريخ الإنشاء:</div>
                <div class="info-value">${order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">آخر تحديث:</div>
                <div class="info-value">${order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
              </div>
            </div>
          </div>

          ${order.notes ? `
            <div class="notes-section">
              <h3 style="margin-top: 0; color: #333;">ملاحظات:</h3>
              <p style="margin: 0; background: white; padding: 15px; border-radius: 6px; border: 1px solid #ddd;">
                ${order.notes}
              </p>
            </div>
          ` : ''}

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المستودع</p>
            <p>هذا المستند صالح للطباعة والأرشفة</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

      toast({
        title: "تم التحضير للطباعة",
        description: "تم تحضير أمر الصرف للطباعة بنجاح",
      });
    } catch (error) {
      console.error('Print failed:', error);
      toast({
        title: "خطأ في الطباعة",
        description: "فشل في تحضير أمر الصرف للطباعة",
        variant: "destructive",
      });
    }
  };

  // Form validation
  const validateAddForm = () => {
    const errors: any = {};
    
    if (!addFormData.itemNumber.trim()) errors.itemNumber = 'رقم الصنف مطلوب';
    if (!addFormData.itemName.trim()) errors.itemName = 'اسم الصنف مطلوب';
    if (!addFormData.receivedQty || parseFloat(addFormData.receivedQty) < 0) errors.receivedQty = 'الكمية المستلمة مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!addFormData.minQuantity || parseFloat(addFormData.minQuantity) < 0) errors.minQuantity = 'كمية الحد الأدنى مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!addFormData.purchaseValue || parseFloat(addFormData.purchaseValue) < 0) errors.purchaseValue = 'قيمة الشراء مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!addFormData.deliveryDate) errors.deliveryDate = 'تاريخ التوريد مطلوب';
    if (!addFormData.supplierName.trim()) errors.supplierName = 'اسم الشركة الموردة مطلوب';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: any = {};
    if (!editFormData.itemNumber.trim()) errors.itemNumber = 'رقم الصنف مطلوب';
    if (!editFormData.itemName.trim()) errors.itemName = 'اسم الصنف مطلوب';
    if (!editFormData.receivedQty || parseFloat(editFormData.receivedQty) < 0) errors.receivedQty = 'الكمية المستلمة مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!editFormData.minQuantity || parseFloat(editFormData.minQuantity) < 0) errors.minQuantity = 'كمية الحد الأدنى مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!editFormData.purchaseValue || parseFloat(editFormData.purchaseValue) < 0) errors.purchaseValue = 'قيمة الشراء مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!editFormData.deliveryDate) errors.deliveryDate = 'تاريخ التوريد مطلوب';
    if (!editFormData.supplierName.trim()) errors.supplierName = 'اسم الشركة الموردة مطلوب';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateWithdrawForm = () => {
    const errors: any = {};


    if (!withdrawFormData.beneficiaryFacility) errors.beneficiaryFacility = 'الجهة المستفيدة مطلوبة';
    if (!withdrawFormData.withdrawQty || parseFloat(withdrawFormData.withdrawQty) <= 0) errors.withdrawQty = 'الكمية المصروفة مطلوبة ويجب أن تكون أكبر من صفر';
    if (!withdrawFormData.withdrawDate) errors.withdrawDate = 'تاريخ الصرف مطلوب';
    if (!withdrawFormData.recipientName.trim()) errors.recipientName = 'اسم المستلم مطلوب';
    if (!withdrawFormData.recipientContact.trim()) errors.recipientContact = 'رقم التواصل مطلوب';
    
    // Validate quantity doesn't exceed available
    const maxQty = selectedItem?.availableQty || 0;
    if (parseFloat(withdrawFormData.withdrawQty) > maxQty) {
      errors.withdrawQty = `الكمية المصروفة لا يمكن أن تتجاوز الكمية المتاحة (${maxQty})`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available quantity
      if (field === 'receivedQty' || field === 'issuedQty') {
        updated.availableQty = calculateAvailableQty(
          field === 'receivedQty' ? value : prev.receivedQty,
          field === 'issuedQty' ? value : prev.issuedQty
        ).toString();
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleWithdrawInputChange = (field: string, value: string) => {
    setWithdrawFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available quantity
      if (field === 'receivedQty' || field === 'issuedQty') {
        updated.availableQty = calculateAvailableQty(
          field === 'receivedQty' ? value : prev.receivedQty,
          field === 'issuedQty' ? value : prev.issuedQty
        ).toString();
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

const handleAddSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateAddForm()) {
    return;
  }
  
  try {
    setLoadingAction(true);
    
    const formData = new FormData();
  
    // Add all text fields
    formData.append('itemNumber', addFormData.itemNumber);
    formData.append('itemName', addFormData.itemName);
    formData.append('receivedQty', addFormData.receivedQty);
    formData.append('issuedQty', addFormData.issuedQty || '0');
    formData.append('availableQty', addFormData.availableQty);
    formData.append('minQuantity', addFormData.minQuantity);
    formData.append('purchaseValue', addFormData.purchaseValue);
    formData.append('deliveryDate', addFormData.deliveryDate);
    formData.append('supplierName', addFormData.supplierName);
    formData.append('beneficiaryFacility', addFormData.beneficiaryFacility);
    formData.append('notes', addFormData.notes || '');
      
 // In handleAddSubmit function, change:
const fileInput = document.getElementById('purchaseInvoice');
if (fileInput && fileInput instanceof HTMLInputElement && fileInput.files && fileInput.files.length > 0) {
  formData.append('image', fileInput.files[0]);
}
    const response = await warehouseApi.addInventoryItem(formData);
        
    if (response.success) {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصنف بنجاح",
      });
      
      // Force reload inventory data and wait for it
      try {
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success && inventoryResponse.data) {
          setInventoryItems(inventoryResponse.data);
        } else {
          // Fallback: optimistically add the new item to current list
          const newItem = {
            id: Date.now().toString(), // Temporary ID
            ...addFormData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setInventoryItems(prev => [...prev, newItem]);
        }
      } catch (reloadError) {
        console.error('Failed to reload inventory:', reloadError);
        // Optimistically add the new item
        const newItem = {
          id: Date.now().toString(),
          ...addFormData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setInventoryItems(prev => [...prev, newItem]);
      }
      
      // Reset form and close modal
      setShowAddForm(false);
      setShowEditModal(false);
      setSelectedItem(null);
      setSearchTerm(''); // Clear search after adding new item
      setFormErrors({});
      
      // Reset file input
      if (fileInput) {
        fileInput.value = '';
      }
      
      setAddFormData({
        itemNumber: '',
        itemName: '',
        receivedQty: '',
        issuedQty: '',
        availableQty: '',
        minQuantity: '',
        purchaseValue: '',
        deliveryDate: '',
        supplierName: '',
        beneficiaryFacility: '',
        notes: ''
      });
    }
  } catch (error: any) {
    toast({
      title: "خطأ في الحفظ",
      description: error.message || "فشل في حفظ البيانات",
      variant: "destructive",
    });
  } finally {
    setLoadingAction(false);
  }
};

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.id) return;

    if (!validateEditForm()) {
      return;
    }

    try {
      setLoadingAction(true);
      
      const response = await warehouseApi.updateInventoryItem(selectedItem.id, editFormData);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث الصنف بنجاح",
        });
        
        // Reload inventory data
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }
        
        setShowEditModal(false);
        setSelectedItem(null);
        setFormErrors({});
        setEditFormData({
          itemNumber: '',
          itemName: '',
          receivedQty: '',
          issuedQty: '',
          availableQty: '',
          minQuantity: '',
          purchaseValue: '',
          deliveryDate: '',
          supplierName: '',
          beneficiaryFacility: '',
          notes: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateWithdrawForm()) {
      return;
    }
    
    try {
      setLoadingAction(true);
      
      const response = await warehouseApi.createWithdrawalOrder(withdrawFormData);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء أمر الصرف بنجاح",
        });
        
        // Reload inventory data after successful withdrawal
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }
        
        setShowWithdrawForm(false);
        setSelectedItem(null);
        setFormErrors({});
        setWithdrawFormData({
          itemNumber: '',
          itemName: '',
          beneficiaryFacility: '',
          requestStatus: 'مفتوح تحت الاجراء',
          withdrawQty: '',
          withdrawDate: '',
          recipientName: '',
          recipientContact: '',
          notes: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في إنشاء أمر الصرف",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawClick = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      setWithdrawFormData(prev => ({
        ...prev,
        itemNumber: item.itemNumber,
        itemName: item.itemName
      }));
    }
    setFormErrors({});
    setShowWithdrawForm(true);
  };

  const handleViewClick = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setEditFormData({
      itemNumber: item.itemNumber || '',
      itemName: item.itemName || '',
      receivedQty: item.receivedQty?.toString() || '0',
      issuedQty: item.issuedQty?.toString() || '0',
      availableQty: item.availableQty?.toString() || '0',
      minQuantity: item.minQuantity?.toString() || '0',
      purchaseValue: item.purchaseValue?.toString() || '0',
      deliveryDate: item.deliveryDate || '',
      supplierName: item.supplierName || '',
      beneficiaryFacility: item.beneficiaryFacility || '',
      notes: item.notes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredItems, 'قائمة_المستودع');
    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات إلى ملف Excel بنجاح",
    });
  };

  const handleExportToPDF = () => {
    try {
      // Create a new window with printable content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>قائمة المستودع</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 10px; }
            .header p { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-available { background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
            .status-low { background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>قائمة المستودع</h1>
            <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>رقم الصنف</th>
                <th>اسم الصنف</th>
                <th>الكمية المستلمة</th>
                <th>الكمية المصروفة</th>
                <th>الكمية المتاحة</th>
                <th>الحد الأدنى</th>
                <th>قيمة الشراء</th>
                <th>الشركة الموردة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td>${item.itemNumber || ''}</td>
                  <td>${item.itemName || ''}</td>
                  <td>${item.receivedQty || 0}</td>
                  <td>${item.issuedQty || 0}</td>
                  <td>${item.availableQty || 0}</td>
                  <td>${item.minQuantity || 0}</td>
                  <td>${item.purchaseValue || 0} ريال</td>
                  <td>${item.supplierName || ''}</td>
                  <td>
                    <span class="${item.availableQty <= item.minQuantity ? 'status-low' : 'status-available'}">
                      ${item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>إجمالي الأصناف: ${filteredItems.length}</p>
            <p>إجمالي قيمة المخزون: ${calculateTotalInventoryValue().toFixed(2)} ريال</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

      toast({
        title: "تم التصدير",
        description: "تم تصدير البيانات إلى ملف PDF بنجاح",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات إلى PDF",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async () => {
  if (!itemToDelete) return;
  
  try {
    setLoadingAction(true);
    const response = await warehouseApi.deleteInventoryItem(itemToDelete.id);
    
    if (response.success) {
      toast({
        title: "تم الحذف",
        description: "تم حذف الصنف بنجاح",
      });
      
      // Reload inventory data
      const inventoryResponse = await warehouseApi.getInventory();
      if (inventoryResponse.success) {
        setInventoryItems(inventoryResponse.data || []);
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  } catch (error: any) {
    toast({
      title: "خطأ في الحذف",
      description: error.message || "فشل في حذف الصنف",
      variant: "destructive",
    });
  } finally {
    setLoadingAction(false);
  }
};
  
  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">إدارة المستودع</h1>
        <p className="text-muted-foreground mt-2">إدارة المخزون والأصناف</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث في الأصناف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-input rounded-md text-right"
          />
        </div>
        <button 
          onClick={() => {
            setFormErrors({});
            setShowAddForm(true);
          }}
          className="admin-btn-success flex items-center gap-2"
        >
          <Plus size={16} />
          إضافة صنف جديد
        </button>
      </div>

      {/* Inventory Stats */}
      <div className="responsive-grid">
        <div className="stat-card">
          <div className="stat-number">{inventoryItems.length}</div>
          <div className="stat-label">إجمالي الأصناف</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-danger">
            {inventoryItems.filter(item => item.availableQty <= item.minQuantity).length}
          </div>
          <div className="stat-label">مخزون منخفض</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-success">
          {inventoryItems.reduce((sum, item) => sum + (parseFloat(item.availableQty) || 0), 0)}
          </div>
          <div className="stat-label">إجمالي الكمية المتاحة</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-info">
            {calculateTotalInventoryValue().toFixed(2)} ريال
          </div>
          <div className="stat-label">إجمالي قيمة المخزون</div>
        </div>
      </div>

      {/* Inventory Items - Enhanced Mobile View */}
      <div className="admin-card">
        <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2>الأصناف المتوفرة ({filteredItems.length})</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExportToExcel}
              className="admin-btn-success text-xs flex items-center gap-1"
            >
              <FileText size={14} />
              Excel
            </button>
            <button 
              onClick={handleExportToPDF}
              className="admin-btn-danger text-xs flex items-center gap-1"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block p-4">
          <div className="responsive-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3">رقم الصنف</th>
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">الكمية المستلمة</th>
                  <th className="p-3">الكمية المصروفة</th>
                  <th className="p-3">الكمية المتاحة</th>
                  <th className="p-3">الحد الأدنى</th>
                  <th className="p-3">الشركة الموردة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border text-right hover:bg-accent">
                    <td className="p-3 font-medium">{item.itemNumber}</td>
                    <td className="p-3">{item.itemName}</td>
                    <td className="p-3">{item.receivedQty}</td>
                    <td className="p-3">{item.issuedQty}</td>
                    <td className="p-3 font-medium">{item.availableQty}</td>
                    <td className="p-3">{item.minQuantity}</td>
                    <td className="p-3">{item.supplierName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.availableQty <= item.minQuantity 
                          ? 'bg-danger text-danger-foreground' 
                          : 'bg-success text-success-foreground'
                      }`}>
                        {item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => handleViewClick(item)}
                          className="p-1.5 text-info hover:bg-info/10 rounded" 
                          title="عرض"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-warning hover:bg-warning/10 rounded" 
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleWithdrawClick(item)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                          title="أمر صرف"
                        >
                          <ShoppingCart size={14} />
                        </button>
                        <button 
                          onClick={() => {
                          setItemToDelete(item);
                          setShowDeleteModal(true);
                           }}
                          className="p-1.5 text-danger hover:bg-danger/10 rounded" 
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex justify-between items-start mb-3">
                <div className="text-right flex-1">
                  <h3 className="font-medium text-base">{item.itemName}</h3>
                  <p className="text-sm text-muted-foreground">رقم الصنف: {item.itemNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.availableQty <= item.minQuantity 
                    ? 'bg-danger text-danger-foreground' 
                    : 'bg-success text-success-foreground'
                }`}>
                  {item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="text-right">
                  <span className="text-muted-foreground">الكمية المتاحة:</span>
                  <span className="font-medium mr-2">{item.availableQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">الحد الأدنى:</span>
                  <span className="font-medium mr-2">{item.minQuantity}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">مستلم:</span>
                  <span className="font-medium mr-2">{item.receivedQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">مصروف:</span>
                  <span className="font-medium mr-2">{item.issuedQty}</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3 text-right">
                الشركة الموردة: {item.supplierName}
              </div>
              
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => handleViewClick(item)}
                  className="admin-btn-info text-xs flex items-center gap-1"
                >
                  <Eye size={12} />
                  عرض
                </button>
                <button 
                  onClick={() => handleEditClick(item)}
                  className="admin-btn-warning text-xs flex items-center gap-1"
                >
                  <Edit size={12} />
                  تعديل
                </button>
                <button 
                  onClick={() => handleWithdrawClick(item)}
                  className="admin-btn-primary text-xs flex items-center gap-1"
                >
                  <ShoppingCart size={12} />
                  صرف
                </button>
                <button 
                  onClick={() => {
  setItemToDelete(item);
  setShowDeleteModal(true);
}}
                  className="admin-btn-danger text-xs flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>إضافة صنف جديد</h2>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                      <input
                        type="text"
                        value={addFormData.itemNumber}
                        onChange={(e) => handleAddInputChange('itemNumber', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemNumber ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="رقم الصنف"
                        required
                      />
                      {formErrors.itemNumber && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                      <input
                        type="text"
                        value={addFormData.itemName}
                        onChange={(e) => handleAddInputChange('itemName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الصنف"
                        required
                      />
                      {formErrors.itemName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الكمية</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المستلمة *</label>
                      <input
                        type="number"
                        value={addFormData.receivedQty}
                        onChange={(e) => handleAddInputChange('receivedQty', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.receivedQty ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0"
                        required
                      />
                      {formErrors.receivedQty && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.receivedQty}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة</label>
                      <input
                        type="number"
                        value={addFormData.issuedQty}
                        onChange={(e) => handleAddInputChange('issuedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المتاحة (تلقائي)</label>
                      <input
                        type="number"
                        value={addFormData.availableQty}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        placeholder="يحسب تلقائياً"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">كمية الحد الأدنى *</label>
                      <input
                        type="number"
                        value={addFormData.minQuantity}
                        onChange={(e) => handleAddInputChange('minQuantity', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.minQuantity ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="الحد الأدنى"
                        required
                      />
                      {formErrors.minQuantity && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.minQuantity}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    * سيتم تنبيهك عند وصول المخزون إلى الحد الأدنى
                  </div>
                </div>
              </div>
{/* Purchase Invoice Upload */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>فاتورة الشراء</h3>
                </div>
                <div className="p-4">
                  <div>
                    <label htmlFor="purchaseInvoice" className="block text-sm font-medium mb-2 text-right">
                      فاتورة الشراء
                    </label>
                    <input
                      type="file"
                      id="purchaseInvoice"
                      name="image"
                      accept="image/*"
                      className="w-full p-2 border border-input rounded-md text-sm"
                    />
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground text-right">
                        سيتم رفع الصورة عند حفظ البيانات
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              {/* Financial and Supplier Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>المعلومات المالية والموردين</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">قيمة الشراء (ريال) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={addFormData.purchaseValue}
                        onChange={(e) => handleAddInputChange('purchaseValue', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.purchaseValue ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-red-500 text-xs mt-1 text-right">هذا هو المبلغ الإجمالي سيتم تقسيمه على الكمية المستلمة</p>
                      {formErrors.purchaseValue && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.purchaseValue}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد/التسليم *</label>
                      <input
                        type="date"
                        value={addFormData.deliveryDate}
                        onChange={(e) => handleAddInputChange('deliveryDate', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.deliveryDate ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      />
                      {formErrors.deliveryDate && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.deliveryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة *</label>
                      <input
                        type="text"
                        value={addFormData.supplierName}
                        onChange={(e) => handleAddInputChange('supplierName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.supplierName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الشركة"
                        required
                      />
                      {formErrors.supplierName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.supplierName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة الطالبة</label>
                      <select
                        value={addFormData.beneficiaryFacility}
                        onChange={(e) => handleAddInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={addFormData.notes}
                    onChange={(e) => handleAddInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Withdraw Order Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>أمر صرف - {selectedItem?.itemName}</h2>
              <button 
                onClick={() => setShowWithdrawForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف</label>
                      <input
                        type="text"
                        value={withdrawFormData.itemNumber}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف</label>
                      <input
                        type="text"
                        value={withdrawFormData.itemName}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-info">
                    الكمية المتاحة: {selectedItem?.availableQty || 0}
                  </div>
                </div>
              </div>

              {/* Withdraw Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصرف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة *</label>
                      <select
                        value={withdrawFormData.beneficiaryFacility}
                        onChange={(e) => handleWithdrawInputChange('beneficiaryFacility', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.beneficiaryFacility ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                      {formErrors.beneficiaryFacility && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.beneficiaryFacility}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">حالة الطلب *</label>
                      <select
                        value={withdrawFormData.requestStatus}
                        onChange={(e) => handleWithdrawInputChange('requestStatus', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        required
                      >
                        <option value="مفتوح تحت الاجراء">مفتوح تحت الاجراء</option>
                        <option value="تم الصرف">تم الصرف</option>
                        <option value="مرفوض">مرفوض</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة *</label>
                      <input
                        type="number"
                        value={withdrawFormData.withdrawQty}
                        onChange={(e) => handleWithdrawInputChange('withdrawQty', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.withdrawQty ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="الكمية"
                        max={selectedItem?.availableQty || 0}
                        required
                      />
                      {formErrors.withdrawQty && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.withdrawQty}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ الصرف *</label>
                      <input
                        type="date"
                        value={withdrawFormData.withdrawDate}
                        onChange={(e) => handleWithdrawInputChange('withdrawDate', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.withdrawDate ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      />
                      {formErrors.withdrawDate && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.withdrawDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات المستلم</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم المستلم *</label>
                      <input
                        type="text"
                        value={withdrawFormData.recipientName}
                        onChange={(e) => handleWithdrawInputChange('recipientName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.recipientName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم المستلم"
                        required
                      />
                      {formErrors.recipientName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.recipientName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم التواصل *</label>
                      <input
                        type="text"
                        value={withdrawFormData.recipientContact}
                        onChange={(e) => handleWithdrawInputChange('recipientContact', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.recipientContact ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="رقم الهاتف"
                        required
                      />
                      {formErrors.recipientContact && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.recipientContact}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
           

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={withdrawFormData.notes}
                    onChange={(e) => handleWithdrawInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ أمر الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>عرض تفاصيل الصنف</h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>معلومات أساسية</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">رقم الصنف:</span> {selectedItem.itemNumber}</div>
                    <div><span className="font-medium">اسم الصنف:</span> {selectedItem.itemName}</div>
                    <div><span className="font-medium">الشركة الموردة:</span> {selectedItem.supplierName}</div>
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>الكميات</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">الكمية المستلمة:</span> {selectedItem.receivedQty}</div>
                    <div><span className="font-medium">الكمية المصروفة:</span> {selectedItem.issuedQty}</div>
                    <div><span className="font-medium">الكمية المتاحة:</span> {selectedItem.availableQty}</div>
                    <div><span className="font-medium">الحد الأدنى:</span> {selectedItem.minQuantity}</div>
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>معلومات مالية</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">قيمة الشراء:</span> {selectedItem.purchaseValue} ريال</div>
                    <div><span className="font-medium">الجهة المستفيدة:</span> {selectedItem.beneficiaryFacility}</div>
                    <div><span className="font-medium">تاريخ التوريد:</span> {selectedItem.deliveryDate || 'غير محدد'}</div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Orders Section */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصرف</h3>
                </div>
                <div className="p-4">
                  {selectedItem.withdrawalOrders && selectedItem.withdrawalOrders.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground text-right mb-4">
                        إجمالي عدد أوامر الصرف: {selectedItem.withdrawalOrders.length}
                      </div>
                      
                      {/* Desktop Table View */}
                      <div className="hidden lg:block">
                        <div className="responsive-table">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-right">
                                <th className="p-3">رقم الأمر</th>
                                <th className="p-3">الجهة المستلمة</th>
                                <th className="p-3">الكمية</th>
                                <th className="p-3">تاريخ الصرف</th>
                                <th className="p-3">اسم المستلم</th>
                                <th className="p-3">رقم التواصل</th>
                                <th className="p-3">الحالة</th>
                                 <th className="p-3">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedItem.withdrawalOrders.map((order: any) => (
                                <tr key={order.id} className="border-b border-border text-right hover:bg-accent">
                                  <td className="p-3 font-medium">{order.orderNumber}</td>
                                  <td className="p-3">{order.beneficiaryFacility || 'غير محدد'}</td>
                                  <td className="p-3">{order.withdrawQty}</td>
                                  <td className="p-3">{order.withdrawDate}</td>
                                  <td className="p-3">{order.recipientName}</td>
                                  <td className="p-3">{order.recipientContact}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      order.requestStatus === 'تم الصرف' 
                                        ? 'bg-success text-success-foreground' 
                                        : order.requestStatus === 'مرفوض'
                                        ? 'bg-danger text-danger-foreground'
                                        : 'bg-warning text-warning-foreground'
                                    }`}>
                                      {order.requestStatus}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={() => {
                                          setSelectedDispenseOrder(order);
                                          setShowDispenseDetailsModal(true);
                                        }}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                                        title="عرض التفاصيل"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handlePrintWithdrawalOrder(order)}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                                        title="طباعة أمر الصرف"
                                      >
                                        <Printer size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {selectedItem.withdrawalOrders.map((order: any) => (
                          <div key={order.id} className="border border-border rounded-lg p-4 bg-card">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-right flex-1">
                                <h4 className="font-medium text-sm">{order.orderNumber}</h4>
                                <p className="text-xs text-muted-foreground">الجهة: {order.beneficiaryFacility || 'غير محدد'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  order.requestStatus === 'تم الصرف' 
                                    ? 'bg-success text-success-foreground' 
                                    : order.requestStatus === 'مرفوض'
                                    ? 'bg-danger text-danger-foreground'
                                    : 'bg-warning text-warning-foreground'
                                }`}>
                                  {order.requestStatus}
                                </span>
                                <button 
                                  onClick={() => {
                                    setSelectedDispenseOrder(order);
                                    setShowDispenseDetailsModal(true);
                                  }}
                                  className="p-1 text-primary hover:bg-primary/10 rounded" 
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={12} />
                                </button>
                                <button 
                                  onClick={() => handlePrintWithdrawalOrder(order)}
                                  className="p-1 text-primary hover:bg-primary/10 rounded" 
                                  title="طباعة أمر الصرف"
                                >
                                  <Printer size={12} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-right">
                                <span className="text-muted-foreground">الكمية:</span>
                                <span className="font-medium mr-1">{order.withdrawQty}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">التاريخ:</span>
                                <span className="font-medium mr-1">{order.withdrawDate}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">المستلم:</span>
                                <span className="font-medium mr-1">{order.recipientName}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">التواصل:</span>
                                <span className="font-medium mr-1">{order.recipientContact}</span>
                              </div>
                            </div>
                            
                            {order.notes && (
                              <div className="mt-2 text-xs text-muted-foreground text-right">
                                <span className="font-medium">ملاحظات:</span> {order.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-2">
                        <ShoppingCart size={48} className="mx-auto mb-2" />
                      </div>
                      <p className="text-muted-foreground">لا توجد أوامر صرف لهذا الصنف</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Close button only */}
            <div className="p-6 pt-0">
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedItem(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>تعديل الصنف - {selectedItem?.itemName}</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                      <input
                        type="text"
                        value={editFormData.itemNumber}
                        onChange={(e) => handleEditInputChange('itemNumber', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemNumber ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="رقم الصنف"
                        required
                      />
                      {formErrors.itemNumber && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                      <input
                        type="text"
                        value={editFormData.itemName}
                        onChange={(e) => handleEditInputChange('itemName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الصنف"
                        required
                      />
                      {formErrors.itemName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الكمية</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المستلمة *</label>
                      <input
                        type="number"
                        value={editFormData.receivedQty}
                        onChange={(e) => handleEditInputChange('receivedQty', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.receivedQty ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0"
                        required
                      />
                      {formErrors.receivedQty && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.receivedQty}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة</label>
                      <input
                        type="number"
                        value={editFormData.issuedQty}
                        onChange={(e) => handleEditInputChange('issuedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المتاحة (تلقائي)</label>
                      <input
                        type="number"
                        value={editFormData.availableQty}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        placeholder="يحسب تلقائياً"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">كمية الحد الأدنى *</label>
                      <input
                        type="number"
                        value={editFormData.minQuantity}
                        onChange={(e) => handleEditInputChange('minQuantity', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.minQuantity ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="الحد الأدنى"
                        required
                      />
                      {formErrors.minQuantity && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.minQuantity}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    * سيتم تنبيهك عند وصول المخزون إلى الحد الأدنى
                  </div>
                </div>
              </div>
{/* Purchase Invoice Upload */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>فاتورة الشراء</h3>
                </div>
                <div className="p-4">
                  <div>
                    <label htmlFor="purchaseInvoice" className="block text-sm font-medium mb-2 text-right">
                      فاتورة الشراء
                    </label>
                    <input
                      type="file"
                      id="purchaseInvoice"
                      name="image"
                      accept="image/*"
                      className="w-full p-2 border border-input rounded-md text-sm"
                    />
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground text-right">
                        سيتم رفع الصورة عند حفظ البيانات
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial and Supplier Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>المعلومات المالية والموردين</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">قيمة الشراء (ريال) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.purchaseValue}
                        onChange={(e) => handleEditInputChange('purchaseValue', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.purchaseValue ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      {formErrors.purchaseValue && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.purchaseValue}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد/التسليم *</label>
                      <input
                        type="date"
                        value={editFormData.deliveryDate}
                        onChange={(e) => handleEditInputChange('deliveryDate', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.deliveryDate ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      />
                      {formErrors.deliveryDate && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.deliveryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة *</label>
                      <input
                        type="text"
                        value={editFormData.supplierName}
                        onChange={(e) => handleEditInputChange('supplierName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.supplierName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الشركة"
                        required
                      />
                      {formErrors.supplierName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.supplierName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة الطالبة</label>
                      <select
                        value={editFormData.beneficiaryFacility}
                        onChange={(e) => handleEditInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => handleEditInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Details Modal */}
      {showDispenseDetailsModal && selectedDispenseOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>تفاصيل أمر الصرف رقم {selectedDispenseOrder.orderNumber}</h2>
              <button 
                onClick={() => {
                  setShowDispenseDetailsModal(false);
                  setSelectedDispenseOrder(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Basic Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الأمر</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">رقم الأمر:</span>
                      <p className="font-semibold">{selectedDispenseOrder.orderNumber}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الجهة المستفيدة:</span>
                      <p className="font-semibold">{selectedDispenseOrder.beneficiaryFacility || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الكمية المصروفة:</span>
                      <p className="font-semibold">{selectedDispenseOrder.withdrawQty}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">تاريخ الصرف:</span>
                      <p className="font-semibold">{selectedDispenseOrder.withdrawDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات المستلم</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">اسم المستلم:</span>
                      <p className="font-semibold">{selectedDispenseOrder.recipientName}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">رقم التواصل:</span>
                      <p className="font-semibold">{selectedDispenseOrder.recipientContact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>حالة الأمر والتواريخ</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الحالة:</span>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedDispenseOrder.requestStatus === 'تم الصرف' 
                            ? 'bg-success text-success-foreground' 
                            : selectedDispenseOrder.requestStatus === 'مرفوض'
                            ? 'bg-danger text-danger-foreground'
                            : 'bg-warning text-warning-foreground'
                        }`}>
                          {selectedDispenseOrder.requestStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">رقم الصنف:</span>
                      <p className="font-semibold">{selectedItem?.itemNumber || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">اسم الصنف:</span>
                      <p className="font-semibold">{selectedItem?.itemName || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الشركة الموردة:</span>
                      <p className="font-semibold">{selectedItem?.supplierName || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الكمية المتاحة قبل الصرف:</span>
                      <p className="font-semibold">{selectedItem?.availableQty || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedDispenseOrder.notes && (
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>ملاحظات</h3>
                  </div>
                  <div className="p-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <p className="leading-relaxed">{selectedDispenseOrder.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={() => handlePrintWithdrawalOrder(selectedDispenseOrder)}
                  className="admin-btn-primary flex items-center gap-2 px-4 py-2"
                >
                  <Printer size={16} />
                  طباعة أمر الصرف
                </button>
                <button
                  onClick={() => {
                    setShowDispenseDetailsModal(false);
                    setSelectedDispenseOrder(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

         {/* Delete Confirmation Modal */}
{showDeleteModal && itemToDelete && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-background rounded-lg w-full max-w-md">
      <div className="admin-header flex justify-between items-center">
        <h2>تأكيد الحذف</h2>
        <button 
          onClick={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <h3 className="text-lg font-medium mb-2">هل أنت متأكد من الحذف؟</h3>
          <p className="text-muted-foreground text-sm">
            سيتم حذف الصنف "{itemToDelete.itemName}" نهائياً ولن يمكن استرجاعه.
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDeleteItem}
            disabled={loadingAction}
            className="admin-btn-danger flex items-center gap-2 px-4 py-2"
          >
            {loadingAction ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            تأكيد الحذف
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
          >
            <X size={16} />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
