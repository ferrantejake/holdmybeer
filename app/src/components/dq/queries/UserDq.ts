import { DataQueries } from '../DataQueries';
import { Document } from '../documents';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

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
            ['_id', 'username', 'first', 'last', 'nick'],
            { _id: 'id' });
    }
}