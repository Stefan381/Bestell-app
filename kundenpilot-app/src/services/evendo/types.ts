export interface EvendoCustomerLookup {
  customerNumber: string;
  firstName: string;
  lastName: string;
}

export interface EvendoReceiptItem {
  articleId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface EvendoReceiptSubmission {
  customerNumber: string;
  storeId: string;
  items: EvendoReceiptItem[];
  totalCents: number;
}

export interface EvendoReceiptRecord extends EvendoReceiptSubmission {
  receiptId: string;
  createdAt: string;
}

/**
 * Vertrag, den sowohl der Mock-Service als auch eine spätere Live-Anbindung
 * an die e-vendo REST-API erfüllen. Die UI/Stores kennen nur dieses Interface.
 */
export interface EvendoClient {
  resolveCustomer(customerNumberOrCode: string): Promise<EvendoCustomerLookup | null>;
  submitReceipt(payload: EvendoReceiptSubmission): Promise<EvendoReceiptRecord>;
  getArticleHistory(customerNumber: string): Promise<EvendoReceiptRecord[]>;
}
