import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Calendar, DollarSign, Building, Phone, AlertTriangle } from 'lucide-react';
import { facilitiesApi, itemsApi, directPurchaseApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Item {
  id: number;
  itemNumber: string;
  itemName: string;
  availableQty: number;
}

export default function NewPurchase() {
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Array<{id: number, name: string}>>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    orderNumber: `ORD-${Date.now()}`,
    orderDate: new Date().toISOString().split('T')[0],
    itemNumber: '',
    itemName: '',
    quantity: '',
    beneficiaryFacility: '',
    financialApprovalNumber: '',
    financialApprovalDate: '',
    totalCost: '',
    supplierCompany: '',
    supplierContact: '',
    supplierPhone: '',
    supplierEmail: '',
    orderStatus: 'جديد',
    deliveryDate: '',
    handoverDate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await directPurchaseApi.submitPurchaseOrder(formData);
      if (response.success) {
        toast({
          title: "تم إنشاء الطلب بنجاح",
          description: "تم إرسال طلب الشراء بنجاح",
        });
        // Reset form
        setFormData({
          orderNumber: `ORD-${Date.now()}`,
          orderDate: new Date().toISOString().split('T')[0],
          itemNumber: '',
          itemName: '',
          quantity: '',
          beneficiaryFacility: '',
          financialApprovalNumber: '',
          financialApprovalDate: '',
          totalCost: '',
          supplierCompany: '',
          supplierContact: '',
          supplierPhone: '',
          supplierEmail: '',
          orderStatus: 'جديد',
          deliveryDate: '',
          handoverDate: '',
          notes: ''
        });
        setSelectedItem(null);
      } else {
        throw new Error(response.message || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال طلب الشراء. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemNumberChange = (itemNumber: string) => {
    const item = items.find(i => i.itemNumber === itemNumber);
    if (item) {
      setSelectedItem(item);
      setFormData(prev => ({
        ...prev,
        itemNumber: item.itemNumber,
        itemName: item.itemName,
        quantity: '' // Reset quantity when item changes
      }));
    } else {
      setSelectedItem(null);
      setFormData(prev => ({
        ...prev,
        itemNumber: '',
        itemName: '',
        quantity: ''
      }));
    }
  };

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const response = await facilitiesApi.getFacilities();
        if (response.success && response.data) {
          setFacilities(response.data);
        }
      } catch (error) {
        console.error('Error loading facilities:', error);
        // Fallback to hardcoded options if API fails
        setFacilities([
          { id: 1, name: 'مستشفى الملك فهد' },
          { id: 2, name: 'مركز الأورام' },
          { id: 3, name: 'مركز القلب' },
          { id: 4, name: 'مركز الأطفال' },
          { id: 5, name: 'العيادات الخارجية' }
        ]);
      }
    };

    const loadItems = async () => {
      try {
        const response = await itemsApi.getItems();
        if (response.success && response.data) {
          setItems(response.data);
        }
      } catch (error) {
        console.error('Error loading items:', error);
        // Fallback to mock data if API fails
        setItems([
          { id: 1, itemNumber: 'ITM-001', itemName: 'قفازات طبية', availableQty: 500 },
          { id: 2, itemNumber: 'ITM-002', itemName: 'كمامات جراحية', availableQty: 1000 },
          { id: 3, itemNumber: 'ITM-003', itemName: 'محاقن طبية', availableQty: 200 },
          { id: 4, itemNumber: 'ITM-004', itemName: 'شاش طبي', availableQty: 300 },
          { id: 5, itemNumber: 'ITM-005', itemName: 'مطهر طبي', availableQty: 150 }
        ]);
      }
    };

    loadFacilities();
    loadItems();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-right">إنشاء طلب شراء جديد</h1>
            <p className="text-green-100 mt-1 text-right">إدارة طلبات الشراء المباشر</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="orderNumber">رقم الطلب بالنظام</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                className="text-right"
              />
            </div>
            <div>
              <Label htmlFor="orderDate">تاريخ الطلب</Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={(e) => handleInputChange('orderDate', e.target.value)}
                className="text-right"
              />
            </div>
            <div>
              <Label htmlFor="itemNumber">رقم الصنف</Label>
              <Input
                id="itemNumber"
                value={formData.itemNumber}
                onChange={(e) => handleInputChange('itemNumber', e.target.value)}
                className="text-right"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="itemName">اسم الصنف</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                className="text-right"
              />
            </div>
            <div>
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="text-right"
                placeholder="أدخل الكمية"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Beneficiary and Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Building className="h-5 w-5" />
              معلومات الجهة المستفيدة والتعميد المالي
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="beneficiaryFacility">الجهة المستفيدة أو المنشأة</Label>
              <Select value={formData.beneficiaryFacility} onValueChange={(value) => handleInputChange('beneficiaryFacility', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجهة المستفيدة" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.name}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="financialApprovalNumber">رقم التعميد المالي</Label>
              <Input
                id="financialApprovalNumber"
                value={formData.financialApprovalNumber}
                onChange={(e) => handleInputChange('financialApprovalNumber', e.target.value)}
                className="text-right"
                placeholder="أدخل رقم التعميد المالي"
              />
            </div>
            <div>
              <Label htmlFor="financialApprovalDate">تاريخ التعميد</Label>
              <Input
                id="financialApprovalDate"
                type="date"
                value={formData.financialApprovalDate}
                onChange={(e) => handleInputChange('financialApprovalDate', e.target.value)}
                className="text-right"
              />
            </div>
            <div>
              <Label htmlFor="totalCost">التكلفة الإجمالية</Label>
              <Input
                id="totalCost"
                type="number"
                value={formData.totalCost}
                onChange={(e) => handleInputChange('totalCost', e.target.value)}
                className="text-right"
                placeholder="أدخل التكلفة بالريال"
              />
            </div>
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Phone className="h-5 w-5" />
              معلومات الشركة الموردة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplierCompany">الشركة الموردة</Label>
              <Input
                id="supplierCompany"
                value={formData.supplierCompany}
                onChange={(e) => handleInputChange('supplierCompany', e.target.value)}
                className="text-right"
                placeholder="أدخل اسم الشركة الموردة"
              />
            </div>
            <div>
              <Label htmlFor="supplierContact">اسم المسؤول</Label>
              <Input
                id="supplierContact"
                value={formData.supplierContact}
                onChange={(e) => handleInputChange('supplierContact', e.target.value)}
                className="text-right"
                placeholder="أدخل اسم المسؤول بالشركة"
              />
            </div>
            <div>
              <Label htmlFor="supplierPhone">رقم التواصل</Label>
              <Input
                id="supplierPhone"
                value={formData.supplierPhone}
                onChange={(e) => handleInputChange('supplierPhone', e.target.value)}
                className="text-right"
                placeholder="05xxxxxxxx"
              />
            </div>
            <div>
              <Label htmlFor="supplierEmail">البريد الإلكتروني</Label>
              <Input
                id="supplierEmail"
                type="email"
                value={formData.supplierEmail}
                onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                className="text-right"
                placeholder="supplier@company.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status and Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              حالة الطلب والتواريخ
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="orderStatus">حالة الطلب</Label>
              <div className="flex items-center gap-2 text-right">
                <Checkbox
                  checked={formData.orderStatus === 'جديد'}
                  disabled
                  className="ml-2"
                />
                <span>جديد</span>
              </div>
              <p className="text-xs text-red-500 mt-1 text-right">يمكنك لاحقاً تعديل حالة العقد</p>
            </div>
            <div>
              <Label htmlFor="deliveryDate">تاريخ التسليم المتوقع</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="text-right"
              placeholder="أدخل أي ملاحظات إضافية..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            إلغاء
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ الإرسال...' : 'إنشاء طلب الشراء'}
          </Button>
        </div>
      </form>
    </div>
  );
}
