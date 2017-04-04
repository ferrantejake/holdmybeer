import { DataQueries } from '../DataQueries';
import * as Queries from '../DataQueries';
import { Document } from '../documents';
const debug = require('debug')('holdmybeer:dataqueries-users');

/** Interface representing User model. */
export interface User extends Document {
    username: string;
    first: string;
    last: string;
    nick: string;
};

export default class UserDq extends DataQueries<User> {
    public constructor() {
        super('holdmybeer_users');
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForInsert(record: User) {
        this.mapCreatedAt(record);
        delete record.id;
        debug('mapped value', record, typeof record.createdAt);
    }

    // Does nothing. Overridden to prevent accidental usage with parent class.
    protected formatId(record: User) { }

    public insert(record: User): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const mappedRecord = this.mapForInsert(record);
            const options = { ConditionExpression: `attribute_not_exists(username)` };
            this.table.insert(mappedRecord, options)
                .then(() => resolve(this.unmapRecord(mappedRecord)))
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve(this.unmapRecord(mappedRecord));
                    else reject(error);
                });
        });
    };

    public updateById(id: string, fields: Object): Promise<Queries.UpdateResult> {
        return new Promise<Queries.UpdateResult>((resolve, reject) => {
            this.mapForUpdate(fields as User);
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
};