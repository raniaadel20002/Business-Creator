import React, { useEffect, useState, useMemo } from 'react';
import { History, ArrowRight, Briefcase, Calendar, Trash2, Eye, Edit2, Save, X, Filter, SortAsc, Star, Zap, PlayCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import CustomSelect from './CustomSelect';
import { supabase, handleSupabaseError } from '../supabase';
import { SavedProject } from '../types';

interface SavedPlansProps {
  onBack: () => void;
  onViewPlan: (plan: any) => void;
  activeProjectId?: string;
  currentPlanId?: string;
  projects: SavedProject[];
  loading: boolean;
}

const SavedPlans: React.FC<SavedPlansProps> = ({ onBack, onViewPlan, activeProjectId, currentPlanId, projects, loading }) => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ projectName: '', concept: '' });
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service' | 'both'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleView = (project: SavedProject) => {
    try {
      const planData = JSON.parse(project.planData);
      onViewPlan(planData);
    } catch (e) {
      console.error("Error parsing plan data:", e);
      alert("حدث خطأ أثناء تحميل بيانات الخطة.");
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', deletingId);
      if (error) handleSupabaseError(error, 'DELETE', `projects/${deletingId}`);
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const startEditing = (project: SavedProject) => {
    setEditingId(project.id);
    setEditForm({ projectName: project.projectName, concept: project.concept });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ projectName: '', concept: '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').update({
        project_name: editForm.projectName,
        concept: editForm.concept,
      }).eq('id', id);
      if (error) throw error;
      setEditingId(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert("حدث خطأ أثناء التحديث.");
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Filtering
    if (filterType !== 'all') {
      result = result.filter(p => p.type === filterType);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.projectName.localeCompare(b.projectName, 'ar');
      return 0;
    });

    return result;
  }, [projects, filterType, sortBy]);

  if (!user) {
    return (
      <div className="space-y-8 w-full">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowRight className="w-6 h-6 text-text-secondary" />
          </button>
          <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <History className="text-primary" />
            مشاريعي ومسارات التنفيذ
          </h2>
        </div>
        <div className="bg-surface p-12 rounded-2xl shadow-sm border border-border text-center">
          <p className="text-text-muted mb-6">يرجى تسجيل الدخول للوصول لمعلوماتك ومسارات التنفيذ الخاصة بك.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-background rounded-full transition-colors">
          <ArrowRight className="w-6 h-6 text-text-secondary" />
        </button>
        <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <History className="text-primary" />
          الخطط المحفوظة
        </h2>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-surface p-4 rounded-2xl shadow-soft border border-border flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-text-muted">
            <Filter size={18} />
            <span className="text-sm font-bold">تصفية:</span>
          </div>
          <CustomSelect 
            value={filterType}
            onChange={(val) => setFilterType(val as any)}
            options={[
              { value: 'all', label: 'كل الأنواع' },
              { value: 'product', label: 'منتجات' },
              { value: 'service', label: 'خدمات' },
              { value: 'both', label: 'مزيج' }
            ]}
            className="flex-1 md:w-48"
          />
        </div>

        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-text-muted">
            <SortAsc size={18} />
            <span className="text-sm font-bold">ترتيب:</span>
          </div>
          <CustomSelect 
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            options={[
              { value: 'newest', label: 'الأحدث أولاً' },
              { value: 'oldest', label: 'الأقدم أولاً' },
              { value: 'name', label: 'الاسم (أ-ي)' }
            ]}
            className="flex-1 md:w-48"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-muted">جاري تحميل المسارات التنفيذية...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-surface p-12 rounded-2xl shadow-soft border border-border text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">لا توجد مسارات تنفيذية بعد</h3>
          <p className="text-text-secondary mb-6">ابدأ التحليل الآن لتجهيز مسار مشروع أولي مصمم بناءً على معطياتك الفعلية.</p>
          <button 
            onClick={onBack}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-soft shadow-primary/20"
          >
            استخراج مسار جديد
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAndSortedProjects.map((project) => {
            let isPro = false;
            try {
              if (project.planData) {
                const parsed = JSON.parse(project.planData);
                isPro = !!parsed.isPro;
              }
            } catch (e) {}
            
            const isActive = project.id === activeProjectId;
            const isViewing = project.id === currentPlanId;

            return (
            <div key={project.id} className={`bg-surface p-6 rounded-2xl shadow-soft border hover:shadow-soft-lg transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
              
              {editingId === project.id ? (
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">اسم المشروع</label>
                    <input 
                      type="text" 
                      value={editForm.projectName}
                      onChange={(e) => setEditForm({...editForm, projectName: e.target.value})}
                      className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-background text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">الوصف المختصر</label>
                    <textarea 
                      value={editForm.concept}
                      onChange={(e) => setEditForm({...editForm, concept: e.target.value})}
                      className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-background text-text-primary"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={cancelEditing}
                      className="flex items-center gap-2 px-4 py-2 bg-background text-text-secondary rounded-xl hover:bg-gray-100 transition-colors font-medium border border-border"
                    >
                      <X size={18} /> إلغاء
                    </button>
                    <button 
                      onClick={() => saveEdit(project.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-soft shadow-primary/20"
                    >
                      <Save size={18} /> حفظ
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-text-primary">{project.projectName}</h3>
                      {isPro ? (
                        <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold border border-orange-200">
                          <Star size={12} fill="currentColor" /> مدفوع (احترافي)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold border border-gray-200">
                          <Zap size={12} fill="currentColor" /> مجاني
                        </span>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">
                          <PlayCircle size={12} /> نشط (قيد التنفيذ)
                        </span>
                      )}
                      {!isActive && isViewing && (
                        <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                          <Eye size={12} /> مفتوح للمعاينة
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary line-clamp-2">{project.concept}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1"><Briefcase size={16} /> {project.type}</span>
                      <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(project.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => handleView(project)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium"
                    >
                      <Eye size={18} /> عرض
                    </button>
                    <button 
                      onClick={() => startEditing(project)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-background text-text-secondary rounded-xl hover:bg-gray-100 transition-colors font-medium border border-border"
                    >
                      <Edit2 size={18} /> تعديل
                    </button>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
                    >
                      <Trash2 size={18} /> حذف
                    </button>
                  </div>
                </>
              )}
            </div>
          );
          })}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-md w-full space-y-6 text-center animate-in zoom-in-95 shadow-soft-lg border border-border">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary">هل أنت متأكد من حذف هذه الخطة؟</h3>
            <p className="text-text-muted">سيتم حذف هذا المشروع نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)} 
                className="flex-1 py-3 px-4 bg-background text-text-secondary font-bold rounded-xl hover:bg-gray-100 transition-colors border border-border"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPlans;
