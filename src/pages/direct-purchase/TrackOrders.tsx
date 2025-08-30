import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, Save, Edit, Printer } from 'lucide-react';
import { directPurchaseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { mockFacilities } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TrackOrders() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    newStatus: '',
    statusNote: '',
    statusDate: '' // Added status date field
  });

  // New states for Image Dialog
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageToShow, setImageToShow] = useState<string | null>(null);

  // Available status options for approved orders
  const statusOptions = [
    { value: 'جديد', label: 'جديد' },
    { value: 'موافق عليه', label: 'موافق عليه' },
    { value: 'تم التعاقد', label: 'تم التعاقد' },
    { value: 'تم التسليم', label: 'تم التسليم' },
    { value: 'مرفوض', label: 'مرفوض' }
  ];

  useEffect(() => {
    loadOrders();
    loadFacilities();
  }, []);

  // React-based filtering (fast, client-side as requested)
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (facilityFilter) {
      filtered = filtered.filter(order => order.beneficiary_facility === facilityFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, facilityFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await directPurchaseApi.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب طلبات الشراء",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const response = await reportsApi.getFacilities();
      if (response.success) {
        setFacilities(response.data);
      }
    } catch (error) {
      setFacilities(mockFacilities);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setStatusUpdateData({
      newStatus: order.status,
      statusNote: '',
      statusDate: '' // Reset date when opening dialog
    });
    setIsEditDialogOpen(true);
  };

  // New handler to show image dialog
  const handleShowImage = (imageBase64: string | undefined) => {
    if (!imageBase64) {
      toast({
        title: "لا توجد صورة",
        description: "لا توجد صورة متاحة لهذا الطلب.",
        variant: "destructive",
      });
      return;
    }
    setImageToShow(imageBase64);
    setIsImageDialogOpen(true);
  };

  const handlePrintOrder = (order: any) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب الشراء المباشر - ${order.id}</title>
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
            <h1>طلب الشراء المباشر</h1>
            <p>رقم الطلب: ${order.order_number || order.id}</p>
          </div>
          <div class="section">
            <div class="section-header">
              <h2>المعلومات الأساسية</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>رقم الطلب</label>
                  <span>${order.order_number || order.id}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ الطلب</label>
                  <span>${order.order_date || '-'}</span>
                </div>
                <div class="info-item">
                  <label>اسم الصنف</label>
                  <span>${order.item_name || '-'}</span>
                </div>
                <div class="info-item">
                  <label>الكمية</label>
                  <span>${order.quantity || '-'}</span>
                </div>
                <div class="info-item">
                  <label>الجهة المستفيدة</label>
                  <span>${order.beneficiary_facility || '-'}</span>
                </div>
                <div class="info-item">
                  <label>التكلفة الإجمالية</label>
                  <span>${order.total_cost ? `${Number(order.total_cost).toLocaleString()} ريال` : '-'}</span>
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
                  <span>${order.financialApprovalNumber || '-'}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ التعميد</label>
                  <span>${order.financialApprovalDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          ${order.supplier_name ? `
          <div class="section">
            <div class="section-header">
              <h2>معلومات المورد</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>اسم المورد</label>
                  <span>${order.supplier_name}</span>
                </div>
                ${order.supplier_contact ? `
                <div class="info-item">
                  <label>بيانات التواصل</label>
                  <span>${order.supplier_contact}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}
          <div class="section">
            <div class="section-header">
              <h2>الحالة</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                  <label>حالة الطلب</label>
                  <span class="status-badge ${getStatusClass(order.status)}">${order.status || '-'}</span>
              </div>
            </div>
          </div>
          ${order.notes ? `
          <div class="section">
            <div class="section-header">
              <h2>الملاحظات</h2>
            </div>
            <div class="section-content">
              <div class="notes-section">
                <p>${order.notes}</p>
              </div>
            </div>
          </div>
          ` : ''}
          <div class="section">
            <div class="section-header">
              <h2>سجل حالات الطلب</h2>
            </div>
            <div class="section-content">
              ${order.creation_date ? `
              <div class="timeline-item">
                <h4>تاريخ الإنشاء</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.creation_date}</span>
                  </div>
                  ${order.creation_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${order.creation_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.contract_approval_date ? `
              <div class="timeline-item">
                <h4>تاريخ الموافقة</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.contract_approval_date}</span>
                  </div>
                  ${order.contract_approval_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${order.contract_approval_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.contract_date ? `
              <div class="timeline-item">
                <h4>تاريخ التعاقد</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.contract_date}</span>
                  </div>
                  ${order.contract_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${order.contract_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.contract_delivery_date ? `
              <div class="timeline-item">
                <h4>تاريخ التسليم</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.contract_delivery_date}</span>
                  </div>
                  ${order.contract_delivery_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${order.contract_delivery_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.rejection_date ? `
              <div class="timeline-item">
                <h4>تاريخ الرفض</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.rejection_date}</span>
                  </div>
                  ${order.rejection_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${order.rejection_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          <div class="footer">
            <p>تم طباعة هذا الطلب في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
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
    if (!editingOrder || !statusUpdateData.newStatus || !statusUpdateData.statusDate) return;

    try {
      setIsUpdatingStatus(true);

      // Use the existing updateOrder API but with status update data including the date
      const updatedOrderData = {
        ...editingOrder,
        status: statusUpdateData.newStatus,
        statusNote: statusUpdateData.statusNote,
        statusDate: statusUpdateData.statusDate // This will be sent to your Laravel backend
      };

      const response = await directPurchaseApi.updateOrder(editingOrder.id, updatedOrderData);

      if (response.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث حالة الطلب بنجاح",
        });

        // Refresh orders list
        loadOrders();
        setIsEditDialogOpen(false);
        setEditingOrder(null);
        setStatusUpdateData({ newStatus: '', statusNote: '', statusDate: '' });
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800';
      case 'موافق عليه': return 'bg-green-100 text-green-800';
      case 'تم التعاقد': return 'bg-purple-100 text-purple-800';
      case 'تم التسليم': return 'bg-emerald-100 text-emerald-800';
      case 'مرفوض': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get status styling for detailed view
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

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">متابعة طلبات الشراء المباشر</h1>
        <p className="text-muted-foreground mt-2">تتبع ومراقبة حالة جميع طلبات الشراء المباشر</p>
      </div>
      <div className="admin-card">
        <div className="admin-header">
          <h2>متابعة مسار الطلبات</h2>
        </div>
        <div className="p-6">
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-input rounded-md text-right"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الحالات</option>
              <option value="جديد">جديد</option>
              <option value="موافق عليه">موافق عليه</option>
              <option value="تم التعاقد">تم التعاقد</option>
              <option value="تم التسليم">تم التسليم</option>
              <option value="مرفوض">مرفوض</option>
            </select>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الجهات</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.name}>{facility.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setFacilityFilter('');
              }}
              className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
            >
              <Filter size={16} />
              مسح الفلاتر
            </button>
          </div>

          {/* Responsive Orders Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد طلبات شراء</p>
            </div>
          ) : (
            <div>
              {/* Desktop / Tablet Table */}
              <table className="w-full text-sm table-fixed border-collapse hidden sm:table">
                <thead>
                  <tr className="border-b border-border text-right">
                    <th className="p-3 w-24">رقم الطلب</th>
                    <th className="p-3 mobile-hidden w-28">تاريخ الطلب</th>
                    <th className="p-3 w-36">اسم الصنف</th>
                    <th className="p-3 mobile-hidden w-44">الجهة المستفيدة</th>
                    <th className="p-3 mobile-hidden w-20">الكمية</th>
                    <th className="p-3 mobile-hidden w-36">رقم التعميد المالي</th>
                    <th className="p-3 mobile-hidden w-28">تاريخ التعميد</th>
                    <th className="p-3 w-24">الحالة</th>
                    <th className="p-3 mobile-hidden w-32">التكلفة</th>
                    <th className="p-3 mobile-hidden w-36 text-center">صورة التعميد</th>
                    <th className="p-3 w-52">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border text-right hover:bg-muted/50">
                      <td className="p-3 font-medium">{order.order_number || order.id}</td>
                      <td className="p-3 mobile-hidden">{order.order_date}</td>
                      <td className="p-3">{order.item_name}</td>
                      <td className="p-3 mobile-hidden">{order.beneficiary_facility}</td>
                      <td className="p-3 mobile-hidden">{order.quantity}</td>
                      <td className="p-3 mobile-hidden">{order.financialApprovalNumber || '-'}</td>
                      <td className="p-3 mobile-hidden">{order.financialApprovalDate || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 mobile-hidden">
                        {order.total_cost ? `${Number(order.total_cost).toLocaleString()} ريال` : '-'}
                      </td>
                      <td className="p-3 mobile-hidden text-center">
                        <button
                          onClick={() => handleShowImage(order.image_url)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors mx-auto"
                          title="عرض صورة التعميد"
                        >
                          <Eye size={14} />
                          صورة التعميد
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye size={14} />
                            عرض
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Edit size={14} />
                            تعديل
                          </button>
                          <button
                            onClick={() => handlePrintOrder(order)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Printer size={14} />
                            طباعة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Table - Card style */}
              <div className="space-y-4 sm:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                    dir="rtl"
                  >
                    <div className="flex justify-between mb-2 items-center">
                      <div className="font-semibold text-lg">{order.item_name || '-'}</div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {order.status || '-'}
                      </span>
                    </div>

                    <div className="space-y-2 text-right text-sm">
                      <div>
                        <strong>رقم الطلب: </strong>
                        <span>{order.order_number || order.id}</span>
                      </div>
                      <div>
                        <strong>تاريخ الطلب: </strong>
                        <span>{order.order_date || '-'}</span>
                      </div>
                      <div>
                        <strong>الجهة المستفيدة: </strong>
                        <span>{order.beneficiary_facility || '-'}</span>
                      </div>
                      <div>
                        <strong>الكمية: </strong>
                        <span>{order.quantity || '-'}</span>
                      </div>
                      <div>
                        <strong>رقم التعميد المالي: </strong>
                        <span>{order.financialApprovalNumber || '-'}</span>
                      </div>
                      <div>
                        <strong>تاريخ التعميد: </strong>
                        <span>{order.financialApprovalDate || '-'}</span>
                      </div>
                      <div>
                        <strong>التكلفة: </strong>
                        <span>{order.total_cost ? `${Number(order.total_cost).toLocaleString()} ريال` : '-'}</span>
                      </div>
                      {order.supplier_name && (
                        <div>
                          <strong>اسم المورد: </strong>
                          <span>{order.supplier_name}</span>
                        </div>
                      )}
                      {order.supplier_contact && (
                        <div>
                          <strong>بيانات التواصل: </strong>
                          <span>{order.supplier_contact}</span>
                        </div>
                      )}
                      <div className="flex justify-start gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eye size={14} />
                          عرض
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit size={14} />
                          تعديل
                        </button>
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Printer size={14} />
                          طباعة
                        </button>
                        <button
                          onClick={() => handleShowImage(order.image_url)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eye size={14} />
                          صورة التعميد
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Popup */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background pb-4 border-b">
            <DialogTitle className="text-right text-xl font-bold">تفاصيل طلب الشراء المباشر</DialogTitle>
            <DialogDescription className="text-right">
              عرض تفاصيل الطلب رقم: {selectedOrder?.order_number || selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-8 p-2">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-blue-800 dark:text-blue-200">المعلومات الأساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">رقم الطلب</label>
                    <p className="font-semibold text-lg bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.order_number || selectedOrder.id}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">تاريخ الطلب</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.order_date || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">اسم الصنف</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.item_name || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">الكمية</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.quantity || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">الجهة المستفيدة</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.beneficiary_facility || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">التكلفة الإجمالية</label>
                    <p className="font-semibold text-lg bg-white dark:bg-gray-800 p-2 rounded">
                      {selectedOrder.total_cost ? `${Number(selectedOrder.total_cost).toLocaleString()} ريال` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Information Section */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-green-800 dark:text-green-200">المعلومات المالية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">رقم التعميد المالي</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.financialApprovalNumber || '-'}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-green-600 dark:text-green-300 mb-2">تاريخ التعميد</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.financialApprovalDate || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information Section */}
              {(selectedOrder.supplier_name || selectedOrder.supplier_contact) && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4 text-right text-purple-800 dark:text-purple-200">معلومات المورد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedOrder.supplier_name && (
                      <div className="text-right">
                        <label className="block text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">اسم المورد</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.supplier_name}</p>
                      </div>
                    )}
                    {selectedOrder.supplier_contact && (
                      <div className="text-right">
                        <label className="block text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">بيانات التواصل</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.supplier_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Section */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-right text-orange-800 dark:text-orange-200">الحالة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-orange-600 dark:text-orange-300 mb-2">حالة الطلب</label>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(selectedOrder.status)}`}>
                        {selectedOrder.status || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedOrder.notes && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 p-6 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4 text-right text-gray-800 dark:text-gray-200">الملاحظات</h3>
                  <div className="text-right">
                    <p className="font-medium bg-white dark:bg-gray-800 p-4 rounded-lg border">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Status History Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-6 text-right text-indigo-800 dark:text-indigo-200">سجل حالات الطلب</h3>
                <div className="space-y-4">
                  {/* Creation Date */}
                  {selectedOrder.creation_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">تاريخ الإنشاء</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.creation_date}</p>
                      </div>
                      {selectedOrder.creation_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">ملاحظة الإنشاء</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.creation_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Contract Approval Date */}
                  {selectedOrder.contract_approval_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border-l-4 border-teal-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">تاريخ الموافقة</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_approval_date}</p>
                      </div>
                      {selectedOrder.contract_approval_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">ملاحظة الموافقة</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_approval_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Contract Date */}
                  {selectedOrder.contract_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">تاريخ التعاقد</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_date}</p>
                      </div>
                      {selectedOrder.contract_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">ملاحظة التعاقد</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Delivery Date */}
                  {selectedOrder.contract_delivery_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border-l-4 border-emerald-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">تاريخ التسليم</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_delivery_date}</p>
                      </div>
                      {selectedOrder.contract_delivery_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">ملاحظة التسليم</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_delivery_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Rejection Date */}
                  {selectedOrder.rejection_date && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border-l-4 border-red-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">تاريخ الرفض</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.rejection_date}</p>
                      </div>
                      {selectedOrder.rejection_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">ملاحظة الرفض</label>
                          <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.rejection_date_note}</p>
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

      {/* Edit Order Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">تعديل حالة الطلب</DialogTitle>
            <DialogDescription className="text-right">
              تعديل حالة الطلب رقم: {editingOrder?.order_number || editingOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-6 p-4">
              <div className="text-right bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium text-muted-foreground mb-2">الحالة الحالية</label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(editingOrder.status)}`}>
                  {editingOrder.status}
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
                  {getStatusOptions(editingOrder.status).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">تاريخ التحديث *</label>
                <input
                  type="date"
                  value={statusUpdateData.statusDate}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusDate: e.target.value }))}
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
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
                  disabled={isUpdatingStatus || !statusUpdateData.newStatus || !statusUpdateData.statusDate}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {isUpdatingStatus ? 'جاري الحفظ...' : 'حفظ التحديث'}
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

      {/* Image Display Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-4 flex flex-col items-center justify-center">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">صورة التعميد</DialogTitle>
            <DialogDescription className="text-right">عرض صورة التعميد الخاصة بالطلب</DialogDescription>
          </DialogHeader>
          {imageToShow ? (
            <img
              src={imageToShow}
              alt="صورة التعميد"
              className="max-w-full max-h-[70vh] rounded-md shadow-md"
            />
          ) : (
            <p className="text-center text-muted-foreground">لا توجد صورة للعرض.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
