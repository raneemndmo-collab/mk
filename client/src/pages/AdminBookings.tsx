import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarCheck, Search, CheckCircle, XCircle, BanknoteIcon, Clock, Filter, FileText, AlertTriangle, CreditCard } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending Approval", labelAr: "بانتظار الموافقة", variant: "secondary" },
  approved: { label: "Approved – Pending Payment", labelAr: "موافق – بانتظار الدفع", variant: "outline" },
  rejected: { label: "Rejected", labelAr: "مرفوض", variant: "destructive" },
  active: { label: "Active (Paid)", labelAr: "نشط (مدفوع)", variant: "default" },
  completed: { label: "Completed", labelAr: "مكتمل", variant: "secondary" },
  cancelled: { label: "Cancelled", labelAr: "ملغي", variant: "destructive" },
};

const LEDGER_STATUS_MAP: Record<string, { label: string; labelAr: string; color: string }> = {
  DUE: { label: "Due", labelAr: "مستحق", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  PENDING: { label: "Pending", labelAr: "قيد المعالجة", color: "text-blue-600 bg-blue-50 border-blue-200" },
  PAID: { label: "Paid", labelAr: "مدفوع", color: "text-green-600 bg-green-50 border-green-200" },
  VOID: { label: "Void", labelAr: "ملغي", color: "text-red-600 bg-red-50 border-red-200" },
  FAILED: { label: "Failed", labelAr: "فشل", color: "text-red-600 bg-red-50 border-red-200" },
  REFUNDED: { label: "Refunded", labelAr: "مسترد", color: "text-purple-600 bg-purple-50 border-purple-200" },
};

export default function AdminBookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const bookings = trpc.admin.bookings.useQuery({ limit: 200 });

  const approveBooking = trpc.admin.approveBooking.useMutation({
    onSuccess: () => {
      toast.success("تم قبول الحجز وإرسال الفاتورة للمستأجر | Booking approved, invoice sent");
      utils.admin.bookings.invalidate();
      setApproveDialog({ open: false, bookingId: null });
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectBooking = trpc.admin.rejectBooking.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الحجز وإلغاء الفاتورة | Booking rejected, ledger voided");
      utils.admin.bookings.invalidate();
      setRejectDialog({ open: false, bookingId: null });
      setRejectReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const confirmPayment = trpc.admin.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد الدفع - الحجز نشط الآن | Payment confirmed, booking active");
      utils.admin.bookings.invalidate();
      setConfirmDialog({ open: false, bookingId: null });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (bookings.data ?? []).filter((b: any) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const match = [b.id?.toString(), b.propertyId?.toString(), b.beds24BookingId, b.source,
        ...(b.ledgerEntries || []).map((l: any) => l.invoiceNumber)]
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

  // Check payment config from first booking (all share same flag)
  const paymentConfigured = (bookings.data as any)?.[0]?.paymentConfigured ?? false;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الحجوزات | Bookings</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة جميع الحجوزات ومتابعة حالتها | Manage all bookings and track their status</p>
          </div>
          {/* Payment Config Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${paymentConfigured ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <CreditCard className="h-3.5 w-3.5" />
            {paymentConfigured
              ? "الدفع الإلكتروني مفعّل | Online Payment Active"
              : "الدفع الإلكتروني غير مفعّل | Online Payment Not Configured"}
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
                  <p className="text-xs text-muted-foreground">إجمالي | Total</p>
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
                  <p className="text-xs text-muted-foreground">بانتظار الموافقة | Pending</p>
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
                  <p className="text-xs text-muted-foreground">بانتظار الدفع | Awaiting Pay</p>
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
                  <p className="text-xs text-muted-foreground">نشط | Active</p>
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
              placeholder="بحث برقم الحجز أو الفاتورة... | Search by booking or invoice #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 me-2" />
              <SelectValue placeholder="تصفية الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل | All ({counts.all})</SelectItem>
              <SelectItem value="pending">بانتظار الموافقة ({counts.pending})</SelectItem>
              <SelectItem value="approved">بانتظار الدفع ({counts.approved})</SelectItem>
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
                    <th className="text-start p-3 font-medium">العقار | Property</th>
                    <th className="text-start p-3 font-medium">المستأجر | Tenant</th>
                    <th className="text-start p-3 font-medium">المدة | Duration</th>
                    <th className="text-start p-3 font-medium">المبلغ | Amount</th>
                    <th className="text-start p-3 font-medium">الفاتورة | Invoice</th>
                    <th className="text-start p-3 font-medium">حالة السجل | Ledger</th>
                    <th className="text-start p-3 font-medium">الحالة | Status</th>
                    <th className="text-start p-3 font-medium">الإجراءات | Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((b: any) => {
                    const status = STATUS_MAP[b.status] || STATUS_MAP.pending;
                    const ledger = b.ledgerEntries?.[0];
                    const ledgerStatus = ledger ? (LEDGER_STATUS_MAP[ledger.status] || LEDGER_STATUS_MAP.DUE) : null;
                    const isExpanded = expandedRow === b.id;
                    return (
                      <>
                        <tr key={b.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : b.id)}>
                          <td className="p-3 font-mono text-xs">{b.id}</td>
                          <td className="p-3">
                            <div className="font-medium">عقار #{b.propertyId}</div>
                            {b.unitId && <div className="text-xs text-muted-foreground">وحدة #{b.unitId}</div>}
                          </td>
                          <td className="p-3 text-xs">#{b.tenantId}</td>
                          <td className="p-3 text-xs">{b.durationMonths} شهر</td>
                          <td className="p-3 font-medium text-xs">{Number(b.totalAmount || b.monthlyRent).toLocaleString()} ر.س</td>
                          <td className="p-3">
                            {ledger ? (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono text-xs">{ledger.invoiceNumber}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {ledgerStatus ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ledgerStatus.color}`}>
                                {ledgerStatus.labelAr}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={status.variant} className="text-xs whitespace-nowrap">{status.labelAr}</Badge>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                        {/* Expanded Row: Ledger Details */}
                        {isExpanded && (
                          <tr key={`${b.id}-detail`} className="bg-muted/20">
                            <td colSpan={9} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Booking Details */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm">تفاصيل الحجز | Booking Details</h4>
                                  <div className="text-xs space-y-1">
                                    <div><span className="text-muted-foreground">تاريخ الدخول:</span> {b.moveInDate ? new Date(b.moveInDate).toLocaleDateString("ar-SA") : "-"}</div>
                                    <div><span className="text-muted-foreground">تاريخ الخروج:</span> {b.moveOutDate ? new Date(b.moveOutDate).toLocaleDateString("ar-SA") : "-"}</div>
                                    <div><span className="text-muted-foreground">الإيجار الشهري:</span> {Number(b.monthlyRent).toLocaleString()} ر.س</div>
                                    <div><span className="text-muted-foreground">المبلغ الإجمالي:</span> {Number(b.totalAmount).toLocaleString()} ر.س</div>
                                    <div><span className="text-muted-foreground">المصدر:</span> {b.source === "BEDS24" ? "Beds24" : "محلي | Local"}</div>
                                    {b.rejectionReason && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                                        <span className="font-medium">سبب الرفض:</span> {b.rejectionReason}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Ledger Details */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm">السجل المالي | Payment Ledger</h4>
                                  {b.ledgerEntries?.length > 0 ? (
                                    <div className="space-y-2">
                                      {b.ledgerEntries.map((le: any) => {
                                        const ls = LEDGER_STATUS_MAP[le.status] || LEDGER_STATUS_MAP.DUE;
                                        return (
                                          <div key={le.id} className="text-xs p-2 border rounded space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="font-mono font-medium">{le.invoiceNumber}</span>
                                              <span className={`px-2 py-0.5 rounded-full border text-xs ${ls.color}`}>{ls.labelAr} | {ls.label}</span>
                                            </div>
                                            <div><span className="text-muted-foreground">المبلغ:</span> {Number(le.amount).toLocaleString()} {le.currency}</div>
                                            <div><span className="text-muted-foreground">النوع:</span> {le.type}</div>
                                            {le.paidAt && <div><span className="text-muted-foreground">تاريخ الدفع:</span> {new Date(le.paidAt).toLocaleDateString("ar-SA")}</div>}
                                            {le.paymentMethod && <div><span className="text-muted-foreground">طريقة الدفع:</span> {le.paymentMethod}</div>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">لا توجد سجلات مالية | No ledger entries</p>
                                  )}
                                  {/* Payment Config Warning */}
                                  {b.status === "approved" && !b.paymentConfigured && (
                                    <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                      <div>
                                        <p className="font-medium">الدفع الإلكتروني غير مفعّل</p>
                                        <p>Online payment not configured — manual confirmation required</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
            <DialogTitle>تأكيد قبول الحجز #{approveDialog.bookingId} | Approve Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            سيتم تغيير حالة الحجز إلى "بانتظار الدفع" وإرسال إشعار للمستأجر.
            <br />
            Booking status will change to "Approved – Pending Payment" and tenant will be notified.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, bookingId: null })}>إلغاء | Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveDialog.bookingId && approveBooking.mutate({ id: approveDialog.bookingId })}
              disabled={approveBooking.isPending}
            >
              {approveBooking.isPending ? "جارٍ..." : "قبول الحجز | Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => { if (!o) { setRejectDialog({ open: false, bookingId: null }); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الحجز #{rejectDialog.bookingId} | Reject Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              سيتم رفض الحجز وإلغاء الفاتورة المرتبطة (VOID). يجب كتابة سبب الرفض.
              <br />
              Booking will be rejected and linked ledger entries will be voided. Reason is required.
            </p>
            <Textarea
              placeholder="سبب الرفض (مطلوب) | Rejection reason (required)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="border-red-200 focus:border-red-400"
            />
            {rejectReason.length === 0 && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                سبب الرفض مطلوب | Reason is required
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, bookingId: null }); setRejectReason(""); }}>إلغاء | Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog.bookingId && rejectBooking.mutate({ id: rejectDialog.bookingId, rejectionReason: rejectReason })}
              disabled={rejectBooking.isPending || rejectReason.trim().length === 0}
            >
              {rejectBooking.isPending ? "جارٍ..." : "رفض الحجز | Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ open: false, bookingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الدفع للحجز #{confirmDialog.bookingId} | Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              سيتم تفعيل الحجز وتحديث حالته إلى "نشط" وتحديث السجل المالي إلى "مدفوع".
              <br />
              Booking will become active and ledger entries will be marked as PAID.
            </p>
            {!paymentConfigured && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>الدفع الإلكتروني غير مفعّل — التأكيد يدوي</p>
                  <p>Online payment not configured — manual confirmation</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, bookingId: null })}>إلغاء | Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => confirmDialog.bookingId && confirmPayment.mutate({ bookingId: confirmDialog.bookingId })}
              disabled={confirmPayment.isPending}
            >
              {confirmPayment.isPending ? "جارٍ..." : "تأكيد الدفع | Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
