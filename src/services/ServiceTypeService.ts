import { ServerServiceInterface, DbService, Server, DbCollection } from "serendip";
import { ServiceTypeModel } from "../models";
import { ObjectId } from "bson";

export class ServiceTypeService implements ServerServiceInterface {

    _dbService: DbService;
    collection: DbCollection<ServiceTypeModel>;

    static dependencies = ["CrmService", "DbService"];

    constructor() {

        this._dbService = Server.services["DbService"];
    }

    async start() {

        this.collection = await this._dbService.collection<ServiceTypeModel>('ServiceTypes', true);

    }

    async insert(model: ServiceTypeModel) {
        return this.collection.insertOne(model);
    }

    async update(model: ServiceTypeModel) {
        return this.collection.updateOne(model);
    }

    async delete(id, userId) {
        return this.collection.deleteOne(id, userId);
    }

    async findById(id: string, skip?: number, limit?: number) {

        var query = await this.collection.find({ _id: new ObjectId(id) }, skip, limit);

        if (query.length == 0)
            return undefined;
        else
            return query[0];

    }

    async findByCrmId(id: string, skip?: number, limit?: number) {

        return this.collection.find({ "crm": id.toString() }, skip, limit);

    }


    async find(query, skip?: number, limit?: number) {

        return this.collection.find(query);

    }


    async count(crmId: string): Promise<Number> {

        return this.collection.count({ "crm": crmId.toString() });

    }



}