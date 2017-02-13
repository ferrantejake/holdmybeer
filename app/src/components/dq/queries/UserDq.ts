import { DataQueries } from '../DataQueries';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

export interface User {
    id: string;
    username: string;
    first: string;
    last: string;
    nick: string;
};

export class UserDq extends DataQueries<User> {
    public constructor() {
        super();
        this.tableName = 'holdmybeer_users';
    }

    public map(record: User): { readonly [P in keyof User]?: User[P]; } {
        return this.mapRecord(
            record,
            ['_id', 'username', 'first', 'last', 'nick'],
            { _id: 'id' });
    }
}