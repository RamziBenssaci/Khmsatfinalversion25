import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { transactionsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Facility {
  id: number;
  name: string;
}

export default function NewTransaction() {
  const [formData, setFormData] = useState({
    transactionNumber: '',
    receiveDate: '',
    subject: '',
    type: '',
    senderEntity: '',
    transferredTo: '',
    status: 'مفتوح تحت الاجراء',
    notes: ''
  });

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [savedTransactionId, setSavedTransactionId] = useState<string | null>(null);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  // Updated transaction types
  const transactionTypes = [
    'خطاب',
    'ايميل',
    'معاملة الكترونية',
    'استفسار',
    'شكوى',
    'طلب',
    'اخرى'
  ];

  // Static transferred to options
  const transferredToOptions = [
    'إدارة صحة المجتمع',
    'إدارة مراكز الرعاية الأولية',
    'إدارة الرعاية الاكلينيكية',
    'إدارة التموين وسلاسل الامداد',
    'إدارة الشئون الهندسية',
    'إدارة الممتلكات',
    'إدارة تكنولوجيا الرعاية الصحية',
    'إدارة تقنية المعلومات',
    'إدارة الامن والسلامة',
    'إدارة التواصل المؤسسي',
    'إدارة المالية',
    'إدارة الموارد البشرية',
    'إدارة الشئون القانونية',
    'الصيانة العامة بالتجمع',
    'الصيانة الطبية بالتجمع',
    'إدارة المسح الاشعاعي',
    'إدارة مكافحة العدوى إدارة خدمات الاسنان',
    'إدارة الجودة بالتجمع',
    'الاسنان - اشراف المراكز الصحية',
    'الاسنان - اشراف خارج الرياض',
    'الاسنان - اشراف مراكز الشرق',
    'الاسنان - اشراف مراكز الشمال',
    'الاسنان - مكافحة العدوى',
    'الاسنان - الاشعة',
    'الاسنان - التثقيف الصحي',
    'الاسنان - التواصل المؤسسي',
    'الاسنان - الجودة',
    'الاسنان - مجمع شرق',
    'الاسنان - مجمع شمال',
    'الاسنان - المركز التخصصي',
    'الاسنان - مستشفى اليمامة',
    'الاسنان - مستشفى الأمير محمد',
    'الاسنان - مدينة الملك فهد',
    'قطاع رماح',
    'قطاع حوطة سدير',
    'قطاع الارطاوية',
    'قطاع تمير',
    'قطاع الغاط',
    'قطاع المجمعة',
    'قطاع الزلفي',
    'مراسلة خارج التجمع',
    'أخرى'
  ];

  // Fetch facilities on component mount (only for sender entity)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const facilitiesResponse = await reportsApi.getFacilities().catch(error => ({
          success: false,
          data: [],
          message: error.message
        }));

        if (facilitiesResponse.success && facilitiesResponse.data) {
          setFacilities(facilitiesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
        setFacilities([]);
      } finally {
        setFacilitiesLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch transfer history when transaction is saved
  useEffect(() => {
    if (savedTransactionId) {
      fetchTransferHistory();
    }
  }, [savedTransactionId]);

  const fetchTransferHistory = async () => {
    if (!savedTransactionId) return;
    
    try {
      setHistoryLoading(true);
      const response = await transactionsApi.getTransactionHistory(savedTransactionId);
      if (response.success && response.data) {
        setTransferHistory(response.data);
      } else {
        setTransferHistory([]);
      }
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      setTransferHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await transactionsApi.createTransaction(formData);
      
      if (response.success) {
        setSavedTransactionId(response.data?.id || '1');
        toast({
          title: "تم إنشاء المعاملة بنجاح",
          description: "تم حفظ المعاملة الجديدة في النظام",
        });
        
        // Reset form
        setFormData({
          transactionNumber: '',
          receiveDate: '',
          subject: '',
          type: '',
          senderEntity: '',
          transferredTo: '',
          status: 'مفتوح تحت الاجراء',
          notes: ''
        });
      } else {
        toast({
          title: "خطأ في إنشاء المعاملة",
          description: response.message || "فشل في حفظ المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">إنشاء معاملة جديدة</h1>
        <p className="text-muted-foreground mt-2">إضافة معاملة إدارية جديدة للمتابعة</p>
      </div>

      <div className="admin-card">
        <div className="admin-header">
          <h2>بيانات المعاملة</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">رقم المعاملة *</label>
                <input
                  type="text"
                  value={formData.transactionNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionNumber: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم المعاملة"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ الاستلام *</label>
                <input
                  type="date"
                  value={formData.receiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiveDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                />
              </div>
            </div>

            {/* Subject and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">موضوع المعاملة *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="موضوع المعاملة"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">نوع المعاملة *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                >
                  <option value="">اختر نوع المعاملة</option>
                  {transactionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sender and Receiver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الجهة المرسلة *</label>
                <select
                  value={formData.senderEntity}
                  onChange={(e) => setFormData(prev => ({ ...prev, senderEntity: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                  disabled={facilitiesLoading}
                >
                  <option value="">
                    {facilitiesLoading ? "جاري تحميل الجهات..." : "اختر الجهة المرسلة"}
                  </option>
                  {facilities.map(facility => (
                    <option 
                      key={facility.id} 
                      value={facility.name}
                      disabled={facility.name === formData.transferredTo}
                      className={facility.name === formData.transferredTo ? "opacity-50 bg-muted" : ""}
                    >
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الجهة المحول لها *</label>
                <select
                  value={formData.transferredTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, transferredTo: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                >
                  <option value="">اختر الجهة المحول لها</option>
                  {transferredToOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status - Modified to checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">حالة المعاملة</label>
                <div className="flex items-center gap-3 text-right">
                  <input
                    type="checkbox"
                    id="status-checkbox"
                    checked={true}
                    disabled={true}
                    className="w-4 h-4 accent-blue-600 disabled:opacity-50"
                  />
                  <label htmlFor="status-checkbox" className="text-sm font-medium">
                    مفتوح تحت الاجراء
                  </label>
                </div>
                <p className="text-red-500 text-sm mt-1 text-right">
                  يمكنك تعديل حالة المعاملة لاحقاً
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-right">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-input rounded-md text-right"
                rows={4}
                placeholder="ملاحظات إضافية حول المعاملة..."
              />
            </div>

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={loading}
                className="admin-btn-success flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {loading ? 'جاري الحفظ...' : 'حفظ المعاملة'}
              </button>
            </div>
          </form>
        </div>
      </div>

  
    </div>
  );
}
