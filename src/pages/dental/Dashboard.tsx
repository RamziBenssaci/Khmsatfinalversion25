import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Loader2, FileX, Download, Printer, FileSpreadsheet, Settings, Wrench, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
    totalValue: 0
  });
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    new: 0,
    approved: 0,
    contracted: 0,
    delivered: 0,
    rejected: 0,
    totalValue: 0
  });
  const [statusData, setStatusData] = useState([]);
  const [facilityDistributionData, setFacilityDistributionData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [topClinics, setTopClinics] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
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
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [selectedWorkingStatus, setSelectedWorkingStatus] = useState('');
  const [selectedMaintenanceStatus, setSelectedMaintenanceStatus] = useState('');
  const [selectedWarrantyStatus, setSelectedWarrantyStatus] = useState('');

  // Status options mapping
  const statusOptions = [
    { value: 'جديد', label: 'جديد', color: '#3b82f6' },
    { value: 'موافق عليه', label: 'موافق عليه', color: '#f59e0b' },
    { value: 'تم التعاقد', label: 'تم التعاقد', color: '#8b5cf6' },
    { value: 'تم التسليم', label: 'تم التسليم', color: '#10b981' },
    { value: 'مرفوض', label: 'مرفوض', color: '#ef4444' }
  ];

  // Device status options
  const workingStatusOptions = [
    { value: 'working', label: 'الأجهزة التي تعمل', icon: CheckCircle, color: '#10b981' },
    { value: 'not_working', label: 'الأجهزة المتعطلة', icon: XCircle, color: '#ef4444' }
  ];

  const maintenanceStatusOptions = [
    { value: 'under_maintenance', label: 'الأجهزة المكهنة', icon: Wrench, color: '#f59e0b' },
    { value: 'not_under_maintenance', label: 'الأجهزة غير المكهنة', icon: Settings, color: '#6b7280' }
  ];

  const warrantyStatusOptions = [
    { value: 'under_warranty', label: 'الأجهزة تحت الضمان', icon: ShieldCheck, color: '#10b981' },
    { value: 'out_of_warranty', label: 'الأجهزة خارج الضمان', icon: ShieldX, color: '#ef4444' }
  ];

  // Helper function to format total cost (excluding rejected contracts)
  const formatTotalCost = (data) => {
    const total = data
      .filter(item => item.status !== 'مرفوض') // Exclude rejected contracts
      .reduce((sum, item) => {
        const numericCost = parseFloat(item.totalCost) || 0;
        return sum + numericCost;
      }, 0);
    
    // Remove .00 if it's a whole number
    return total % 1 === 0 ? total.toString() : total.toFixed(2);
  };

  // Calculate filtered statistics
  const calculateFilteredStats = (data) => {
    const totalValue = parseFloat(formatTotalCost(data));
    
    const stats = {
      total: data.length,
      new: data.filter(item => item.status === 'جديد').length,
      approved: data.filter(item => item.status === 'موافق عليه').length,
      contracted: data.filter(item => item.status === 'تم التعاقد').length,
      delivered: data.filter(item => item.status === 'تم التسليم').length,
      rejected: data.filter(item => item.status === 'مرفوض').length,
      totalValue: totalValue
    };
    return stats;
  };

  // Calculate facility distribution for improved chart
  const calculateFacilityDistribution = (data) => {
    const facilityCount = {};
    data.forEach(item => {
      if (item.beneficiaryFacility) {
        facilityCount[item.beneficiaryFacility] = (facilityCount[item.beneficiaryFacility] || 0) + 1;
      }
    });

    return Object.entries(facilityCount)
      .map(([name, count]) => ({ name, count, value: count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 facilities
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await dentalContractsApi.getDashboardData();
      
      if (response.success && response.data) {
        setOriginalDashboardData(response.data);
        setDashboardData(response.data);
        
        // Update status data for pie chart
        const newStatusData = [
          { name: 'جديد', value: response.data.new, color: '#3b82f6' },
          { name: 'موافق عليه', value: response.data.approved, color: '#f59e0b' },
          { name: 'تم التعاقد', value: response.data.contracted, color: '#8b5cf6' },
          { name: 'تم التسليم', value: response.data.delivered, color: '#10b981' },
          { name: 'مرفوض', value: response.data.rejected, color: '#ef4444' }
        ];
        setStatusData(newStatusData);
        
        // If monthly data is included in dashboard response
        if (response.data.monthlyData) {
          setMonthlyData(response.data.monthlyData);
        }
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات لوحة التحكم');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load contracts data for filtering
  const loadContractsData = async () => {
    try {
      const response = await dentalContractsApi.getContracts();
      
      if (response.success && response.data) {
        setAllData(response.data);
        setFilteredData(response.data);
        
        // Calculate initial facility distribution
        const facilityDist = calculateFacilityDistribution(response.data);
        setFacilityDistributionData(facilityDist);
      }
    } catch (err) {
      console.error('Contracts data loading error:', err);
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

  // Real-time filtering with useEffect
  useEffect(() => {
    let filtered = [...allData];

    if (selectedClinic && selectedClinic !== "all") {
      filtered = filtered.filter(item => 
        item.beneficiaryFacility?.toLowerCase().includes(selectedClinic.toLowerCase())
      );
    }

    if (selectedSupplier && selectedSupplier !== "all") {
      filtered = filtered.filter(item => 
        item.supplierName?.toLowerCase().includes(selectedSupplier.toLowerCase())
      );
    }

    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    if (selectedDeviceType && selectedDeviceType !== "all") {
      filtered = filtered.filter(item => 
        item.deviceName?.toLowerCase().includes(selectedDeviceType.toLowerCase())
      );
    }

    if (selectedWorkingStatus && selectedWorkingStatus !== "all") {
      if (selectedWorkingStatus === "working") {
        filtered = filtered.filter(item => item.isWorking === true);
      } else if (selectedWorkingStatus === "not_working") {
        filtered = filtered.filter(item => item.isWorking === false);
      }
    }

    if (selectedMaintenanceStatus && selectedMaintenanceStatus !== "all") {
      if (selectedMaintenanceStatus === "under_maintenance") {
        filtered = filtered.filter(item => item.isUnderMaintenance === true);
      } else if (selectedMaintenanceStatus === "not_under_maintenance") {
        filtered = filtered.filter(item => item.isUnderMaintenance === false);
      }
    }

    if (selectedWarrantyStatus && selectedWarrantyStatus !== "all") {
      if (selectedWarrantyStatus === "under_warranty") {
        filtered = filtered.filter(item => item.isUnderWarranty === true);
      } else if (selectedWarrantyStatus === "out_of_warranty") {
        filtered = filtered.filter(item => item.isUnderWarranty === false);
      }
    }

    setFilteredData(filtered);
    
    // Update dashboard stats based on filtered data
    const filteredStats = calculateFilteredStats(filtered);
    setDashboardData(filteredStats);

    // Update status data based on filtered results
    const newStatusData = [
      { name: 'جديد', value: filteredStats.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: filteredStats.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: filteredStats.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: filteredStats.delivered, color: '#10b981' },
      { name: 'مرفوض', value: filteredStats.rejected, color: '#ef4444' }
    ];
    setStatusData(newStatusData);

    // Update facility distribution
    const facilityDist = calculateFacilityDistribution(filtered);
    setFacilityDistributionData(facilityDist);

  }, [selectedClinic, selectedSupplier, selectedStatus, selectedDeviceType, selectedWorkingStatus, selectedMaintenanceStatus, selectedWarrantyStatus, allData]);

  const clearFilters = () => {
    setSelectedClinic('');
    setSelectedSupplier('');
    setSelectedStatus('');
    setSelectedDeviceType('');
    setSelectedWorkingStatus('');
    setSelectedMaintenanceStatus('');
    setSelectedWarrantyStatus('');
    // Reset to original dashboard data instead of reloading
    setDashboardData(originalDashboardData);
    setFilteredData(allData);
    
    // Reset status data to original
    const originalStatusData = [
      { name: 'جديد', value: originalDashboardData.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: originalDashboardData.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: originalDashboardData.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: originalDashboardData.delivered, color: '#10b981' },
      { name: 'مرفوض', value: originalDashboardData.rejected, color: '#ef4444' }
    ];
    setStatusData(originalStatusData);
    
    // Reset facility distribution
    const facilityDist = calculateFacilityDistribution(allData);
    setFacilityDistributionData(facilityDist);
  };

  const refreshData = async () => {
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
      // Create a print-friendly version
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
                  <th>رقم العقد</th>
                  <th>العيادة المستفيدة</th>
                  <th>الشركة الموردة</th>
                  <th>نوع الجهاز</th>
                  <th>الحالة</th>
                  <th>التكلفة الإجمالية</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(item => `
                  <tr>
                    <td>${item.contractNumber || ''}</td>
                    <td>${item.beneficiaryFacility || ''}</td>
                    <td>${item.supplierName || ''}</td>
                    <td>${item.deviceName || ''}</td>
                    <td>${item.status || ''}</td>
                    <td>${parseFloat(item.totalCost || 0).toLocaleString()}</td>
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
      // Create CSV content
      const headers = ['رقم العقد', 'العيادة المستفيدة', 'الشركة الموردة', 'نوع الجهاز', 'الحالة', 'التكلفة الإجمالية', 'تاريخ الإنشاء'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          `"${item.contractNumber || ''}"`,
          `"${item.beneficiaryFacility || ''}"`,
          `"${item.supplierName || ''}"`,
          `"${item.deviceName || ''}"`,
          `"${item.status || ''}"`,
          `"${item.totalCost || ''}"`,
          `"${item.createdAt || ''}"`
        ].join(','))
      ].join('\n');
      
      // Add BOM for Arabic support
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

  // Get unique values for dropdown options from the actual contracts data
  const uniqueClinics = [...new Set(allData
    .map(item => item.beneficiaryFacility)
    .filter(clinic => clinic && clinic.trim() !== '')
  )].sort();
  
  const uniqueSuppliers = [...new Set(allData
    .map(item => item.supplierName)
    .filter(supplier => supplier && supplier.trim() !== '')
  )].sort();

  const uniqueDeviceTypes = [...new Set(allData
    .map(item => item.deviceName)
    .filter(device => device && device.trim() !== '')
  )].sort();

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-4 md:p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <Users className="h-6 md:h-8 w-6 md:w-8 flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-right">لوحة تحكم عقود الأسنان</h1>
            <p className="text-purple-100 mt-1 text-right text-sm md:text-base">إدارة شاملة لعقود معدات طب الأسنان</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {/* Export buttons */}
            <Button 
              variant="secondary" 
              onClick={exportToPDF}
              disabled={exportLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-1 md:flex-none"
              title="طباعة / تصدير PDF"
            >
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              onClick={exportToExcel}
              disabled={exportLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-1 md:flex-none"
              title="تصدير Excel"
            >
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              onClick={refreshData}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-1 md:flex-none"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">تحديث البيانات</span>
              <span className="md:hidden">تحديث</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العيادة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العيادات</SelectItem>
                {uniqueClinics.map((clinic) => (
                  <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة الموردة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموردين</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الجهاز" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {uniqueDeviceTypes.map((device) => (
                  <SelectItem key={device} value={device}>{device}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
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

            <Select value={selectedWorkingStatus} onValueChange={setSelectedWorkingStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة التشغيل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {workingStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" style={{ color: option.color }} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMaintenanceStatus} onValueChange={setSelectedMaintenanceStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الصيانة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {maintenanceStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" style={{ color: option.color }} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWarrantyStatus} onValueChange={setSelectedWarrantyStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الضمان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {warrantyStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" style={{ color: option.color }} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="sm:col-span-2 lg:col-span-1">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                مسح جميع الفلاتر
              </Button>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          {(selectedClinic || selectedSupplier || selectedStatus || selectedDeviceType || selectedWorkingStatus || selectedMaintenanceStatus || selectedWarrantyStatus) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="text-sm text-blue-800 text-right flex-1">
                  <p className="font-medium mb-2">عرض {filteredData.length} من أصل {allData.length} عقد</p>
                  <div className="space-y-1 text-xs">
                    {selectedClinic && <span className="block">العيادة: {selectedClinic}</span>}
                    {selectedSupplier && <span className="block">المورد: {selectedSupplier}</span>}
                    {selectedDeviceType && <span className="block">نوع الجهاز: {selectedDeviceType}</span>}
                    {selectedStatus && <span className="block">الحالة: {selectedStatus}</span>}
                    {selectedWorkingStatus && (
                      <span className="block">
                        حالة التشغيل: {workingStatusOptions.find(opt => opt.value === selectedWorkingStatus)?.label}
                      </span>
                    )}
                    {selectedMaintenanceStatus && (
                      <span className="block">
                        حالة الصيانة: {maintenanceStatusOptions.find(opt => opt.value === selectedMaintenanceStatus)?.label}
                      </span>
                    )}
                    {selectedWarrantyStatus && (
                      <span className="block">
                        حالة الضمان: {warrantyStatusOptions.find(opt => opt.value === selectedWarrantyStatus)?.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToPDF}
                    disabled={exportLoading || filteredData.length === 0}
                    className="text-xs flex-1 md:flex-none"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    طباعة
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={exportLoading || filteredData.length === 0}
                    className="text-xs flex-1 md:flex-none"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">إجمالي العقود</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-800">{dashboardData.total}</p>
              </div>
              <Users className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-600">القيمة الإجمالية</p>
                <p className="text-xl md:text-2xl font-bold text-indigo-800">{dashboardData.totalValue?.toLocaleString()}</p>
                <p className="text-xs text-indigo-600">ريال سعودي</p>
              </div>
              <DollarSign className="h-6 md:h-8 w-6 md:w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <Clock className="h-5 md:h-6 w-5 md:w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs md:text-sm font-medium text-blue-600">جديد</p>
              <p className="text-lg md:text-xl font-bold text-blue-800">{dashboardData.new}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <AlertTriangle className="h-5 md:h-6 w-5 md:w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-xs md:text-sm font-medium text-yellow-600">موافق عليه</p>
              <p className="text-lg md:text-xl font-bold text-yellow-800">{dashboardData.approved}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <TrendingUp className="h-5 md:h-6 w-5 md:w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs md:text-sm font-medium text-purple-600">تم التعاقد</p>
              <p className="text-lg md:text-xl font-bold text-purple-800">{dashboardData.contracted}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <CheckCircle className="h-5 md:h-6 w-5 md:w-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs md:text-sm font-medium text-green-600">تم التسليم</p>
              <p className="text-lg md:text-xl font-bold text-green-800">{dashboardData.delivered}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 col-span-2 md:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <XCircle className="h-5 md:h-6 w-5 md:w-6 text-red-600 mx-auto mb-2" />
              <p className="text-xs md:text-sm font-medium text-red-600">مرفوض</p>
              <p className="text-lg md:text-xl font-bold text-red-800">{dashboardData.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm md:text-base">توزيع حالة العقود</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-gray-500 text-sm">لا توجد بيانات لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facility Distribution - Improved */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm md:text-base">توزيع الأجهزة حسب المنشآت</CardTitle>
          </CardHeader>
          <CardContent>
            {facilityDistributionData.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {facilityDistributionData.map((facility, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                    <div className="text-right flex-1">
                      <p className="font-medium text-sm md:text-base text-gray-800 truncate" title={facility.name}>
                        {facility.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">{facility.count} جهاز</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.max(10, (facility.count / Math.max(...facilityDistributionData.map(f => f.count))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mr-3">
                      <div className="text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-purple-100 text-purple-600 rounded-full text-xs md:text-sm font-bold">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-gray-500 text-sm">لا توجد بيانات منشآت</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers and Clinics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm md:text-base">أفضل الشركات الموردة</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topSuppliers.length > 0 ? (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                    <div className="text-right flex-1">
                      <p className="font-medium text-sm md:text-base">{supplier.name}</p>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        <p>{supplier.contracts} عقد</p>
                        <p>{supplier.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
                      <span className="font-bold text-purple-600 text-sm md:text-base">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">لا توجد بيانات موردين</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clinics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm md:text-base">أكثر العيادات نشاطاً</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topClinics.length > 0 ? (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {topClinics.map((clinic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <div className="text-right flex-1">
                      <p className="font-medium text-sm md:text-base">{clinic.name}</p>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        <p>{clinic.contracts} عقد</p>
                        <p>{clinic.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 md:h-5 w-4 md:w-5 text-green-600" />
                      <span className="font-bold text-green-600 text-sm md:text-base">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">لا توجد بيانات عيادات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
