import { DataQueries, UpdateResult } from '../DataQueries';
import { Document } from '../documents';
export interface BeerLog extends Document {
    ownerId: string;
    drinkId: string;
    geo: { lat: string, lng: string };

}

export default class BeerLogDq extends DataQueries<BeerLog> {
    public constructor() {
        super('holdmybeer_drinks');
    }

    // public static mapToConsumable(record: BeerLog): BeerLog {
    //     const mapped = Object.apply(record);

    // }
    public mapToConsumable(record: BeerLog): BeerLog {
        return record;
    }

    public getByOwner(owner: string): Promise<BeerLog[]> {
        return super.getByField('owner', owner);
    }

    public getByDrinkUPC(upc: string): Promise<BeerLog[]> {
        // conver upc-e to upc-a here
        return super.getByField('upc', upc);
    }
}