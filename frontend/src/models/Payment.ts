
export const PaymentStatus =  {
    PENDING: "pending",
    PAID: "paid",
    FAILED: "failed"
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];


export interface Payment{
    id: number,
    total: number,
    status: typeof PaymentStatus
}