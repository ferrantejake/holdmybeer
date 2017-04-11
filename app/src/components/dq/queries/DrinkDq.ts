import { DataQueries, UpdateResult } from '../DataQueries';
import { Document } from '../documents';

const debug = require('debug')('holdmybeer:dataqueries');
const debugV = require('debug')('holdmybeer-v:dataqueries');

export interface Drink extends Document {
    // id is drink upc
}

export default class DrinkDq extends DataQueries<Drink> {
    public constructor() {
        super('holdmybeer_drinks');
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForInsert(record: Drink) {
        this.mapCreatedAt(record);
        // debug('mapped value', record, typeof record.createdAt);
        return record;
    }

    public static mapToConsumable(record: Drink): Drink {
        return record;
    }

    // Does nothing. Overridden to prevent accidental usage with parent class.
    protected formatId(record: Drink) { }

    public insert(record: Drink): Promise<Drink> {
        return new Promise<Drink>((resolve, reject) => {
            const mappedRecord = this.mapForInsert(record);
            const options = { ConditionExpression: `attribute_not_exists(username)` };
            debug('mapped value:', mappedRecord);
            this.table.insert(mappedRecord, options)
                .then(() => resolve(this.unmapRecord(mappedRecord)))
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve(this.unmapRecord(mappedRecord));
                    else reject(error);
                });
        });
    };

    public updateById(id: string, fields: Object): Promise<UpdateResult> {
        return new Promise<UpdateResult>((resolve, reject) => {
            this.mapForUpdate(fields as Drink);
            const options = { ReturnValues: 'UPDATED_OLD', ConditionExpression: 'attribute_exists(username)' };
            this.table.update(id, fields, options)
                .then((response: any) => {
                    const stats = this.updateStats(response, fields);
                    resolve({ success: true, count: stats.count, isModified: stats.isModified });
                })
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve({ success: true, count: 0, isModified: false });
                    else reject(error);
                });
        });
    };

    public getByUpc(upc: string): Promise<Drink> {
        return super.getById(upc);
    }
    public updateByUpc(upc: string, updates: any): Promise<UpdateResult> {
        return super.updateById(upc, updates);
    }
}