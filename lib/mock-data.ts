export interface PaymentNetwork {
  id: string;
  label: string;
  region: string;
}

export const SPONSOR_NETWORKS: PaymentNetwork[] = [
  { id: "card-us", label: "Card", region: "United States" },
  { id: "bank-ca", label: "Bank Transfer", region: "Canada" },
  { id: "card-uk", label: "Card", region: "United Kingdom" },
];

// The student's receiving network is fixed per their profile for this demo
export const STUDENT_NETWORK: PaymentNetwork = { id: "momo-ng", label: "Mobile Money", region: "Nigeria" };
