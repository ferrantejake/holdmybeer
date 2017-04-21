import { DataQueries, UpdateResult } from '../DataQueries';
import { Document } from '../documents';
export interface BeerRating extends Document {
}

export default class BeerRatingDq extends DataQueries<BeerRating> {
    public constructor() {
        super('holdmybeer_ratings');
    }

    public mapToConsumable(record: BeerRating): BeerRating {
        return record;
    }

    public getByOwner(owner: string): Promise<BeerRating[]> {
        return super.getByField('owner', owner);
    }

    public getByDrinkUPC(upc: string): Promise<BeerRating[]> {
        // conver upc-e to upc-a here
        return super.getByField('upc', upc);
    }
}