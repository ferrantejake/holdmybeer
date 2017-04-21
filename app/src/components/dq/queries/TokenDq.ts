import { DataQueries } from '../DataQueries';
import { Document } from '../documents';

const debug = require('debug')('holdmybeer:tokendq');
const debugV = require('debug')('holdmybeer-v:tokendq');

/** Interface representing Token model. */
export interface Token extends Document {
    ownerId?: string;
    type: TokenType;
    // Context is never exposed to the consumer.
    context?: any;
    // Public context is mapped to `context` in it's consumable mapped form.
    publicContext?: Object;
    description?: string;
    expires?: Date;
    ttl?: number;
}

export enum TokenType {
    Auth,
    Session
}

export default class TokenDq extends DataQueries<Token> {
    public constructor() {
        super('holdmybeer_tokens');
    }

    protected mapForInsert(record: Token): any {
        const mapped = Object.assign(record);
        mapped.type = TokenType[record.type as any];
        this.mapCreatedAt(mapped);
        this.removeUndefinedValues(record);
        return mapped;
    }

    public static mapToConsumable(record: Token): Token {
        const mapped = Object.assign(record,
            {
                context: record.publicContext,
                publicContext: undefined,
                type: TokenType[record.token],

            });
        return mapped;
    }
    // Does nothing. Overridden to prevent accidental usage with parent class.
    // protected formatId(record: Token) { }

    public insert(record: Token): Promise<Token> {
        return new Promise<Token>((resolve, reject) => {
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

    public getByOwnerId(owner: string): Promise<Token> {

        return new Promise<Token>((resolve, reject) =>
            super.getByField('ownerId', owner).then(tokens =>
                resolve(tokens.length > 0 ? tokens[0] : undefined)
            )
        );
    }

    // public updateById(id: string, fields: Object): Promise<Queries.UpdateResult> {
    //     return new Promise<Queries.UpdateResult>((resolve, reject) => {
    //         this.mapForUpdate(fields as User);
    //         const options = { ReturnValues: 'UPDATED_OLD', ConditionExpression: 'attribute_exists(username)' };
    //         this.table.update(id, fields, options)
    //             .then((response: any) => {
    //                 const stats = this.updateStats(response, fields);
    //                 resolve({ success: true, count: stats.count, isModified: stats.isModified });
    //             })
    //             .catch((error: Error) => {
    //                 if (error && error.message === 'The conditional request failed')
    //                     return resolve({ success: true, count: 0, isModified: false });
    //                 else reject(error);
    //             });
    //     });
    // };
}