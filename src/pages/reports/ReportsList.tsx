
import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, Printer, X, Save, Loader2, AlertTriangle, FileText, Clock, Settings } from 'lucide-react';
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

  // New state for full report edit modal
  const [fullEditingReport, setFullEditingReport] = useState(null);
  const [fullEditFormData, setFullEditFormData] = useState({
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

  const handleFullEditClick = (report) => {
    setFullEditingReport(report);
    setFullEditFormData({
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

  const handleFullEditSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const updateData: any = { ...fullEditFormData, update_type: 'new' };
      if ((fullEditFormData.status === 'مغلق' || fullEditFormData.status === 'مكهن') && 
          fullEditingReport.status === 'مفتوح') {
        updateData.resolved_at = new Date().toISOString();
      }

      const response = await reportsApi.updateReport(fullEditingReport.id, updateData);
      
      if (response.success) {
        toast({
          title: "تم تحديث البلاغ بنجاح",
          description: "تم حفظ التغييرات على البلاغ",
        });

        setReports(prev => 
          prev.map(report => 
            report.id === fullEditingReport.id 
              ? { ...report, ...updateData }
              : report
          )
        );
        
        setFullEditingReport(null);
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

  const handleFullEditInputChange = (field, value) => {
    setFullEditFormData(prev => ({ ...prev, [field]: value }));
  };

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
  const categories = [...new Set(reports.map(r => r.category).filter(Boolean))];

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
