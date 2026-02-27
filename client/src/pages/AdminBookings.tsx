import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarCheck, Search, CheckCircle, XCircle, BanknoteIcon, Clock, Filter } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", labelAr: "قيد الانتظار", variant: "secondary" },
  approved: { label: "Approved", labelAr: "موافق عليه", variant: "outline" },
  rejected: { label: "Rejected", labelAr: "مرفوض", variant: "destructive" },
  active: { label: "Active", labelAr: "نشط", variant: "default" },
  completed: { label: "Completed", labelAr: "مكتمل", variant: "secondary" },
  cancelled: { label: "Cancelled", labelAr: "ملغي", variant: "destructive" },
};

export default function AdminBookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
  const [rejectReason, setRejectReason] = useState("");

  const utils = trpc.useUtils();
  const bookings = trpc.admin.bookings.useQuery({ limit: 200 });

  const approveBooking = trpc.admin.approveBooking.useMutation({
    onSuccess: () => {
      toast.success("تم قبول الحجز وإرسال الفاتورة للمستأجر");
      utils.admin.bookings.invalidate();
      setApproveDialog({ open: false, bookingId: null });
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectBooking = trpc.admin.rejectBooking.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الحجز");
      utils.admin.bookings.invalidate();
      setRejectDialog({ open: false, bookingId: null });
      setRejectReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const confirmPayment = trpc.admin.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد الدفع - الحجز نشط الآن");
      utils.admin.bookings.invalidate();
      setConfirmDialog({ open: false, bookingId: null });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (bookings.data ?? []).filter((b: any) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const match = [b.id?.toString(), b.propertyId?.toString(), b.beds24BookingId, b.source]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });

  const counts = {
    all: bookings.data?.length ?? 0,
    pending: bookings.data?.filter((b: any) => b.status === "pending").length ?? 0,
    approved: bookings.data?.filter((b: any) => b.status === "approved").length ?? 0,
    active: bookings.data?.filter((b: any) => b.status === "active").length ?? 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الحجوزات</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة جميع الحجوزات ومتابعة حالتها</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{counts.all}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setStatusFilter("pending")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.pending}</p>
                  <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter("approved")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BanknoteIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.approved}</p>
                  <p className="text-xs text-muted-foreground">بانتظار الدفع</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setStatusFilter("active")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.active}</p>
                  <p className="text-xs text-muted-foreground">نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الحجز أو رقم العقار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 me-2" />
              <SelectValue placeholder="تصفية الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل ({counts.all})</SelectItem>
              <SelectItem value="pending">قيد الانتظار ({counts.pending})</SelectItem>
              <SelectItem value="approved">موافق عليه ({counts.approved})</SelectItem>
              <SelectItem value="active">نشط ({counts.active})</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Table */}
        {bookings.isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              لا توجد حجوزات {statusFilter !== "all" ? "بهذه الحالة" : ""}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-start p-3 font-medium">#</th>
                    <th className="text-start p-3 font-medium">العقار</th>
                    <th className="text-start p-3 font-medium">المستأجر</th>
                    <th className="text-start p-3 font-medium">تاريخ الدخول</th>
                    <th className="text-start p-3 font-medium">المدة</th>
                    <th className="text-start p-3 font-medium">الإيجار الشهري</th>
                    <th className="text-start p-3 font-medium">المصدر</th>
                    <th className="text-start p-3 font-medium">الحالة</th>
                    <th className="text-start p-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((b: any) => {
                    const status = STATUS_MAP[b.status] || STATUS_MAP.pending;
                    return (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs">{b.id}</td>
                        <td className="p-3">
                          <div className="font-medium">عقار #{b.propertyId}</div>
                          {b.buildingId && <div className="text-xs text-muted-foreground">مبنى #{b.buildingId} {b.unitId ? `- وحدة #${b.unitId}` : ""}</div>}
                        </td>
                        <td className="p-3">مستأجر #{b.tenantId}</td>
                        <td className="p-3 text-xs">
                          {b.moveInDate ? new Date(b.moveInDate).toLocaleDateString("ar-SA") : "-"}
                        </td>
                        <td className="p-3">{b.durationMonths} شهر</td>
                        <td className="p-3 font-medium">{b.monthlyRent} ر.س</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {b.source === "BEDS24" ? "Beds24" : "محلي"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={status.variant}>{status.labelAr}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1.5">
                            {b.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => setApproveDialog({ open: true, bookingId: b.id })}
                                >
                                  <CheckCircle className="h-3 w-3 me-1" />
                                  قبول
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setRejectDialog({ open: true, bookingId: b.id })}
                                >
                                  <XCircle className="h-3 w-3 me-1" />
                                  رفض
                                </Button>
                              </>
                            )}
                            {b.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => setConfirmDialog({ open: true, bookingId: b.id })}
                              >
                                <BanknoteIcon className="h-3 w-3 me-1" />
                                تأكيد الدفع
                              </Button>
                            )}
                            {!["pending", "approved"].includes(b.status) && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(o) => !o && setApproveDialog({ open: false, bookingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد قبول الحجز #{approveDialog.bookingId}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">سيتم إرسال فاتورة الدفع للمستأجر تلقائياً بعد القبول.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, bookingId: null })}>إلغاء</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveDialog.bookingId && approveBooking.mutate({ id: approveDialog.bookingId })}
              disabled={approveBooking.isPending}
            >
              {approveBooking.isPending ? "جارٍ..." : "قبول الحجز"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false, bookingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الحجز #{rejectDialog.bookingId}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="سبب الرفض (اختياري)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, bookingId: null }); setRejectReason(""); }}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog.bookingId && rejectBooking.mutate({ id: rejectDialog.bookingId, reason: rejectReason })}
              disabled={rejectBooking.isPending}
            >
              {rejectBooking.isPending ? "جارٍ..." : "رفض الحجز"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ open: false, bookingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الدفع للحجز #{confirmDialog.bookingId}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">سيتم تفعيل الحجز وتحديث حالته إلى "نشط".</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, bookingId: null })}>إلغاء</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => confirmDialog.bookingId && confirmPayment.mutate({ id: confirmDialog.bookingId })}
              disabled={confirmPayment.isPending}
            >
              {confirmPayment.isPending ? "جارٍ..." : "تأكيد الدفع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
