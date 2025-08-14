
import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, Printer, X, Save, Loader2, AlertTriangle, FileText, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';

// Utility function to calculate downtime period
const calculateDowntimePeriod = (reportDate: string, reportTime: string, resolvedAt?: string) => {
  const startDateTime = new Date(`${reportDate}T${reportTime}`);
  const endDateTime = resolvedAt ? new Date(resolvedAt) : new Date();
  const diffTime = Math.abs(endDateTime.getTime() - startDateTime.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} يوم ${diffHours} ساعة`;
  } else if (diffHours > 0) {
    return `${diffHours} ساعة ${diffMinutes} دقيقة`;
  } else {
    return `${diffMinutes} دقيقة`;
  }
};

// PDF export function using browser only
const exportToPDF = (data, filename) => {
  const printContent = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          margin: 20px;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: right;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #333;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>قائمة البلاغات</h1>
        <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
        <p>عدد البلاغات: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>رقم البلاغ</th>
            <th>المنشأة</th>
            <th>التصنيف</th>
            <th>اسم الجهاز</th>
            <th>وصف المشكلة</th>
            <th>الحالة</th>
            <th>تاريخ البلاغ</th>
            <th>فترة التوقف (أيام)</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(report => `
            <tr>
              <td>${report.id}</td>
              <td>${report.facilityName}</td>
              <td>${report.category}</td>
              <td>${report.deviceName}</td>
              <td>${report.problem_description || 'غير محدد'}</td>
              <td>${report.status}</td>
              <td>${report.reportDate}</td>
              <td>${report.downtimeDays}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

// Excel export function
const exportToExcel = (data, filename) => {
  const csvContent = [
    ['رقم البلاغ', 'المنشأة', 'التصنيف', 'اسم الجهاز', 'وصف المشكلة', 'الحالة', 'تاريخ البلاغ', 'فترة التوقف (أيام)'],
    ...data.map(report => [
      report.id,
      report.facilityName,
      report.category,
      report.deviceName,
      report.problem_description || 'غير محدد',
      report.status,
      report.reportDate,
      report.downtimeDays
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function ReportsList() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingReport, setEditingReport] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  const [deleteConfirmReport, setDeleteConfirmReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [modifyingReport, setModifyingReport] = useState(null);
  const [modifyFormData, setModifyFormData] = useState({
    status: '',
    resolution: '',
    resolved_at: ''
  });

  const handleModifyClick = (report) => {
    setModifyingReport(report);
    setModifyFormData({
      status: report.status || '',
      resolution: report.resolution || '',
      resolved_at: ''
    });
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const updateData: any = {
        status: modifyFormData.status,
        resolution: modifyFormData.resolution
      };

      // Add resolved_at from form input if provided
      if (modifyFormData.resolved_at) {
        updateData.resolved_at = modifyFormData.resolved_at;
      }

      const response = await reportsApi.updateReport(modifyingReport.id, updateData);
      
      if (response.success) {
        toast({
          title: "تم تحديث البلاغ بنجاح",
          description: "تم حفظ التغييرات على البلاغ",
        });

        setReports(prev => 
          prev.map(report => 
            report.id === modifyingReport.id 
              ? { ...report, ...updateData }
              : report
          )
        );
        
        setModifyingReport(null);
      } else {
        toast({
          title: "خطأ في تحديث البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تحديث البلاغ",
        description: error.message || "فشل في تحديث البلاغ",
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const [editFormData, setEditFormData] = useState({
    category: '',
    device_name: '',
    serial_number: '',
    problem_description: '',
    under_warranty: '',
    repair_company: '',
    contact_number: '',
    email: '',
    reporter_name: '',
    reporter_contact: '',
    status: '',
    notes: '',
    resolution: '',
    resolved_by: ''
  });

  // Predefined categories
  const predefinedCategories = [
    'صيانة طبية',
    'صيانة عامة', 
    'تقنية المعلومات',
    'أمن وسلامة',
    'التموين الطبي',
    'أخرى'
  ];

  // Predefined statuses
  const predefinedStatuses = ['مفتوح', 'مغلق', 'مكهن'];

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await reportsApi.getReports();
        if (response.success) {
          setReports(response.data || []);
        } else {
          toast({
            title: "خطأ في تحميل البلاغات",
            description: response.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "خطأ في تحميل البلاغات",
          description: error.message || "فشل في تحميل قائمة البلاغات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [toast]);

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    return (
      (searchTerm === '' || 
       report.facility?.name?.includes(searchTerm) || 
       report.problem_description?.includes(searchTerm) ||
       report.device_name?.includes(searchTerm) ||
       report.id?.toString().includes(searchTerm)) &&
      (selectedFacility === '' || report.facility?.name === selectedFacility) &&
      (selectedCategory === '' || report.category === selectedCategory) &&
      (selectedStatus === '' || report.status === selectedStatus)
    );
  });

  // Get unique values for filters
  const facilities = [...new Set(reports.map(r => r.facility?.name).filter(Boolean))];

  const handleEditClick = (report) => {
    setEditingReport(report);
    setEditFormData({
      category: report.category || '',
      device_name: report.device_name || '',
      serial_number: report.serial_number || '',
      problem_description: report.problem_description || '',
      under_warranty: report.under_warranty || '',
      repair_company: report.repair_company || '',
      contact_number: report.contact_number || '',
      email: report.email || '',
      reporter_name: report.reporter_name || '',
      reporter_contact: report.reporter_contact || '',
      status: report.status || '',
      notes: report.notes || '',
      resolution: report.resolution || '',
      resolved_by: report.resolved_by || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      // Add resolved_at timestamp when status changes to closed or paused
      const updateData: any = { ...editFormData };
      if ((editFormData.status === 'مغلق' || editFormData.status === 'مكهن') && 
          editingReport.status === 'مفتوح') {
        updateData.resolved_at = new Date().toISOString();
      }

      const response = await reportsApi.updateReport(editingReport.id, updateData);
      
      if (response.success) {
        toast({
          title: "تم تحديث البلاغ بنجاح",
          description: "تم حفظ التغييرات على البلاغ",
        });

        setReports(prev => 
          prev.map(report => 
            report.id === editingReport.id 
              ? { ...report, ...updateData }
              : report
          )
        );
        
        setEditingReport(null);
      } else {
        toast({
          title: "خطأ في تحديث البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تحديث البلاغ",
        description: error.message || "فشل في تحديث البلاغ",
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteClick = (report) => {
    setDeleteConfirmReport(report);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmReport) return;

    setDeleteLoading(deleteConfirmReport.id);

    try {
      const response = await reportsApi.deleteReport(deleteConfirmReport.id);
      
      if (response.success) {
        toast({
          title: "تم حذف البلاغ بنجاح",
          description: "تم حذف البلاغ من النظام",
        });

        setReports(prev => prev.filter(report => report.id !== deleteConfirmReport.id));
        setDeleteConfirmReport(null);
      } else {
        toast({
          title: "خطأ في حذف البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في حذف البلاغ",
        description: error.message || "فشل في حذف البلاغ",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewClick = (report) => {
    setViewingReport(report);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrintReport = (report) => {
    const downtimePeriod = calculateDowntimePeriod(
      report.report_date,
      report.report_time,
      report.resolved_at
    );

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير بلاغ - ${report.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          .status {
            padding: 5px 15px;
            border-radius: 15px;
            display: inline-block;
            font-weight: bold;
          }
          .status-open { background: #fff3cd; color: #856404; }
          .status-closed { background: #d1edff; color: #0c5460; }
          .status-paused { background: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير بلاغ رقم ${report.id}</h1>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">رقم البلاغ:</div>
            <div>${report.id}</div>
          </div>
          <div class="info-item">
            <div class="info-label">المنشأة:</div>
            <div>${report.facility?.name || 'غير محدد'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">تاريخ البلاغ:</div>
            <div>${report.report_date} ${report.report_time}</div>
          </div>
          <div class="info-item">
            <div class="info-label">الحالة:</div>
            <div>
              <span class="status ${
                report.status === 'مفتوح' ? 'status-open' :
                report.status === 'مغلق' ? 'status-closed' : 'status-paused'
              }">
                ${report.status}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">التصنيف:</div>
            <div>${report.category}</div>
          </div>
          <div class="info-item">
            <div class="info-label">اسم الجهاز:</div>
            <div>${report.device_name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">الرقم التسلسلي:</div>
            <div>${report.serial_number || 'غير محدد'}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">وصف المشكلة:</div>
            <div>${report.problem_description || 'غير محدد'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">تحت الضمان:</div>
            <div>${report.under_warranty || 'غير محدد'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">شركة الصيانة:</div>
            <div>${report.repair_company || 'غير محدد'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">رقم الاتصال:</div>
            <div>${report.contact_number || 'غير محدد'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">البريد الإلكتروني:</div>
            <div>${report.email || 'غير محدد'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">اسم المبلغ:</div>
            <div>${report.reporter_name || 'غير محدد'}</div>
          </div>
          ${report.notes ? `
            <div class="info-item full-width">
              <div class="info-label">ملاحظات:</div>
              <div>${report.notes}</div>
            </div>
          ` : ''}
          ${report.resolution ? `
            <div class="info-item full-width">
              <div class="info-label">الحل:</div>
              <div>${report.resolution}</div>
            </div>
          ` : ''}
          ${report.resolved_at ? `
            <div class="info-item">
              <div class="info-label">تاريخ الإغلاق/التكهين:</div>
              <div>${new Date(report.resolved_at).toLocaleDateString('ar-SA')}</div>
            </div>
          ` : ''}
          <div class="info-item">
            <div class="info-label">فترة التوقف:</div>
            <div>${downtimePeriod}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredReports.map(report => ({
        id: report.id,
        facilityName: report.facility?.name || '',
        category: report.category,
        deviceName: report.device_name,
        problem_description: report.problem_description || 'غير محدد',
        status: report.status,
        reportDate: `${report.report_date} ${report.report_time}`,
        downtimeDays: calculateDowntimePeriod(report.report_date, report.report_time, report.resolved_at)
      }));
      
      exportToExcel(exportData, 'قائمة_البلاغات');
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم تصدير البلاغات إلى ملف Excel",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    try {
      const exportData = filteredReports.map(report => ({
        id: report.id,
        facilityName: report.facility?.name || '',
        category: report.category,
        deviceName: report.device_name,
        problem_description: report.problem_description || 'غير محدد',
        status: report.status,
        reportDate: `${report.report_date} ${report.report_time}`,
        downtimeDays: calculateDowntimePeriod(report.report_date, report.report_time, report.resolved_at)
      }));
      
      exportToPDF(exportData, 'قائمة_البلاغات');
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم تصدير البلاغات إلى ملف PDF",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-3">جاري تحميل البلاغات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">قائمة البلاغات</h1>
        <p className="text-muted-foreground mt-2">عرض وإدارة جميع البلاغات المستلمة</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Filter size={20} />
            البحث والتصفية
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في البلاغات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Facility Filter */}
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع المنشآت</option>
              {facilities.map(facility => (
                <option key={facility} value={facility}>{facility}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع التصنيفات</option>
              {predefinedCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الحالات</option>
              {predefinedStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6">
            <button 
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">تصدير Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">تصدير PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText size={20} />
            البلاغات ({filteredReports.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right">
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100">رقم البلاغ</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">المنشأة</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100">التصنيف</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100 hidden lg:table-cell">الجهاز</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100 hidden xl:table-cell">وصف المشكلة</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100 hidden sm:table-cell">التاريخ</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100">الحالة</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100 hidden sm:table-cell">فترة التوقف</th>
                <th className="p-4 font-medium text-gray-900 dark:text-gray-100">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const downtimePeriod = calculateDowntimePeriod(
                  report.report_date,
                  report.report_time,
                  report.resolved_at
                );
                
                return (
                  <tr key={report.id} className="border-b border-gray-200 dark:border-gray-700 text-right hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-4 font-medium text-blue-600 dark:text-blue-400">{report.id}</td>
                    <td className="p-4 hidden md:table-cell text-gray-700 dark:text-gray-300">{report.facility?.name || 'غير محدد'}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{report.category}</td>
                    <td className="p-4 hidden lg:table-cell text-gray-700 dark:text-gray-300">{report.device_name}</td>
                    <td className="p-4 hidden xl:table-cell text-gray-700 dark:text-gray-300 max-w-xs truncate" title={report.problem_description}>{report.problem_description}</td>
                    <td className="p-4 hidden sm:table-cell text-gray-700 dark:text-gray-300">{report.report_date}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.status === 'مفتوح' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        report.status === 'مغلق' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock size={14} />
                        {downtimePeriod}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <button 
                          onClick={() => handleViewClick(report)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors" 
                          title="عرض"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleModifyClick(report)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors" 
                          title="تعديل الحالة"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handlePrintReport(report)}
                          className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded transition-colors hidden sm:inline-block" 
                          title="طباعة"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(report)}
                          disabled={deleteLoading === report.id}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors hidden sm:inline-block" 
                          title="حذف"
                        >
                          {deleteLoading === report.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">لا توجد بلاغات تطابق معايير البحث</p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText size={24} />
                تفاصيل البلاغ رقم {viewingReport.id}
              </h2>
              <button 
                onClick={() => setViewingReport(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Downtime Counter */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock size={24} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">عداد فترة التوقف</h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      {calculateDowntimePeriod(viewingReport.report_date, viewingReport.report_time, viewingReport.resolved_at)}
                      من تاريخ الإنشاء {viewingReport.resolved_at ? 'حتى تاريخ الإغلاق' : 'حتى الآن'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم البلاغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md font-mono text-blue-600 dark:text-blue-400">{viewingReport.id}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">المنشأة</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.facility?.name || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاريخ البلاغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.report_date}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">وقت البلاغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.report_time}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">التصنيف</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.category}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الحالة</label>
                  <div className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingReport.status === 'مفتوح' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      viewingReport.status === 'مغلق' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {viewingReport.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">اسم الجهاز</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.device_name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الرقم التسلسلي</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.serial_number || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تحت الضمان</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.under_warranty || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">شركة الصيانة</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.repair_company || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم الاتصال</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.contact_number || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">البريد الإلكتروني</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.email || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">اسم المبلغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.reporter_name || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">رقم اتصال المبلغ</label>
                  <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{viewingReport.reporter_contact || 'غير محدد'}</p>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">وصف المشكلة</label>
                <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md leading-relaxed min-h-[100px] border-l-4 border-blue-500">
                  {viewingReport.problem_description}
                </p>
              </div>

              {/* Notes */}
              {viewingReport.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ملاحظات</label>
                  <p className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md leading-relaxed border-l-4 border-yellow-500">
                    {viewingReport.notes}
                  </p>
                </div>
              )}

              {/* Resolution */}
              {viewingReport.resolution && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الحل</label>
                  <p className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md leading-relaxed border-l-4 border-green-500">
                    {viewingReport.resolution}
                  </p>
                </div>
              )}

              {/* Resolution Details */}
              {(viewingReport.resolved_at || viewingReport.resolved_by) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">تفاصيل الإغلاق/التكهين</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingReport.resolved_at && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-green-700 dark:text-green-300">تاريخ الإغلاق/التكهين</label>
                        <p className="p-3 bg-white dark:bg-gray-800 rounded-md">
                          {viewingReport.resolved_at}
                        </p>
                      </div>
                    )}
                    {viewingReport.resolved_by && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-green-700 dark:text-green-300">تم الحل بواسطة</label>
                        <p className="p-3 bg-white dark:bg-gray-800 rounded-md">{viewingReport.resolved_by}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={20} />
                تأكيد الحذف
              </h2>
              <button 
                onClick={() => setDeleteConfirmReport(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">هل أنت متأكد من حذف هذا البلاغ؟</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  سيتم حذف البلاغ رقم <strong>{deleteConfirmReport.id}</strong> نهائياً من النظام ولا يمكن استرداده.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-right space-y-2">
                  <p><strong>التصنيف:</strong> {deleteConfirmReport.category}</p>
                  <p><strong>الجهاز:</strong> {deleteConfirmReport.device_name}</p>
                  <p><strong>المنشأة:</strong> {deleteConfirmReport.facility?.name || 'غير محدد'}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setDeleteConfirmReport(null)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading === deleteConfirmReport.id}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors"
                >
                  {deleteLoading === deleteConfirmReport.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      حذف نهائي
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Edit size={24} />
                تعديل البلاغ رقم {editingReport.id}
              </h2>
              <button 
                onClick={() => setEditingReport(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Status Change Notice */}
              {editFormData.status !== editingReport.status && 
               (editFormData.status === 'مغلق' || editFormData.status === 'مكهن') && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Clock size={20} />
                    <span className="font-medium">
                      سيتم تسجيل تاريخ {editFormData.status === 'مغلق' ? 'الإغلاق' : 'التكهين'} تلقائياً عند الحفظ
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">التصنيف</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => handleEditInputChange('category', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر التصنيف</option>
                    {predefinedCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">اسم الجهاز</label>
                  <input
                    type="text"
                    value={editFormData.device_name}
                    onChange={(e) => handleEditInputChange('device_name', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">الرقم التسلسلي</label>
                  <input
                    type="text"
                    value={editFormData.serial_number}
                    onChange={(e) => handleEditInputChange('serial_number', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">تحت الضمان</label>
                  <select
                    value={editFormData.under_warranty}
                    onChange={(e) => handleEditInputChange('under_warranty', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">غير محدد</option>
                    <option value="yes">نعم</option>
                    <option value="no">لا</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">شركة الصيانة</label>
                  <input
                    type="text"
                    value={editFormData.repair_company}
                    onChange={(e) => handleEditInputChange('repair_company', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">رقم الاتصال</label>
                  <input
                    type="text"
                    value={editFormData.contact_number}
                    onChange={(e) => handleEditInputChange('contact_number', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">اسم المبلغ</label>
                  <input
                    type="text"
                    value={editFormData.reporter_name}
                    onChange={(e) => handleEditInputChange('reporter_name', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">رقم اتصال المبلغ</label>
                  <input
                    type="text"
                    value={editFormData.reporter_contact}
                    onChange={(e) => handleEditInputChange('reporter_contact', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">الحالة</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => handleEditInputChange('status', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {predefinedStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                {(editFormData.status === 'مغلق' || editFormData.status === 'مكهن') && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">تم الحل بواسطة</label>
                    <input
                      type="text"
                      value={editFormData.resolved_by}
                      onChange={(e) => handleEditInputChange('resolved_by', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="اسم الشخص المسؤول عن الحل"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">وصف المشكلة</label>
                <textarea
                  value={editFormData.problem_description}
                  onChange={(e) => handleEditInputChange('problem_description', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">ملاحظات</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => handleEditInputChange('notes', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {(editFormData.status === 'مغلق' || editFormData.status === 'مكهن') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">تفاصيل الحل</label>
                  <textarea
                    value={editFormData.resolution}
                    onChange={(e) => handleEditInputChange('resolution', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="وصف تفصيلي للحل المتخذ..."
                  />
                </div>
              )}

              {/* Downtime Display */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-gray-600 dark:text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">فترة التوقف الحالية</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {calculateDowntimePeriod(editingReport.report_date, editingReport.report_time, editingReport.resolved_at)}
                      من تاريخ الإنشاء {editingReport.resolved_at ? 'حتى تاريخ الإغلاق' : 'حتى الآن'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Status Modal */}
      {modifyingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Edit size={20} />
                تعديل حالة البلاغ رقم {modifyingReport.id}
              </h2>
              <button 
                onClick={() => setModifyingReport(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleModifySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">الحالة</label>
                <select
                  value={modifyFormData.status}
                  onChange={(e) => setModifyFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  {predefinedStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">تاريخ الحل</label>
                <input
                  type="date"
                  value={modifyFormData.resolved_at}
                  onChange={(e) => setModifyFormData(prev => ({ ...prev, resolved_at: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right text-gray-700 dark:text-gray-300">ملاحظة</label>
                <textarea
                  value={modifyFormData.resolution}
                  onChange={(e) => setModifyFormData(prev => ({ ...prev, resolution: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="أدخل ملاحظة حول التغيير..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModifyingReport(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
