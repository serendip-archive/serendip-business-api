import { ServerServiceInterface, DbService, Server, DbCollection } from "serendip";
import { CompanyModel } from "../models";
import { ObjectId } from "bson";

export class CompanyService implements ServerServiceInterface {

    _dbService: DbService;
    collection: DbCollection<CompanyModel>;

    static dependencies = ["CrmService", "DbService"];

    constructor() {

        this._dbService = Server.services["DbService"];
    }

    async start() {

        this.collection = await this._dbService.collection<CompanyModel>('CrmCompanies', true);
        this.collection.createIndex({ name: 1 }, { unique: true });

    }

    async insert(model: CompanyModel) {
        return this.collection.insertOne(model);
    }

    async update(model: CompanyModel) {
        return this.collection.updateOne(model);
    }

    async delete(id, userId) {
        return this.collection.deleteOne(id, userId);
    }

    async findById(id: string) {

        var query = await this.collection.find({ _id: new ObjectId(id) });

        if (query.length == 0)
            return undefined;
        else
            return query[0];

    }

    async findByCrmId(id: string) {

        return this.collection.find( { "crm": id.toString() } );

    }



}