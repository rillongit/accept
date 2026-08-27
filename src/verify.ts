export type VerifyReceiptResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export async function verifyReceipt(options: {
  apiBaseUrl: string;
  receiptId: string;
  resourceId: string;
}): Promise<boolean> {
  const result = await createVerifyReceipt(options.apiBaseUrl)(
    options.receiptId,
    options.resourceId,
  );
  return result;
}

export function createVerifyReceipt(apiBaseUrl: string) {
  const base = apiBaseUrl.replace(/\/$/, "");
  return async (receiptId: string, resourceId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${base}/access/verify`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receipt_id: receiptId,
          resource_id: resourceId,
        }),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as { valid?: boolean; ok?: boolean };
      return Boolean(body.valid ?? body.ok);
    } catch {
      return false;
    }
  };
}
