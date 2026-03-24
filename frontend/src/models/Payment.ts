
export const PaymentStatus =  {
    PENDING: "pending",
    PAID: "paid",
    FAILED: "failed"
} as const;

export interface Payment{
    id: number,
    total: number,
    status: typeof PaymentStatus
}