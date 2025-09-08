import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Loader2, FileX, Download, Printer, FileSpreadsheet, Calendar, Banknote, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { dentalContractsApi } from '@/lib/api';

export default function DentalDashboard() {
  // State management
  const [originalDashboardData, setOriginalDashboardData] = useState({
    total: 0,
    new: 0,
    approved: 0,
    contracted: 0,
    delivered: 0,
    rejected: 0,
    totalValue: 0,
    receivedValue: 0,
    remainingValue: 0
  });
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [topClinics, setTopClinics] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Status options mapping
  const statusOptions = [
    { value: 'جديد', label: 'جديد', color: '#3b82f6' },
    { value: 'موافق عليه', label: 'موافق عليه', color: '#f59e0b' },
    { value: 'تم التعاقد', label: 'تم التعاقد', color: '#8b5cf6' },
    { value: 'تم التسليم', label: 'تم التسليم', color: '#10b981' },
    { value: 'مرفوض', label: 'مرفوض', color: '#ef4444' }
  ];

  // Filter contracts based on current filters
  const filteredContracts = useMemo(() => {
    let filtered = [...allContracts];

    // Facility filter
    if (selectedClinic && selectedClinic !== "all") {
      filtered = filtered.filter(item => 
        item.facilityName?.toLowerCase().includes(selectedClinic.toLowerCase())
      );
    }

    // Supplier filter
    if (selectedSupplier && selectedSupplier !== "all") {
      filtered = filtered.filter(item => 
        item.supplierCompanyName?.toLowerCase().includes(selectedSupplier.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Date range filters
    if (dateFrom) {
      filtered = filtered.filter(item => {
        const contractDate = new Date(item.orderDate);
        const fromDate = new Date(dateFrom);
        return contractDate >= fromDate;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(item => {
        const contractDate = new Date(item.orderDate);
        const toDate = new Date(dateTo);
        return contractDate <= toDate;
      });
    }

    return filtered;
  }, [allContracts, selectedClinic, selectedSupplier, selectedStatus, dateFrom, dateTo]);

  // Calculate dashboard statistics from filtered contracts
  const dashboardData = useMemo(() => {
    const nonRejectedContracts = filteredContracts.filter(item => item.status !== 'مرفوض');
    
    const totalValue = nonRejectedContracts.reduce((sum, item) => 
      sum + (parseFloat(item.totalValue) || 0), 0
    );
    
    const receivedValue = nonRejectedContracts.reduce((sum, item) => 
      sum + (parseFloat(item.receivedValue) || 0), 0
    );
    
    const remainingValue = nonRejectedContracts.reduce((sum, item) => 
      sum + (parseFloat(item.remainingValue) || 0), 0
    );

    return {
      total: filteredContracts.length,
      new: filteredContracts.filter(item => item.status === 'جديد').length,
      approved: filteredContracts.filter(item => item.status === 'موافق عليه').length,
      contracted: filteredContracts.filter(item => item.status === 'تم التعاقد').length,
      delivered: filteredContracts.filter(item => item.status === 'تم التسليم').length,
      rejected: filteredContracts.filter(item => item.status === 'مرفوض').length,
      totalValue: totalValue,
      receivedValue: receivedValue,
      remainingValue: remainingValue
    };
  }, [filteredContracts]);

  // Generate status data for pie chart
  const statusData = useMemo(() => {
    return statusOptions.map(status => ({
      name: status.label,
      value: filteredContracts.filter(item => item.status === status.value).length,
      color: status.color
    }));
  }, [filteredContracts]);

  // Generate monthly trend from filtered data
  const monthlyData = useMemo(() => {
    const monthCounts = {};
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // Initialize all months with 0
    months.forEach(month => {
      monthCounts[month] = 0;
    });

    // Count contracts by month using orderDate
    filteredContracts.forEach(contract => {
      const date = new Date(contract.orderDate);
      if (!isNaN(date.getTime())) {
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];
        monthCounts[monthName]++;
      }
    });

    return months.map(month => ({
      month,
      count: monthCounts[month]
    }));
  }, [filteredContracts]);

  // Get unique values for dropdown options
  const uniqueClinics = useMemo(() => {
    return [...new Set(allContracts
      .map(item => item.facilityName)
      .filter(clinic => clinic && clinic.trim() !== '')
    )].sort();
  }, [allContracts]);
  
  const uniqueSuppliers = useMemo(() => {
    return [...new Set(allContracts
      .map(item => item.supplierCompanyName)
      .filter(supplier => supplier && supplier.trim() !== '')
    )].sort();
  }, [allContracts]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await dentalContractsApi.getDashboardData();
      
      if (response.success && response.data) {
        setOriginalDashboardData(response.data);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات لوحة التحكم');
      console.error('Dashboard data loading error:', err);
    }
  };

  // Load all contracts data for filtering
  const loadContractsData = async () => {
    try {
      const response = await dentalContractsApi.getContracts();
      
      if (response.success && response.data) {
        setAllContracts(response.data);
      }
    } catch (err) {
      console.error('Contracts data loading error:', err);
      setError(err.message || 'فشل في تحميل بيانات العقود');
    } finally {
      setLoading(false);
    }
  };

  // Load top suppliers
  const loadTopSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await dentalContractsApi.getTopSuppliers();
      
      if (response.success && response.data) {
        setTopSuppliers(response.data);
      }
    } catch (err) {
      console.error('Top suppliers loading error:', err);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Load top clinics
  const loadTopClinics = async () => {
    try {
      setClinicsLoading(true);
      const response = await dentalContractsApi.getTopClinics();
      
      if (response.success && response.data) {
        setTopClinics(response.data);
      }
    } catch (err) {
      console.error('Top clinics loading error:', err);
    } finally {
      setClinicsLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadDashboardData(),
        loadContractsData(),
        loadTopSuppliers(),
        loadTopClinics()
      ]);
    };
    
    loadAllData();
  }, []);

  const clearFilters = () => {
    setSelectedClinic('');
    setSelectedSupplier('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboardData(),
      loadContractsData(),
      loadTopSuppliers(),
      loadTopClinics()
    ]);
  };

  // Export functions
  const exportToPDF = async () => {
    setExportLoading(true);
    try {
      const printContent = `
        <html dir="rtl">
          <head>
            <title>تقرير عقود الأسنان</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
              .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; margin-bottom: 20px; }
              .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
              .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              .table th { background: #f5f5f5; }
              @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير عقود الأسنان</h1>
              <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <div class="stats-grid">
              <div class="stat-card"><h3>إجمالي العقود</h3><p>${dashboardData.total}</p></div>
              <div class="stat-card"><h3>القيمة الإجمالية</h3><p>${dashboardData.totalValue?.toLocaleString()} ريال</p></div>
              <div class="stat-card"><h3>قيمة الكميات المستلمة</h3><p>${dashboardData.receivedValue?.toLocaleString()} ريال</p></div>
              <div class="stat-card"><h3>قيمة الكميات المتبقية</h3><p>${dashboardData.remainingValue?.toLocaleString()} ريال</p></div>
              <div class="stat-card"><h3>جديد</h3><p>${dashboardData.new}</p></div>
              <div class="stat-card"><h3>موافق عليه</h3><p>${dashboardData.approved}</p></div>
              <div class="stat-card"><h3>تم التعاقد</h3><p>${dashboardData.contracted}</p></div>
              <div class="stat-card"><h3>تم التسليم</h3><p>${dashboardData.delivered}</p></div>
              <div class="stat-card"><h3>مرفوض</h3><p>${dashboardData.rejected}</p></div>
            </div>
            <h2>تفاصيل العقود المفلترة</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>رقم الصنف</th>
                  <th>اسم الصنف</th>
                  <th>المنشأة</th>
                  <th>الشركة الموردة</th>
                  <th>الحالة</th>
                  <th>القيمة الإجمالية</th>
                </tr>
              </thead>
              <tbody>
                ${filteredContracts.map(item => `
                  <tr>
                    <td>${item.itemNumber || ''}</td>
                    <td>${item.itemName || ''}</td>
                    <td>${item.facilityName || ''}</td>
                    <td>${item.supplierCompanyName || ''}</td>
                    <td>${item.status || ''}</td>
                    <td>${parseFloat(item.totalValue || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('PDF export error:', error);
      alert('حدث خطأ في تصدير PDF');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const headers = ['رقم الصنف', 'اسم الصنف', 'المنشأة', 'الشركة الموردة', 'الحالة', 'القيمة الإجمالية', 'تاريخ الطلب'];
      const csvContent = [
        headers.join(','),
        ...filteredContracts.map(item => [
          `"${item.itemNumber || ''}"`,
          `"${item.itemName || ''}"`,
          `"${item.facilityName || ''}"`,
          `"${item.supplierCompanyName || ''}"`,
          `"${item.status || ''}"`,
          `"${item.totalValue || ''}"`,
          `"${item.orderDate || ''}"`
        ].join(','))
      ].join('\n');
      
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dental-contracts-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Excel export error:', error);
      alert('حدث خطأ في تصدير Excel');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">جاري تحميل بيانات لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshData} className="w-full">
              <Loader2 className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم عقود الأسنان</h1>
            <p className="text-purple-100 mt-1 text-right">إدارة شاملة لعقود معدات طب الأسنان</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={exportToPDF}
              disabled={exportLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              title="طباعة / تصدير PDF"
            >
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              onClick={exportToExcel}
              disabled={exportLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              title="تصدير Excel"
            >
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              onClick={refreshData}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              تحديث البيانات
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Download className="h-5 w-5" />
            فلاتر البحث والتصدير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Facility Filter */}
            <div>
              <Label htmlFor="facility-select" className="text-right block mb-2">المنشأة</Label>
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger id="facility-select">
                  <SelectValue placeholder="اختر المنشأة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنشآت</SelectItem>
                  {uniqueClinics.map((clinic) => (
                    <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div>
              <Label htmlFor="supplier-select" className="text-right block mb-2">الشركة الموردة</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier-select">
                  <SelectValue placeholder="اختر الشركة الموردة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموردين</SelectItem>
                  {uniqueSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status-select" className="text-right block mb-2">الحالة</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-select">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        ></div>
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <div>
              <Label htmlFor="date-from" className="text-right block mb-2">من تاريخ</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <Label htmlFor="date-to" className="text-right block mb-2">إلى تاريخ</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-right"
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={clearFilters}>
              <Calendar className="h-4 w-4 mr-2" />
              مسح الفلاتر
            </Button>
          </div>
          
          {/* Filter Results Summary */}
          {(selectedClinic || selectedSupplier || selectedStatus || dateFrom || dateTo) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800 text-right">
                  عرض {filteredContracts.length} من أصل {allContracts.length} عقد
                  {selectedClinic && <span className="block">المنشأة: {selectedClinic}</span>}
                  {selectedSupplier && <span className="block">المورد: {selectedSupplier}</span>}
                  {selectedStatus && <span className="block">الحالة: {selectedStatus}</span>}
                  {dateFrom && <span className="block">من: {dateFrom}</span>}
                  {dateTo && <span className="block">إلى: {dateTo}</span>}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToPDF}
                    disabled={exportLoading || filteredContracts.length === 0}
                    className="text-xs"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    طباعة
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={exportLoading || filteredContracts.length === 0}
                    className="text-xs"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards - Updated with new value boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">إجمالي العقود</p>
                <p className="text-2xl font-bold text-purple-800">{dashboardData.total}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-600">القيمة الإجمالية</p>
                <p className="text-xl font-bold text-indigo-800">{dashboardData.totalValue?.toLocaleString()}</p>
                <p className="text-xs text-indigo-600">ريال سعودي</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">قيمة الكميات المستلمة</p>
                <p className="text-xl font-bold text-green-800">{dashboardData.receivedValue?.toLocaleString()}</p>
                <p className="text-xs text-green-600">ريال سعودي</p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">قيمة الكميات المتبقية</p>
                <p className="text-xl font-bold text-orange-800">{dashboardData.remainingValue?.toLocaleString()}</p>
                <p className="text-xs text-orange-600">ريال سعودي</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-600">نسبة الإنجاز</p>
                <p className="text-xl font-bold text-slate-800">
                  {dashboardData.totalValue > 0 
                    ? Math.round((dashboardData.receivedValue / dashboardData.totalValue) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-slate-600">من إجمالي القيمة</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">جديد</p>
              <p className="text-xl font-bold text-blue-800">{dashboardData.new}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-600">موافق عليه</p>
              <p className="text-xl font-bold text-yellow-800">{dashboardData.approved}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">تم التعاقد</p>
              <p className="text-xl font-bold text-purple-800">{dashboardData.contracted}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">تم التسليم</p>
              <p className="text-xl font-bold text-green-800">{dashboardData.delivered}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-600">مرفوض</p>
              <p className="text-xl font-bold text-red-800">{dashboardData.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-success to-success/80 text-success-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4" />
              توزيع حالة العقود
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            {statusData.length > 0 && statusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات لعرضها</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
              {statusData.filter(item => item.value > 0).map((item) => (
                <div key={item.name} className="flex items-center gap-1 sm:gap-2 bg-accent/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs sm:text-sm font-medium">
                    {item.name} ({item.value}) 
                    {dashboardData.total > 0 && ` - ${Math.round((item.value / dashboardData.total) * 100)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4" />
              الاتجاه الشهري
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            {monthlyData.length > 0 && monthlyData.some(item => item.count > 0) ? (
              <div className="h-[300px] sm:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={monthlyData} 
                    margin={{ 
                      top: 20, 
                      right: 10, 
                      left: 10, 
                      bottom: 40 
                    }}
                  >
                    <XAxis 
                      dataKey="month" 
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      fontSize={10} 
                      tick={{ fontSize: 10 }}
                      width={30}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات شهرية لعرضها</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Suppliers and Clinics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أفضل الشركات الموردة</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topSuppliers.length > 0 ? (
              <div className="space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="font-medium">{supplier.name}</p>
                      <div className="text-sm text-gray-600">
                        <p>{supplier.contracts} عقد</p>
                        <p>{supplier.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد بيانات موردين</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clinics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أكثر المنشآت نشاطاً</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topClinics.length > 0 ? (
              <div className="space-y-4">
                {topClinics.map((clinic, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="font-medium">{clinic.name}</p>
                      <div className="text-sm text-gray-600">
                        <p>{clinic.contracts} عقد</p>
                        <p>{clinic.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد بيانات منشآت</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
