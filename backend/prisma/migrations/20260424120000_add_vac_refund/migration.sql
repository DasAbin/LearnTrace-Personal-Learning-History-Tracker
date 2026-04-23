-- CreateTable
CREATE TABLE "vac_refund_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "pre_approval_path" TEXT,
    "certificate_path" TEXT,
    "payment_receipt_path" TEXT,
    "additional_doc_path" TEXT,
    "course_name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "course_amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vac_refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vac_refund_requests_student_id_status_idx" ON "vac_refund_requests"("student_id", "status");

-- CreateIndex
CREATE INDEX "vac_refund_requests_status_created_at_idx" ON "vac_refund_requests"("status", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "vac_refund_requests" ADD CONSTRAINT "vac_refund_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
