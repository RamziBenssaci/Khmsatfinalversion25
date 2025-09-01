import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { directPurchaseApi, facilitiesApi, suppliersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function DirectPurchaseDashboard() {
  const [dashboardData, setDashboardData] = useState<any>({
    total: 0,
    new: 0,
    approved: 0,
    contracted: 0,
    delivered: 0,
    rejected: 0,
    totalValue: 0,
    topSuppliers: [],
    monthlyData: [],
    statusData: []
  });
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const { toast } = useToast();

  // Fetch all dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [selectedFacility, selectedItem, selectedSupplier, allOrders]);

  const applyFilters = () => {
    let filtered = allOrders;

    if (selectedFacility) {
      filtered = filtered.filter(order => order.beneficiary === selectedFacility);
    }

    if (selectedItem) {
      filtered = filtered.filter(order => 
        order.itemNumber?.includes(selectedItem) || order.itemName?.includes(selectedItem)
      );
    }

    if (selectedSupplier) {
      filtered = filtered.filter(order => order.supplier === selectedSupplier);
    }

    setFilteredOrders(filtered);
    
    // Recalculate stats with filtered data
    const filteredStats = calculateDashboardStats(filtered);
    setDashboardData(filteredStats);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all required data in parallel
      const [ordersResponse, facilitiesResponse, suppliersResponse] = await Promise.all([
        directPurchaseApi.getOrders(),
        facilitiesApi.getFacilities(),
        suppliersApi.getSuppliers()
      ]);

      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse.data || []);
      const facilitiesData = Array.isArray(facilitiesResponse) ? facilitiesResponse : (facilitiesResponse.data || []);
      const suppliersData = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse.data || []);
      
      setAllOrders(ordersData);
      setFilteredOrders(ordersData);
      setFacilities(facilitiesData);
      setSuppliers(suppliersData);
      
      // Calculate dashboard statistics
      const stats = calculateDashboardStats(ordersData);
      setDashboardData(stats);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const calculateDashboardStats = (orders: any[]) => {
    const stats = {
      total: orders.length,
      new: orders.filter(o => o.status === 'جديد').length,
      approved: orders.filter(o => o.status === 'موافق عليه').length,
      contracted: orders.filter(o => o.status === 'تم التعاقد').length,
      delivered: orders.filter(o => o.status === 'تم التسليم').length,
      rejected: orders.filter(o => o.status === 'مرفوض').length,
      totalValue: orders.filter(o => o.status !== 'مرفوض').reduce((sum, order) => sum + (parseFloat(order.totalCost) || 0), 0)
    };

    // Calculate top suppliers
    const supplierStats = orders.reduce((acc: any, order) => {
      if (order.supplier) {
        if (!acc[order.supplier]) {
          acc[order.supplier] = { name: order.supplier, orders: 0, value: 0 };
        }
        acc[order.supplier].orders += 1;
        acc[order.supplier].value += order.totalCost || 0;
      }
      return acc;
    }, {});

    const topSuppliers = Object.values(supplierStats)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 4);

    // Calculate monthly data (all 12 months)
    const monthlyData = calculateMonthlyData(orders);
    
    // Status distribution data
    const statusData = [
      { name: 'جديد', value: stats.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: stats.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: stats.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: stats.delivered, color: '#10b981' },
      { name: 'مرفوض', value: stats.rejected, color: '#ef4444' }
    ];

    return {
      ...stats,
      topSuppliers,
      monthlyData,
      statusData
    };
  };

  const calculateMonthlyData = (orders: any[]) => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyStats: any[] = [];

    // Initialize all 12 months with 0
    months.forEach((monthName, monthIndex) => {
      const monthOrders = orders.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === monthIndex;
      });

      monthlyStats.push({
        month: monthName,
        orders: monthOrders.length,
        value: monthOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0)
      });
    });

    return monthlyStats;
  };

  const clearFilters = () => {
    setSelectedFacility('');
    setSelectedItem('');
    setSelectedSupplier('');
    setFilteredOrders(allOrders);
    
    // Reset stats to original data
    const originalStats = calculateDashboardStats(allOrders);
    setDashboardData(originalStats);
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم الشراء المباشر</h1>
            <p className="text-green-100 mt-1 text-right">إدارة شاملة لطلبات الشراء المباشر</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">فلاتر البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنشأة" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility: any) => (
                  <SelectItem key={facility.id || facility.name} value={facility.name}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="رقم أو اسم الصنف"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            />

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة الموردة" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: any, index: number) => (
                  <SelectItem key={index} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-800">{dashboardData.total || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">القيمة الإجمالية</p>
                <p className="text-xl font-bold text-purple-800">{(dashboardData.totalValue || 0).toLocaleString()}</p>
                <p className="text-xs text-purple-600">ريال سعودي</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
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
              <p className="text-xl font-bold text-blue-800">{dashboardData.new || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-600">موافق عليه</p>
              <p className="text-xl font-bold text-yellow-800">{dashboardData.approved || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">تم التعاقد</p>
              <p className="text-xl font-bold text-purple-800">{dashboardData.contracted || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">تم التسليم</p>
              <p className="text-xl font-bold text-green-800">{dashboardData.delivered || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-600">مرفوض</p>
              <p className="text-xl font-bold text-red-800">{dashboardData.rejected || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع حالة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboardData.statusData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(dashboardData.statusData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}`, name]}
                  labelFormatter={() => ''}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend below chart */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
              {(dashboardData.statusData || []).map((item: any) => (
                <div key={item.name} className="flex items-center gap-1 sm:gap-2 bg-accent/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs sm:text-sm font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">اتجاه الطلبات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={dashboardData.monthlyData || []} 
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
                    dataKey="orders" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    name="عدد الطلبات"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أفضل الشركات الموردة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dashboardData.topSuppliers || []).map((supplier: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-right">
                  <p className="font-medium">{supplier.name}</p>
                  <div className="text-sm text-gray-600">
                    <p>{supplier.orders} طلب</p>
                    <p>{supplier.value.toLocaleString()} ريال</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-600">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
