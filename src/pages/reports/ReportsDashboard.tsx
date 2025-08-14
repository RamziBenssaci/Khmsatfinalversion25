import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, Package, Loader2, X, User, Calendar, FileText, MapPin } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';

export default function ReportsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    total_reports: 0,
    open_reports: 0,
    closed_reports: 0,
    out_of_order_reports: 0,
    status_distribution: [],
    category_distribution: [],
    facility_reports: [],
    monthly_trend: []
  });
  const [reports, setReports] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load dashboard data and reports
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load both dashboard stats and all reports
        const [dashboardResponse, reportsResponse] = await Promise.all([
          reportsApi.getDashboardStats(),
          reportsApi.getReports()
        ]);

        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
        }

        if (reportsResponse.success) {
          setReports(reportsResponse.data || []);
        }

        if (!dashboardResponse.success && !reportsResponse.success) {
          toast({
            title: "خطأ في تحميل البيانات",
            description: "فشل في تحميل بيانات لوحة التحكم",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "فشل في تحميل بيانات لوحة التحكم",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Get unique values for filters from the reports data
  const facilities = [...new Set(reports.map(r => r.facility?.name).filter(Boolean))];
  const categories = [...new Set(reports.map(r => r.category || r.type).filter(Boolean))];

  // Filter reports based on selected facility and category (client-side)
  const filteredReports = reports.filter(report => {
    const reportCategory = report.category || report.type;
    return (
      (selectedFacility === '' || report.facility?.name === selectedFacility) &&
      (selectedCategory === '' || reportCategory === selectedCategory)
    );
  });

  // Calculate filtered statistics - use filtered reports for all stats
  const totalReports = filteredReports.length;
  const openReports = filteredReports.filter(r => r.status === 'مفتوح').length;
  const closedReports = filteredReports.filter(r => r.status === 'مغلق').length;
  const outOfOrderReports = filteredReports.filter(r => r.status === 'مكهن').length;

  // Chart data for filtered results
  const statusChartData = [
    { name: 'مفتوح', value: openReports, fill: '#f59e0b' },
    { name: 'مغلق', value: closedReports, fill: '#10b981' },
    { name: 'مكهن', value: outOfOrderReports, fill: '#ef4444' }
  ];

  // Category chart data based on filtered reports
  const categoryChartData = categories.map(category => ({
    name: category,
    value: filteredReports.filter(r => (r.category || r.type) === category).length,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  // Facility chart data based on filtered reports
  const facilityChartData = facilities.map(facility => ({
    name: facility,
    reports: filteredReports.filter(r => r.facility?.name === facility).length
  }));

  // Handle showing report details
  const handleShowReportDetails = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-3">جاري تحميل لوحة التحكم...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* AdminLTE 3 Style Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-primary-foreground shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-right">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">لوحة تحكم البلاغات</h1>
            <p className="text-primary-foreground/90">إحصائيات ومعدلات الإنجاز للبلاغات والصيانة</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">آخر تحديث: الآن</span>
            </div>
          </div>
        </div>
      </div>

      {/* AdminLTE 3 Style Filters */}
      <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border">
        <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground px-4 py-3 rounded-t-lg border-b border-border">
          <h3 className="font-semibold text-right flex items-center gap-2">
            <Package className="h-4 w-4" />
            فلترة البيانات
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">المنشأة</label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="w-full p-3 border border-border rounded-lg text-right bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">جميع المنشآت</option>
                {facilities.map(facility => (
                  <option key={facility} value={facility}>{facility}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">النوع</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-border rounded-lg text-right bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">جميع الأنواع</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics - Now showing filtered data */}
      <div className="responsive-grid">
        <StatCard title="إجمالي البلاغات" value={totalReports} icon={AlertCircle} color="primary" />
        <StatCard title="البلاغات المفتوحة" value={openReports} icon={Clock} color="warning" />
        <StatCard title="البلاغات المغلقة" value={closedReports} icon={CheckCircle} color="success" />
        <StatCard title="البلاغات المكهنة" value={outOfOrderReports} icon={XCircle} color="danger" />
      </div>

      {/* AdminLTE 3 Style Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-success to-success/80 text-success-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              توزيع البلاغات حسب الحالة
            </h3>
          </div>
          <div className="p-4">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {statusChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 bg-accent/50 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span className="text-sm font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-info to-info/80 text-info-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              توزيع البلاغات حسب النوع
            </h3>
          </div>
          <div className="p-4">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-2 mt-4 max-h-24 overflow-y-auto">
              {categoryChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs bg-accent/30 px-2 py-1 rounded">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }}></div>
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AdminLTE 3 Style Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Facility Reports Bar Chart */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2">
              <Package className="h-4 w-4" />
              البلاغات حسب المنشآت
            </h3>
          </div>
          <div className="p-4">
            <div className="h-[350px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={facilityChartData} 
                    margin={{ 
                      top: 20, 
                      right: 30, 
                      left: 20, 
                      bottom: 100 
                    }}
                  >
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      fontSize={11}
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="reports" 
                      fill="hsl(var(--warning))" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </div>

        {/* Monthly Trend Line Chart - Uses dashboard data (not filtered) */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              اتجاه البلاغات الشهري
            </h3>
          </div>
          <div className="p-4">
            <div className="h-[350px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={dashboardData.monthly_trend} 
                    margin={{ 
                      top: 20, 
                      right: 30, 
                      left: 20, 
                      bottom: 20 
                    }}
                  >
                    <XAxis 
                      dataKey="month" 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </div>
      </div>

      {/* AdminLTE 3 Style Latest Reports */}
      <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-danger to-danger/80 text-danger-foreground px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-right flex items-center gap-2">
            <Clock className="h-4 w-4" />
            أحدث البلاغات
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {filteredReports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className={`w-3 h-3 rounded-full ${
                    report.status === 'مفتوح' ? 'bg-warning' :
                    report.status === 'مغلق' ? 'bg-success' : 'bg-danger'
                  }`}></div>
                  <div>
                    <div className="font-medium">{report.id} - {report.title}</div>
                    <div className="text-sm text-muted-foreground">{report.facility?.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    report.status === 'مفتوح' ? 'bg-warning text-warning-foreground' :
                    report.status === 'مغلق' ? 'bg-success text-success-foreground' :
                    'bg-danger text-danger-foreground'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">
                    {new Date(report.created_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بلاغات لعرضها
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-bold text-right">تفاصيل البلاغ #{selectedReport.id}</h2>
              <button 
                onClick={handleCloseModal}
                className="text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Report Status */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedReport.status === 'مفتوح' ? 'bg-warning text-warning-foreground' :
                  selectedReport.status === 'مغلق' ? 'bg-success text-success-foreground' :
                  'bg-danger text-danger-foreground'
                }`}>
                  {selectedReport.status}
                </span>
              </div>

              {/* Report Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-right">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">العنوان</div>
                      <div className="text-muted-foreground">{selectedReport.title}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">النوع</div>
                      <div className="text-muted-foreground">{selectedReport.category || selectedReport.type}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">المنشأة</div>
                      <div className="text-muted-foreground">{selectedReport.facility?.name}</div>
                    </div>
                  </div>
                </div>

                {/* Dates and User */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-right">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">المبلغ</div>
                      <div className="text-muted-foreground">{selectedReport.user?.name || 'غير محدد'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">تاريخ الإنشاء</div>
                      <div className="text-muted-foreground">
                        {new Date(selectedReport.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedReport.updated_at && selectedReport.updated_at !== selectedReport.created_at && (
                    <div className="flex items-center gap-3 text-right">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">آخر تحديث</div>
                        <div className="text-muted-foreground">
                          {new Date(selectedReport.updated_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground text-right">الوصف</h3>
                  <div className="bg-accent p-4 rounded-lg text-right">
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Priority */}
              {selectedReport.priority && (
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground text-right">الأولوية</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    selectedReport.priority === 'عالية' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                    selectedReport.priority === 'متوسطة' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {selectedReport.priority}
                  </span>
                </div>
              )}

              {/* Notes */}
              {selectedReport.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground text-right">ملاحظات</h3>
                  <div className="bg-accent p-4 rounded-lg text-right">
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedReport.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-accent/30 px-6 py-4 rounded-b-lg flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
