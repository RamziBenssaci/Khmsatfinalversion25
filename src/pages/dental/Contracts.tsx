import { useState, useEffect } from 'react';
import { Save, Plus, Eye, Edit, Trash2, Printer } from 'lucide-react';
import { mockFacilities } from '@/data/mockData';
import { dentalContractsApi } from '@/lib/api';
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
    beneficiaryFacility: '', // Now text input instead of select
    financialApprovalNumber: '',
    approvalDate: '',
    totalCost: '',
    supplierName: '',
    supplierContact: '',
    status: 'جديد', // Will be checkbox, always 'جديد'
    deliveryDate: '',
    // Removed actualDeliveryDate field
    notes: ''
  });

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    newStatus: '',
    statusNote: '',
    statusDate: ''
  });
  const { toast } = useToast();

  // Fetch contracts on component mount
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
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
        
        // Reset form
        setFormData({
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
          notes: ''
        });
        
        // Refresh contracts list
        fetchContracts();
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
      
      // Wait for content to load then print
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
      case 'جديد':
        return 'status-new';
      case 'موافق عليه':
        return 'status-approved';
      case 'تم التعاقد':
        return 'status-contracted';
      case 'تم التسليم':
        return 'status-delivered';
      case 'مرفوض':
        return 'status-rejected';
      default:
        return 'status-new';
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
        
        // Refresh contracts list
        fetchContracts();
        setIsEditDialogOpen(false);
        setEditingContract(null);
        setStatusUpdateData({ newStatus: '', statusNote: '', statusDate: '' });
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
    
    // Can move forward in the flow or go to 'مرفوض' from any status
    const availableOptions = [
      ...statusFlow.slice(currentIndex),
      'مرفوض'
    ];
    
    return [...new Set(availableOptions)]; // Remove duplicates
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

            {/* Quantity and Facility - Updated beneficiaryFacility to text input */}
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
                <input
                  type="text"
                  value={formData.beneficiaryFacility}
                  onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryFacility: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="اسم عيادة الأسنان المستفيدة"
                  required
                />
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

            {/* Status and Delivery - Updated status to checkbox */}
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
                placeholder="ملاحظات حول العقد أو التركيب..."
              />
            </div>

            <div className="flex justify-start">
              <button 
                type="submit" 
                disabled={loading}
                className="admin-btn-success flex items-center gap-2 px-6 py-3 disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'جاري الحفظ...' : 'حفظ عقد الأسنان'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Dental Contracts Table */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>عقود الأسنان الحديثة</h2>
        </div>
        <div className="p-4">
          <div className="responsive-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3">رقم العقد</th>
                  <th className="p-3 mobile-hidden">نوع الجهاز</th>
                  <th className="p-3 mobile-hidden">العيادة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 mobile-hidden">التكلفة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      جاري تحميل العقود...
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      لا توجد عقود أسنان مسجلة
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract, index) => (
                    <tr key={contract.id || index} className="border-b border-border text-right">
                      <td className="p-3 font-medium">{contract.id}</td>
                      <td className="p-3 mobile-hidden">{contract.itemName}</td>
                      <td className="p-3 mobile-hidden">{contract.beneficiaryFacility}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3 mobile-hidden">
                        {contract.totalCost ? `${Number(contract.totalCost).toLocaleString()} ريال` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewContract(contract)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye size={14} />
                            عرض
                          </button>
                          <button 
                            onClick={() => handleEditContract(contract)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Edit size={14} />
                            تعديل
                          </button>
                          <button 
                            onClick={() => handlePrintContract(contract)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Printer size={14} />
                            طباعة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
            <div className="space-y-8 p-2">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-blue-800 dark:text-blue-200">المعلومات الأساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">رقم العقد</label>
                    <p className="font-semibold text-lg bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.id || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">رقم الصنف</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.itemNumber || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">اسم الصنف</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.itemName || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">الكمية</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.quantity || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">العيادة المستفيدة</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.beneficiaryFacility || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">تاريخ الطلب</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.orderDate || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information Section */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-green-800 dark:text-green-200">المعلومات المالية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">رقم التعميد المالي</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.financialApprovalNumber || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">تاريخ التعميد</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.approvalDate || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">التكلفة الإجمالية</label>
                    <p className="font-semibold text-lg bg-white dark:bg-gray-800 p-2 rounded">
                      {selectedContract.totalCost ? `${Number(selectedContract.totalCost).toLocaleString()} ريال` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Information Section */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-purple-800 dark:text-purple-200">معلومات المورد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">شركة الأجهزة</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.supplierName || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">بيانات التواصل</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.supplierContact || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status and Delivery Section */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-orange-800 dark:text-orange-200">الحالة والتسليم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-orange-600 dark:text-orange-300 mb-2">حالة العقد</label>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(selectedContract.status)}`}>
                        {selectedContract.status || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-orange-600 dark:text-orange-300 mb-2">تاريخ التسليم المخطط</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedContract.deliveryDate || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedContract.notes && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 p-6 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4 text-right text-gray-800 dark:text-gray-200">الملاحظات</h3>
                  <div className="text-right">
                    <p className="font-medium bg-white dark:bg-gray-800 p-4 rounded-lg border">{selectedContract.notes}</p>
                  </div>
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
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">ملاحظة التحديث</label>
                <textarea
                  value={statusUpdateData.statusNote}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusNote: e.target.value }))}
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows={4}
                  placeholder="ملاحظة حول تغيير الحالة..."
                />
              </div>

              <div className="flex justify-start gap-3 pt-4">
                <button 
                  onClick={handleStatusUpdate}
                  disabled={loading || !statusUpdateData.newStatus}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'جاري الحفظ...' : 'حفظ التحديث'}
                </button>
                <button 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to get status styling
function getStatusStyle(status: string) {
  switch (status) {
    case 'جديد':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'موافق عليه':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'تم التعاقد':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'تم التسليم':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'مرفوض':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}
