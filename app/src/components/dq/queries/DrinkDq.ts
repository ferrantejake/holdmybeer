import { DataQueries } from '../DataQueries';
import { Document } from '../documents';
interface Drink extends Document {

}

export class DrinkDq extends DataQueries<Drink> {
    public constructor() {
        super('holdmybeer_drinks');
    }
}