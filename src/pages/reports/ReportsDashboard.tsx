import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, Package, X, User, Calendar, FileText, MapPin } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';

export default function ReportsDashboard() {
  const { toast } = useToast();
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
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load dashboard data and reports - Optimized
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load reports first (since we can calculate stats from them if needed)
        const reportsResponse = await reportsApi.getReports();

        if (reportsResponse.success) {
          setReports(reportsResponse.data || []);
        }

        // Try to load dashboard stats in parallel, but don't wait for it
        reportsApi.getDashboardStats().then(dashboardResponse => {
          if (dashboardResponse.success) {
            setDashboardData(dashboardResponse.data);
          }
        }).catch(error => {
          console.warn('Dashboard stats loading failed:', error);
        });

        if (!reportsResponse.success) {
          toast({
            title: "خطأ في تحميل البيانات",
            description: "فشل في تحميل بيانات البلاغات",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Data loading error:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "فشل في تحميل بيانات لوحة التحكم",
          variant: "destructive"
        });
      }
    };

    loadDashboardData();
  }, [toast]);

  // Get unique values for filters from the reports data
  const facilities = [...new Set(reports.map(r => r.facility?.name).filter(Boolean))];
  const categories = [...new Set(reports.map(r => r.category || r.type).filter(Boolean))];

  // Helper function to check if a date is within the selected range
  const isDateInRange = (reportDate) => {
    if (!startDate && !endDate) return true;
    
    const reportDateObj = new Date(reportDate);
    if (isNaN(reportDateObj.getTime())) return false;
    
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    
    if (startDateObj && endDateObj) {
      return reportDateObj >= startDateObj && reportDateObj <= endDateObj;
    } else if (startDateObj) {
      return reportDateObj >= startDateObj;
    } else if (endDateObj) {
      return reportDateObj <= endDateObj;
    }
    
    return true;
  };

  // Filter reports based on selected facility, category, and date range (client-side)
  const filteredReports = reports.filter(report => {
    const reportCategory = report.category || report.type;
    return (
      (selectedFacility === '' || report.facility?.name === selectedFacility) &&
      (selectedCategory === '' || reportCategory === selectedCategory) &&
      isDateInRange(report.report_date)
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

  // Generate beautiful horizontal bar chart data for facilities
  const facilityChartData = facilities.map((facility, index) => ({
    name: facility,
    reports: filteredReports.filter(r => r.facility?.name === facility).length,
    fill: `hsl(${(index * 45) % 360}, 65%, 55%)`
  })).sort((a, b) => b.reports - a.reports); // Sort by report count

  // Generate monthly trend from filtered reports using report_date
  const generateMonthlyTrend = () => {
    const monthCounts = {};
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // Initialize all months with 0
    months.forEach(month => {
      monthCounts[month] = 0;
    });

    // Count reports by month using report_date or created_at
    filteredReports.forEach(report => {
      const date = new Date(report.report_date || report.created_at);
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
  };

  const monthlyTrendData = generateMonthlyTrend();

  // Handle clearing date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

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

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* AdminLTE 3 Style Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 sm:p-6 text-primary-foreground shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">لوحة تحكم البلاغات</h1>
            <p className="text-sm sm:text-base text-primary-foreground/90">إحصائيات ومعدلات الإنجاز للبلاغات والصيانة</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">آخر تحديث: الآن</span>
            </div>
          </div>
        </div>
      </div>

      {/* AdminLTE 3 Style Filters - Enhanced with Date Filter */}
      <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border">
        <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground px-3 sm:px-4 py-3 rounded-t-lg border-b border-border">
          <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
            <Package className="h-4 w-4" />
            فلترة البيانات
          </h3>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Facility Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">المنشأة</label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="w-full p-2 sm:p-3 border border-border rounded-lg text-right bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              >
                <option value="">جميع المنشآت</option>
                {facilities.map(facility => (
                  <option key={facility} value={facility}>{facility}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">النوع</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 sm:p-3 border border-border rounded-lg text-right bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              >
                <option value="">جميع الأنواع</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-border rounded-lg text-right bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block text-right">إلى تاريخ</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 p-2 sm:p-3 border border-border rounded-lg text-right bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateFilters}
                    className="px-3 py-2 bg-danger text-danger-foreground rounded-lg hover:bg-danger/90 transition-colors text-xs flex items-center gap-1"
                    title="مسح فلتر التاريخ"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Date Filter Summary */}
          {(startDate || endDate) && (
            <div className="mt-3 p-2 bg-primary/10 rounded-lg">
              <div className="text-sm text-primary text-right flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  فلتر التاريخ: 
                  {startDate && ` من ${startDate}`}
                  {startDate && endDate && ' '}
                  {endDate && ` إلى ${endDate}`}
                  <span className="mr-2 text-primary/70">({totalReports} بلاغ)</span>
                </span>
              </div>
            </div>
          )}
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
          <div className="bg-gradient-to-r from-success to-success/80 text-success-foreground px-3 sm:px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4" />
              توزيع البلاغات حسب الحالة
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            <ChartContainer config={{}} className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
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
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
              {statusChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 sm:gap-2 bg-accent/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span className="text-xs sm:text-sm font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-info to-info/80 text-info-foreground px-3 sm:px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <AlertCircle className="h-4 w-4" />
              توزيع البلاغات حسب النوع
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            <ChartContainer config={{}} className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-3 sm:mt-4 max-h-20 sm:max-h-24 overflow-y-auto">
              {categoryChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 sm:gap-2 text-xs bg-accent/30 px-2 py-1 rounded">
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
        {/* Facility Reports - Beautiful Grid Layout */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground px-3 sm:px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <Package className="h-4 w-4" />
              البلاغات حسب المنشآت
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            {facilityChartData.length > 0 ? (
              <div className="space-y-3">
                {facilityChartData.map((facility, index) => (
                  <div key={facility.name} className="group">
                    {/* Facility Name and Count */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: facility.fill }}
                        ></div>
                        <span className="text-sm font-medium text-foreground">
                          {facility.reports}
                        </span>
                      </div>
                      <div className="text-right flex-1 min-w-0 mr-3">
                        <span className="text-sm font-medium text-foreground block truncate">
                          {facility.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="w-full bg-accent rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out group-hover:shadow-lg"
                          style={{ 
                            backgroundColor: facility.fill,
                            width: `${totalReports > 0 ? (facility.reports / Math.max(...facilityChartData.map(f => f.reports))) * 100 : 0}%`,
                            background: `linear-gradient(90deg, ${facility.fill}, ${facility.fill}dd)`
                          }}
                        ></div>
                      </div>
                      
                      {/* Percentage Label */}
                      <div className="absolute left-2 top-0 h-full flex items-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {totalReports > 0 ? Math.round((facility.reports / totalReports) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات لعرضها
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend Line Chart - Now uses report_date from filtered reports */}
        <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 sm:px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4" />
              اتجاه البلاغات الشهري
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            <div className="h-[300px] sm:h-[350px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={monthlyTrendData} 
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
                    <ChartTooltip content={<ChartTooltipContent />} />
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
              </ChartContainer>
            </div>
          </div>
        </div>
      </div>

      {/* AdminLTE 3 Style Latest Reports */}
      <div className="bg-white dark:bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-danger to-danger/80 text-danger-foreground px-3 sm:px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-right flex items-center gap-2 text-sm sm:text-base">
            <Clock className="h-4 w-4" />
            أحدث البلاغات
          </h3>
        </div>
        <div className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {filteredReports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex flex-col gap-3 p-3 sm:p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                    report.status === 'مفتوح' ? 'bg-warning' :
                    report.status === 'مغلق' ? 'bg-success' : 'bg-danger'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base text-right">{report.id} - {report.title}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground text-right">{report.facility?.name}</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 order-2 sm:order-1">
                    <button
                      onClick={() => handleShowReportDetails(report)}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm order-1 sm:order-2">
                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                      report.status === 'مفتوح' ? 'bg-warning text-warning-foreground' :
                      report.status === 'مغلق' ? 'bg-success text-success-foreground' :
                      'bg-danger text-danger-foreground'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-muted-foreground text-right">
                      {report.report_date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
                لا توجد بلاغات لعرضها
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Details Modal - Mobile Optimized */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg flex justify-between items-center sticky top-0">
              <h2 className="text-lg sm:text-xl font-bold text-right">تفاصيل البلاغ #{selectedReport.id}</h2>
              <button 
                onClick={handleCloseModal}
                className="text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Report Status */}
              <div className="flex justify-center">
                <span className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium ${
                  selectedReport.status === 'مفتوح' ? 'bg-warning text-warning-foreground' :
                  selectedReport.status === 'مغلق' ? 'bg-success text-success-foreground' :
                  'bg-danger text-danger-foreground'
                }`}>
                  {selectedReport.status}
                </span>
              </div>

              {/* Report Info Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Basic Info */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 text-right">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm sm:text-base">العنوان</div>
                      <div className="text-muted-foreground text-sm break-words">{selectedReport.title}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-right">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm sm:text-base">النوع</div>
                      <div className="text-muted-foreground text-sm">{selectedReport.category || selectedReport.type}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-right">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm sm:text-base">المنشأة</div>
                      <div className="text-muted-foreground text-sm break-words">{selectedReport.facility?.name}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-right">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm sm:text-base">المبلغ</div>
                      <div className="text-muted-foreground text-sm">{selectedReport.user?.name || 'غير محدد'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-right">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm sm:text-base">تاريخ البلاغ</div>
                      <div className="text-muted-foreground text-sm">
                        {selectedReport.report_date}
                      </div>
                    </div>
                  </div>

                  {selectedReport.updated_at && selectedReport.updated_at !== selectedReport.created_at && (
                    <div className="flex items-start gap-3 text-right">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground text-sm sm:text-base">آخر تحديث</div>
                        <div className="text-muted-foreground text-sm">
                          {selectedReport.updated_at}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground text-right text-sm sm:text-base">الوصف</h3>
                  <div className="bg-accent p-3 sm:p-4 rounded-lg text-right">
                    <p className="text-muted-foreground leading-relaxed text-sm break-words">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Priority */}
              {selectedReport.priority && (
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground text-right text-sm sm:text-base">الأولوية</h3>
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
                  <h3 className="font-medium text-foreground text-right text-sm sm:text-base">ملاحظات</h3>
                  <div className="bg-accent p-3 sm:p-4 rounded-lg text-right">
                    <p className="text-muted-foreground leading-relaxed text-sm break-words">
                      {selectedReport.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-accent/30 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg flex justify-end sticky bottom-0">
              <button 
                onClick={handleCloseModal}
                className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
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
