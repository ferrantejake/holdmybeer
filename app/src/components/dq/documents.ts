/** Interface representing minimum document requirements. */
export interface Document {
    id?: string;
    [k: string]: any;
}

export function parseItemGet<T extends Document>(response: any): T {
    return response.Item as T;
}