import { DataQueries } from '../DataQueries';
import * as Queries from '../DataQueries';
import { Document } from '../documents';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';
const debug = require('debug')('holdmybeer:dataqueries-users');

/** Interface representing User model. */
export interface User extends Document {
    username: string;
    first: string;
    last: string;
    nick: string;
};

export class UserDq extends DataQueries<User> {
    public constructor() {
        super('holdmybeer_users');
    }

    public map(record: User): { readonly [P in keyof User]?: User[P]; } {
        return this.mapRecord(
            record,
            ['username', 'first', 'last', 'nick'],
            {});
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForInsert(record: User) {
        this.formatCreatedAt(record);
        delete record.id;
        debug('mapped value', record, typeof record.createdAt);
    }

    // Does nothing. Overridden to prevent accidental usage with parent class.
    protected formatId(record: User) { }

    public insert(record: User): Promise<Queries.InsertResult> {
        return new Promise<Queries.InsertResult>((resolve, reject) => {
            this.mapForInsert(record);
            const options = { ConditionExpression: `attribute_not_exists(username)` };
            this.table.insert(record, options)
                .then(() => resolve({ success: true, isModified: true } as Queries.InsertResult))
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve({ success: true, isModified: false } as Queries.InsertResult);
                    else resolve({ success: false, isModified: false } as Queries.InsertResult);
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