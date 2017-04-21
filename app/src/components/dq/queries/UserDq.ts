import { DataQueries } from '../DataQueries';
import * as Queries from '../DataQueries';
import { Document } from '../documents';
const debug = require('debug')('holdmybeer:dataqueries-users');

/** Interface representing User model. */
export interface User extends Document {
    first: string;
    last: string;
    nick: string;
    friends: string[];
};

export default class UserDq extends DataQueries<User> {
    public constructor() {
        super('holdmybeer_users');
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForInsert(record: User) {
        const mapped = Object.assign(record);
        this.formatId(mapped);
        this.mapCreatedAt(mapped);
        debug('mapped value:\n', mapped);
        return mapped;
    }

    public static mapToConsumable(record: User): User {
        return record;
    }

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

    public getByUniqueId(uniqueId: string): Promise<User> {
        return new Promise<User>((resolve, reject) =>
            this.getByField('uniqueId', uniqueId).then(users =>
                resolve(users.length > 0 ? users[0] : null)));
    }

    public getFriends(userId: string): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            this.getById(userId).then(userRecord => {
                this.getByIds(userRecord.friends)
                    .then(resolve)
                    .catch(reject);
            }).catch(reject);
        });
    }

    // Associates friends with requested user by uniqueIds
    public associateFriends(userId: string, friends: string[]): Promise<void> {
        // Gets all friend records mentioned
        // Concatenates userIds with current friends
        // Removes any possible duplicate friends
        // Updates user record with new friends information
        return new Promise<void>((resolve, reject) => {
            const friendPromises = friends.map(uniqueId =>
                this.getByField('uniqueId', uniqueId)
                    .then(friends => friends.length > 0 ? friends[0] : undefined)
                    .catch(reject));
            Promise.all(friendPromises)
                .then(friendRecords => {
                    this.getById(userId)
                        .then(userRecord => {
                            const friends = removeDuplicates(friendRecords.map((f: User) => {
                                return f ? f.id : undefined;
                            }).concat(userRecord.friends));
                            debug('about to update:', friends);
                            this.updateById(userRecord.id, {
                                friends
                                // Map friends to friend ids, concatenate with current list, remove duplicates.

                            })
                                .then(() => resolve())
                                .catch(reject);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
};

// Remove duplicates
function removeDuplicates(array: any[]) {
    return array
        .sort()
        .filter(function (item, pos, ary) {
            if (item)
                return !pos || item !== ary[pos - 1];
        });
}