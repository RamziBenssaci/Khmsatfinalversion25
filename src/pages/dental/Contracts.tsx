import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Eye, Edit, Trash2, Printer, Settings, Image as ImageIcon } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string>("");

  const handleViewImage = (image: string) => {
    setSelectedImage(image);
    setIsImageViewOpen(true);
  };
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
                <div className="info-item">
                  <label>صورة التعميد</label>
                  {contract.imagebase64 ? (
                    <img src={contract.imagebase64} alt="Approval" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                  ) : (
                    <span>لا توجد صورة</span>
                  )}
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

          <div class="section">
            <div class="section-header">
              <h2>سجل حالات العقد</h2>
            </div>
            <div class="section-content">
              ${contract.creation_date ? `
              <div class="timeline-item">
                <h4>تاريخ الإنشاء</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${contract.creation_date}</span>
                  </div>
                  ${contract.creation_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${contract.creation_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${contract.contract_approval_date ? `
              <div class="timeline-item">
                <h4>تاريخ الموافقة</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${contract.contract_approval_date}</span>
                  </div>
                  ${contract.contract_approval_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${contract.contract_approval_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${contract.contract_date ? `
              <div class="timeline-item">
                <h4>تاريخ التعاقد</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${contract.contract_date}</span>
                  </div>
                  ${contract.contract_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${contract.contract_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${contract.contract_delivery_date ? `
              <div class="timeline-item">
                <h4>تاريخ التسليم</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${contract.contract_delivery_date}</span>
                  </div>
                  ${contract.contract_delivery_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${contract.contract_delivery_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${contract.rejection_date ? `
              <div class="timeline-item">
                <h4>تاريخ الرفض</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${contract.rejection_date}</span>
                  </div>
                  ${contract.rejection_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${contract.rejection_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
            </div>
          </div>

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
    <div className="container mx-auto p-4 space-y-6">
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
              <label className="block text-sm font-medium mb-2 text-right">ملاحظات إضافية</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-input rounded-md text-right"
                rows={3}
                placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2"
              >
                <Save size={18} />
                {loading ? 'جاري الإنشاء...' : 'إنشاء العقد'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-header">
          <h2>قائمة العقود</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">
              <p>جاري تحميل العقود...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-4">
              <p>لا توجد عقود حاليًا.</p>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">رقم العقد</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">تاريخ الطلب</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">اسم الصنف</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العيادة المستفيدة</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">صورة التعميد</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التكلفة الإجمالية</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{contract.id}</td>
                      <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{contract.orderDate}</td>
                      <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{contract.itemName}</td>
                      <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{contract.beneficiaryFacility}</td>
                      <td className="p-3">
                        {contract.imagebase64 ? (
                          <button
                            onClick={() => handleViewImage(contract.imagebase64)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium flex items-center gap-1"
                          >
                            <ImageIcon size={16} />
                            عرض الصورة
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">لا توجد صورة</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-800 dark:text-gray-200">
                        {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewContract(contract)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Eye size={14} />
                            عرض
                          </button>
                          <button 
                            onClick={() => handleGeneralModifyContract(contract)}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Settings size={14} />
                            تعديل عام
                          </button>
                          <button 
                            onClick={() => handleEditContract(contract)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Edit size={14} />
                            تعديل حالة
                          </button>
                          <button 
                            onClick={() => handlePrintContract(contract)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Printer size={14} />
                            طباعة
                          </button>
                          <button 
                            onClick={() => handleDeleteContract(contract.id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Trash2 size={14} />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {contracts.map((contract) => (
                <div key={contract.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">عقد رقم: {contract.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(contract.status)}`}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-gray-700 dark:text-gray-300 text-right">
                    <p><span className="font-semibold">تاريخ الطلب:</span> {contract.orderDate}</p>
                    <p><span className="font-semibold">اسم الصنف:</span> {contract.itemName}</p>
                    <p><span className="font-semibold">العيادة المستفيدة:</span> {contract.beneficiaryFacility}</p>
                    <p><span className="font-semibold">التكلفة الإجمالية:</span> {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}</p>
                    {contract.imagebase64 && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleViewImage(contract.imagebase64)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium flex items-center gap-1"
                        >
                          <ImageIcon size={16} />
                          عرض صورة التعميد
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 mt-4">
                    <button 
                      onClick={() => handleViewContract(contract)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      <Eye size={14} />
                      عرض التفاصيل
                    </button>
                    <button 
                      onClick={() => handleGeneralModifyContract(contract)}
                      className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      <Settings size={14} />
                      تعديل عام
                    </button>
                    <button 
                      onClick={() => handleEditContract(contract)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      <Edit size={14} />
                      تعديل حالة
                    </button>
                    <button 
                      onClick={() => handlePrintContract(contract)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      <Printer size={14} />
                      طباعة
                    </button>
                    <button 
                      onClick={() => handleDeleteContract(contract.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      <Trash2 size={14} />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                <label className="block text-sm font-semibold mb-3">تاريخ التحديث</label>
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
                  rows={4}
                  placeholder="أضف ملاحظة حول تحديث الحالة..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={loading || !statusUpdateData.newStatus}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md"
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background pb-4 border-b">
            <DialogTitle className="text-right text-xl font-bold">تعديل عام للعقد</DialogTitle>
            <DialogDescription className="text-right">
              تعديل بيانات العقد رقم: {editingContract?.id}
            </DialogDescription>
          </DialogHeader>
          
          {editingContract && (
            <div className="p-4">
              <form onSubmit={handleUpdateContract} className="space-y-6">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-right">بيانات التواصل للشركة</label>
                    <input
                      type="text"
                      value={editingContract.supplierContact || ''}
                      onChange={(e) => setEditingContract(prev => ({ ...prev, supplierContact: e.target.value }))}
                      className="w-full p-3 border border-input rounded-md text-right"
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

                {/* Status and Delivery */}
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
                  <label className="block text-sm font-medium mb-2 text-right">ملاحظات إضافية</label>
                  <textarea
                    value={editingContract.notes || ''}
                    onChange={(e) => setEditingContract(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-input rounded-md text-right"
                    rows={3}
                    placeholder="ملاحظات حول العقد أو التركيب..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsGeneralModifyDialogOpen(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
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



      {/* Image View Dialog */}
      <Dialog open={isImageViewOpen} onOpenChange={setIsImageViewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-lg shadow-xl">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img src={selectedImage} alt="Full Size" className="max-w-full max-h-[90vh] object-contain" />
            <button
              onClick={() => setIsImageViewOpen(false)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </DialogContent>
      </Dialog>
