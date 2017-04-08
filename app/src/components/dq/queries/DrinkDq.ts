import { DataQueries, UpdateResult } from '../DataQueries';
import { Document } from '../documents';
interface Drink extends Document {
    upc: string;
}

export default class DrinkDq extends DataQueries<Drink> {
    public constructor() {
        super('holdmybeer_drinks');
    }

    public getByUpc(upc: string): Promise<Drink> {
        return super.getById(upc);
    }
    public updateByUpc(upc: string, updates: any): Promise<UpdateResult> {
        return super.updateById(upc, updates);
    }
}