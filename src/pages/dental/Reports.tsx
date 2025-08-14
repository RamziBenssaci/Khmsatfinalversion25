import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Filter, Users, Loader2 } from 'lucide-react';
import { dentalContractsApi } from '@/lib/api';
import { exportToExcel } from '@/utils/exportUtils';
import { toast } from 'sonner';

// Mock data for dental contracts (fallback)
const mockContracts = [
  {
    id: 'CONT-001',
    itemNumber: 'DENT-001',
    itemName: 'كرسي الأسنان المتطور',
    beneficiaryFacility: 'عيادة الأسنان - المبنى الرئيسي',
    supplierName: 'شركة التجهيزات الطبية المتقدمة',
    status: 'تم التعاقد',
    totalCost: '85000.00',
    orderDate: '2024-01-15',
    deliveryDate: '2024-02-15'
  },
  {
    id: 'CONT-002',
    itemNumber: 'DENT-002',
    itemName: 'جهاز الأشعة السينية للأسنان',
    beneficiaryFacility: 'مركز طب الأسنان التخصصي',
    supplierName: 'مؤسسة الأجهزة التشخيصية',
    status: 'موافق عليه',
    totalCost: '120000.00',
    orderDate: '2024-01-20',
    deliveryDate: '2024-02-20'
  },
  {
    id: 'CONT-003',
    itemNumber: 'DENT-003',
    itemName: 'أدوات تقويم الأسنان',
    beneficiaryFacility: 'قسم تقويم الأسنان',
    supplierName: 'شركة الأدوات الطبية المتخصصة',
    status: 'تم التسليم',
    totalCost: '45000.00',
    orderDate: '2024-01-10',
    deliveryDate: '2024-01-25'
  },
  {
    id: 'CONT-004',
    itemNumber: 'DENT-004',
    itemName: 'جهاز تنظيف الأسنان بالموجات فوق الصوتية',
    beneficiaryFacility: 'عيادة الأسنان العامة',
    supplierName: 'شركة التجهيزات الطبية المتقدمة',
    status: 'مرفوض',
    totalCost: '25000.00',
    orderDate: '2024-01-12',
    deliveryDate: null
  }
];

const statusConfig = {
  'جديد': 'bg-blue-100 text-blue-800',
  'موافق عليه': 'bg-yellow-100 text-yellow-800',
  'تم التعاقد': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرفوض': 'bg-red-100 text-red-800'
};

