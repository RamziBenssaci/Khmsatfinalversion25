import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, Edit } from 'lucide-react';

interface Asset {
  id: string;
  deviceName: string;
  serialNumber: string;
  facilityName: string;
  supplierName: string;
  supplierContact: string;
  supplierEmail: string;
  deviceModel: string;
  deliveryDate: string;
  installationDate: string;
  warrantyPeriod: number;
  deviceStatus: string;
  notes: string;
  warrantyStatus?: string;
  malfunctionCount?: number;
  outOfWarrantyDays?: number;
}

interface Facility {
  id: string;
  name: string;
}

interface EditAssetDialogProps {
  asset: Asset;
  onSave: (asset: Asset) => void;
  facilities: Facility[];
}

export default function EditAssetDialog({ asset, onSave, facilities }: EditAssetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    deviceName: asset.deviceName || '',
    serialNumber: asset.serialNumber || '',
    facilityName: asset.facilityName || '',
    supplierName: asset.supplierName || '',
    supplierContact: asset.supplierContact || '',
    supplierEmail: asset.supplierEmail || '',
    deviceModel: asset.deviceModel || '',
    deliveryDate: asset.deliveryDate || '',
    installationDate: asset.installationDate || '',
    warrantyPeriod: asset.warrantyPeriod || 1,
    deviceStatus: asset.deviceStatus || 'يعمل',
    notes: asset.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAsset = { ...asset, ...formData };
    onSave(updatedAsset);
    setIsOpen(false);
    console.log('Asset updated:', updatedAsset);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="group bg-gradient-to-r from-warning to-warning/80 hover:from-warning/80 hover:to-warning text-warning-foreground p-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md">
          <Edit size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-accent/20" dir="rtl">
        <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 -m-6 mb-6 rounded-t-lg">
          <DialogTitle className="text-right text-xl font-bold flex items-center gap-2">
            <Edit className="h-5 w-5" />
            تعديل الأصل
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Professional Section Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 text-right mb-4">المعلومات الأساسية للجهاز</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-800 dark:text-blue-200 text-right">اسم الجهاز *</label>
                <input
                  type="text"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  className="w-full p-3 border-2 border-blue-200 dark:border-blue-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="اسم الجهاز"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-800 dark:text-blue-200 text-right">الرقم التسلسلي *</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full p-3 border-2 border-blue-200 dark:border-blue-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="الرقم التسلسلي"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-800 dark:text-blue-200 text-right">اسم المنشأة *</label>
                <select
                  value={formData.facilityName}
                  onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                  className="w-full p-3 border-2 border-blue-200 dark:border-blue-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                >
                  <option value="">اختر المنشأة</option>
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.name}>{facility.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 text-right mb-4">معلومات الشركة الموردة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-green-800 dark:text-green-200 text-right">اسم الشركة الموردة</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full p-3 border-2 border-green-200 dark:border-green-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="اسم الشركة"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-green-800 dark:text-green-200 text-right">رقم المسؤول بالشركة</label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  className="w-full p-3 border-2 border-green-200 dark:border-green-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="رقم الهاتف"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-green-800 dark:text-green-200 text-right">إيميل المسؤول</label>
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierEmail: e.target.value }))}
                  className="w-full p-3 border-2 border-green-200 dark:border-green-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="البريد الإلكتروني"
                />
              </div>
            </div>
          </div>

          {/* Device Technical Details */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 text-right mb-4">التفاصيل التقنية والزمنية</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-purple-800 dark:text-purple-200 text-right">موديل الجهاز</label>
                <input
                  type="text"
                  value={formData.deviceModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceModel: e.target.value }))}
                  className="w-full p-3 border-2 border-purple-200 dark:border-purple-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="الموديل"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-purple-800 dark:text-purple-200 text-right">تاريخ التوريد</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full p-3 border-2 border-purple-200 dark:border-purple-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-purple-800 dark:text-purple-200 text-right">تاريخ التركيب</label>
                <input
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, installationDate: e.target.value }))}
                  className="w-full p-3 border-2 border-purple-200 dark:border-purple-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-purple-800 dark:text-purple-200 text-right">مدة الضمان (سنوات)</label>
                <select
                  value={formData.warrantyPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyPeriod: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border-2 border-purple-200 dark:border-purple-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                >
                  <option value="">اختر المدة</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(year => (
                    <option key={year} value={year}>{year} {year === 1 ? 'سنة' : 'سنوات'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status and Notes */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 text-right mb-4">الحالة والملاحظات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-orange-800 dark:text-orange-200 text-right">حالة الجهاز</label>
                <select
                  value={formData.deviceStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceStatus: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 dark:border-orange-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                >
                  <option value="يعمل">يعمل</option>
                  <option value="مكهن">مكهن (خارج الخدمة)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-orange-800 dark:text-orange-200 text-right">ملاحظات الجهاز</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 dark:border-orange-700 rounded-lg text-right bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none"
                  rows={4}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-start pt-4 border-t border-border">
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-success to-success/80 hover:from-success/80 hover:to-success text-success-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Save size={20} className="ml-2" />
              حفظ التغييرات
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="border-2 hover:bg-muted transition-all"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
