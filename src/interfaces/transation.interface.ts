export interface ITransaction {
    id: string;
    time: string;
    description: string;
    mcc: string;
    originalMcc: string;
    amount: string;
    operationAmount: string;
    currencyCode: string;
    commissionRate: string;
    cashbackAmount: string;
    balance: string;
    hold: boolean;
    receiptId: string;
}