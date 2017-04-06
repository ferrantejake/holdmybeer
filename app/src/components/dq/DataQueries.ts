import { Document } from './documents';
import * as uuid from 'uuid';
import * as aws from '../aws';
const debug = require('debug')('holdmybeer:dataqueries');
const debugV = require('debug')('holdmybeer-v:dataqueries');

export enum ErrorType {
    Unknown,
    DuplicateKey,
    DuplicateAlias,
    SelfSimilarity, // mise en abyme
    EnvironmentBoundary,
    AlreadyClaimed,
    NotFound
}

export interface SelectOneResult<T> { success: boolean; value: T; }
export interface SelectResult<T> { success: boolean; value: T[]; }

export interface FindAndUpdateResult<T> { success: boolean; value: T; isModified: boolean; updatedExisting: boolean; upserted: any; }
/** Represents the expected response from an insert */

export interface InsertResult { success: boolean; isModified: boolean; record: any; }
/** Represents the expected response from an update */
export interface UpdateResult { success: boolean; count: number; isModified: boolean; }

/** Represents the expected response from a delete */
export interface DeleteResult { success: boolean; count: number; isModified: boolean; }

/** Represents a generic CRUD result */
export interface CrudResult {
    error?: Error;
    data?: any;
}

export interface TransformMap<T> {
    [key: string]: string | Transform<T> | KeyedTransform<T>;
}

export interface KeyedTransform<T> {
    key: string;
    transform: Transform<T>;
}

export type Transform<T> = (record: T) => any;

/** Class representing base database transactions model. */
export abstract class DataQueries<T extends Document> {
    protected table: any;

    constructor(tableName: string) {
        debugV('instantiating table:', tableName);
        this.table = aws.dynamodb().table(tableName);
    }

    // Create and return UUID.
    private createUUID(): string {
        // use v4 per: http://stackoverflow.com/a/20342413/2530285
        return uuid.v4();
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForInsert(record: T): any {
        const mapped = Object.assign(record);
        this.formatId(mapped);
        this.mapCreatedAt(mapped);
        return mapped;
    }

    // Alters the record being inserted to fit the structure of the expected data.
    // Removes fields which will always conflict.
    protected mapForUpdate(record: T): T {
        delete record.id;
        delete record.createdAt;
        return record;
    }

    // Map a record to a consumable form, i.e. for a user-facing interface.
    protected mapToConsumable(record: T): T {
        return record;
    }

    protected unmapRecord(record: any): T {
        this.unmapCreatedAt(record);
        return record;
    }

    protected formatId(record: T) {
        debug('formatId:', record);
        if (!record) return;
        if (!record.id) record.id = this.createUUID();
    }

    protected mapCreatedAt(record: T) {
        if (!record) return;
        if (!record.createdAt || !(typeof record.createdAt === 'string'))
            record.createdAt = new Date(Date.now()).toISOString() as any;
    }

    // Map date string to Date object.
    protected unmapCreatedAt(record: T) {
        // If record dne or record.createdAt dne, then do nothing.
        if (!(record || record.createdAt))
            try { record.createdAt = new Date(record.createdAt); }
            catch (error) { throw error; }
    }

    // Insert a document
    public insert(record: T): Promise<T> {
        // There are 3 potential outcomes to an insert:
        // 1: Insert successfull:   success:true, isModified:true
        // 2: Record exists:        success:true, isModified:false
        // 3: Insert failure:       reject, error

        return new Promise<T>((resolve, reject) => {
            const insertableRecord = this.mapForInsert(record);
            const options = { ConditionExpression: 'attribute_not_exists(id)' };
            this.table.insert(insertableRecord, options)
                .then((response: any) => { console.log(insertableRecord, response); resolve(response); })
                .catch((error: Error) => {
                    // Record already exists, is not modified
                    if (error && error.message === 'The conditional request failed')
                        return resolve(this.unmapRecord(insertableRecord));
                    else reject(error);
                });
        });
    };

    /**
     * Retrieves a record by the specified ID.
     * @param {string} id - The ID of the record.
     * @return {Promise<T[]>} A record Promise.
     */
    public getById(id: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.table.find(id)
                .then((document: T) => resolve(document as T))
                .catch(reject);
        });
    };

    /**
     * Retrieves records by the specified IDs.
     * @param {string[]} ids - The IDs of the desired records.
     * @return {Promise<T[]>} A Promise of records.
     */
    public getByIds(ids: string[]): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.table.batchFind(ids)
                .then((documents: T[]) => resolve(documents))
                .catch(reject);
        });
    };

    /**
     * Updates a record by the specified ID.
     * @param {string} id - The ID of the records.
     * @return {Promise<void>} An empty Promise.
     */
    public updateById(id: string, fields: Object): Promise<UpdateResult> {
        // There are 3 potential outcomes to an insert:
        // 1: Update successfull:   success:true, count:n, isModified: boolean
        // 2: Record DNE:           success:true, count: 0, isModified: false
        // 3: Update failure:       reject, error

        const options = { ReturnValues: 'UPDATED_OLD', ConditionExpression: 'attribute_exists(id)' };
        return new Promise<UpdateResult>((resolve, reject) => {
            this.table.update(id, fields, options)
                .then((response: any) => {
                    const stats = this.updateStats(response, fields);
                    resolve({ success: true, count: stats.count, isModified: stats.isModified });
                })
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve({ success: true, count: undefined, isModified: undefined });
                    else reject(error);
                });
        });
    };

    // Gather statistics on update result (consumed in an UpdateResult)
    public updateStats(old: Object, update: any): any {
        const stats = {
            count: 0,
            isModified: false
        };
        Object.keys(old).forEach(key => {
            if (old[key] !== update[key]) {
                stats.count++;
                stats.isModified = true;
            }
        });
        return stats;
    }

    // Worth nothing this system does not `ensure` that a delete has actually
    // taken place, but assumes if there was no error that the delete was successfull.
    public deleteById(id: string): Promise<DeleteResult> {
        return new Promise<DeleteResult>((resolve, reject) => {
            this.table.remove(id)
                // Because we do not ensure a deletion, return undefined for modification and count.
                .then(() => resolve({ count: undefined, isModified: undefined, success: true } as DeleteResult))
                .catch(reject);
        });
    };
};