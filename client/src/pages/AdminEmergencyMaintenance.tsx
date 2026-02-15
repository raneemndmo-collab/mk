import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Clock, CheckCircle, XCircle, User, Wrench, Zap, Droplets, Flame, Bug, Shield, Package, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

const urgencyConfig: Record<string, { en: string; ar: string; color: string; icon: any }> = {
  low: { en: "Low", ar: "منخفض", color: "bg-blue-100 text-blue-800", icon: Clock },
  medium: { en: "Medium", ar: "متوسط", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  high: { en: "High", ar: "عالي", color: "bg-orange-100 text-orange-800", icon: Zap },
  critical: { en: "Critical", ar: "حرج", color: "bg-red-100 text-red-800 animate-pulse", icon: AlertTriangle },
};

const statusConfig: Record<string, { en: string; ar: string; color: string; icon: any }> = {
  open: { en: "Open", ar: "مفتوح", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  assigned: { en: "Assigned", ar: "تم التعيين", color: "bg-blue-100 text-blue-800", icon: User },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ", color: "bg-purple-100 text-purple-800", icon: Wrench },
  resolved: { en: "Resolved", ar: "تم الحل", color: "bg-green-100 text-green-800", icon: CheckCircle },
  closed: { en: "Closed", ar: "مغلق", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const categoryConfig: Record<string, { en: string; ar: string; icon: any }> = {
  plumbing: { en: "Plumbing", ar: "سباكة", icon: Droplets },
  electrical: { en: "Electrical", ar: "كهرباء", icon: Zap },
  ac_heating: { en: "AC/Heating", ar: "تكييف/تدفئة", icon: Flame },
  appliance: { en: "Appliance", ar: "أجهزة", icon: Package },
  structural: { en: "Structural", ar: "هيكلي", icon: Wrench },
  pest: { en: "Pest Control", ar: "مكافحة حشرات", icon: Bug },
  security: { en: "Security", ar: "أمن", icon: Shield },
  other: { en: "Other", ar: "أخرى", icon: Package },
};

export default function AdminEmergencyMaintenance() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState({ status: "assigned" as string, message: "", messageAr: "", assignedTo: "", assignedPhone: "", resolution: "", resolutionAr: "" });

  const tickets = trpc.emergencyMaintenance.listAll.useQuery();
  const ticketDetail = trpc.emergencyMaintenance.getById.useQuery({ id: selectedTicket! }, { enabled: !!selectedTicket });
  const utils = trpc.useUtils();

  const updateStatus = trpc.emergencyMaintenance.updateStatus.useMutation({
    onSuccess: () => {
      utils.emergencyMaintenance.listAll.invalidate();
      if (selectedTicket) utils.emergencyMaintenance.getById.invalidate({ id: selectedTicket });
      setUpdateDialogOpen(false);
      setUpdateForm({ status: "assigned", message: "", messageAr: "", assignedTo: "", assignedPhone: "", resolution: "", resolutionAr: "" });
      toast.success(lang === "ar" ? "تم تحديث الحالة وإرسال الإشعار" : "Status updated and notification sent");
    },
  });

  const handleUpdate = () => {
    if (!selectedTicket || !updateForm.message) { toast.error(lang === "ar" ? "يرجى كتابة رسالة التحديث" : "Please write an update message"); return; }
    updateStatus.mutate({ id: selectedTicket, ...updateForm } as any);
  };

  const openUpdateDialog = (ticketId: number, currentStatus: string) => {
    setSelectedTicket(ticketId);
    const nextStatus = currentStatus === "open" ? "assigned" : currentStatus === "assigned" ? "in_progress" : currentStatus === "in_progress" ? "resolved" : "closed";
    setUpdateForm(prev => ({ ...prev, status: nextStatus }));
    setUpdateDialogOpen(true);
  };

  if (!user || user.role !== "admin") return null;

  const openCount = tickets.data?.filter(t => t.status === "open" || t.status === "assigned").length || 0;
  const criticalCount = tickets.data?.filter(t => t.urgency === "critical" && t.status !== "closed" && t.status !== "resolved").length || 0;

  return (
    <DashboardLayout>
      <SEOHead title={lang === "ar" ? "طوارئ الصيانة" : "Emergency Maintenance"} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">{lang === "ar" ? "🚨 طوارئ الصيانة" : "🚨 Emergency Maintenance"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "ar" ? `${openCount} طلب مفتوح` : `${openCount} open tickets`}
              {criticalCount > 0 && <span className="text-red-500 font-bold ms-2">{lang === "ar" ? `• ${criticalCount} حرج` : `• ${criticalCount} critical`}</span>}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const count = tickets.data?.filter(t => t.status === key).length || 0;
            const Icon = cfg.icon;
            return (
              <Card key={key} className="p-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{lang === "ar" ? cfg.ar : cfg.en}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </Card>
            );
          })}
        </div>

        {/* Tickets List */}
        {tickets.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#3ECFC0]" /></div>
        ) : tickets.data && tickets.data.length > 0 ? (
          <div className="space-y-3">
            {tickets.data.map((t) => {
              const urg = urgencyConfig[t.urgency] || urgencyConfig.medium;
              const st = statusConfig[t.status] || statusConfig.open;
              const cat = categoryConfig[t.category] || categoryConfig.other;
              const CatIcon = cat.icon;
              const isExpanded = expandedId === t.id;

              return (
                <Card key={t.id} className={`transition-all ${t.urgency === "critical" && t.status !== "closed" && t.status !== "resolved" ? "border-red-400 shadow-red-100 shadow-md" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => { setExpandedId(isExpanded ? null : t.id); if (!isExpanded) setSelectedTicket(t.id); }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold">#{t.id}</span>
                          <CatIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{t.titleAr || t.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${urg.color}`}>{lang === "ar" ? urg.ar : urg.en}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{lang === "ar" ? st.ar : st.en}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lang === "ar" ? `المستأجر #${t.tenantId}` : `Tenant #${t.tenantId}`} • {lang === "ar" ? cat.ar : cat.en} • {new Date(t.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
                        </div>
                        {t.assignedTo && <div className="text-sm mt-1"><User className="h-3 w-3 inline me-1" />{t.assignedTo} {t.assignedPhone && `(${t.assignedPhone})`}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {t.status !== "closed" && t.status !== "resolved" && (
                          <Button size="sm" className="bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6]" onClick={(e) => { e.stopPropagation(); openUpdateDialog(t.id, t.status); }}>
                            <Send className="h-3.5 w-3.5 me-1" />{lang === "ar" ? "تحديث" : "Update"}
                          </Button>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">{lang === "ar" ? "الوصف" : "Description"}</Label>
                          <p className="text-sm">{t.descriptionAr || t.description}</p>
                        </div>
                        {t.resolution && (
                          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                            <Label className="text-xs text-green-700">{lang === "ar" ? "الحل" : "Resolution"}</Label>
                            <p className="text-sm">{t.resolutionAr || t.resolution}</p>
                          </div>
                        )}
                        {/* Timeline */}
                        {ticketDetail.data?.updates && ticketDetail.data.updates.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">{lang === "ar" ? "سجل التحديثات" : "Update Timeline"}</Label>
                            <div className="space-y-2">
                              {ticketDetail.data.updates.map((u) => {
                                const uSt = u.newStatus ? statusConfig[u.newStatus] : null;
                                return (
                                  <div key={u.id} className="flex gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-[#3ECFC0] mt-1.5 shrink-0" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{u.updatedBy}</span>
                                        {uSt && <span className={`text-xs px-1.5 py-0.5 rounded ${uSt.color}`}>{lang === "ar" ? uSt.ar : uSt.en}</span>}
                                        <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</span>
                                      </div>
                                      <p className="text-muted-foreground">{u.messageAr || u.message}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{lang === "ar" ? "لا توجد طلبات صيانة طوارئ" : "No emergency maintenance requests"}</p>
          </Card>
        )}
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{lang === "ar" ? "تحديث حالة الصيانة" : "Update Maintenance Status"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{lang === "ar" ? "الحالة الجديدة *" : "New Status *"}</Label>
              <Select value={updateForm.status} onValueChange={v => setUpdateForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{lang === "ar" ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang === "ar" ? "رسالة التحديث للمستأجر (إنجليزي) *" : "Update Message to Tenant (EN) *"}</Label>
              <Textarea value={updateForm.message} onChange={e => setUpdateForm(p => ({ ...p, message: e.target.value }))} placeholder={lang === "ar" ? "اكتب رسالة التحديث..." : "Write update message..."} rows={3} />
            </div>
            <div>
              <Label>{lang === "ar" ? "رسالة التحديث (عربي)" : "Update Message (AR)"}</Label>
              <Textarea value={updateForm.messageAr} onChange={e => setUpdateForm(p => ({ ...p, messageAr: e.target.value }))} placeholder={lang === "ar" ? "اكتب الرسالة بالعربي..." : "Arabic message..."} rows={3} />
            </div>
            {(updateForm.status === "assigned") && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{lang === "ar" ? "المعيّن إليه" : "Assigned To"}</Label><Input value={updateForm.assignedTo} onChange={e => setUpdateForm(p => ({ ...p, assignedTo: e.target.value }))} placeholder={lang === "ar" ? "اسم الفني" : "Technician name"} /></div>
                <div><Label>{lang === "ar" ? "رقم الجوال" : "Phone"}</Label><Input value={updateForm.assignedPhone} onChange={e => setUpdateForm(p => ({ ...p, assignedPhone: e.target.value }))} placeholder="+966..." /></div>
              </div>
            )}
            {(updateForm.status === "resolved" || updateForm.status === "closed") && (
              <div className="space-y-3">
                <div><Label>{lang === "ar" ? "ملخص الحل (إنجليزي)" : "Resolution Summary (EN)"}</Label><Textarea value={updateForm.resolution} onChange={e => setUpdateForm(p => ({ ...p, resolution: e.target.value }))} rows={2} /></div>
                <div><Label>{lang === "ar" ? "ملخص الحل (عربي)" : "Resolution Summary (AR)"}</Label><Textarea value={updateForm.resolutionAr} onChange={e => setUpdateForm(p => ({ ...p, resolutionAr: e.target.value }))} rows={2} /></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpdate} disabled={updateStatus.isPending} className="bg-[#3ECFC0] text-[#0B1E2D] hover:bg-[#2ab5a6]">
              {updateStatus.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              <Send className="h-4 w-4 me-2" />{lang === "ar" ? "إرسال التحديث" : "Send Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