export default function DentalReports() {
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Dynamic filter options
  const [facilities, setFacilities] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await dentalContractsApi.getContracts();
        if (response.success && response.data) {
          setAllContracts(response.data);
          setFilteredContracts(response.data);
          
          // Extract unique values for filters
          const uniqueFacilities = [...new Set(response.data.map((contract: any) => contract.beneficiaryFacility).filter(Boolean))];
          const uniqueSuppliers = [...new Set(response.data.map((contract: any) => contract.supplierName).filter(Boolean))];
          const uniqueStatuses = [...new Set(response.data.map((contract: any) => contract.status).filter(Boolean))];
          
          setFacilities(uniqueFacilities);
          setSuppliers(uniqueSuppliers);
          setStatuses(uniqueStatuses);
          
          toast.success('تم تحميل البيانات بنجاح');
        } else {
          // Fallback to mock data if API fails
          setAllContracts(mockContracts);
          setFilteredContracts(mockContracts);
          
          // Extract unique values for filters from mock data
          const uniqueFacilities = [...new Set(mockContracts.map(contract => contract.beneficiaryFacility).filter(Boolean))];
          const uniqueSuppliers = [...new Set(mockContracts.map(contract => contract.supplierName).filter(Boolean))];
          const uniqueStatuses = [...new Set(mockContracts.map(contract => contract.status).filter(Boolean))];
          
          setFacilities(uniqueFacilities);
          setSuppliers(uniqueSuppliers);
          setStatuses(uniqueStatuses);
          
          toast.error('فشل في جلب البيانات من الخادم، سيتم عرض البيانات التجريبية');
        }
      } catch (error) {
        console.error('Error fetching reports data:', error);
        // Fallback to mock data
        setAllContracts(mockContracts);
        setFilteredContracts(mockContracts);
        
        // Extract unique values for filters from mock data
        const uniqueFacilities = [...new Set(mockContracts.map(contract => contract.beneficiaryFacility).filter(Boolean))];
        const uniqueSuppliers = [...new Set(mockContracts.map(contract => contract.supplierName).filter(Boolean))];
        const uniqueStatuses = [...new Set(mockContracts.map(contract => contract.status).filter(Boolean))];
        
        setFacilities(uniqueFacilities);
        setSuppliers(uniqueSuppliers);
        setStatuses(uniqueStatuses);
        
        toast.error('فشل في جلب البيانات من الخادم، سيتم عرض البيانات التجريبية');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters whenever filter values or data changes
  useEffect(() => {
    let filtered = [...allContracts];

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    if (itemFilter) {
      filtered = filtered.filter(contract => 
        contract.itemNumber?.toLowerCase().includes(itemFilter.toLowerCase()) || 
        contract.itemName?.toLowerCase().includes(itemFilter.toLowerCase())
      );
    }

    if (facilityFilter && facilityFilter !== 'all') {
      filtered = filtered.filter(contract => contract.beneficiaryFacility === facilityFilter);
    }

    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter(contract => contract.supplierName === supplierFilter);
    }

    setFilteredContracts(filtered);
  }, [statusFilter, itemFilter, facilityFilter, supplierFilter, allContracts]);

  // Calculate total cost with proper formatting
  const calculateTotalCost = () => {
    const total = filteredContracts.reduce((sum, contract) => {
      const cost = parseFloat(contract.totalCost) || 0;
      return sum + cost;
    }, 0);
    
    // Format number to remove unnecessary decimal places
    return total % 1 === 0 ? total.toLocaleString() : total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setItemFilter('');
    setFacilityFilter('all');
    setSupplierFilter('all');
  };

  const handleExportToExcel = async () => {
    if (filteredContracts.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    try {
      const exportData = filteredContracts.map(contract => ({
        'رقم العقد': contract.id,
        'رقم المعدة': contract.itemNumber,
        'اسم المعدة': contract.itemName,
        'العيادة المستفيدة': contract.beneficiaryFacility,
        'الشركة الموردة': contract.supplierName,
        'الحالة': contract.status,
        'التكلفة (ريال)': contract.totalCost,
        'تاريخ العقد': contract.orderDate,
        'تاريخ التسليم': contract.deliveryDate || 'لم يتم التسليم بعد'
      }));

      await exportToExcel(exportData, 'تقرير_عقود_الأسنان');
      toast.success('تم تصدير التقرير إلى Excel بنجاح');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('فشل في تصدير التقرير إلى Excel');
    }
  };

  const handleExportToPDF = () => {
    if (filteredContracts.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير عقود الأسنان</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              direction: rtl; 
              margin: 20px;
              font-size: 12px;
            }
            h1 { 
              text-align: center; 
              color: #6B46C1; 
              margin-bottom: 30px;
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
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .summary {
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-approved { background-color: #fef3c7; color: #92400e; }
            .status-contracted { background-color: #e9d5ff; color: #6b21a8; }
            .status-delivered { background-color: #d1fae5; color: #065f46; }
            .status-rejected { background-color: #fee2e2; color: #991b1b; }
            .status-new { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <h1>تقرير عقود الأسنان</h1>
          <div class="summary">
            <p><strong>عدد العقود:</strong> ${filteredContracts.length}</p>
            <p><strong>إجمالي التكلفة:</strong> ${calculateTotalCost()} ريال</p>
            <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>رقم العقد</th>
                <th>رقم المعدة</th>
                <th>اسم المعدة</th>
                <th>العيادة المستفيدة</th>
                <th>الشركة الموردة</th>
                <th>الحالة</th>
                <th>التكلفة</th>
                <th>تاريخ العقد</th>
              </tr>
            </thead>
            <tbody>
              ${filteredContracts.map(contract => {
                const statusClass = {
                  'موافق عليه': 'status-approved',
                  'تم التعاقد': 'status-contracted',
                  'تم التسليم': 'status-delivered',
                  'مرفوض': 'status-rejected',
                  'جديد': 'status-new'
                }[contract.status] || '';
                
                const cost = parseFloat(contract.totalCost) || 0;
                const formattedCost = cost % 1 === 0 ? cost.toLocaleString() : cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                return `
                  <tr>
                    <td>${contract.id}</td>
                    <td>${contract.itemNumber || ''}</td>
                    <td>${contract.itemName || ''}</td>
                    <td>${contract.beneficiaryFacility || ''}</td>
                    <td>${contract.supplierName || ''}</td>
                    <td><span class="status-badge ${statusClass}">${contract.status || ''}</span></td>
                    <td>${formattedCost} ريال</td>
                    <td>${contract.orderDate || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window and trigger print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
        
        toast.success('تم فتح نافذة الطباعة - اختر "حفظ كـ PDF" من خيارات الطباعة');
      } else {
        toast.error('فشل في فتح نافذة الطباعة - تأكد من السماح للنوافذ المنبثقة');
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('فشل في تصدير التقرير إلى PDF');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await dentalContractsApi.getContracts();
      if (response.success && response.data) {
        setAllContracts(response.data);
        
        // Update filter options
        const uniqueFacilities = [...new Set(response.data.map((contract: any) => contract.beneficiaryFacility).filter(Boolean))];
        const uniqueSuppliers = [...new Set(response.data.map((contract: any) => contract.supplierName).filter(Boolean))];
        const uniqueStatuses = [...new Set(response.data.map((contract: any) => contract.status).filter(Boolean))];
        
        setFacilities(uniqueFacilities);
        setSuppliers(uniqueSuppliers);
        setStatuses(uniqueStatuses);
        
        toast.success('تم تحديث البيانات بنجاح');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('فشل في تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-right">تقارير عقود الأسنان</h1>
              <p className="text-purple-100 mt-1 text-right">جاري تحميل البيانات...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mr-2">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-right">تقارير عقود الأسنان</h1>
              <p className="text-purple-100 mt-1 text-right">عرض وإدارة عقود معدات طب الأسنان</p>
            </div>
          </div>
          <Button 
            onClick={refreshData} 
            variant="secondary" 
            size="sm"
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              'تحديث البيانات'
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">حالة العقد</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رقم أو اسم المعدة</label>
              <Input
                placeholder="أدخل رقم أو اسم المعدة"
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">العيادة/القسم</label>
              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العيادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العيادات</SelectItem>
                  {facilities.map(facility => (
                    <SelectItem key={facility} value={facility}>{facility}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الشركة الموردة</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشركة الموردة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشركات</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تصدير البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">لا توجد بيانات للتصدير</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button 
                onClick={handleExportToExcel} 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير إلى Excel
              </Button>
              <Button 
                onClick={handleExportToPDF} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير إلى PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">عقود الأسنان</CardTitle>
          <p className="text-muted-foreground text-right">
            عدد العقود المعروضة: {filteredContracts.length} من {allContracts.length} | 
            إجمالي التكلفة: {calculateTotalCost()} ريال
          </p>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">لا توجد عقود تطابق المعايير المحددة</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-right">رقم العقد</th>
                      <th className="p-2 text-right">رقم المعدة</th>
                      <th className="p-2 text-right">اسم المعدة</th>
                      <th className="p-2 text-right">العيادة المستفيدة</th>
                      <th className="p-2 text-right">الشركة الموردة</th>
                      <th className="p-2 text-right">الحالة</th>
                      <th className="p-2 text-right">التكلفة</th>
                      <th className="p-2 text-right">تاريخ العقد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract) => {
                      const cost = parseFloat(contract.totalCost) || 0;
                      const formattedCost = cost % 1 === 0 ? cost.toLocaleString() : cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      
                      return (
                        <tr key={contract.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{contract.id}</td>
                          <td className="p-2">{contract.itemNumber}</td>
                          <td className="p-2">{contract.itemName}</td>
                          <td className="p-2">{contract.beneficiaryFacility}</td>
                          <td className="p-2">{contract.supplierName}</td>
                          <td className="p-2">
                            <Badge className={statusConfig[contract.status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'}>
                              {contract.status}
                            </Badge>
                          </td>
                          <td className="p-2">{formattedCost} ريال</td>
                          <td className="p-2">{contract.orderDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredContracts.map((contract) => {
                  const cost = parseFloat(contract.totalCost) || 0;
                  const formattedCost = cost % 1 === 0 ? cost.toLocaleString() : cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  
                  return (
                    <Card key={contract.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Badge className={statusConfig[contract.status as keyof typeof statusConfig]}>
                              {contract.status}
                            </Badge>
                            <span className="font-bold">{contract.id}</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>المعدة:</strong> {contract.itemName}</p>
                            <p><strong>العيادة المستفيدة:</strong> {contract.beneficiaryFacility}</p>
                            <p><strong>الشركة الموردة:</strong> {contract.supplierName}</p>
                            <p><strong>التكلفة:</strong> {formattedCost} ريال</p>
                            <p><strong>تاريخ العقد:</strong> {contract.orderDate}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
