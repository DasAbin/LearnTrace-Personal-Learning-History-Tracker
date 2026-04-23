import prisma from '../lib/prisma';

// ─── Student-facing ───────────────────────────────────────────────────────────

/** Check if the student already has a PENDING request for the SAME course name */
export const hasPendingRequestForCourse = async (
  studentId: string,
  courseName: string
): Promise<boolean> => {
  const existing = await prisma.vacRefundRequest.findFirst({
    where: {
      studentId,
      status: 'PENDING',
      courseName: { equals: courseName, mode: 'insensitive' },
    },
    select: { id: true },
  });
  return !!existing;
};

/** Create a new VAC refund submission */
export const createRequest = async (
  studentId: string,
  data: {
    courseName: string;
    platform: string;
    courseAmount: number;
    notes?: string;
    preApprovalPath?: string;
    certificatePath?: string;
    paymentReceiptPath?: string;
    additionalDocPath?: string;
  }
) => {
  return prisma.vacRefundRequest.create({
    data: { studentId, ...data },
  });
};

/** Get all submissions by a single student */
export const getRequestsByStudent = async (studentId: string) => {
  return prisma.vacRefundRequest.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
};

// ─── VAC Incharge-facing ─────────────────────────────────────────────────────

/** Get all PENDING requests for the incharge's college */
export const getPendingRequests = async (collegeName: string | null) => {
  return prisma.vacRefundRequest.findMany({
    where: {
      status: 'PENDING',
      ...(collegeName ? { student: { collegeName } } : {}),
    },
    include: {
      student: {
        select: {
          id: true, firstName: true, lastName: true, email: true,
          rollNumber: true, className: true, department: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' }, // oldest first — FIFO review queue
  });
};

/** Get all completed (APPROVED or REJECTED) requests for the incharge's college */
export const getCompletedRequests = async (collegeName: string | null) => {
  return prisma.vacRefundRequest.findMany({
    where: {
      status: { in: ['APPROVED', 'REJECTED'] },
      ...(collegeName ? { student: { collegeName } } : {}),
    },
    include: {
      student: {
        select: {
          id: true, firstName: true, lastName: true, email: true,
          rollNumber: true, className: true, department: true,
        },
      },
    },
    orderBy: { reviewedAt: 'desc' },
  });
};

/** Approve a request */
export const approveRequest = async (requestId: string, reviewerId: string) => {
  return prisma.vacRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
};

/** Reject a request — reason is mandatory, enforced at controller level */
export const rejectRequest = async (
  requestId: string,
  reviewerId: string,
  rejectionReason: string
) => {
  return prisma.vacRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      rejectionReason,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
};
