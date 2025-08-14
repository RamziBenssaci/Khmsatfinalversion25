import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, TrendingDown, Loader2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { transactionsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  transactionNumber: string;
  receiveDate: string;
  subject: string;
  type: string;
  senderEntity: string;
  transferredTo: string;
  status: string;
  notes?: string;
}

interface Facility {
  id: number;
  name: string;
}

interface DashboardData {
  transactions: Transaction[];
  statistics: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    overdue: number;
  };
  facilityBreakdown: Array<{
    facility: string;
    total: number;
    pending: number;
    completed: number;
    rejected: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  completionRate: number;
}

export default function TransactionsDashboard() {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [uniqueFacilities, setUniqueFacilities] = useState<string[]>([]);
  const [transactionStatuses, setTransactionStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [transactionsResponse, statusesResponse] = await Promise.all([
        transactionsApi.getTransactions().catch(error => ({
          success: false,
          data: [],
          message: error.message
        })),
        transactionsApi.getTransactionStatuses().catch(error => ({
          success: false,
          data: [],
          message: error.message
        }))
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setAllTransactions(transactionsResponse.data);
        
        // Extract unique facilities from transferredTo field
        const facilities = [...new Set(transactionsResponse.data.map(t => t.transferredTo))].filter(Boolean);
        setUniqueFacilities(facilities);
      } else {
        setAllTransactions([]);
        setUniqueFacilities([]);
        toast({
          title: "تعذر تحميل بيانات لوحة التحكم",
          description: transactionsResponse.message || "فشل في تحميل بيانات المعاملات",
          variant: "destructive"
        });
      }

      if (statusesResponse.success && statusesResponse.data) {
        setTransactionStatuses(statusesResponse.data);
      } else {
        setTransactionStatuses([
          'مفتوح تحت الاجراء',
          'منجز',
          'مرفوض'
        ]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAllTransactions([]);
      setUniqueFacilities([]);
      setTransactionStatuses([]);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering based on selected facility
  const filteredTransactions = selectedFacility === '' 
    ? allTransactions 
    : allTransactions.filter(transaction => transaction.transferredTo === selectedFacility);

  // Calculate statistics based on filtered data
  const getFilteredStats = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0, overdue: 0, completionRate: 0 };
    }
    
    const total = filteredTransactions.length;
    const pending = filteredTransactions.filter(t => t.status === 'مفتوح تحت الاجراء').length;
    const completed = filteredTransactions.filter(t => t.status === 'منجز').length;
    const rejected = filteredTransactions.filter(t => t.status === 'مرفوض').length;
    
    // Calculate overdue (more than 21 days)
    const today = new Date();
    const overdue = filteredTransactions.filter(transaction => {
      const receiveDate = new Date(transaction.receiveDate);
      const daysDiff = Math.floor((today.getTime() - receiveDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 21 && transaction.status === 'مفتوح تحت الاجراء';
    }).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, pending, completed, rejected, overdue, completionRate };
  };

  // Calculate facility breakdown
  const getFacilityBreakdown = () => {
    if (!allTransactions || allTransactions.length === 0) return [];
    
    return uniqueFacilities.map(facility => {
      const facilityTransactions = allTransactions.filter(t => t.transferredTo === facility);
      const total = facilityTransactions.length;
      const pending = facilityTransactions.filter(t => t.status === 'مفتوح تحت الاجراء').length;
      const completed = facilityTransactions.filter(t => t.status === 'منجز').length;
      const rejected = facilityTransactions.filter(t => t.status === 'مرفوض').length;
      
      return {
        facility,
        total,
        pending,
        completed,
        rejected
      };
    });
  };

  const stats = getFilteredStats();
  const facilityBreakdown = getFacilityBreakdown();

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">لوحة تحكم المعاملات الإدارية</h1>
        <p className="text-muted-foreground mt-2">إحصائيات ومعدلات الإنجاز للمعاملات</p>
      </div>

      {/* Filters */}
      <div className="admin-card">
        <div className="admin-header"><h2>التصفية</h2></div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
              disabled={loading}
            >
              <option value="">
                {loading ? "جاري تحميل الجهات..." : "جميع الجهات"}
              </option>
              {uniqueFacilities.map((facility, index) => (
                <option key={index} value={facility}>{facility}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="responsive-grid">
        {loading ? (
          <div className="col-span-full">
            <div className="admin-card">
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <StatCard
              title="إجمالي المعاملات"
              value={stats.total}
              icon={AlertCircle}
              color="primary"
            />
            <StatCard
              title="تحت الإجراء"
              value={stats.pending}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="المعاملات المنجزة"
              value={stats.completed}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="المعاملات المرفوضة"
              value={stats.rejected}
              icon={XCircle}
              color="danger"
            />
          </>
        )}
      </div>

      {/* Overdue Transactions Alert */}
      <div className="admin-card">
        <div className="admin-header bg-danger text-danger-foreground">
          <h2>المعاملات المتأخرة</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل بيانات المعاملات المتأخرة...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-danger mb-2">
                {stats.overdue}
              </div>
              <div className="text-muted-foreground">
                معاملة متأخرة (أكثر من 3 أسابيع)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="admin-card">
        <div className="admin-header"><h2>توزيع المعاملات حسب الحالة</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل توزيع المعاملات...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transactionStatuses.map(status => {
                const statusCount = filteredTransactions.filter(t => t.status === status).length;
                return (
                  <div key={status} className="stat-card">
                    <div className="stat-number">{statusCount}</div>
                    <div className="stat-label">{status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Facility Breakdown */}
      <div className="admin-card">
        <div className="admin-header"><h2>توزيع المعاملات حسب الجهات</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل توزيع الجهات...</p>
            </div>
          ) : (
            <>
              <div className="responsive-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-right">
                      <th className="p-3">الجهة</th>
                      <th className="p-3">إجمالي المعاملات</th>
                      <th className="p-3">تحت الإجراء</th>
                      <th className="p-3">منجز</th>
                      <th className="p-3">مرفوض</th>
                    </tr>
                  </thead>
                  <tbody>
                     {facilityBreakdown.map((item, index) => (
                        <tr key={index} className="border-b border-border text-right">
                          <td className="p-3 font-medium">{item.facility}</td>
                          <td className="p-3">{item.total}</td>
                          <td className="p-3 text-warning">{item.pending}</td>
                          <td className="p-3 text-success">{item.completed}</td>
                          <td className="p-3 text-danger">{item.rejected}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {facilityBreakdown.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد جهات متاحة
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Completion Rate */}
      <div className="admin-card">
        <div className="admin-header"><h2>معدل الإنجاز</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل معدل الإنجاز...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-success">
                {stats.completionRate}%
              </div>
              <div className="text-muted-foreground">معدل إنجاز المعاملات الإدارية</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
