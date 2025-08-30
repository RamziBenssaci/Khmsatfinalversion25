
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Loader2, FileX, Download, Printer, FileSpreadsheet, FileText, Monitor, Wrench, Shield, ShieldCheck, ShieldX, Building } from 'lucide-react';
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
  const [monthlyData, setMonthlyData] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [topClinics, setTopClinics] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [facilitiesDistribution, setFacilitiesDistribution] = useState([]);
  
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
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('');
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

  // Equipment filter options
  const workingStatusOptions = [
    { value: 'working', label: 'الأجهزة التي تعمل' },
    { value: 'not_working', label: 'الأجهزة المعطلة' }
  ];

  const maintenanceStatusOptions = [
    { value: 'needs_maintenance', label: 'الأجهزة المحتاجة صيانة' },
    { value: 'no_maintenance', label: 'الأجهزة التي لا تحتاج صيانة' }
  ];

  const warrantyStatusOptions = [
    { value: 'under_warranty', label: 'الأجهزة تحت الضمان' },
    { value: 'out_of_warranty', label: 'الأجهزة خارج الضمان' }
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

  // Calculate facilities distribution for chart
  const calculateFacilitiesDistribution = (data) => {
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
        setFacilitiesDistribution(calculateFacilitiesDistribution(response.data));
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

    if (selectedEquipmentType && selectedEquipmentType !== "all") {
      filtered = filtered.filter(item => 
        item.equipmentName?.toLowerCase().includes(selectedEquipmentType.toLowerCase()) ||
        item.deviceName?.toLowerCase().includes(selectedEquipmentType.toLowerCase())
      );
    }

    if (selectedWorkingStatus && selectedWorkingStatus !== "all") {
      filtered = filtered.filter(item => {
        if (selectedWorkingStatus === 'working') {
          return item.deviceStatus === 'يعمل';
        } else if (selectedWorkingStatus === 'not_working') {
          return item.deviceStatus === 'مكهن';
        }
        return true;
      });
    }

    if (selectedMaintenanceStatus && selectedMaintenanceStatus !== "all") {
      filtered = filtered.filter(item => {
        if (selectedMaintenanceStatus === 'needs_maintenance') {
          return item.deviceStatus === 'يعمل';
        } else if (selectedMaintenanceStatus === 'no_maintenance') {
          return item.deviceStatus === 'مكهن';
        }
        return true;
      });
    }

    if (selectedWarrantyStatus && selectedWarrantyStatus !== "all") {
      filtered = filtered.filter(item => {
        if (selectedWarrantyStatus === 'under_warranty') {
          return item.warrantyActive === 'yes';
        } else if (selectedWarrantyStatus === 'out_of_warranty') {
          =return item.warrantyActive === 'no';

        }
        return true;
      });
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

    // Update facilities distribution
    setFacilitiesDistribution(calculateFacilitiesDistribution(filtered));

  }, [selectedClinic, selectedSupplier, selectedStatus, selectedEquipmentType, selectedWorkingStatus, selectedMaintenanceStatus, selectedWarrantyStatus, allData]);

  const clearFilters = () => {
    setSelectedClinic('');
    setSelectedSupplier('');
    setSelectedStatus('');
    setSelectedEquipmentType('');
    setSelectedWorkingStatus('');
    setSelectedMaintenanceStatus('');
    setSelectedWarrantyStatus('');
    // Reset to original dashboard data instead of reloading
    setDashboardData(originalDashboardData);
    setFilteredData(allData);
    setFacilitiesDistribution(calculateFacilitiesDistribution(allData));
    
    // Reset status data to original
    const originalStatusData = [
      { name: 'جديد', value: originalDashboardData.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: originalDashboardData.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: originalDashboardData.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: originalDashboardData.delivered, color: '#10b981' },
      { name: 'مرفوض', value: originalDashboardData.rejected, color: '#ef4444' }
    ];
    setStatusData(originalStatusData);
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
      const headers = ['رقم العقد', 'العيادة المستفيدة', 'الشركة الموردة', 'الحالة', 'التكلفة الإجمالية', 'تاريخ الإنشاء'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          `"${item.contractNumber || ''}"`,
          `"${item.beneficiaryFacility || ''}"`,
          `"${item.supplierName || ''}"`,
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

  const uniqueEquipmentTypes = [...new Set(allData
    .map(item => item.equipmentName || item.deviceName)
    .filter(equipment => equipment && equipment.trim() !== '')
  )].sort();

  // Check if any filters are active
  const hasActiveFilters = selectedClinic || selectedSupplier || selectedStatus || 
                          selectedEquipmentType || selectedWorkingStatus || 
                          selectedMaintenanceStatus || selectedWarrantyStatus;

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
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <Users className="h-8 w-8" />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم عقود الأسنان</h1>
            <p className="text-purple-100 mt-1 text-right">إدارة شاملة لعقود معدات طب الأسنان</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Export buttons */}
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
          {/* First row - Basic filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

            <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الأجهزة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {uniqueEquipmentTypes.map((equipment) => (
                  <SelectItem key={equipment} value={equipment}>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      {equipment}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Second row - Equipment status filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select value={selectedWorkingStatus} onValueChange={setSelectedWorkingStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة التشغيل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {workingStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${option.value === 'working' ? 'text-green-600' : 'text-red-600'}`} />
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
                      <Wrench className={`w-4 h-4 ${option.value === 'needs_maintenance' ? 'text-orange-600' : 'text-green-600'}`} />
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
                      {option.value === 'under_warranty' ? (
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <ShieldX className="w-4 h-4 text-red-600" />
                      )}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                مسح الفلاتر
              </Button>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="text-sm text-blue-800 text-right flex-1">
                  <p className="font-medium mb-2">عرض {filteredData.length} من أصل {allData.length} عقد</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {selectedClinic && <span>العيادة: {selectedClinic}</span>}
                    {selectedSupplier && <span>المورد: {selectedSupplier}</span>}
                    {selectedStatus && <span>الحالة: {selectedStatus}</span>}
                    {selectedEquipmentType && <span>نوع الجهاز: {selectedEquipmentType}</span>}
                    {selectedWorkingStatus && <span>حالة التشغيل: {workingStatusOptions.find(o => o.value === selectedWorkingStatus)?.label}</span>}
                    {selectedMaintenanceStatus && <span>حالة الصيانة: {maintenanceStatusOptions.find(o => o.value === selectedMaintenanceStatus)?.label}</span>}
                    {selectedWarrantyStatus && <span>حالة الضمان: {warrantyStatusOptions.find(o => o.value === selectedWarrantyStatus)?.label}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToPDF}
                    disabled={exportLoading || filteredData.length === 0}
                    className="text-xs"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    طباعة
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={exportLoading || filteredData.length === 0}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Detailed Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع حالة العقود</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facilities Distribution - Improved Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Building className="h-5 w-5" />
              توزيع الأجهزة حسب المنشآت
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facilitiesDistribution.length > 0 ? (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={facilitiesDistribution}
                    layout="horizontal"
                    margin={{ top: 5, right: 5, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={90}
                      tick={{ fontSize: 10, textAnchor: 'end' }}
                    />
                    <Tooltip 
                      formatter={(value) => [value, 'عدد الأجهزة']}
                      labelStyle={{ direction: 'rtl', textAlign: 'right' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8b5cf6" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Detailed List */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 text-right">تفصيل المنشآت:</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {facilitiesDistribution.map((facility, index) => (
                      <div 
                        key={facility.name} 
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="text-right flex-1">
                          <span className="font-medium">{facility.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {facility.count} جهاز
                          </span>
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد بيانات منشآت لعرضها</p>
                </div>
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
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                    <div className="text-right flex-1">
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
            <CardTitle className="text-right">أكثر العيادات نشاطاً</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topClinics.length > 0 ? (
              <div className="space-y-4">
                {topClinics.map((clinic, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                    <div className="text-right flex-1">
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
                <p className="text-gray-500">لا توجد بيانات عيادات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
