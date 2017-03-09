import { Document } from './documents';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';
import * as uuid from 'uuid';
import { aws } from '../';
const debug = require('debug')('holdmybeer:dataqueries');
const dynasty = require('dynasty');

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

export interface InsertResult { success: boolean; isModified: boolean; }
/** Represents the expected response from an update */
export interface UpdateResult { success: boolean; count: number; isModified: boolean; isScanned: boolean; }

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
        debug('instantiating table:', tableName);
        this.table = aws.dynamodb().table(tableName);
    }
    /*
     * Creates a mapped version of the record using the specified fields.
     * @param {T} record The record to map.
     * @param {string[]} Fields the fields to use in the mapping.
     * @param {TransformMap<T>} [map] a map of transformations to apply to the field during mapping.
     */
    public static mapRecord<T extends Document>(record: T, fields: string[], map?: TransformMap<T>): { readonly [P in keyof T]?: T[P]} {
        return Object.freeze(
            fields.reduce((prev: any, cur: string) => {
                if (!map || !map.hasOwnProperty(cur)) {
                    // Direct map
                    prev[cur] = record[cur];
                }
                else {
                    // Apply a transform/map
                    const mapKey = map[cur];
                    if (typeof mapKey === 'string') {
                        // Mapping sans transform
                        prev[mapKey] = record[cur];
                    }
                    else if (((map: KeyedTransform<T> | Transform<T>): map is KeyedTransform<T> => map.hasOwnProperty('key'))(mapKey)) {
                        // Keyed transform; use IIFE to avoid making a user-defined type guard function *just* for TypeScript
                        prev[mapKey.key] = mapKey.transform(record);
                    }
                    else
                        prev[cur] = mapKey(record);
                }
                return prev;
            }, {}));
    }

    // Create and return UUID.
    private createUUID(): string {
        // use v4 per: http://stackoverflow.com/a/20342413/2530285
        return uuid.v4();
    }

    // Alters the record being inserted to fit the structure of the expected data.
    protected mapForDatabase(record: T) {
        this.formatId(record);
        this.formatCreatedAt(record);
    }

    protected formatId(record: T) {
        if (!record) return;
        if (!record.id) record.id = this.createUUID();
    }

    protected formatCreatedAt(record: T) {
        if (!record) return;
        if (!record.createdAt || !(typeof record.createdAt === 'string'))
            record.createdAt = new Date(Date.now()).toISOString() as any;
    }

    /**
     * Wraps a CRUD Promise in a Promise without the Read Promise.
     * @param {Promise<InsertResult>} Promise - The insert Promise.
     * @return {Promise<CrudResult>} The insert result.
     */
    protected cPromise(promise: Promise<InsertResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => promise.then(resolve).catch(resolve));
    }

    /**
     * Wraps an update Promise in a Promise.
     * @param {Promise<UpdateResult>} Promise - The update Promise.
     * @return {Promise<CrudResult>} The update result.
     */
    protected uPromise(promise: Promise<UpdateResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => promise.then(resolve).catch(resolve));
    }

    /**
     * Wraps a delete Promise in a Promise.
     * @param {Promise<DeleteResult>} Promise - The delete Promise.
     * @return {Promise<CrudResult>} The delete result.
     */
    protected dPromise(promise: Promise<DeleteResult>): Promise<CrudResult> {
        return new Promise((resolve, reject) => promise.then(resolve).catch(reject));
    }

    // Insert a document
    public insert(record: T): Promise<InsertResult> {
        // There are 3 potential outcomes to an insert:
        // 1: Insert successfull:   success:true, isModified:true
        // 2: Record exists:        success:true, isModified:false
        // 3: Insert failure:        success:false, isModified:false

        return new Promise<InsertResult>((resolve, reject) => {
            this.mapForDatabase(record);
            const options = { ConditionExpression: 'attribute_not_exists(id)' };
            this.table.insert(record, options)
                .then(() => resolve({ success: true, isModified: true } as InsertResult))
                .catch((error: Error) => {
                    if (error && error.message === 'The conditional request failed')
                        return resolve({ success: true, isModified: false } as InsertResult);
                    else resolve({ success: false, isModified: false } as InsertResult);
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
                .then((document: T) => resolve(this.map(document) as T))
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
                .then((documents: T[]) => resolve(documents.map<any>(document => this.map)))
                .catch(reject);
        });
    };

    /**
     * Updates a record by the specified ID.
     * @param {string} id - The ID of the records.
     * @return {Promise<void>} An empty Promise.
     */
    public updateById(id: string): Promise<UpdateResult> {
        return new Promise<UpdateResult>((resolve, reject) => {
            this.table.update(id)
                .then(console.log)
                .catch(console.log);
        });
    };

    /**
     * Deletes a record by the specified ID.
     * @param {string} id - The ID of the records.
     * @return {Promise<void>} An empty Promise.
     */
    public deleteById(id: string): Promise<DeleteResult> {
        return null;
    };

    public parseGetResponse(response: any): T {
        return null;
    }

    /**
     * Maps a database record to a consumable structure.
     * @param {T} record - The database record.
     * @return {Object} The refined object.
     */
    public map(record: T): Object {
        return record;
    }

    public mapRecord(record: T, fields: string[], map?: TransformMap<T>): { readonly [P in keyof T]?: T[P]} {
        return DataQueries.mapRecord<T>(record, fields, map);
    }
};