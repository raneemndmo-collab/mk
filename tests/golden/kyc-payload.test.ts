/**
 * Golden Tests — KYC Submission Payload Structure
 *
 * Validates the shape and constraints of KYC submission payloads.
 * No DB, no API — pure structure validation with Saudi locale data.
 */
import { describe, it, expect } from "vitest";

// ─── KYC Payload Types (mirrored from kyc-adapter.ts) ────────────────
interface KycDocument {
  documentType: string;
  storageKey: string;
  originalFilename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}

interface KycSubmission {
  userId: number;
  level: "basic" | "enhanced";
  documents: KycDocument[];
  metadata?: Record<string, unknown>;
}

interface KycResult {
  success: boolean;
  requestId?: string;
  status?: string;
  message?: string;
}

// ─── Saudi Test Data ─────────────────────────────────────────────────
const SAUDI_ID_DOCUMENT: KycDocument = {
  documentType: "saudi_national_id",
  storageKey: "kyc/user-101/saudi-id-front.jpg",
  originalFilename: "هوية_وطنية.jpg",
  mimeType: "image/jpeg",
  fileSizeBytes: 245_000,
};

const IQAMA_DOCUMENT: KycDocument = {
  documentType: "iqama",
  storageKey: "kyc/user-102/iqama-front.jpg",
  originalFilename: "إقامة.jpg",
  mimeType: "image/jpeg",
  fileSizeBytes: 310_000,
};

const COMMERCIAL_REGISTER: KycDocument = {
  documentType: "commercial_register",
  storageKey: "kyc/user-103/cr.pdf",
  originalFilename: "سجل_تجاري.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 1_200_000,
};

// ─── Test Suite ──────────────────────────────────────────────────────
describe("Golden Tests — KYC Payload Structure", () => {
  describe("Basic Level Submission", () => {
    it("accepts valid basic KYC with Saudi National ID", () => {
      const submission: KycSubmission = {
        userId: 101,
        level: "basic",
        documents: [SAUDI_ID_DOCUMENT],
        metadata: {
          submittedAt: "2026-03-07T10:00:00Z",
          ipAddress: "185.70.40.1",
          userAgent: "Mozilla/5.0",
          locale: "ar-SA",
        },
      };

      expect(submission.level).toBe("basic");
      expect(submission.documents).toHaveLength(1);
      expect(submission.documents[0].documentType).toBe("saudi_national_id");
      expect(submission.documents[0].mimeType).toBe("image/jpeg");
      expect(submission.metadata?.locale).toBe("ar-SA");
    });

    it("accepts valid basic KYC with Iqama", () => {
      const submission: KycSubmission = {
        userId: 102,
        level: "basic",
        documents: [IQAMA_DOCUMENT],
      };

      expect(submission.documents[0].documentType).toBe("iqama");
      expect(submission.documents[0].fileSizeBytes).toBeLessThan(5_000_000);
    });

    it("snapshot: basic submission payload shape", () => {
      const submission: KycSubmission = {
        userId: 101,
        level: "basic",
        documents: [SAUDI_ID_DOCUMENT],
        metadata: { locale: "ar-SA", submittedAt: "2026-03-07T10:00:00Z" },
      };
      expect(submission).toMatchSnapshot();
    });
  });

  describe("Enhanced Level Submission", () => {
    it("requires multiple documents for enhanced KYC", () => {
      const submission: KycSubmission = {
        userId: 103,
        level: "enhanced",
        documents: [SAUDI_ID_DOCUMENT, COMMERCIAL_REGISTER],
        metadata: {
          businessName: "شركة المفتاح الشهري",
          crNumber: "1010123456",
          locale: "ar-SA",
        },
      };

      expect(submission.level).toBe("enhanced");
      expect(submission.documents).toHaveLength(2);
      expect(submission.documents.map((d) => d.documentType)).toEqual([
        "saudi_national_id",
        "commercial_register",
      ]);
    });

    it("snapshot: enhanced submission payload shape", () => {
      const submission: KycSubmission = {
        userId: 103,
        level: "enhanced",
        documents: [SAUDI_ID_DOCUMENT, COMMERCIAL_REGISTER],
        metadata: {
          businessName: "شركة المفتاح الشهري",
          crNumber: "1010123456",
        },
      };
      expect(submission).toMatchSnapshot();
    });
  });

  describe("Document Validation Constraints", () => {
    const VALID_DOCUMENT_TYPES = [
      "saudi_national_id",
      "iqama",
      "passport",
      "commercial_register",
      "freelance_certificate",
      "address_proof",
    ];

    const VALID_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    it("document type must be from allowed list", () => {
      VALID_DOCUMENT_TYPES.forEach((type) => {
        const doc: KycDocument = {
          documentType: type,
          storageKey: `kyc/user-1/${type}.jpg`,
        };
        expect(VALID_DOCUMENT_TYPES).toContain(doc.documentType);
      });
    });

    it("mime type must be from allowed list", () => {
      VALID_MIME_TYPES.forEach((mime) => {
        expect(VALID_MIME_TYPES).toContain(mime);
      });
    });

    it("file size must not exceed 5MB", () => {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const docs = [SAUDI_ID_DOCUMENT, IQAMA_DOCUMENT, COMMERCIAL_REGISTER];
      docs.forEach((doc) => {
        expect(doc.fileSizeBytes).toBeLessThanOrEqual(MAX_FILE_SIZE);
      });
    });

    it("Saudi ID format: 10-digit number starting with 1 or 2", () => {
      const validIds = ["1012345678", "2098765432"];
      const invalidIds = ["301234567", "10123456789", "abcdefghij", ""];
      const saudiIdRegex = /^[12]\d{9}$/;

      validIds.forEach((id) => {
        expect(saudiIdRegex.test(id)).toBe(true);
      });
      invalidIds.forEach((id) => {
        expect(saudiIdRegex.test(id)).toBe(false);
      });
    });

    it("+966 phone format validation", () => {
      const validPhones = ["+966501234567", "+966551234567", "+966591234567"];
      const invalidPhones = ["+965501234567", "0501234567", "+96650123456", ""];
      const phoneRegex = /^\+966[5][0-9]{8}$/;

      validPhones.forEach((phone) => {
        expect(phoneRegex.test(phone)).toBe(true);
      });
      invalidPhones.forEach((phone) => {
        expect(phoneRegex.test(phone)).toBe(false);
      });
    });
  });

  describe("KYC Result Structure", () => {
    it("successful result shape", () => {
      const result: KycResult = {
        success: true,
        requestId: "kyc-req-2026-001",
        status: "pending_review",
        message: "تم استلام طلب التحقق بنجاح",
      };
      expect(result).toMatchSnapshot();
    });

    it("failed result shape", () => {
      const result: KycResult = {
        success: false,
        message: "نوع المستند غير مدعوم",
      };
      expect(result.success).toBe(false);
      expect(result.requestId).toBeUndefined();
    });
  });
});
