import { 
  AlertCircle, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Building,
  Stethoscope,
  Activity,
  Filter,
  BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { mockReports, mockInventoryItems, mockTransactions, dentalClinicsData } from '@/data/mockData';
import { logout } from '@/lib/api';

// Mock facilities data
const mockFacilities = [
  { id: 1, name: 'مركز صحي الملز', code: 'RC001', location: 'حي الملز', sector: 'الرياض', type: 'الرياض - مراكز شرق', category: 'مركز صحي', totalClinics: 8, working: 7, outOfOrder: 1, notWorking: 0, status: 'نشطة' },
  { id: 2, name: 'مستشفى الملك فهد', code: 'KFH001', location: 'شمال الرياض', sector: 'الرياض', type: 'الرياض - مستشفى', category: 'مستشفى', totalClinics: 25, working: 23, outOfOrder: 1, notWorking: 1, status: 'نشطة' },
  { id: 3, name: 'مركز الزلفي الصحي', code: 'ZC001', location: 'الزلفي', sector: 'الزلفي', type: 'مركز صحي', category: 'مركز صحي', totalClinics: 12, working: 11, outOfOrder: 0, notWorking: 1, status: 'غير نشطة' },
];

// Hardcoded clinic names in Arabic
const clinicOptions = [
  'عيادة الأسنان العامة',
  'عيادة طب الأسنان التخصصية',
  'عيادة جراحة الفم والأسنان',
  'عيادة تقويم الأسنان',
  'عيادة طب أسنان الأطفال'
];

// Hardcoded sectors list
const hardcodedSectors = ['الرياض', 'الزلفي', 'رماح', 'حوطة سدير', 'تمير', 'الغاط', 'المجمعة', 'الأرطاوية'];

export default function Dashboard() {
  const [selectedSector, setSelectedSector] = useState('');
  // Remove selectedFacilityType state
  // const [selectedFacilityType, setSelectedFacilityType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [newFacility, setNewFacility] = useState({
    name: '',
    code: '',
    sector: '',
    status: 'نشطة',
    category: '',
    totalClinics: '',
    workingClinics: '',
    outOfOrderClinics: '',
    notWorkingClinics: '',
    facilityEmail: '',
    facilityPhone: '',
    facilityLocation: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    medicalDirectorName: '',
    medicalDirectorEmail: '',
    medicalDirectorPhone: '',
    contact: '',
    manager: '',
    medical_director: '',
    location: '',
    clinics: [],
    number: ''
  });

  // Load dashboard data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading dashboard data from API...');
        
        // Load all dashboard data in parallel
        const [dashboardResponse, facilitiesResponse, reportsResponse] = await Promise.all([
          dashboardApi.getDashboardData(),
          dashboardApi.getFacilities(),
          dashboardApi.getRecentReports()
        ]);
        
        console.log('✅ API data loaded successfully:', {
          dashboard: dashboardResponse.data,
          facilities: facilitiesResponse.data,
          reports: reportsResponse.data
        });
        
        setDashboardStats(dashboardResponse.data);
        setFacilities(facilitiesResponse.data || []);
        setRecentReports(reportsResponse.data || []);
        
        toast({
          title: "تم تحميل البيانات من الخادم",
          description: "تم تحميل جميع بيانات لوحة التحكم بنجاح من الـ API",
        });
      } catch (error: any) {
        console.error('❌ Error loading dashboard data:', error);
        console.log('🔄 Falling back to mock data...');
        
        toast({
          title: "تعذر الاتصال بالخادم",
          description: "سيتم استخدام البيانات التجريبية حتى يصبح الخادم متاحاً",
          variant: "destructive",
        });
        
        // Fallback to mock data
        setFacilities(mockFacilities);
        setRecentReports(mockReports.slice(0, 5));
        setDashboardStats({
          total_clinics: 150,
          working_clinics: 135,
          not_working_clinics: 10,
          out_of_order_clinics: 5,
          total_facilities: 12
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Calculate dynamic statistics based on real API data
  const calculateStatsFromAPI = (facilities) => {
    if (!facilities || facilities.length === 0) {
      return {
        total_clinics: dashboardStats?.total_clinics || 150,
        working_clinics: dashboardStats?.working_clinics || 135,
        not_working_clinics: dashboardStats?.not_working_clinics || 10,
        out_of_order_clinics: dashboardStats?.out_of_order_clinics || 5,
        total_facilities: dashboardStats?.total_facilities || 5
      };
    }

    return facilities.reduce((acc, facility) => {
      acc.total_clinics += parseInt(facility.totalClinics) || 0;
      acc.working_clinics += parseInt(facility.workingClinics || facility.working) || 0;
      acc.not_working_clinics += parseInt(facility.notWorkingClinics || facility.notWorking) || 0;
      acc.out_of_order_clinics += parseInt(facility.outOfOrderClinics || facility.outOfOrder) || 0;
      return acc;
    }, {
      total_clinics: 0,
      working_clinics: 0,
      not_working_clinics: 0,
      out_of_order_clinics: 0,
      total_facilities: facilities.length
    });
  };

  // Calculate facility status counts from facilities data
  const calculateFacilityStatusCounts = (facilities) => {
    if (!facilities || facilities.length === 0) {
      return { active: 0, inactive: 0 };
    }

    return facilities.reduce((acc, facility) => {
      if (facility.status === 'نشطة') {
        acc.active++;
      } else if (facility.status === 'غير نشطة') {
        acc.inactive++;
      }
      return acc;
    }, { active: 0, inactive: 0 });
  };

  // Use real API dashboard stats
  const totalClinics = dashboardStats?.total_clinics || 150;
  const totalWorking = dashboardStats?.working_clinics || 135;
  const totalNotWorking = dashboardStats?.not_working_clinics || 10;
  const totalOutOfOrder = dashboardStats?.out_of_order_clinics || 5;
  const totalFacilities = dashboardStats?.total_facilities || facilities.length;

  // Get unique categories from API data (remove facility type logic)
  const uniqueCategories = [
  ...new Set(
    facilities
      .map(f => typeof f.category === "string" ? f.category.trim().toLowerCase() : f.category)
  )
  ].filter(Boolean);

  // Updated filter facilities with only sector and category
  const filteredFacilities = facilities.filter((f: any) => {
    const sectorMatch = (!selectedSector || selectedSector === 'all-sectors' || f.sector === selectedSector);
    const categoryMatch = (!selectedCategory || selectedCategory === 'all-categories' || f.category === selectedCategory);
    
    return sectorMatch && categoryMatch;
  });

  // Calculate filtered statistics
  const filteredStats = calculateStatsFromAPI(filteredFacilities);
  
  // Calculate facility status counts for filtered or all facilities
  const facilityStatusCounts = calculateFacilityStatusCounts(
    (selectedSector && selectedSector !== 'all-sectors') || 
    (selectedCategory && selectedCategory !== 'all-categories') 
    ? filteredFacilities : facilities
  );

  // Group by sector and type for display
  const groupedBySector = filteredFacilities.reduce((acc: any, f: any) => {
    if (!acc[f.sector]) acc[f.sector] = {};
    if (!acc[f.sector][f.category || f.type]) acc[f.sector][f.category || f.type] = { count: 0, clinics: 0 };
    acc[f.sector][f.category || f.type].count++;
    acc[f.sector][f.category || f.type].clinics += parseInt(f.totalClinics) || 0;
    return acc;
  }, {} as Record<string, Record<string, { count: number; clinics: number }>>);

  // Handle clinic selection
  const handleClinicChange = (clinicName: string, checked: boolean) => {
    if (checked) {
      setNewFacility({
        ...newFacility,
        clinics: [...newFacility.clinics, clinicName]
      });
    } else {
      setNewFacility({
        ...newFacility,
        clinics: newFacility.clinics.filter(clinic => clinic !== clinicName)
      });
    }
  };

  const handleAddFacility = async () => {
    if (newFacility.name && newFacility.code) {
      try {
        console.log('🔄 Adding new facility via API...', newFacility);
        
        const response = await dashboardApi.registerFacility(newFacility);
        
        console.log('✅ Facility added successfully:', response.data);
        
        // Add the new facility to the list with the returned ID
        const addedFacility = { ...newFacility, id: response.data?.id || Date.now() };
        setFacilities([...facilities, addedFacility]);
        
        setNewFacility({
          name: '',
          code: '',
          sector: '',
          status: 'نشطة',
          category: '',
          totalClinics: '',
          workingClinics: '',
          outOfOrderClinics: '',
          notWorkingClinics: '',
          facilityEmail: '',
          facilityPhone: '',
          facilityLocation: '',
          managerName: '',
          managerEmail: '',
          managerPhone: '',
          medicalDirectorName: '',
          medicalDirectorEmail: '',
          medicalDirectorPhone: '',
          contact: '',
          manager: '',
          medical_director: '',
          location: '',
          clinics: [],
          number: ''
        });
        setIsAddDialogOpen(false);
        
        toast({
          title: "تم حفظ المنشأة عبر الـ API",
          description: "تم تسجيل المنشأة الجديدة بنجاح في قاعدة البيانات",
        });
      } catch (error: any) {
        console.error('❌ Error adding facility via API:', error);
        console.log('🔄 Adding facility locally as fallback...');
        
        // Fallback to local addition
        const addedFacility = { ...newFacility, id: Date.now() };
        setFacilities([...facilities, addedFacility]);
        
        setNewFacility({
          name: '',
          code: '',
          sector: '',
          status: 'نشطة',
          category: '',
          totalClinics: '',
          workingClinics: '',
          outOfOrderClinics: '',
          notWorkingClinics: '',
          facilityEmail: '',
          facilityPhone: '',
          facilityLocation: '',
          managerName: '',
          managerEmail: '',
          managerPhone: '',
          medicalDirectorName: '',
          medicalDirectorEmail: '',
          medicalDirectorPhone: '',
          contact: '',
          manager: '',
          medical_director: '',
          location: '',
          clinics: [],
          number: ''
        });
        setIsAddDialogOpen(false);
        
        toast({
          title: "تم حفظ المنشأة محلياً",
          description: "تعذر الاتصال بالخادم، تم الحفظ محلياً",
          variant: "destructive",
        });
      }
    }
  };

  // Logout confirmation dialog component
  const LogoutButton = () => {
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
      try {
        setIsLoggingOut(true);
        
        // Determine user type (you might need to adjust this logic)
        const userType = localStorage.getItem('admin_token') ? 'admin' : 'staff';
        
        await logout(userType);
        
        toast({
          title: "تم تسجيل الخروج بنجاح",
          description: "تم تسجيل خروجك من النظام",
        });
        
        // Redirect to login page
        window.location.href = '/login';
      } catch (error: any) {
        console.error('Logout error:', error);
        toast({
          title: "خطأ في تسجيل الخروج",
          description: error.message || "حدث خطأ أثناء تسجيل الخروج",
          variant: "destructive",
        });
        
        // Even if API fails, redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } finally {
        setIsLoggingOut(false);
        setIsLogoutDialogOpen(false);
      }
    };

    return (
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 p-2 sm:px-3 sm:py-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline mr-2">تسجيل الخروج</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">تأكيد تسجيل الخروج</DialogTitle>
          </DialogHeader>
          <div className="text-right space-y-4">
            <p className="text-muted-foreground">هل أنت متأكد من أنك تريد تسجيل الخروج من النظام؟</p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsLogoutDialogOpen(false)}
                disabled={isLoggingOut}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 sm:p-6 text-primary-foreground shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">لوحة التحكم الرئيسية</h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base">لوحة تحكم خاصة لجميع عيادات الأسنان بتجمع الرياض الصحي الثاني</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm">
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">مرحباً بك</span>
            </div>
            <div className="relative group">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Updated Statistics - Now 7 cards including facility status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">مجموع العيادات الكلي</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(selectedSector && selectedSector !== 'all-sectors') || 
                   (selectedCategory && selectedCategory !== 'all-categories') 
                   ? filteredStats.total_clinics : totalClinics}
                </p>
              </div>
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">العيادات التي تعمل</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(selectedSector && selectedSector !== 'all-sectors') || 
                   (selectedCategory && selectedCategory !== 'all-categories') 
                   ? filteredStats.working_clinics : totalWorking}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">العيادات التي لا تعمل</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(selectedSector && selectedSector !== 'all-sectors') || 
                   (selectedCategory && selectedCategory !== 'all-categories') 
                   ? filteredStats.not_working_clinics : totalNotWorking}
                </p>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">العيادات المكهنة</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(selectedSector && selectedSector !== 'all-sectors') || 
                   (selectedCategory && selectedCategory !== 'all-categories') 
                   ? filteredStats.out_of_order_clinics : totalOutOfOrder}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">جميع المنشآت</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(selectedSector && selectedSector !== 'all-sectors') || 
                   (selectedCategory && selectedCategory !== 'all-categories') 
                   ? filteredFacilities.length : totalFacilities}
                </p>
              </div>
              <Building className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* New Active Facilities Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">المنشآت النشطة</p>
                <p className="text-xl sm:text-2xl font-bold">{facilityStatusCounts.active}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* New Inactive Facilities Card */}
        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">المنشآت غير النشطة</p>
                <p className="text-xl sm:text-2xl font-bold">{facilityStatusCounts.inactive}</p>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updated Filters and Add Facility - Removed facility type filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-right flex items-center gap-2 text-sm sm:text-base">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              تصفية البيانات وإدارة المنشآت
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">تسجيل منشأة جديدة</span>
                  <span className="sm:hidden">منشأة جديدة</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-2">
                <DialogHeader>
                  <DialogTitle className="text-right">تسجيل منشأة جديدة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label htmlFor="name" className="text-sm">اسم المنشأة *</Label>
                      <Input
                        id="name"
                        value={newFacility.name}
                        onChange={(e) => setNewFacility({...newFacility, name: e.target.value})}
                        className="text-right"
                        placeholder="أدخل اسم المنشأة"
                      />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label htmlFor="code" className="text-sm">رمز المنشأة *</Label>
                      <Input
                        id="code"
                        value={newFacility.code}
                        onChange={(e) => setNewFacility({...newFacility, code: e.target.value})}
                        className="text-right"
                        placeholder="أدخل رمز المنشأة"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label htmlFor="sector" className="text-sm">القطاع</Label>
                      <Select value={newFacility.sector} onValueChange={(value) => setNewFacility({...newFacility, sector: value})}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر القطاع" />
                        </SelectTrigger>
                        <SelectContent>
                          {hardcodedSectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 text-right">
                      <Label htmlFor="status" className="text-sm">حالة المنشأة</Label>
                      <Select value={newFacility.status} onValueChange={(value) => setNewFacility({...newFacility, status: value})}>
                        <SelectTrigger className="text-right">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="نشطة">نشطة</SelectItem>
                          <SelectItem value="غير نشطة">غير نشطة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* New Fields */}
                  <div className="space-y-2 text-right">
                    <Label htmlFor="category" className="text-sm">تصنيف المنشأة</Label>
                    <Select value={newFacility.category} onValueChange={(value) => setNewFacility({...newFacility, category: value})}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر تصنيف المنشأة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مركز صحي">مركز صحي</SelectItem>
                        <SelectItem value="مركز تخصصي">مركز تخصصي</SelectItem>
                        <SelectItem value="مستشفى">مستشفى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 text-right">
                    <Label htmlFor="totalClinics" className="text-sm">مجموع عيادات الأسنان</Label>
                    <Input
                      id="totalClinics"
                      type="number"
                      value={newFacility.totalClinics}
                      onChange={(e) => setNewFacility({...newFacility, totalClinics: e.target.value})}
                      className="text-right"
                      placeholder="20"
                    />
                  </div>

                  {/* Clinic Status Fields */}
                  <div className="space-y-4 text-right">
                    <Label className="text-sm font-medium">حالة العيادات</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workingClinics" className="text-sm">يعمل</Label>
                        <Input
                          id="workingClinics"
                          type="number"
                          value={newFacility.workingClinics}
                          onChange={(e) => setNewFacility({...newFacility, workingClinics: e.target.value})}
                          className="text-right"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="outOfOrderClinics" className="text-sm">مكهن</Label>
                        <Input
                          id="outOfOrderClinics"
                          type="number"
                          value={newFacility.outOfOrderClinics}
                          onChange={(e) => setNewFacility({...newFacility, outOfOrderClinics: e.target.value})}
                          className="text-right"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notWorkingClinics" className="text-sm">غير مفعل</Label>
                        <Input
                          id="notWorkingClinics"
                          type="number"
                          value={newFacility.notWorkingClinics}
                          onChange={(e) => setNewFacility({...newFacility, notWorkingClinics: e.target.value})}
                          className="text-right"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-lg font-semibold text-right">معلومات التواصل</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-right">
                        <Label htmlFor="facilityEmail" className="text-sm">إيميل المنشأة</Label>
                        <Input
                          id="facilityEmail"
                          type="email"
                          value={newFacility.facilityEmail}
                          onChange={(e) => setNewFacility({...newFacility, facilityEmail: e.target.value})}
                          className="text-right"
                          placeholder="info@facility.health.sa"
                        />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label htmlFor="facilityPhone" className="text-sm">رقم اتصال المنشأة</Label>
                        <Input
                          id="facilityPhone"
                          value={newFacility.facilityPhone}
                          onChange={(e) => setNewFacility({...newFacility, facilityPhone: e.target.value})}
                          className="text-right"
                          placeholder="011-123-4567"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <Label htmlFor="facilityLocation" className="text-sm">موقع المنشأة</Label>
                      <Input
                        id="facilityLocation"
                        value={newFacility.facilityLocation}
                        onChange={(e) => setNewFacility({...newFacility, facilityLocation: e.target.value})}
                        className="text-right"
                        placeholder="أدخل موقع المنشأة"
                      />
                    </div>

                    <div className="space-y-2 text-right">
                      <Label htmlFor="managerName" className="text-sm">اسم مدير المنشأة</Label>
                      <Input
                        id="managerName"
                        value={newFacility.managerName}
                        onChange={(e) => setNewFacility({...newFacility, managerName: e.target.value})}
                        className="text-right"
                        placeholder="اسم مدير المنشأة"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-right">
                        <Label htmlFor="managerEmail" className="text-sm">إيميل مدير المنشأة</Label>
                        <Input
                          id="managerEmail"
                          type="email"
                          value={newFacility.managerEmail}
                          onChange={(e) => setNewFacility({...newFacility, managerEmail: e.target.value})}
                          className="text-right"
                          placeholder="manager@facility.health.sa"
                        />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label htmlFor="managerPhone" className="text-sm">رقم اتصال مدير المنشأة</Label>
                        <Input
                          id="managerPhone"
                          value={newFacility.managerPhone}
                          onChange={(e) => setNewFacility({...newFacility, managerPhone: e.target.value})}
                          className="text-right"
                          placeholder="011-123-4567"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <Label htmlFor="medicalDirectorName" className="text-sm">اسم المدير الطبي</Label>
                      <Input
                        id="medicalDirectorName"
                        value={newFacility.medicalDirectorName}
                        onChange={(e) => setNewFacility({...newFacility, medicalDirectorName: e.target.value})}
                        className="text-right"
                        placeholder="اسم المدير الطبي"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-right">
                        <Label htmlFor="medicalDirectorEmail" className="text-sm">إيميل المدير الطبي</Label>
                        <Input
                          id="medicalDirectorEmail"
                          type="email"
                          value={newFacility.medicalDirectorEmail}
                          onChange={(e) => setNewFacility({...newFacility, medicalDirectorEmail: e.target.value})}
                          className="text-right"
                          placeholder="medical.director@facility.health.sa"
                        />
                      </div>
                      <div className="space-y-2 text-right">
                        <Label htmlFor="medicalDirectorPhone" className="text-sm">رقم اتصال المدير الطبي</Label>
                        <Input
                          id="medicalDirectorPhone"
                          value={newFacility.medicalDirectorPhone}
                          onChange={(e) => setNewFacility({...newFacility, medicalDirectorPhone: e.target.value})}
                          className="text-right"
                          placeholder="011-123-4567"
                        />
                      </div>
                    </div>
                  </div>

                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                  <Button onClick={handleAddFacility} disabled={!newFacility.name || !newFacility.code}>
                    حفظ المنشأة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Updated filters - Only 2 filters now */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2 text-right">
              <Label className="text-sm">القطاع</Label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر القطاع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-sectors">جميع القطاعات</SelectItem>
                  {hardcodedSectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Fixed Category Filter */}
            <div className="space-y-2 text-right">
              <Label className="text-sm">تصنيف المنشآت بالقطاع</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر تصنيف المنشأة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">جميع التصنيفات</SelectItem>
                  <SelectItem value="مركز صحي">مركز صحي</SelectItem>
                  <SelectItem value="مركز تخصصي">مركز تخصصي</SelectItem>
                  <SelectItem value="مستشفى">مستشفى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Updated Filter Summary */}
          {(selectedSector || selectedCategory) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500">
              <p className="text-sm text-blue-800 text-right">
                <strong>التصفية النشطة:</strong>
                {selectedSector && selectedSector !== 'all-sectors' && (
                  <span className="mr-2">القطاع: {selectedSector}</span>
                )}
                {selectedCategory && selectedCategory !== 'all-categories' && (
                  <span className="mr-2">التصنيف: {selectedCategory}</span>
                )}
                - عدد المنشآت المعروضة: {filteredFacilities.length}
              </p>
            </div>
          )}

          {/* Sector Statistics */}
          {selectedSector && selectedSector !== 'all-sectors' && (
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-right">إحصائيات قطاع {selectedSector}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(groupedBySector[selectedSector] || {}).map(([type, data]) => (
                  <Card key={type}>
                    <CardContent className="p-3 sm:p-4 text-right">
                      <div className="text-xs sm:text-sm text-muted-foreground">{type}</div>
                      <div className="text-lg sm:text-2xl font-bold">{(data as any).count}</div>
                      <div className="text-xs text-muted-foreground">{(data as any).clinics} عيادة</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facilities Table - Updated to show filtered facilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-sm sm:text-base flex items-center justify-between">
            <span>قائمة المنشآت</span>
            <Badge variant="secondary" className="text-xs">
              {filteredFacilities.length} من {facilities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-right bg-muted/50">
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">اسم المنشأة</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">الرمز</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">القطاع</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">التصنيف</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">المجموع</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">يعمل</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">مكهن</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">لا يعمل</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacilities.map((facility: any) => (
                  <tr key={facility.id} className="border-b border-border text-right hover:bg-muted/30">
                    <td className="p-2 sm:p-3 font-medium">{facility.name}</td>
                    <td className="p-2 sm:p-3">{facility.code}</td>
                    <td className="p-2 sm:p-3">{facility.sector}</td>
                    <td className="p-2 sm:p-3">{facility.category || facility.type}</td>
                    <td className="p-2 sm:p-3">{facility.totalClinics}</td>
                    <td className="p-2 sm:p-3 text-green-600">{facility.workingClinics || facility.working}</td>
                    <td className="p-2 sm:p-3 text-orange-600">{facility.outOfOrderClinics || facility.outOfOrder}</td>
                    <td className="p-2 sm:p-3 text-red-600">{facility.notWorkingClinics || facility.notWorking}</td>
                    <td className="p-2 sm:p-3">
                      <Badge variant={facility.status === 'نشطة' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                        {facility.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports - UNCHANGED as requested */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-sm sm:text-base">البلاغات الحديثة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-right bg-muted/50">
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">رقم البلاغ</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">المنشأة</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">الفئة</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">التاريخ</th>
                  <th className="p-2 sm:p-3 font-medium whitespace-nowrap">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.slice(0, 5).map((report: any) => (
                  <tr key={report.id} className="border-b border-border text-right hover:bg-muted/30">
                    <td className="p-2 sm:p-3 font-medium">{report.id}</td>
                    <td className="p-2 sm:p-3">{report.facilityName}</td>
                    <td className="p-2 sm:p-3">{report.category}</td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">{report.reportDate}</td>
                    <td className="p-2 sm:p-3">
                      <Badge variant={
                        report.status === 'مفتوح' ? 'secondary' :
                        report.status === 'مغلق' ? 'default' : 'destructive'
                      } className="text-xs whitespace-nowrap">
                        {report.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - UNCHANGED */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4" />
            الإجراءات السريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button 
              onClick={() => window.location.href = '/reports/new'}
              className="group bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 sm:p-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full group-hover:bg-white/30 transition-all">
                  <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium">بلاغ جديد</span>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/dental/assets'}
              className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 sm:p-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full group-hover:bg-white/30 transition-all">
                  <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium">إضافة أصل</span>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/transactions/new'}
              className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 sm:p-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full group-hover:bg-white/30 transition-all">
                  <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium">معاملة جديدة</span>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/reports/dashboard'}
              className="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 sm:p-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full group-hover:bg-white/30 transition-all">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium">التقارير</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
