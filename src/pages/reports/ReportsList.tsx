import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Printer,
  X,
  Save,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
  Settings
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';

const calculateDowntimePeriod = (reportDate, reportTime, resolvedAt) => {
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
        .status-open { background: #fff3cd; color: #856404; }
        .status-closed { background: #d1edff; color: #0c5460; }
        .status-paused { background: #f8d7da; color: #721c24; }
        .status {
          padding: 5px 15px;
          border-radius: 15px;
          font-weight: bold;
          display: inline-block;
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
            <th>الرقم التسلسلي</th>
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
<td>${report.serial_number || 'غير محدد'}</td>
<td>${report.problem_description || 'غير محدد'}</td>
              <td>
                <span class="status ${
                  report.status === 'مفتوح' ? 'status-open' :
                  report.status === 'مغلق' ? 'status-closed' : 'status-paused'
                }">${report.status}</span>
              </td>
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
  if(printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }
};

const exportToExcel = (data, filename) => {
  const csvContent = [
    ['رقم البلاغ', 'المنشأة', 'التصنيف', 'اسم الجهاز', 'الرقم التسلسلي', 'وصف المشكلة', 'الحالة', 'تاريخ البلاغ', 'فترة التوقف (أيام)'],
    ...data.map(report => [
      report.id,
      report.facilityName,
      report.category,
      report.deviceName,
      report.serialNumber || 'غير محدد',
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
  const [loading,setLoading] = useState(true);
  const [reports,setReports] = useState([]);
  const [searchTerm,setSearchTerm] = useState('');
  const [selectedFacility,setSelectedFacility] = useState('');
  const [selectedCategory,setSelectedCategory] = useState('');
  const [selectedStatus,setSelectedStatus] = useState('');
  const [editingReport,setEditingReport] = useState(null);
  const [modifyingReport,setModifyingReport] = useState(null);
  const [fullEditingReport,setFullEditingReport] = useState(null);
  const [deleteConfirmReport,setDeleteConfirmReport] = useState(null);
  const [viewingReport,setViewingReport] = useState(null);
  const [updateLoading,setUpdateLoading] = useState(false);
  const [deleteLoading,setDeleteLoading] = useState(null);
  const [modifyFormData,setModifyFormData] = useState({
    status: '',
    resolution: '',
    resolved_at: '',
    resolved_by: ''
  });
 const [facilitiesData, setFacilitiesData] = useState([]);
 const [facilitiesLoading, setFacilitiesLoading] = useState(false);
const [editFormData,setEditFormData] = useState({
    facility_id: '',
    report_date: '',
    report_time: '',
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

  const predefinedCategories = [
    'الصيانة الطبية',
    'الصيانة العامة',
    'تقنية المعلومات',
    'أمن وسلامة',
    'التموين الطبي',
    'أخرى'
  ];

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
      } catch(e) {
        toast({
          title: "خطأ في تحميل البلاغات",
          description: e.message || "فشل في تحميل قائمة البلاغات",
          variant:"destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  },[toast]);

  const filteredReports = reports.filter(r => {
    return (
      (searchTerm === '' ||
       r.facility?.name?.includes(searchTerm) ||
       r.problem_description?.includes(searchTerm) ||
       r.device_name?.includes(searchTerm) ||
       r.id?.toString().includes(searchTerm))
      &&
      (selectedFacility === '' || r.facility?.name === selectedFacility)
      &&
      (selectedCategory === '' || r.category === selectedCategory)
      &&
      (selectedStatus === '' || r.status === selectedStatus)
    );
  });

  const facilities = [...new Set(reports.map(r => r.facility?.name).filter(Boolean))];
  const categories = [...new Set(reports.map(r => r.category).filter(Boolean))];

  const handleModifyClick = (report) => {
    setModifyingReport(report);
    setModifyFormData({
      status: report.status || '',
      resolution: report.resolution || '',
      resolved_at: report.resolved_at ? report.resolved_at.split('T')[0] : '',
      resolved_by: report.resolved_by || ''
    });
  };
const handleFullEditClick = async (report) => {
    setFullEditingReport(report);
    setEditFormData({
      facility_id: report.facility?.id?.toString() || '',
      report_date: report.report_date || '',
      report_time: report.report_time || '',
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
    
    // Load facilities when opening full edit modal
    if (facilitiesData.length === 0) {
      setFacilitiesLoading(true);
      try {
        const facilitiesResponse = await reportsApi.getFacilities();
        if (facilitiesResponse.success) {
          setFacilitiesData(facilitiesResponse.data || []);
        }
      } catch (error) {
        console.error('Failed to load facilities:', error);
      } finally {
        setFacilitiesLoading(false);
      }
    }
  };

  const handleModifySubmit = async(e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const updateData = {
        status: modifyFormData.status,
        resolution: modifyFormData.resolution,
        resolved_at: modifyFormData.resolved_at || undefined,
        resolved_by: modifyFormData.resolved_by || undefined,
      };
      const response = await reportsApi.updateReport(modifyingReport.id, updateData);
      if(response.success){
        toast({
          title:"تم تحديث البلاغ بنجاح",
          description:"تم حفظ التغييرات على البلاغ"
        });
        window.location.reload();
        setReports(prev => prev.map(r => r.id === modifyingReport.id ? {...r, ...updateData } : r));
        setModifyingReport(null);
      } else {
        toast({
          title:"خطأ في تحديث البلاغ",
          description: response.message,
          variant:"destructive"
        });
      }
    } catch(error){
      toast({
        title:"خطأ في تحديث البلاغ",
        description: error.message || "فشل في تحديث البلاغ",
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleFullEditSubmit = async(e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const updateData = {...editFormData};
      if(['مغلق','مكهن'].includes(editFormData.status) && fullEditingReport.status === 'مفتوح'){
        updateData.resolved_at = new Date().toISOString();
      }
      const response = await reportsApi.updateReport(fullEditingReport.id, updateData);
      if(response.success){
        toast({
          title:"تم تحديث البلاغ بنجاح",
          description:"تم حفظ التغييرات على البلاغ"
        });
        window.location.reload();
        setReports(prev => prev.map(r => r.id === fullEditingReport.id ? {...r, ...updateData} : r));
        setFullEditingReport(null);
      } else {
        toast({
          title:"خطأ في تحديث البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch(error){
      toast({
        title:"خطأ في تحديث البلاغ",
        description: error.message || "فشل في تحديث البلاغ",
        variant:"destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteClick = (report) => {
    setDeleteConfirmReport(report);
  };

  const handleDeleteConfirm = async() => {
    if(!deleteConfirmReport) return;
    setDeleteLoading(deleteConfirmReport.id);
    try {
      const response = await reportsApi.deleteReport(deleteConfirmReport.id);
      if(response.success){
        toast({
          title:"تم حذف البلاغ بنجاح",
          description:"تم حذف البلاغ من النظام"
        });
        setReports(prev => prev.filter(r => r.id !== deleteConfirmReport.id));
        setDeleteConfirmReport(null);
      } else {
        toast({
          title:"خطأ في حذف البلاغ",
          description: response.message,
          variant:"destructive"
        });
      }
    } catch(error){
      toast({
        title:"خطأ في حذف البلاغ",
        description: error.message || "فشل في حذف البلاغ",
        variant:"destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewClick = (report) => {
    setViewingReport(report);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({...prev, [field]: value}));
  };

  const generateStatusLogHTML = (report) => {
    const isPrint = typeof report === 'string' || report instanceof String;

    const creationDate = report.creation_date;
    const creationNote = report.creation_date_note;
    const approvalDate = report.contract_approval_date;
    const approvalNote = report.contract_approval_date_note;
    const rejectionDate = report.rejection_date;
    const rejectionNote = report.rejection_date_note;

    if(!creationDate && !approvalDate && !rejectionDate) {
      return isPrint ? '' : null;
    }

    if(isPrint) {
      let html = `
      <div style="background:#e9d5ff; border:1px solid #c4b5fd; border-radius:8px; padding:16px; margin:12px 0; direction:rtl; font-family:Arial, sans-serif;">
        <h3 style="color:#5b21b6; margin-bottom:16px;"><svg xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.104 0-2 .896-2 2v4h-2v2h6v-2h-2v-4c0-1.104-.896-2-2-2z"></path><circle cx="12" cy="4" r="2"></circle><path d="M4 20h16v2H4z"></path></svg> سجل حالات البلاغ</h3>
      `;

      if (creationDate) {
        html += `
          <div style="margin-bottom:8px;">
            <strong>تاريخ فتح البلاغ:</strong> ${creationDate}
            ${creationNote ? `<em style="font-style: italic; color: #555;">(${creationNote})</em>` : ''}
          </div>`;
      }
      if (approvalDate) {
        html += `
          <div style="margin-bottom:8px;">
            <strong>تاريخ الغلق:</strong> ${approvalDate}
            ${approvalNote ? `<em style="font-style: italic; color: #555;">(${approvalNote})</em>` : ''}
          </div>`;
      }
      if (rejectionDate) {
        html += `
          <div style="margin-bottom:8px;">
            <strong>تاريخ التكهين:</strong> ${rejectionDate}
            ${rejectionNote ? `<em style="font-style: italic; color: #555;">(${rejectionNote})</em>` : ''}
          </div>`;
      }
      html += '</div>';
      return html;
    } else {
      return (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-right">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2"><Clock size={20} />سجل حالات البلاغ</h3>
          <div className="space-y-3">
            {creationDate && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-md">
                <span className="font-medium text-purple-700 dark:text-purple-300 min-w-[120px]">تاريخ فتح البلاغ:</span>
                <span className="text-gray-700 dark:text-gray-300">{creationDate}</span>
                {creationNote && <span className="text-sm text-gray-500 dark:text-gray-400 italic">({creationNote})</span>}
              </div>
            )}
            {approvalDate && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-md">
                <span className="font-medium text-purple-700 dark:text-purple-300 min-w-[120px]">تاريخ الغلق:</span>
                <span className="text-gray-700 dark:text-gray-300">{approvalDate}</span>
                {approvalNote && <span className="text-sm text-gray-500 dark:text-gray-400 italic">({approvalNote})</span>}
              </div>
            )}
            {rejectionDate && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-md">
                <span className="font-medium text-purple-700 dark:text-purple-300 min-w-[120px]">تاريخ التكهين:</span>
                <span className="text-gray-700 dark:text-gray-300">{rejectionDate}</span>
                {rejectionNote && <span className="text-sm text-gray-500 dark:text-gray-400 italic">({rejectionNote})</span>}
              </div>
            )}
          </div>
        </div>
      )
    }
  };

  const handlePrintReport = (report) => {
    const downtimePeriod = calculateDowntimePeriod(report.report_date, report.report_time, report.resolved_at);
    const statusLogHTML = generateStatusLogHTML(JSON.stringify(report)) || '';

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
          .status-log {
            background:#e9d5ff; border:1px solid #c4b5fd; border-radius:8px; padding:16px; margin:12px 0; font-family:Arial, sans-serif;
          }
          .status-log h3 {
            color:#5b21b6; margin-bottom:16px; font-weight: bold;
          }
          .status-log div {
            margin-bottom:8px;
          }
          .status-log em {
            font-style: italic; color: #555;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير بلاغ رقم ${report.id}</h1>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">رقم البلاغ:</div><div>${report.id}</div></div>
          <div class="info-item"><div class="info-label">المنشأة:</div><div>${report.facility?.name || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">تاريخ البلاغ:</div><div>${report.report_date} ${report.report_time}</div></div>
          <div class="info-item"><div class="info-label">الحالة:</div><div>
            <span class="status ${
              report.status === 'مفتوح' ? 'status-open' :
              report.status === 'مغلق' ? 'status-closed' : 'status-paused'
            }">${report.status}</span>
          </div></div>
          <div class="info-item"><div class="info-label">التصنيف:</div><div>${report.category}</div></div>
          <div class="info-item"><div class="info-label">اسم الجهاز:</div><div>${report.device_name}</div></div>
          <div class="info-item"><div class="info-label">الرقم التسلسلي:</div><div>${report.serial_number || 'غير محدد'}</div></div>
          <div class="info-item full-width"><div class="info-label">وصف المشكلة:</div><div>${report.problem_description || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">تحت الضمان:</div><div>${report.under_warranty || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">شركة الصيانة:</div><div>${report.repair_company || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">رقم الاتصال:</div><div>${report.contact_number || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">البريد الإلكتروني:</div><div>${report.email || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">اسم المبلغ:</div><div>${report.reporter_name || 'غير محدد'}</div></div>
          <div class="info-item"><div class="info-label">رقم اتصال المبلغ:</div><div>${report.reporter_contact || 'غير محدد'}</div></div>

          ${statusLogHTML.replace(/<div dir="rtl">|<\/div>/g, '')}

          ${report.notes ? `<div class="info-item full-width"><div class="info-label">ملاحظات:</div><div>${report.notes}</div></div>` : ''}
          ${report.resolution ? `<div class="info-item full-width"><div class="info-label">الحل:</div><div>${report.resolution}</div></div>` : ''}
          ${report.resolved_at ? `<div class="info-item"><div class="info-label">تاريخ الإغلاق/التكهين:</div><div>${new Date(report.resolved_at).toLocaleDateString('ar-SA')}</div></div>` : ''}
          <div class="info-item"><div class="info-label">فترة التوقف:</div><div>${downtimePeriod}</div></div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print() }, 500);
    }
  };

  if(loading){
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-3">جاري تحميل البلاغات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">

      <div className="text-right">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">قائمة البلاغات</h1>
        <p className="text-muted-foreground mt-2">عرض وإدارة جميع البلاغات المستلمة</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className=" bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Filter size={20} />
            البحث والتصفية
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في البلاغات..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={selectedFacility}
              onChange={e => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع المنشآت</option>
              {facilities.map(facility => (
                <option key={facility} value={facility}>{facility}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-right bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الحالات</option>
              {predefinedStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6">
            <button
              onClick={() => {
                try {
                    console.log('Sample report data:', filteredReports[0]); // Add this line
                  const exportData = filteredReports.map(report => ({
                    id: report.id,
                    facilityName: report.facility?.name || '',
                    category: report.category,
                    deviceName: report.device_name,
                    serialNumber: report.serial_number ? report.serial_number : 'غير محدد',
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
                } catch(e){
                  toast({
                    title: "خطأ في التصدير",
                    description: "فشل في تصدير البيانات",
                    variant: "destructive"
                  });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">تصدير Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button
              onClick={() => {
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
                } catch(e){
                  toast({
                    title: "خطأ في التصدير",
                    description: "فشل في تصدير البيانات",
                    variant: "destructive"
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">تصدير PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">لا توجد بلاغات تطابق معاييير البحث</p>
          </div>
        )}
        {filteredReports.map(report => {
          const downtimePeriod = calculateDowntimePeriod(report.report_date, report.report_time, report.resolved_at);
          return (
            <div key={report.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col space-y-2 text-right">
              <div className="flex justify-between items-center">
                <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">بلاغ #{report.id}</div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleViewClick(report)} title="عرض" className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"><Eye size={20} /></button>
                  <button onClick={() => handleModifyClick(report)} title="تعديل الحالة" className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"><Edit size={20} /></button>
                  <button onClick={() => handleFullEditClick(report)} title="تعديل كامل" className="p-1 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded transition-colors"><Settings size={20} /></button>
                  <button onClick={() => handlePrintReport(report)} title="طباعة" className="p-1 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded transition-colors"><Printer size={20} /></button>
                  <button onClick={() => handleDeleteClick(report)} disabled={deleteLoading === report.id} title="حذف" className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors">{deleteLoading === report.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}</button>
                </div>
              </div>
              <div><strong>المنشأة:</strong> {report.facility?.name || 'غير محدد'}</div>
              <div><strong>التصنيف:</strong> {report.category}</div>
              <div><strong>اسم الجهاز:</strong> {report.device_name}</div>
              <div><strong>وصف المشكلة:</strong> {report.problem_description || 'غير محدد'}</div>
              <div><strong>التاريخ:</strong> {report.report_date}</div>
              <div><strong>الحالة:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                report.status === 'مفتوح' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                : report.status === 'مغلق' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>{report.status}</span></div>
              <div><strong>فترة التوقف:</strong> {downtimePeriod}</div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
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
              {filteredReports.map(report => {
                const downtimePeriod = calculateDowntimePeriod(report.report_date, report.report_time, report.resolved_at);
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
                        report.status === 'مغلق' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
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
                        <button onClick={() => handleViewClick(report)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors" title="عرض">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleModifyClick(report)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors" title="تعديل الحالة">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleFullEditClick(report)} className="p-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded transition-colors" title="تعديل كامل">
                          <Settings size={16} />
                        </button>
                        <button onClick={() => handlePrintReport(report)} className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded transition-colors" title="طباعة">
                          <Printer size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(report)} disabled={deleteLoading === report.id} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors" title="حذف">
                          {deleteLoading === report.id ? (<Loader2 size={16} className="animate-spin" />) : (<Trash2 size={16} />)}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">لا توجد بلاغات تطابق معاييير البحث</p>
          </div>
        )}
      </div>

      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText size={24} />
                تفاصيل البلاغ رقم {viewingReport.id}
              </h2>
              <button onClick={() => setViewingReport(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6 text-right">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                <Clock size={24} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">عداد فترة التوقف</h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {calculateDowntimePeriod(viewingReport.report_date, viewingReport.report_time, viewingReport.resolved_at)}
                    من تاريخ الإنشاء {viewingReport.resolved_at ? 'حتى تاريخ الإغلاق' : 'حتى الآن'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'رقم البلاغ', value: viewingReport.id, mono: true },
                  { label: 'المنشأة', value: viewingReport.facility?.name || 'غير محدد' },
                  { label: 'تاريخ البلاغ', value: viewingReport.report_date },
                  { label: 'وقت البلاغ', value: viewingReport.report_time },
                  { label: 'التصنيف', value: viewingReport.category },
                  {
                    label: 'الحالة',
                    value: (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewingReport.status === 'مفتوح' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        viewingReport.status === 'مغلق' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {viewingReport.status}
                      </span>)
                  },
                  { label: 'اسم الجهاز', value: viewingReport.device_name },
                  { label: 'الرقم التسلسلي', value: viewingReport.serial_number || 'غير محدد' },
                  { label: 'تحت الضمان', value: viewingReport.under_warranty || 'غير محدد' },
                  { label: 'شركة الصيانة', value: viewingReport.repair_company || 'غير محدد' },
                  { label: 'رقم الاتصال', value: viewingReport.contact_number || 'غير محدد' },
                  { label: 'البريد الإلكتروني', value: viewingReport.email || 'غير محدد' },
                  { label: 'اسم المبلغ', value: viewingReport.reporter_name || 'غير محدد' },
                  { label: 'رقم اتصال المبلغ', value: viewingReport.reporter_contact || 'غير محدد' }
                ].map(({ label, value, mono }) => (
                  <div key={label} className="space-y-2 text-right">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
                    <p className={`p-3 rounded-md bg-gray-50 dark:bg-gray-800 ${mono ? 'font-mono text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-right">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">وصف المشكلة</label>
                <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md leading-relaxed min-h-[100px] border-l-4 border-blue-500">
                  {viewingReport.problem_description}
                </p>
              </div>

              {generateStatusLogHTML(viewingReport)}

              {viewingReport.notes && (
                <div className="space-y-2 text-right">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ملاحظات</label>
                  <p className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md leading-relaxed border-l-4 border-yellow-500">
                    {viewingReport.notes}
                  </p>
                </div>
              )}

              {viewingReport.resolution && (
                <div className="space-y-2 text-right">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الحل</label>
                  <p className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md leading-relaxed border-l-4 border-green-500">
                    {viewingReport.resolution}
                  </p>
                </div>
              )}

              {(viewingReport.status !== 'مفتوح' && (viewingReport.resolved_at || viewingReport.resolved_by)) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-right">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">تفاصيل الإغلاق/التكهين</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingReport.resolved_at && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-green-700 dark:text-green-300">تاريخ الإغلاق/التكهين</label>
                        <p className="p-3 bg-white dark:bg-gray-800 rounded-md">{viewingReport.resolved_at}</p>
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

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setViewingReport(null)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={20} />
                تأكيد الحذف
              </h2>
              <button onClick={() => setDeleteConfirmReport(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
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
              <div className="flex justify-center gap-3 pt-4">
                <button onClick={() => setDeleteConfirmReport(null)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">إلغاء</button>
                <button onClick={handleDeleteConfirm} disabled={deleteLoading === deleteConfirmReport.id} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors">
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

      {modifyingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 px-6 py-4 border-b border-green-200 dark:border-green-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                <Edit size={24} />
                تعديل حالة البلاغ رقم {modifyingReport.id}
              </h2>
              <button onClick={() => setModifyingReport(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" aria-label="Close modify modal">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleModifySubmit} className="p-4 md:p-6 space-y-6 text-right" dir="rtl">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">الحالة</label>
                <select
                  value={modifyFormData.status}
                  onChange={e => setModifyFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  {predefinedStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">تم الحل بواسطة</label>
                <input
                  type="text"
                  value={modifyFormData.resolved_by || ''}
                  onChange={e => setModifyFormData(prev => ({ ...prev, resolved_by: e.target.value }))}
                  placeholder="اسم الشخص المسؤول عن الحل"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">تاريخ الحل</label>
                <input
                  type="date"
                  value={modifyFormData.resolved_at}
                  onChange={e => setModifyFormData(prev => ({ ...prev, resolved_at: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ملاحظة</label>
                <textarea
                  value={modifyFormData.resolution}
                  onChange={e => setModifyFormData(prev => ({ ...prev, resolution: e.target.value }))}
                  rows={3}
                  placeholder="أدخل ملاحظة حول التغيير..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setModifyingReport(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">إلغاء</button>
                <button type="submit" disabled={updateLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
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

      {fullEditingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Settings size={24} />
                تعديل كامل البلاغ رقم {fullEditingReport.id}
              </h2>
              <button onClick={() => setFullEditingReport(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" aria-label="Close full edit modal">
                <X size={24} />
              </button>
            </div>
           <form onSubmit={handleFullEditSubmit} className="p-4 md:p-6 space-y-6" dir="rtl">

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">١- اسم المنشأة</label>
                {facilitiesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="mr-2">جاري تحميل المنشآت...</span>
                  </div>
                ) : (
                  <select
                    value={editFormData.facility_id}
                    onChange={e => handleEditInputChange('facility_id', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر اسم المنشأة</option>
{facilitiesData.map((facility) => (
                      <option key={facility.id} value={facility.id.toString()}>
                        {facility.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٢- الرقم التسلسلي</label>
                <input
                  type="text"
                  value={editFormData.serial_number}
                  onChange={e => handleEditInputChange('serial_number', e.target.value)}
                  placeholder="الرقم التسلسلي للجهاز"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٣- تاريخ إنشاء البلاغ *</label>
                  <input
                    type="date"
                    value={editFormData.report_date}
                    onChange={e => handleEditInputChange('report_date', e.target.value)}
                    className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوقت *</label>
                  <input
                    type="time"
                    value={editFormData.report_time}
                    onChange={e => handleEditInputChange('report_time', e.target.value)}
                    className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٣- تصنيف البلاغ *</label>
                <select
                  value={editFormData.category}
                  onChange={e => handleEditInputChange('category', e.target.value)}
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر تصنيف البلاغ</option>
                  {predefinedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٤- اسم الجهاز أو الصنف *</label>
                <input
                  type="text"
                  value={editFormData.device_name}
                  onChange={e => handleEditInputChange('device_name', e.target.value)}
                  placeholder="اسم الجهاز أو نوع الصنف"
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٥- وصف مشكلة البلاغ *</label>
                <textarea
                  rows={3}
                  value={editFormData.problem_description}
                  onChange={e => handleEditInputChange('problem_description', e.target.value)}
                  placeholder="وصف مفصل للمشكلة أو العطل..."
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٦- هل الجهاز تحت الضمان؟</label>
                <select
                  value={editFormData.under_warranty}
                  onChange={e => handleEditInputChange('under_warranty', e.target.value)}
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر حالة الضمان</option>
                  <option value="yes">نعم</option>
                  <option value="no">لا</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٧- اسم الإدارة / الشركة المختصة بالإصلاح</label>
                <input
                  type="text"
                  value={editFormData.repair_company}
                  onChange={e => handleEditInputChange('repair_company', e.target.value)}
                  placeholder="اسم الإدارة أو الشركة المسؤولة عن الإصلاح"
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٨- رقم الاتصال</label>
                  <input
                    type="text"
                    value={editFormData.contact_number}
                    onChange={e => handleEditInputChange('contact_number', e.target.value)}
                    placeholder="رقم الهاتف للتواصل"
                    className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الإيميل</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={e => handleEditInputChange('email', e.target.value)}
                    placeholder="البريد الإلكتروني"
                    className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">٩- اسم المبلغ</label>
                  <input
                    type="text"
                    value={editFormData.reporter_name}
                    onChange={e => handleEditInputChange('reporter_name', e.target.value)}
                    placeholder="الاسم الكامل للمبلغ"
                    className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الاتصال</label>
                  <input
                    type="text"
                    value={editFormData.reporter_contact}
                    onChange={e => handleEditInputChange('reporter_contact', e.target.value)}
                    placeholder="رقم جوال المبلغ"
                    className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">١٠- حالة البلاغ</label>
                <select
                  value={editFormData.status}
                  onChange={e => handleEditInputChange('status', e.target.value)}
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {predefinedStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">١١- ملاحظات</label>
                <textarea
                  value={editFormData.notes}
                  onChange={e => handleEditInputChange('notes', e.target.value)}
                  placeholder="أي ملاحظات إضافية مهمة..."
                  className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {['مغلق', 'مكهن'].includes(editFormData.status) && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الحل</label>
                    <textarea
                      value={editFormData.resolution}
                      onChange={e => handleEditInputChange('resolution', e.target.value)}
                      placeholder="وصف الحل المطبق..."
                      className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تم الحل بواسطة</label>
                    <input
                      type="text"
                      value={editFormData.resolved_by}
                      onChange={e => handleEditInputChange('resolved_by', e.target.value)}
                      placeholder="اسم الشخص المسؤول عن الحل"
                      className="w-full p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setFullEditingReport(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">إلغاء</button>
                <button type="submit" disabled={updateLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
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
