const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const API_BASE_URL = rawUrl.startsWith("http")
  ? (rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`)
  : `https://${rawUrl}/api`;

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

export const api = {
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
        throw new Error(errData.detail || "Failed to process audio with AI");
      }

      return response.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(`Failed to fetch from backend at (${API_BASE_URL}). Please verify your backend URL is HTTPS and active on Render.`);
      }
      throw err;
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
        throw new Error(errData.detail || "Failed to process photo with AI");
      }

      return response.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(`Failed to fetch from backend at (${API_BASE_URL}). Please verify your backend URL is HTTPS and active on Render.`);
      }
      throw err;
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
        throw new Error(errData.detail || "Failed to process text with AI");
      }

      return response.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(`Failed to fetch from backend at (${API_BASE_URL}). Please verify backend URL is active & HTTPS on Render.`);
      }
      throw err;
    }
  },

  async createBatch(customerName: string, customerMacNo: string, submitterName: string = "", samples: Omit<Sample, "id" | "batch_id" | "created_at">[]): Promise<SubmissionBatch> {
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
      throw new Error(errData.detail || "Failed to create draft batch");
    }

    return response.json();
  },

  async getBatch(batchId: string): Promise<SubmissionBatch> {
    const response = await fetch(`${API_BASE_URL}/batches/${batchId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch batch details");
    }
    return response.json();
  },

  async updateBatch(batchId: string, customerName: string, customerMacNo: string, submitterName: string = "", samples: any[]): Promise<SubmissionBatch> {
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
      throw new Error(errData.detail || "Failed to update batch");
    }

    return response.json();
  },

  async submitBatch(batchId: string): Promise<SubmissionBatch> {
    const response = await fetch(`${API_BASE_URL}/batches/${batchId}/submit`, {
      method: "POST",
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      // If there are detailed validation errors:
      if (errData.detail && typeof errData.detail === "object" && errData.detail.errors) {
        throw new Error(JSON.stringify(errData.detail.errors));
      }
      throw new Error(errData.detail?.message || errData.detail || "Failed to finalize batch submission");
    }

    return response.json();
  },

  getExportUrl(batchId: string): string {
    return `${API_BASE_URL}/batches/${batchId}/export`;
  }
};
