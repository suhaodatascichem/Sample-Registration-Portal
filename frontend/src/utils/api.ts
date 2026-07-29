const getApiBaseUrl = (): string => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").trim();
  const stripped = raw.replace(/\/+$/, ""); // remove trailing slashes
  if (stripped.endsWith("/api")) {
    return stripped;
  }
  return stripped.startsWith("http") ? `${stripped}/api` : `https://${stripped}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export interface ExtractedSample {
  mac_no?: string;
  customer_name?: string;
  material_code?: string;
  sample_description?: string;
  test_total_aa: boolean;
  test_supp_aa: boolean;
  test_nir: boolean;
  test_trp: boolean;
  test_gaa: boolean;
  test_tdf: boolean;
  contact_person?: string;
}

export interface ExtractedBatch {
  customer_name?: string;
  customer_mac_no?: string;
  samples: ExtractedSample[];
}

export interface Customer {
  id: string;
  name: string;
  created_at: string;
}

export interface Sample {
  id: string;
  batch_id: string;
  mac_no?: string;
  material_code: string;
  sample_description: string;
  test_total_aa: boolean;
  test_supp_aa: boolean;
  test_nir: boolean;
  test_trp: boolean;
  test_gaa: boolean;
  test_tdf: boolean;
  contact_person?: string;
  created_at: string;
}

export interface SubmissionBatch {
  id: string;
  batch_number?: number;
  customer_id: string;
  customer_mac_no?: string;
  submitter_name?: string;
  status: string;
  manifest_qr_code?: string;
  created_at: string;
  customer?: Customer;
  samples?: Sample[];
}

function handleFetchError(err: any, endpointName: string): never {
  if (err.name === "TypeError" && err.message.toLowerCase().includes("fetch")) {
    throw new Error(`Unable to connect to backend service at (${API_BASE_URL}). If deployed on Render, the backend service may still be building or waking up. Please wait 10 seconds and try again.`);
  }
  throw err;
}

function parseBackendDetail(errData: any, defaultMsg: string): string {
  if (!errData || !errData.detail) return defaultMsg;
  if (typeof errData.detail === "string") return errData.detail;
  if (Array.isArray(errData.detail)) {
    // Array of Pydantic validation errors
    return errData.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
  }
  if (typeof errData.detail === "object" && errData.detail.message) {
    return errData.detail.message;
  }
  return JSON.stringify(errData.detail);
export const api = {
  async transcribeAudio(file: File): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/transcribe-audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to transcribe audio with AI"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "audio transcription");
    }
  },

  async processAudio(file: File): Promise<ExtractedBatch> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/process-audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to process audio with AI"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "audio extraction");
    }
  async ocrPhoto(file: File): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/ocr-photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to perform OCR on photo with AI"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "photo OCR");
    }
  },

  async processPhoto(file: File): Promise<ExtractedBatch> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/process-photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to process photo with AI"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "photo extraction");
    }
  },

  async processText(text: string): Promise<ExtractedBatch> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/process-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to process text with AI"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "text extraction");
    }
  },

  async createBatch(customerName: string, customerMacNo: string, submitterName: string = "", samples: Omit<Sample, "id" | "batch_id" | "created_at">[]): Promise<SubmissionBatch> {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_mac_no: customerMacNo,
          submitter_name: submitterName,
          samples,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to create draft batch"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "batch creation");
    }
  },

  async getBatch(batchId: string): Promise<SubmissionBatch> {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to fetch batch details"));
      }
      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "fetching batch details");
    }
  },

  async updateBatch(batchId: string, customerName: string, customerMacNo: string, submitterName: string = "", samples: any[]): Promise<SubmissionBatch> {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_mac_no: customerMacNo,
          submitter_name: submitterName,
          samples: samples.map(s => ({
            mac_no: s.mac_no,
            material_code: s.material_code,
            sample_description: s.sample_description,
            test_total_aa: s.test_total_aa,
            test_supp_aa: s.test_supp_aa,
            test_nir: s.test_nir,
            test_trp: s.test_trp,
            test_gaa: s.test_gaa,
            contact_person: s.contact_person,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(parseBackendDetail(errData, "Failed to update batch"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "updating batch");
    }
  },

  async submitBatch(batchId: string): Promise<SubmissionBatch> {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.detail && typeof errData.detail === "object" && errData.detail.errors) {
          throw new Error(JSON.stringify(errData.detail.errors));
        }
        throw new Error(parseBackendDetail(errData, "Failed to finalize batch submission"));
      }

      return response.json();
    } catch (err: any) {
      return handleFetchError(err, "submitting batch");
    }
  },

  getExportUrl(batchId: string): string {
    return `${API_BASE_URL}/batches/${batchId}/export`;
  }
};
