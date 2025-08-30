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
  BarChart3,
  Upload,
  X,
  Download,
  FileSpreadsheet
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
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // New state for filtering
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
    number: '',
    imageBase64: '' // New field for image
  });

  // New state for image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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

  // Image upload handler
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Convert to base64 for the request
      const base64Reader = new FileReader();
      base64Reader.onload = (e) => {
        const base64String = e.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
        setNewFacility({...newFacility, imageBase64: base64String});
      };
      base64Reader.readAsDataURL(file);
    }
  };

  // Remove image handler
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setNewFacility({...newFacility, imageBase64: ''});
  };

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

  // Get unique categories from API data
  const uniqueCategories = [
  ...new Set(
    facilities
      .map(f => typeof f.category === "string" ? f.category.trim().toLowerCase() : f.category)
  )
  ].filter(Boolean);

  // Updated filter facilities with sector, category, and new filters
  const filteredFacilities = facilities.filter((f: any) => {
    const sectorMatch = (!selectedSector || selectedSector === 'all-sectors' || f.sector === selectedSector);
    const categoryMatch = (!selectedCategory || selectedCategory === 'all-categories' || f.category === selectedCategory);
    
    // New filtering logic
    let filterMatch = true;
    switch (activeFilter) {
      case 'working':
        filterMatch = (parseInt(f.workingClinics || f.working) || 0) > 0;
        break;
      case 'not-working':
        filterMatch = (parseInt(f.notWorkingClinics || f.notWorking) || 0) > 0;
        break;
      case 'out-of-order':
        filterMatch = (parseInt(f.outOfOrderClinics || f.outOfOrder) || 0) > 0;
        break;
      case 'active-facilities':
        filterMatch = f.status === 'نشطة';
        break;
      case 'inactive-facilities':
        filterMatch = f.status === 'غير نشطة';
        break;
      default:
        filterMatch = true;
    }
    
    return sectorMatch && categoryMatch && filterMatch;
  });

  // Calculate filtered statistics
  const filteredStats = calculateStatsFromAPI(filteredFacilities);
  
  // Calculate facility status counts for filtered or all facilities
  const facilityStatusCounts = calculateFacilityStatusCounts(
    (selectedSector && selectedSector !== 'all-sectors') || 
    (selectedCategory && selectedCategory !== 'all-categories') || 
    activeFilter !== 'all'
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

  // Export to PDF function
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Set font for Arabic support (you might need to add Arabic font)
    doc.setFontSize(16);
    doc.text('قائمة المنشآت', 105, 20, { align: 'center' });
    
    let yPosition = 40;
    
    filteredFacilities.forEach((facility, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${facility.name}`, 20, yPosition);
      doc.text(`الرمز: ${facility.code}`, 20, yPosition + 10);
      doc.text(`القطاع: ${facility.sector}`, 20, yPosition + 20);
      doc.text(`الحالة: ${facility.status}`, 20, yPosition + 30);
      doc.text(`مجموع العيادات: ${facility.totalClinics}`, 20, yPosition + 40);
      
      yPosition += 60;
    });
    
    doc.save('facilities-list.pdf');
    
    toast({
      title: "تم تصدير PDF",
      description: "تم تصدير قائمة المنشآت بصيغة PDF بنجاح",
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    const worksheetData = filteredFacilities.map((facility, index) => ({
      'الرقم': index + 1,
      'اسم المنشأة': facility.name,
      'رمز المنشأة': facility.code,
      'القطاع': facility.sector,
      'التصنيف': facility.category,
      'الحالة': facility.status,
      'مجموع العيادات': facility.totalClinics,
      'العيادات العاملة': facility.workingClinics || facility.working,
      'العيادات المكهنة': facility.outOfOrderClinics || facility.outOfOrder,
      'العيادات غير المفعلة': facility.notWorkingClinics || facility.notWorking,
      'الموقع': facility.location || facility.facilityLocation,
      'رقم الاتصال': facility.facilityPhone,
      'البريد الإلكتروني': facility.facilityEmail
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المنشآت');
    
    XLSX.writeFile(workbook, 'facilities-list.xlsx');
    
    toast({
      title: "تم تصدير Excel",
      description: "تم تصدير قائمة المنشآت بصيغة Excel بنجاح",
    });
  };

  // Gauge chart data
  const gaugeData = [
    { name: 'العيادات العاملة', value: totalWorking, color: '#22c55e' },
    { name: 'العيادات المكهنة', value: totalOutOfOrder, color: '#f59e0b' },
    { name: 'العيادات غير المفعلة', value: totalNotWorking, color: '#ef4444' }
  ];

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
          number: '',
          imageBase64: ''
        });
        
        // Reset image states
        setSelectedImage(null);
        setImagePreview('');
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
          number: '',
          imageBase64: ''
        });
        
        // Reset image states
        setSelectedImage(null);
        setImagePreview('');
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

      {/* Gauge Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            مؤشر حالة العيادات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-full lg:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 space-y-4">
              <div className="text-center lg:text-right">
                <h3 className="text-2xl font-bold">{totalClinics}</h3>
                <p className="text-muted-foreground">مجموع العيادات الكلي</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{totalWorking}</div>
                  <div className="text-sm text-green-600">العيادات العاملة</div>
                  <div className="text-xs text-muted-foreground">{((totalWorking / totalClinics) * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">{totalOutOfOrder}</div>
                  <div className="text-sm text-amber-600">العيادات المكهنة</div>
                  <div className="text-xs text-muted-foreground">{((totalOutOfOrder / totalClinics) * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{totalNotWorking}</div>
                  <div className="text-sm text-red-600">العيادات غير المفعلة</div>
                  <div className="text-xs text-muted-foreground">{((totalNotWorking / totalClinics) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updated Statistics - Now 7 cards including facility status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium opacity-90">مجموع العيادات الكلي</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(selectedSector && selectedSector !== 'all-sectors') || 
                   (selectedCategory && selectedCategory !== 'all-categories') || 
                   activeFilter !== 'all'
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
                   (selectedCategory && selectedCategory !== 'all-categories') || 
                   activeFilter !== 'all'
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
                   (selectedCategory && selectedCategory !== 'all-categories') || 
                   activeFilter !== 'all'
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
                   (selectedCategory && selectedCategory !== 'all-categories') || 
                   activeFilter !== 'all'
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
                   (selectedCategory && selectedCategory !== 'all-categories') || 
                   activeFilter !== 'all'
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

      {/* Updated Filters and Add Facility */}
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

                  {/* Conditional Image Upload for شهادة التكهين */}
                  {parseInt(newFacility.outOfOrderClinics) > 0 && (
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-sm font-medium text-right">شهادة التكهين</Label>
                      <div className="space-y-4">
                        {!imagePreview ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <div className="text-sm text-gray-600 mb-4">
                              <p>اختر صورة شهادة التكهين</p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF حتى 10MB</p>
                            </div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                            />
                            <Label
                              htmlFor="image-upload"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                            >
                              اختيار الصورة
                            </Label>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="relative border rounded-lg p-4">
                              <img
                                src={imagePreview}
                                alt="معاينة شهادة التكهين"
                                className="max-w-full h-48 object-contain mx-auto rounded"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={handleRemoveImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-green-600">تم رفع الصورة بنجاح</p>
                              <p className="text-xs text-gray-500">{selectedImage?.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
          {/* Updated filters - 2 existing filters + 5 new filter buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2 text-right">
                <Label className="text-sm">التصنيف</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر التصنيف" />
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

            {/* New Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="text-sm"
              >
                جميع المنشآت
              </Button>
              <Button
                variant={activeFilter === 'working' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('working')}
                className="text-sm"
              >
                العيادات التي تعمل
              </Button>
              <Button
                variant={activeFilter === 'not-working' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('not-working')}
                className="text-sm"
              >
                العيادات التي لا تعمل
              </Button>
              <Button
                variant={activeFilter === 'out-of-order' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('out-of-order')}
                className="text-sm"
              >
                العيادات المكهنة
              </Button>
              <Button
                variant={activeFilter === 'active-facilities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('active-facilities')}
                className="text-sm"
              >
                العيادات النشطة
              </Button>
              <Button
                variant={activeFilter === 'inactive-facilities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('inactive-facilities')}
                className="text-sm"
              >
                العيادات الغير نشطة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons and Facilities List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-right">قائمة المنشآت</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={exportToPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تصدير PDF
              </Button>
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                تصدير Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Facilities Display */}
          <div className="space-y-6">
            {Object.entries(groupedBySector).map(([sector, types]) => (
              <div key={sector} className="space-y-4">
                <h3 className="text-lg font-semibold text-right border-b pb-2">{sector}</h3>
                {Object.entries(types).map(([type, data]) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-right">
                        <h4 className="font-medium">{type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {data.count} منشأة • {data.clinics} عيادة
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {filteredFacilities
                        .filter(f => f.sector === sector && (f.category || f.type) === type)
                        .map((facility: any) => (
                          <div key={facility.id} className="bg-white p-4 rounded-lg border">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="text-right space-y-1">
                                <h5 className="font-medium">{facility.name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {facility.code} • {facility.location || facility.facilityLocation}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={facility.status === 'نشطة' ? 'default' : 'secondary'}>
                                  {facility.status}
                                </Badge>
                                <Badge variant="outline">
                                  {facility.totalClinics} عيادة
                                </Badge>
                                <Badge variant="outline" className="text-green-600">
                                  {facility.workingClinics || facility.working} تعمل
                                </Badge>
                                {(parseInt(facility.outOfOrderClinics || facility.outOfOrder) || 0) > 0 && (
                                  <Badge variant="outline" className="text-orange-600">
                                    {facility.outOfOrderClinics || facility.outOfOrder} مكهن
                                  </Badge>
                                )}
                                {(parseInt(facility.notWorkingClinics || facility.notWorking) || 0) > 0 && (
                                  <Badge variant="outline" className="text-red-600">
                                    {facility.notWorkingClinics || facility.notWorking} لا تعمل
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            <button 
              onClick={() => window.location.href = '/inventory'}
              className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 sm:p-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full group-hover:bg-white/30 transition-all">
                  <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-medium">المخزون</span>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/transactions'}
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
