improved-dental-contracts.tsx
import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Eye, Edit, Trash2, Printer, Settings, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import { dentalContractsApi, dashboardApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DentalContracts() {
  const [formData, setFormData] = useState({
    orderDate: '',
    itemNumber: '',
    itemName: '',
    quantity: '',
    beneficiaryFacility: '',
    financialApprovalNumber: '',
    approvalDate: '',
    totalCost: '',
    supplierName: '',
    supplierContact: '',
    status: 'جديد',
    deliveryDate: '',
    notes: '',
    imagebase64: null as string | null,
  });

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGeneralModifyDialogOpen, setIsGeneralModifyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    newStatus: '',
    statusNote: '',
    statusDate: ''
  });
  const [facilities, setFacilities] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dentalContractsApi.getContracts();
      if (response.success && response.data) {
        setContracts(response.data);
      } else {
        console.error('API response not successful or no data:', response);
        setContracts([]);
        toast({
          title: "تحذير",
          description: "فشل في تحميل العقود من الخادم.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
      toast({
        title: "تحذير",
        description: "فشل في تحميل العقود من الخادم.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchFacilities = useCallback(async () => {
    try {
      const response = await dashboardApi.getFacilities();
      if (response.success && response.data) {
        setFacilities(response.data);
      } else {
        console.error('Failed to fetch facilities:', response);
        toast({
          title: "تحذير",
          description: "فشل في تحميل قائمة العيادات.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast({
        title: "تحذير",
        description: "فشل في تحميل قائمة العيادات.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchContracts();
    fetchFacilities();
  }, [fetchContracts, fetchFacilities]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagebase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneralModifyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingContract(prev => ({
          ...prev,
          imagebase64: reader.result as string,
          imagebase64: reader.result as string, // Update image_url for preview
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await dentalContractsApi.createContract(formData);
      if (response.success) {
        toast({
          title: "نجح الإنشاء",
          description: "تم إنشاء عقد الأسنان بنجاح",
        });
        setFormData({
          orderDate: '', itemNumber: '', itemName: '', quantity: '', beneficiaryFacility: '',
          financialApprovalNumber: '', approvalDate: '', totalCost: '', supplierName: '',
          supplierContact: '', status: 'جديد', deliveryDate: '', notes: '', imagebase64: null,
        });
        fetchContracts();
      } else {
        toast({
          title: "خطأ في الإنشاء",
          description: response.message || "فشل في إنشاء العقد",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إنشاء العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsViewDialogOpen(true);
  };

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setStatusUpdateData({
      newStatus: contract.status,
      statusNote: '',
      statusDate: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleGeneralModifyContract = (contract: any) => {
    setEditingContract(contract);
    setIsGeneralModifyDialogOpen(true);
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    try {
      setLoading(true);
      const response = await dentalContractsApi.updateContract(editingContract.id, editingContract);
      if (response.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث العقد بنجاح",
        });
        fetchContracts();
        setIsGeneralModifyDialogOpen(false);
        setEditingContract(null);
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.message || "فشل في تحديث العقد",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Custom Delete Confirmation Dialog
  const handleDeleteContract = (contract: any) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return;
    
    try {
      setLoading(true);
      const response = await dentalContractsApi.deleteContract(contractToDelete.id);
      if (response.success) {
        toast({
          title: "تم الحذف!",
          description: "تم حذف العقد بنجاح.",
        });
        fetchContracts();
        setIsDeleteDialogOpen(false);
        setContractToDelete(null);
      } else {
        toast({
          title: "خطأ!",
          description: response.message || 'فشل في حذف العقد.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast({
        title: "خطأ!",
        description: error.message || 'فشل في حذف العقد.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintContract = (contract: any) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عقد الأسنان - ${contract.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            direction: rtl;
            text-align: right;
          }
          
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .header p {
            color: #64748b;
            font-size: 16px;
          }
          
          .section {
            margin-bottom: 25px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .section-header {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 15px 20px;
            border-bottom: 1px solid #d1d5db;
          }
          
          .section-header h2 {
            color: #374151;
            font-size: 18px;
            font-weight: bold;
            margin: 0;
          }
          
          .section-content {
            padding: 20px;
            background: white;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          
          .info-item {
            background: #f9fafb;
            padding: 12px 15px;
            border-radius: 6px;
            border-right: 4px solid #3b82f6;
          }
          
          .info-item label {
            display: block;
            font-weight: bold;
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .info-item span {
            color: #1f2937;
            font-size: 15px;
            font-weight: 500;
          }
          
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          
          .status-new { background: #dbeafe; color: #1e40af; }
          .status-approved { background: #dcfce7; color: #166534; }
          .status-contracted { background: #fef3c7; color: #92400e; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          
          .notes-section {
            background: #fffbeb;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
          }
          
          .notes-section h3 {
            color: #92400e;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .notes-section p {
            color: #451a03;
            line-height: 1.6;
          }
          
          .timeline-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            border-right: 4px solid #6366f1;
          }
          
          .timeline-item h4 {
            color: #4338ca;
            font-size: 16px;
            margin-bottom: 10px;
          }
          
          .timeline-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .timeline-field {
            background: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          
          .timeline-field label {
            display: block;
            font-weight: bold;
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .timeline-field span {
            color: #111827;
            font-weight: 500;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .print-container { padding: 10mm; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>عقد الأسنان - بلانكت</h1>
            <p>رقم العقد: ${contract.id || 'غير محدد'}</p>
          </div>

          <div class="section">
            <div class="section-header">
              <h2>المعلومات الأساسية</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>رقم العقد</label>
                  <span>${contract.id || '-'}</span>
                </div>
                <div class="info-item">
                  <label>رقم الصنف</label>
                  <span>${contract.itemNumber || '-'}</span>
                </div>
                <div class="info-item">
                  <label>اسم الصنف</label>
                  <span>${contract.itemName || '-'}</span>
                </div>
                <div class="info-item">
                  <label>الكمية</label>
                  <span>${contract.quantity || '-'}</span>
                </div>
                <div class="info-item">
                  <label>العيادة المستفيدة</label>
                  <span>${contract.beneficiaryFacility || '-'}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ الطلب</label>
                  <span>${contract.orderDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h2>المعلومات المالية</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>رقم التعميد المالي</label>
                  <span>${contract.financialApprovalNumber || '-'}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ التعميد</label>
                  <span>${contract.approvalDate || '-'}</span>
                </div>
                <div class="info-item">
                  <label>التكلفة الإجمالية</label>
                  <span>${contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h2>معلومات المورد</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>شركة الأجهزة</label>
                  <span>${contract.supplierName || '-'}</span>
                </div>
                <div class="info-item">
                  <label>بيانات التواصل</label>
                  <span>${contract.supplierContact || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h2>الحالة والتسليم</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>حالة العقد</label>
                  <span class="status-badge ${getStatusClass(contract.status)}">${contract.status || '-'}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ التسليم المخطط</label>
                  <span>${contract.deliveryDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          ${contract.notes ? `
          <div class="section">
            <div class="section-header">
              <h2>الملاحظات</h2>
            </div>
            <div class="section-content">
              <div class="notes-section">
                <p>${contract.notes}</p>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>تم طباعة هذا العقد في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'جديد': return 'status-new';
      case 'موافق عليه': return 'status-approved';
      case 'تم التعاقد': return 'status-contracted';
      case 'تم التسليم': return 'status-delivered';
      case 'مرفوض': return 'status-rejected';
      default: return 'status-new';
    }
  };

  const handleStatusUpdate = async () => {
    if (!editingContract || !statusUpdateData.newStatus) return;
    try {
      setLoading(true);
      const response = await dentalContractsApi.updateContractStatus(
        editingContract.id,
        {
          newStatus: statusUpdateData.newStatus,
          statusNote: statusUpdateData.statusNote,
          statusDate: statusUpdateData.statusDate
        }
      );
      if (response.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث حالة العقد بنجاح",
        });
        fetchContracts();
        setIsEditDialogOpen(false);
        setEditingContract(null);
        setStatusUpdateData({ newStatus: '', statusNote: '', statusDate: '' });
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.message || "فشل في تحديث حالة العقد",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating contract status:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث حالة العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    const statusFlow = ['جديد', 'موافق عليه', 'تم التعاقد', 'تم التسليم'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const availableOptions = [
      ...statusFlow.slice(currentIndex),
      'مرفوض'
    ];
    return [...new Set(availableOptions)];
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'موافق عليه': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'تم التعاقد': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'تم التسليم': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'مرفوض': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">عقود الأسنان - بلانكت</h1>
        <p className="text-muted-foreground mt-2">إدارة عقود وطلبات أجهزة ومستلزمات الأسنان</p>
      </div>

      <div className="admin-card">
        <div className="admin-header">
          <h2>إنشاء طلب عقد أسنان جديد</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ الطلب *</label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                <input
                  type="text"
                  value={formData.itemNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemNumber: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم صنف الأسنان"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="جهاز أو مستلزم أسنان"
                  required
                />
              </div>
            </div>

            {/* Quantity and Facility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الكمية *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="الكمية"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">عيادة الأسنان المستفيدة *</label>
                <select
                  value={formData.beneficiaryFacility}
                  onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryFacility: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                >
                  <option value="">اختر العيادة</option>
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.name}>{facility.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial Approval */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">رقم التعميد المالي</label>
                <input
                  type="text"
                  value={formData.financialApprovalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, financialApprovalNumber: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم التعميد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التعميد</label>
                <input
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">التكلفة الإجمالية</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="التكلفة بالريال"
                />
              </div>
            </div>

            {/* Supplier Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">شركة أجهزة الأسنان</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="اسم شركة أجهزة الأسنان"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">بيانات التواصل للشركة</label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم الهاتف والإيميل"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-right">صورة التعميد</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-3 border border-input rounded-md text-right"
              />
              {formData.imagebase64 && (
                <div className="mt-2 text-right">
                  <img src={formData.imagebase64} alt="Image Preview" className="max-w-[150px] max-h-[150px] object-contain border rounded-md" />
                </div>
              )}
            </div>

            {/* Status and Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">حالة العقد</label>
                <div className="flex items-center gap-2 text-right">
                  <input
                    type="checkbox"
                    checked={formData.status === 'جديد'}
                    disabled
                    className="ml-2"
                  />
                  <span>جديد</span>
                </div>
                <p className="text-xs text-red-500 mt-1 text-right">يمكنك لاحقاً تعديل حالة العقد</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التسليم المخطط</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-right">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-input rounded-md text-right"
                rows={3}
                placeholder="أي ملاحظات إضافية"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'جاري الحفظ...' : 'حفظ العقد'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>عقود الأسنان الحديثة</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">جاري تحميل العقود...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">لا توجد عقود</h3>
              <p className="text-muted-foreground">لم يتم إنشاء أي عقود أسنان بعد</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <th className="p-4 text-right font-semibold text-sm">رقم العقد</th>
                        <th className="p-4 text-right font-semibold text-sm">تاريخ الطلب</th>
                        <th className="p-4 text-right font-semibold text-sm">اسم الصنف</th>
                        <th className="p-4 text-right font-semibold text-sm">العيادة المستفيدة</th>
                        <th className="p-4 text-right font-semibold text-sm">الكمية</th>
                        <th className="p-4 text-right font-semibold text-sm">صورة التعميد</th>
                        <th className="p-4 text-right font-semibold text-sm">الحالة</th>
                        <th className="p-4 text-right font-semibold text-sm">التكلفة</th>
                        <th className="p-4 text-right font-semibold text-sm">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract, index) => (
                        <tr 
                          key={contract.id} 
                          className={`
                            border-b border-blue-100 dark:border-blue-800 
                            hover:bg-blue-50 dark:hover:bg-blue-900/30 
                            transition-all duration-200
                            ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-25 dark:bg-gray-800'}
                          `}
                        >
                          <td className="p-4">
                            <div className="font-semibold text-blue-700 dark:text-blue-300">
                              #{contract.id}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {contract.orderDate || '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                              {contract.itemName || '-'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              رقم: {contract.itemNumber || '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                              {contract.beneficiaryFacility || '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {contract.quantity || '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            {contract.imagebase64 ? (
                              <button
                                onClick={() => {
                                  const imgWindow = window.open('');
                                  if (imgWindow) {
                                    imgWindow.document.write(`<html><head><title>صورة التعميد</title></head><body style="margin:0;padding:20px;background:#f5f5f5;"><img src="${contract.imagebase64}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" /></body></html>`);
                                    imgWindow.document.close();
                                  }
                                }}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              >
                                <ImageIcon size={16} />
                                <span className="text-xs">عرض</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                                لا توجد صورة
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(contract.status)}`}>
                              {contract.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-green-700 dark:text-green-400">
                              {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              <button 
                                onClick={() => handleViewContract(contract)}
                                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 hover:shadow-md"
                                title="عرض التفاصيل"
                              >
                                <Eye size={12} />
                                <span className="hidden xl:inline">عرض</span>
                              </button>
                              <button 
                                onClick={() => handleGeneralModifyContract(contract)}
                                className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 hover:shadow-md"
                                title="تعديل عام"
                              >
                                <Settings size={12} />
                                <span className="hidden xl:inline">تعديل</span>
                              </button>
                              <button 
                                onClick={() => handleEditContract(contract)}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 hover:shadow-md"
                                title="تعديل الحالة"
                              >
                                <Edit size={12} />
                                <span className="hidden xl:inline">حالة</span>
                              </button>
                              <button 
                                onClick={() => handlePrintContract(contract)}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 hover:shadow-md"
                                title="طباعة"
                              >
                                <Printer size={12} />
                                <span className="hidden xl:inline">طباعة</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteContract(contract)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 hover:shadow-md"
                                title="حذف"
                              >
                                <Trash2 size={12} />
                                <span className="hidden xl:inline">حذف</span>
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
              <div className="lg:hidden space-y-4">
                {contracts.map((contract) => (
                  <div 
                    key={contract.id} 
                    className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">عقد #{contract.id}</h3>
                          <p className="text-blue-100 text-sm">{contract.orderDate || 'تاريخ غير محدد'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(contract.status)} bg-opacity-90`}>
                          {contract.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-4">
                      {/* Item Info */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                          <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">اسم الصنف</label>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{contract.itemName || '-'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">رقم: {contract.itemNumber || '-'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">الكمية</label>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{contract.quantity || '-'}</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                            <label className="block text-xs font-semibold text-green-700 dark:text-green-300 mb-1">التكلفة</label>
                            <p className="font-medium text-green-800 dark:text-green-200">
                              {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                          <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">العيادة المستفيدة</label>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{contract.beneficiaryFacility || '-'}</p>
                        </div>

                        {/* Image Section */}
                        {contract.imagebase64 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                            <label className="block text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-2">صورة التعميد</label>
                            <button
                              onClick={() => {
                                const imgWindow = window.open('');
                                if (imgWindow) {
                                  imgWindow.document.write(`<html><head><title>صورة التعميد</title></head><body style="margin:0;padding:20px;background:#f5f5f5;"><img src="${contract.imagebase64}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" /></body></html>`);
                                  imgWindow.document.close();
                                }
                              }}
                              className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors bg-yellow-100 dark:bg-yellow-900/50 px-3 py-2 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/70 w-full justify-center"
                            >
                              <ImageIcon size={16} />
                              <span className="text-sm font-medium">عرض الصورة</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100 dark:border-blue-800">
                        <button 
                          onClick={() => handleViewContract(contract)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Eye size={16} />
                          عرض
                        </button>
                        <button 
                          onClick={() => handleGeneralModifyContract(contract)}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Settings size={16} />
                          تعديل
                        </button>
                        <button 
                          onClick={() => handleEditContract(contract)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Edit size={16} />
                          حالة
                        </button>
                        <button 
                          onClick={() => handlePrintContract(contract)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Printer size={16} />
                          طباعة
                        </button>
                        <button 
                          onClick={() => handleDeleteContract(contract)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-red-800 dark:text-red-200">
              تأكيد حذف العقد
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
              هل أنت متأكد من حذف العقد رقم <span className="font-bold text-red-600 dark:text-red-400">#{contractToDelete?.id}</span>؟
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">تحذير مهم:</p>
                <p>لن تتمكن من التراجع عن هذا الإجراء. سيتم حذف جميع البيانات المرتبطة بهذا العقد نهائياً.</p>
              </div>
            </div>
          </div>

          {contractToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">تفاصيل العقد:</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">اسم الصنف:</span> {contractToDelete.itemName || '-'}</p>
                <p><span className="font-medium">العيادة:</span> {contractToDelete.beneficiaryFacility || '-'}</p>
                <p><span className="font-medium">التاريخ:</span> {contractToDelete.orderDate || '-'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setContractToDelete(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={confirmDeleteContract}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  تأكيد الحذف
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Details Popup */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background pb-4 border-b">
            <DialogTitle className="text-right text-xl font-bold">تفاصيل عقد الأسنان</DialogTitle>
            <DialogDescription className="text-right">
              عرض تفاصيل العقد رقم: {selectedContract?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم العقد:</p>
                  <p className="text-lg font-semibold">{selectedContract.id}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تاريخ الطلب:</p>
                  <p className="text-lg font-semibold">{selectedContract.orderDate}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم الصنف:</p>
                  <p className="text-lg font-semibold">{selectedContract.itemNumber}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">اسم الصنف:</p>
                  <p className="text-lg font-semibold">{selectedContract.itemName}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الكمية:</p>
                  <p className="text-lg font-semibold">{selectedContract.quantity}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">العيادة المستفيدة:</p>
                  <p className="text-lg font-semibold">{selectedContract.beneficiaryFacility}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم التعميد المالي:</p>
                  <p className="text-lg font-semibold">{selectedContract.financialApprovalNumber || '-'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تاريخ التعميد:</p>
                  <p className="text-lg font-semibold">{selectedContract.approvalDate || '-'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">التكلفة الإجمالية:</p>
                  <p className="text-lg font-semibold">{selectedContract.totalCost ? `${Number(selectedContract.totalCost).toLocaleString()} ريال` : '-'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">شركة الأجهزة:</p>
                  <p className="text-lg font-semibold">{selectedContract.supplierName || '-'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">بيانات التواصل للشركة:</p>
                  <p className="text-lg font-semibold">{selectedContract.supplierContact || '-'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تاريخ التسليم المخطط:</p>
                  <p className="text-lg font-semibold">{selectedContract.deliveryDate || '-'}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg col-span-full">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">صورة التعميد:</p>
                  {selectedContract.imagebase64 ? (
                    <img src={selectedContract.imagebase64} alt="Approval" className="mt-2 max-w-full h-auto rounded-md" />
                  ) : (
                    <p className="text-lg font-semibold">لا توجد صورة</p>
                  )}
                </div>
              </div>

              {selectedContract.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">ملاحظات:</p>
                  <p className="text-base text-yellow-900 dark:text-yellow-100">{selectedContract.notes}</p>
                </div>
              )}

              {/* Status History Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-6 text-right text-indigo-800 dark:text-indigo-200">سجل حالات العقد</h3>
                <div className="space-y-4">
                  
                  {/* Creation Date */}
                  {selectedContract.creation_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">تاريخ الإنشاء</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.creation_date}</p>
                      </div>
                      {selectedContract.creation_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">ملاحظة الإنشاء</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.creation_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contract Approval Date */}
                  {selectedContract.contract_approval_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border-l-4 border-teal-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">تاريخ الموافقة</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.contract_approval_date}</p>
                      </div>
                      {selectedContract.contract_approval_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">ملاحظة الموافقة</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.contract_approval_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contract Date */}
                  {selectedContract.contract_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">تاريخ التعاقد</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.contract_date}</p>
                      </div>
                      {selectedContract.contract_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">ملاحظة التعاقد</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.contract_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Date */}
                  {selectedContract.contract_delivery_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border-l-4 border-emerald-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">تاريخ التسليم</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.contract_delivery_date}</p>
                      </div>
                      {selectedContract.contract_delivery_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">ملاحظة التسليم</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.contract_delivery_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Date */}
                  {selectedContract.rejection_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border-l-4 border-red-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">تاريخ الرفض</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.rejection_date}</p>
                      </div>
                      {selectedContract.rejection_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">ملاحظة الرفض</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.rejection_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Contract Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">تعديل حالة العقد</DialogTitle>
            <DialogDescription className="text-right">
              تعديل حالة العقد رقم: {editingContract?.id}
            </DialogDescription>
          </DialogHeader>
          
          {editingContract && (
            <div className="space-y-6 p-4">
              <div className="text-right bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium text-muted-foreground mb-2">الحالة الحالية</label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(editingContract.status)}`}>
                  {editingContract.status}
                </span>
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">الحالة الجديدة *</label>
                <select
                  value={statusUpdateData.newStatus}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                >
                  <option value="">اختر الحالة الجديدة</option>
                  {getStatusOptions(editingContract.status).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">تاريخ تحديث الحالة</label>
                <input
                  type="date"
                  value={statusUpdateData.statusDate}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">ملاحظة التحديث</label>
                <textarea
                  value={statusUpdateData.statusNote}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusNote: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  rows={3}
                  placeholder="أي ملاحظات حول تحديث الحالة"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading || !statusUpdateData.newStatus}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* General Modify Contract Dialog */}
      <Dialog open={isGeneralModifyDialogOpen} onOpenChange={setIsGeneralModifyDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">تعديل عام للعقد</DialogTitle>
            <DialogDescription className="text-right">
              تعديل بيانات العقد رقم: {editingContract?.id}
            </DialogDescription>
          </DialogHeader>
          
          {editingContract && (
            <form onSubmit={handleUpdateContract} className="space-y-6 p-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">تاريخ الطلب *</label>
                  <input
                    type="date"
                    value={editingContract.orderDate || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                  <input
                    type="text"
                    value={editingContract.itemNumber || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, itemNumber: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="رقم صنف الأسنان"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                  <input
                    type="text"
                    value={editingContract.itemName || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, itemName: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="جهاز أو مستلزم أسنان"
                    required
                  />
                </div>
              </div>

              {/* Quantity and Facility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">الكمية *</label>
                  <input
                    type="number"
                    value={editingContract.quantity || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="الكمية"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">عيادة الأسنان المستفيدة *</label>
                  <select
                    value={editingContract.beneficiaryFacility || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, beneficiaryFacility: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    required
                  >
                    <option value="">اختر العيادة</option>
                    {facilities.map(facility => (
                      <option key={facility.id} value={facility.name}>{facility.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Approval */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">رقم التعميد المالي</label>
                  <input
                    type="text"
                    value={editingContract.financialApprovalNumber || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, financialApprovalNumber: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="رقم التعميد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">تاريخ التعميد</label>
                  <input
                    type="date"
                    value={editingContract.approvalDate || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, approvalDate: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">التكلفة الإجمالية</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingContract.totalCost || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, totalCost: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="التكلفة بالريال"
                  />
                </div>
              </div>

              {/* Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">شركة أجهزة الأسنان</label>
                  <input
                    type="text"
                    value={editingContract.supplierName || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, supplierName: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="اسم شركة أجهزة الأسنان"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">بيانات التواصل للشركة</label>
                  <input
                    type="text"
                    value={editingContract.supplierContact || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, supplierContact: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    placeholder="رقم الهاتف والإيميل"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-right">صورة التعميد</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGeneralModifyImageUpload}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
                {editingContract.imagebase64 && (
                  <div className="mt-2 text-right">
                    <img src={editingContract.imagebase64} alt="Image Preview" className="max-w-[150px] max-h-[150px] object-contain border rounded-md" />
                  </div>
                )}
              </div>

              {/* Delivery Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">تاريخ التسليم المخطط</label>
                  <input
                    type="date"
                    value={editingContract.deliveryDate || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 text-right">ملاحظات</label>
                <textarea
                  value={editingContract.notes || ''}
                  onChange={(e) => setEditingContract(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  rows={3}
                  placeholder="أي ملاحظات إضافية"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGeneralModifyDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={16} />
                  {loading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
