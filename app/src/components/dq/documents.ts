/** Interface representing minimum document requirements. */
export interface Document {
    id?: string;
    createdAt?: Date;
    [k: string]: any;
}