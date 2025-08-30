import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { HardDrive, Building, Users, Wrench, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { dentalAssetsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Interface for asset data
interface Asset {
  id: number;
  name: string;
  facility: string;
  supplier: string;
  status: string;
  type: string;
  warrantyActive: string;
}

interface Facility {
  id: number;
  name: string;
}

const chartConfig = {
  working: { label: 'يعمل', color: '#22c55e' },
  broken: { label: 'معطل', color: '#ef4444' },
  facilities: { label: 'المنشآت', color: '#3b82f6' },
  suppliers: { label: 'الموردين', color: '#8b5cf6' },
  devices: { label: 'الأجهزة', color: '#f59e0b' }
};

export default function AssetsDashboard() {
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warrantyFilter, setWarrantyFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [facilities, setFacilitiesData] = useState<Facility[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const { toast } = useToast();

  // Fetch dashboard data and facilities on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFacilitiesLoading(true);

        // Fetch dashboard data and facilities in parallel
        const [dashboardResponse, facilitiesResponse] = await Promise.all([
          dentalAssetsApi.getDashboardData().catch(error => {
            console.error('Dashboard API error:', error);
            return { success: false, data: null, message: error.message };
          }),
          reportsApi.getFacilities().catch(error => {
            console.error('Facilities API error:', error);
            return { success: false, data: null, message: error.message };
          })
        ]);

        // Handle dashboard data
        if (dashboardResponse.success && dashboardResponse.data) {
          setAssets(dashboardResponse.data.assets || []);
          setDashboardData(dashboardResponse.data);
        } else {
          console.warn('Dashboard data not available:', dashboardResponse.message);
          setAssets([]); // Ensure assets is empty array on failure
          toast({
            title: "تعذر تحميل بيانات الأصول",
            description: dashboardResponse.message || "فشل في تحميل بيانات الأصول من الخادم",
            variant: "destructive"
          });
        }

        // Handle facilities data
        if (facilitiesResponse.success && facilitiesResponse.data) {
          setFacilitiesData(facilitiesResponse.data);
        } else {
          console.warn('Facilities data not available:', facilitiesResponse.message);
          setFacilitiesData([]); // Ensure facilities is empty array on failure
          toast({
            title: "تعذر تحميل المنشآت",
            description: facilitiesResponse.message || "فشل في تحميل بيانات المنشآت من الخادم",
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error('Critical error fetching data:', error);
        // Ensure state is clean on error
        setAssets([]);
        setFacilitiesData([]);
        toast({
          title: "خطأ في الاتصال",
          description: "فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت والمحاولة مرة أخرى",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setFacilitiesLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter devices based on selected filters
  const filteredDevices = assets.filter(device => {
    const matchesFacility = !facilityFilter || facilityFilter === 'all' || device.facility === facilityFilter;
    const matchesType = !deviceTypeFilter || deviceTypeFilter === 'all' || device.type === deviceTypeFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || device.status === statusFilter;
    const matchesWarranty = !warrantyFilter || warrantyFilter === 'all' || device.warrantyActive === warrantyFilter;
    const matchesSupplier = !supplierFilter || supplierFilter === 'all' || device.supplier === supplierFilter;
    
    return matchesFacility && matchesType && matchesStatus && matchesWarranty && matchesSupplier;
  });

  // Calculate statistics - use filtered data for accurate counts
  const totalDevices = filteredDevices.length;
  const workingDevices = filteredDevices.filter(d => d.status === 'يعمل').length;
  const brokenDevices = filteredDevices.filter(d => d.status === 'معطل' || d.status === 'مكهن').length;
  const underWarrantyDevices = filteredDevices.filter(d => d.warrantyActive === 'نعم').length;
  const outOfWarrantyDevices = filteredDevices.filter(d => d.warrantyActive === 'لا').length;

  const facilitiesInAssets = [...new Set(filteredDevices.map(d => d.facility))].filter(Boolean);
  const suppliers = [...new Set(assets.map(d => d.supplier))].filter(Boolean);
  const deviceTypes = [...new Set(assets.map(d => d.type))].filter(Boolean);

  // Clear all filters function
  const clearAllFilters = () => {
    setFacilityFilter('all');
    setDeviceTypeFilter('all');
    setStatusFilter('all');
    setWarrantyFilter('all');
    setSupplierFilter('all');
  };

  // Data for improved facility distribution (sorted and numbered)
  const facilityDistribution = facilitiesInAssets
    .map(facility => ({
      name: facility,
      shortName: facility.length > 15 ? facility.substring(0, 15) + '...' : facility,
      value: filteredDevices.filter(d => d.facility === facility).length
    }))
    .sort((a, b) => b.value - a.value) // Sort by value descending
    .map((item, index) => ({
      ...item,
      displayName: `${index + 1}. ${item.shortName}`,
      fullName: item.name
    }));

  // Data for device types distribution
  const deviceTypeDistribution = deviceTypes.map(type => ({
    name: type,
    value: filteredDevices.filter(d => d.type === type).length
  })).filter(item => item.value > 0);

  // Data for supplier distribution
  const supplierDistribution = suppliers.map(supplier => ({
    name: supplier,
    value: filteredDevices.filter(d => d.supplier === supplier).length
  })).filter(item => item.value > 0);

  // Data for working vs broken devices
  const statusDistribution = [
    { name: 'يعمل', value: workingDevices, fill: chartConfig.working.color },
    { name: 'معطل', value: brokenDevices, fill: chartConfig.broken.color }
  ].filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* AdminLTE 3 Style Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 sm:p-6 text-primary-foreground shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">لوحة تحكم الأصول</h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base">إدارة ومراقبة جميع الأصول والأجهزة الطبية</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">آخر تحديث: الآن</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border">
        <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground px-4 py-3 rounded-t-lg border-b border-border">
          <h3 className="font-semibold text-right flex items-center gap-2">
            <Filter className="h-4 w-4" />
            فلترة البيانات
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Facility Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">المنشأة</label>
              <Select value={facilityFilter} onValueChange={setFacilityFilter} disabled={facilitiesLoading}>
                <SelectTrigger className="bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder={facilitiesLoading ? "جاري التحميل..." : "جميع المنشآت"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنشآت</SelectItem>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.name}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">نوع الجهاز</label>
              <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
                <SelectTrigger className="bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">حالة الجهاز</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="يعمل">الأجهزة التي تعمل</SelectItem>
                  <SelectItem value="معطل">الأجهزة المعطلة</SelectItem>
                  <SelectItem value="مكهن">الأجهزة المكهنة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warranty Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">حالة الضمان</label>
              <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                <SelectTrigger className="bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="جميع أنواع الضمان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع أنواع الضمان</SelectItem>
                  <SelectItem value="نعم">تحت الضمان</SelectItem>
                  <SelectItem value="لا">خارج الضمان</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">الشركة الموردة</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="جميع الموردين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموردين</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button 
                onClick={clearAllFilters}
                variant="outline"
                className="w-full hover:bg-primary hover:text-primary-foreground transition-all"
              >
                مسح جميع الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {loading ? (
          <div className="col-span-full">
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
              </div>
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="text-center">
                <HardDrive className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد بيانات أصول متاحة</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">إجمالي الأجهزة</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{totalDevices}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                    <HardDrive className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-green-100 text-xs sm:text-sm font-medium">الأجهزة العاملة</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{workingDevices}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-red-100 text-xs sm:text-sm font-medium">الأجهزة المعطلة</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{brokenDevices}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-purple-100 text-xs sm:text-sm font-medium">إجمالي المنشآت</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{facilitiesInAssets.length}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                    <Building className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Warranty Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        {loading ? (
          <div className="col-span-full">
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">جاري تحميل إحصائيات الضمان...</p>
              </div>
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="text-center">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد بيانات ضمان متاحة</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-emerald-100 text-xs sm:text-sm font-medium">الأجهزة تحت الضمان</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{underWarrantyDevices}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-orange-100 text-xs sm:text-sm font-medium">الأجهزة خارج الضمان</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{outOfWarrantyDevices}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Device Status Distribution */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-success to-success/80 text-success-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="h-4 w-4" />
              توزيع حالة الأجهزة
            </h3>
          </div>
          <div className="p-2 sm:p-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">جاري تحميل بيانات توزيع الحالة...</p>
              </div>
            ) : statusDistribution.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد بيانات أجهزة لعرض التوزيع</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Device Type Distribution */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <HardDrive className="h-4 w-4" />
              توزيع أنواع الأجهزة
            </h3>
          </div>
          <div className="p-2 sm:p-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">جاري تحميل بيانات أنواع الأجهزة...</p>
              </div>
            ) : deviceTypeDistribution.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد بيانات أنواع أجهزة لعرض التوزيع</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceTypeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>

      {/* Improved Facility Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-info to-info/80 text-info-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <Building className="h-4 w-4" />
              توزيع الأجهزة حسب المنشآت
            </h3>
          </div>
          <div className="p-2 sm:p-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">جاري تحميل بيانات المنشآت...</p>
              </div>
            ) : facilityDistribution.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد بيانات منشآت لعرض التوزيع</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile-friendly list view */}
                <div className="block xl:hidden">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {facilityDistribution.map((facility, index) => (
                      <div key={facility.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                        <div className="text-right flex-1">
                          <div className="font-medium text-sm" title={facility.fullName}>
                            {index + 1}. {facility.name}
                          </div>
                        </div>
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {facility.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop chart view */}
                <div className="hidden xl:block h-[350px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={facilityDistribution} 
                        margin={{ 
                          top: 20, 
                          right: 30, 
                          left: 20, 
                          bottom: 100 
                        }}
                      >
                        <XAxis 
                          dataKey="displayName" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={90}
                          interval={0}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium text-right">{data.fullName}</p>
                                  <p className="text-blue-600 font-bold">عدد الأجهزة: {data.value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="hsl(var(--info))" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supplier Distribution */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <Users className="h-4 w-4" />
              توزيع الموردين
            </h3>
          </div>
          <div className="p-2 sm:p-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">جاري تحميل بيانات الموردين...</p>
              </div>
            ) : supplierDistribution.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد بيانات موردين لعرض التوزيع</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile-friendly list view */}
                <div className="block xl:hidden">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {supplierDistribution
                      .sort((a, b) => b.value - a.value)
                      .map((supplier, index) => (
                      <div key={supplier.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                        <div className="text-right flex-1">
                          <div className="font-medium text-sm">
                            {index + 1}. {supplier.name}
                          </div>
                        </div>
                        <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {supplier.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop chart view */}
                <div className="hidden xl:block h-[350px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={supplierDistribution.sort((a, b) => b.value - a.value)} 
                        margin={{ 
                          top: 20, 
                          right: 30, 
                          left: 20, 
                          bottom: 100 
                        }}
                      >
                        <XAxis 
                          dataKey="name" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={90}
                          interval={0}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="value" 
                          fill="#8b5cf6" 
                          radius={[6, 6, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
