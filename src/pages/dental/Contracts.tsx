import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Eye, Edit, Trash2, Printer, Settings, Image as ImageIcon, X, Calendar, User, Building, DollarSign, Package, Phone, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
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
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageView = (imageBase64: string) => {
    setSelectedImage(imageBase64);
    setIsImageViewOpen(true);
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

  const handleDeleteContract = async (id: string) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذا العقد؟ لن تتمكن من التراجع عن هذا الإجراء.')) {
      try {
        setLoading(true);
        const response = await dentalContractsApi.deleteContract(id);
        if (response.success) {
          toast({
            title: "تم الحذف!",
            description: "تم حذف العقد بنجاح.",
          });
          fetchContracts();
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
      case 'جديد': return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'موافق عليه': return 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'تم التعاقد': return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'تم التسليم': return 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'مرفوض': return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'جديد': return <AlertCircle className="w-4 h-4" />;
      case 'موافق عليه': return <CheckCircle className="w-4 h-4" />;
      case 'تم التعاقد': return <FileText className="w-4 h-4" />;
      case 'تم التسليم': return <Package className="w-4 h-4" />;
      case 'مرفوض': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            عقود الأسنان الحديثة
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            نظام إدارة متطور لعقود وطلبات أجهزة ومستلزمات الأسنان مع واجهة عصرية وسهلة الاستخدام
          </p>
        </div>

        {/* Create New Contract Form */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">إنشاء طلب عقد أسنان جديد</h2>
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      تاريخ الطلب *
                    </label>
                    <input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Package className="w-4 h-4 text-blue-600" />
                      رقم الصنف *
                    </label>
                    <input
                      type="text"
                      value={formData.itemNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, itemNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="رقم صنف الأسنان"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-blue-600" />
                      اسم الصنف *
                    </label>
                    <input
                      type="text"
                      value={formData.itemName}
                      onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="جهاز أو مستلزم أسنان"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Package className="w-4 h-4 text-blue-600" />
                      الكمية *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="الكمية"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Building className="w-4 h-4 text-blue-600" />
                      عيادة الأسنان المستفيدة *
                    </label>
                    <select
                      value={formData.beneficiaryFacility}
                      onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryFacility: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                      required
                    >
                      <option value="">اختر العيادة</option>
                      {facilities.map(facility => (
                        <option key={facility.id} value={facility.name}>{facility.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  المعلومات المالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-green-600" />
                      رقم التعميد المالي
                    </label>
                    <input
                      type="text"
                      value={formData.financialApprovalNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, financialApprovalNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="رقم التعميد"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-green-600" />
                      تاريخ التعميد
                    </label>
                    <input
                      type="date"
                      value={formData.approvalDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, approvalDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      التكلفة الإجمالية
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="التكلفة بالريال"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <User className="w-5 h-5 text-purple-600" />
                  معلومات المورد
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Building className="w-4 h-4 text-purple-600" />
                      شركة أجهزة الأسنان
                    </label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="اسم شركة أجهزة الأسنان"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-purple-600" />
                      بيانات التواصل للشركة
                    </label>
                    <input
                      type="text"
                      value={formData.supplierContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                      placeholder="رقم الهاتف والإيميل"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <ImageIcon className="w-5 h-5 text-orange-600" />
                  المرفقات
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    صورة التعميد
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-right file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                  </div>
                  {formData.imagebase64 && (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">معاينة الصورة:</p>
                      <img 
                        src={formData.imagebase64} 
                        alt="Image Preview" 
                        className="max-w-[200px] max-h-[200px] object-contain border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                        onClick={() => handleImageView(formData.imagebase64!)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  معلومات إضافية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <AlertCircle className="w-4 h-4 text-indigo-600" />
                      حالة العقد
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <input
                        type="checkbox"
                        checked={formData.status === 'جديد'}
                        disabled
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-blue-800 dark:text-blue-200 font-medium">جديد</span>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-400">يمكنك لاحقاً تعديل حالة العقد</p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      تاريخ التسليم المخطط
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-right"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    ملاحظات إضافية
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-right resize-none"
                    rows={4}
                    placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      إنشاء العقد
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contracts List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">قائمة العقود</h2>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-semibold">
                  {contracts.length} عقد
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg font-medium text-slate-600 dark:text-slate-300">جاري تحميل العقود...</span>
                </div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">لا توجد عقود</h3>
                <p className="text-slate-500 dark:text-slate-400">ابدأ بإنشاء عقد جديد لعرضه هنا</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">رقم العقد</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">تاريخ الطلب</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">اسم الصنف</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">العيادة</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">الصورة</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">الحالة</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">التكلفة</th>
                        <th className="text-right py-4 px-6 font-bold text-slate-700 dark:text-slate-300">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract, index) => (
                        <tr key={contract.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                              #{contract.id}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700 dark:text-slate-300">{contract.orderDate || '-'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="max-w-[200px]">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{contract.itemName}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">الكمية: {contract.quantity}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{contract.beneficiaryFacility}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {contract.imagebase64 ? (
                              <button
                                onClick={() => handleImageView(contract.imagebase64)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors duration-200"
                              >
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">عرض</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-sm">لا توجد صورة</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(contract.status)}`}>
                              {getStatusIcon(contract.status)}
                              {contract.status}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button 
                                onClick={() => handleViewContract(contract)}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <Eye className="w-4 h-4" />
                                عرض
                              </button>
                              <button 
                                onClick={() => handleGeneralModifyContract(contract)}
                                className="flex items-center gap-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <Settings className="w-4 h-4" />
                                تعديل عام
                              </button>
                              <button 
                                onClick={() => handleEditContract(contract)}
                                className="flex items-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4" />
                                تعديل حالة
                              </button>
                              <button 
                                onClick={() => handlePrintContract(contract)}
                                className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <Printer className="w-4 h-4" />
                                طباعة
                              </button>
                              <button 
                                onClick={() => handleDeleteContract(contract.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {contracts.map((contract, index) => (
                    <div key={contract.id} className="bg-white dark:bg-slate-700 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-600 dark:to-slate-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-200">عقد #{contract.id}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{contract.orderDate}</p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(contract.status)}`}>
                            {getStatusIcon(contract.status)}
                            {contract.status}
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">اسم الصنف</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{contract.itemName}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">الكمية: {contract.quantity}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">العيادة المستفيدة</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{contract.beneficiaryFacility}</p>
                            </div>
                          </div>

                          {contract.totalCost && (
                            <div className="flex items-start gap-3">
                              <DollarSign className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">التكلفة الإجمالية</p>
                                <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                                  {Number(contract.totalCost).toLocaleString()} ريال
                                </p>
                              </div>
                            </div>
                          )}

                          {contract.supplierName && (
                            <div className="flex items-start gap-3">
                              <User className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">شركة الأجهزة</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{contract.supplierName}</p>
                              </div>
                            </div>
                          )}

                          {contract.imagebase64 && (
                            <div className="flex items-start gap-3">
                              <ImageIcon className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">صورة التعميد</p>
                                <button
                                  onClick={() => handleImageView(contract.imagebase64)}
                                  className="mt-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  عرض الصورة
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleViewContract(contract)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200"
                            >
                              <Eye className="w-4 h-4" />
                              عرض التفاصيل
                            </button>
                            <button 
                              onClick={() => handleGeneralModifyContract(contract)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors duration-200"
                            >
                              <Settings className="w-4 h-4" />
                              تعديل عام
                            </button>
                            <button 
                              onClick={() => handleEditContract(contract)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors duration-200"
                            >
                              <Edit className="w-4 h-4" />
                              تعديل الحالة
                            </button>
                            <button 
                              onClick={() => handlePrintContract(contract)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors duration-200"
                            >
                              <Printer className="w-4 h-4" />
                              طباعة
                            </button>
                          </div>
                          <button 
                            onClick={() => handleDeleteContract(contract.id)}
                            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف العقد
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
      </div>

      {/* Image Popup Modal */}
      <Dialog open={isImageViewOpen} onOpenChange={setIsImageViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95 border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setIsImageViewOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Contract Image"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background pb-4 border-b z-10">
            <DialogTitle className="text-right text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              تفاصيل عقد الأسنان
            </DialogTitle>
            <DialogDescription className="text-right text-lg">
              عرض تفاصيل العقد رقم: <span className="font-mono font-bold">#{selectedContract?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">رقم العقد</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">#{selectedContract.id}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">تاريخ الطلب</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.orderDate}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">رقم الصنف</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.itemNumber}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">اسم الصنف</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.itemName}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">الكمية</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.quantity}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">العيادة المستفيدة</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.beneficiaryFacility}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  المعلومات المالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">رقم التعميد المالي</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.financialApprovalNumber || '-'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">تاريخ التعميد</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.approvalDate || '-'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">التكلفة الإجمالية</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {selectedContract.totalCost ? `${Number(selectedContract.totalCost).toLocaleString()} ريال` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  معلومات المورد
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">شركة الأجهزة</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.supplierName || '-'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">بيانات التواصل</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.supplierContact || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status and Delivery */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  الحالة والتسليم
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">حالة العقد</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(selectedContract.status)}`}>
                      {getStatusIcon(selectedContract.status)}
                      {selectedContract.status}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">تاريخ التسليم المخطط</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedContract.deliveryDate || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Image */}
              {selectedContract.imagebase64 && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
                  <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 mb-6 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6" />
                    صورة التعميد
                  </h3>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <img 
                      src={selectedContract.imagebase64} 
                      alt="Contract Approval" 
                      className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                      onClick={() => handleImageView(selectedContract.imagebase64)}
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">اضغط على الصورة لعرضها بحجم أكبر</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedContract.notes && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    الملاحظات
                  </h3>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedContract.notes}</p>
                  </div>
                </div>
              )}

              {/* Status History */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  سجل حالات العقد
                </h3>
                <div className="space-y-4">
                  {selectedContract.creation_date && (
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border-r-4 border-blue-400">
                      <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-3">تاريخ الإنشاء</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">التاريخ</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.creation_date}</p>
                        </div>
                        {selectedContract.creation_date_note && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الملاحظة</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.creation_date_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContract.contract_approval_date && (
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border-r-4 border-green-400">
                      <h4 className="font-bold text-green-700 dark:text-green-300 mb-3">تاريخ الموافقة</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">التاريخ</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.contract_approval_date}</p>
                        </div>
                        {selectedContract.contract_approval_date_note && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الملاحظة</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.contract_approval_date_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContract.contract_date && (
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border-r-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-700 dark:text-yellow-300 mb-3">تاريخ التعاقد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">التاريخ</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.contract_date}</p>
                        </div>
                        {selectedContract.contract_date_note && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الملاحظة</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.contract_date_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContract.contract_delivery_date && (
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border-r-4 border-emerald-400">
                      <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-3">تاريخ التسليم</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">التاريخ</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.contract_delivery_date}</p>
                        </div>
                        {selectedContract.contract_delivery_date_note && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الملاحظة</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.contract_delivery_date_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContract.rejection_date && (
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border-r-4 border-red-400">
                      <h4 className="font-bold text-red-700 dark:text-red-300 mb-3">تاريخ الرفض</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">التاريخ</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.rejection_date}</p>
                        </div>
                        {selectedContract.rejection_date_note && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الملاحظة</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedContract.rejection_date_note}</p>
                          </div>
                        )}
                      </div>
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
            <DialogTitle className="text-right text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              تعديل حالة العقد
            </DialogTitle>
            <DialogDescription className="text-right text-lg">
              تعديل حالة العقد رقم: <span className="font-mono font-bold">#{editingContract?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          {editingContract && (
            <div className="space-y-6 p-6">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">الحالة الحالية</label>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(editingContract.status)}`}>
                  {getStatusIcon(editingContract.status)}
                  {editingContract.status}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">الحالة الجديدة *</label>
                <select
                  value={statusUpdateData.newStatus}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-right"
                  required
                >
                  <option value="">اختر الحالة الجديدة</option>
                  {getStatusOptions(editingContract.status).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">تاريخ التحديث</label>
                <input
                  type="date"
                  value={statusUpdateData.statusDate}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-right"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">ملاحظة التحديث</label>
                <textarea
                  value={statusUpdateData.statusNote}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusNote: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-right resize-none"
                  rows={4}
                  placeholder="أضف ملاحظة حول تحديث الحالة..."
                />
              </div>

              <div className="flex justify-center gap-4 pt-6">
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading || !statusUpdateData.newStatus}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      تحديث الحالة
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* General Modify Contract Dialog */}
      <Dialog open={isGeneralModifyDialogOpen} onOpenChange={setIsGeneralModifyDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background pb-4 border-b z-10">
            <DialogTitle className="text-right text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              تعديل عام للعقد
            </DialogTitle>
            <DialogDescription className="text-right text-lg">
              تعديل بيانات العقد رقم: <span className="font-mono font-bold">#{editingContract?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          {editingContract && (
            <div className="p-6">
              <form onSubmit={handleUpdateContract} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    المعلومات الأساسية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        تاريخ الطلب *
                      </label>
                      <input
                        type="date"
                        value={editingContract.orderDate || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, orderDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Package className="w-4 h-4 text-purple-600" />
                        رقم الصنف *
                      </label>
                      <input
                        type="text"
                        value={editingContract.itemNumber || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, itemNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <FileText className="w-4 h-4 text-purple-600" />
                        اسم الصنف *
                      </label>
                      <input
                        type="text"
                        value={editingContract.itemName || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, itemName: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Package className="w-4 h-4 text-purple-600" />
                        الكمية *
                      </label>
                      <input
                        type="number"
                        value={editingContract.quantity || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Building className="w-4 h-4 text-purple-600" />
                        العيادة المستفيدة *
                      </label>
                      <select
                        value={editingContract.beneficiaryFacility || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, beneficiaryFacility: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                        required
                      >
                        <option value="">اختر العيادة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    المعلومات المالية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <FileText className="w-4 h-4 text-green-600" />
                        رقم التعميد المالي
                      </label>
                      <input
                        type="text"
                        value={editingContract.financialApprovalNumber || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, financialApprovalNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-green-600" />
                        تاريخ التعميد
                      </label>
                      <input
                        type="date"
                        value={editingContract.approvalDate || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, approvalDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        التكلفة الإجمالية
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingContract.totalCost || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, totalCost: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <User className="w-5 h-5 text-orange-600" />
                    معلومات المورد
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Building className="w-4 h-4 text-orange-600" />
                        شركة أجهزة الأسنان
                      </label>
                      <input
                        type="text"
                        value={editingContract.supplierName || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, supplierName: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-orange-600" />
                        بيانات التواصل
                      </label>
                      <input
                        type="text"
                        value={editingContract.supplierContact || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, supplierContact: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    المرفقات
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      صورة التعميد
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGeneralModifyImageUpload}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-right file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {editingContract.imagebase64 && (
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">الصورة الحالية:</p>
                        <img 
                          src={editingContract.imagebase64} 
                          alt="Contract Image" 
                          className="max-w-[200px] max-h-[200px] object-contain border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                          onClick={() => handleImageView(editingContract.imagebase64)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    معلومات إضافية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        تاريخ التسليم المخطط
                      </label>
                      <input
                        type="date"
                        value={editingContract.deliveryDate || ''}
                        onChange={(e) => setEditingContract(prev => ({ ...prev, deliveryDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-blue-600" />
                      ملاحظات إضافية
                    </label>
                    <textarea
                      value={editingContract.notes || ''}
                      onChange={(e) => setEditingContract(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right resize-none"
                      rows={4}
                      placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-center gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري التحديث...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGeneralModifyDialogOpen(false)}
                    className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
