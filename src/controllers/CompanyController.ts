import { ServerEndpointInterface, Server, ServerError, ServerRequestInterface, ServerResponseInterface, DbService, Validator } from "serendip";
import { CompanyService, CrmService, CrmCheckAccessResultInterface } from "../services";
import { CompanyModel } from "../models";
import * as archiver from 'archiver';
import * as fs from 'fs';
import { join } from "path";
import * as _ from 'underscore'
import { ObjectID, ObjectId } from "bson";

export class CompanyController {


    static apiPrefix = "CRM";

    private companyService: CompanyService;
    private crmService: CrmService;
    private dbService: DbService;

    constructor() {

        this.companyService = Server.services["CompanyService"];
        this.crmService = Server.services["CrmService"];
        this.dbService = Server.services["DbService"];

    }

    public async onRequest(req: ServerRequestInterface, res: ServerResponseInterface, next, done) {
        next();
    }



    public zip: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {


                var range = {
                    from: 0,
                    to: Date.now()
                };

                if (req.body.from && Validator.isNumeric(req.body.from))
                    range.from = req.body.from;

                if (req.body.to && Validator.isNumeric(req.body.to))
                    range.to = req.body.to;


                var model = await this.companyService.find({ crm: access.crm._id.toString(), _vdate: { $gt: range.from, $lt: range.to } });


                var zip = archiver('zip', {
                    zlib: { level: 9 } // Sets the compression level.
                });


                res.setHeader('content-type', 'application/zip');


                zip.pipe(fs.createWriteStream(join(Server.dir, 'testing.zip')));

                zip.pipe(res);

                zip.append(JSON.stringify(model), { name: 'data.json' });

                zip.finalize();



            }
        ]
    }

    public changes: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {


                var range = {
                    from: 0,
                    to: Date.now()
                };

                if (req.body.from && Validator.isNumeric(req.body.from))
                    range.from = req.body.from;

                if (req.body.to && Validator.isNumeric(req.body.to))
                    range.to = req.body.to;

                if (req.body._id) {

                    var actualRecord = await this.companyService.findById(req.body._id);

                    if (!actualRecord)
                        return next(new ServerError(400, "record not found"));

                    var recordChanges = await this.dbService.entityCollection.find({ entityId: actualRecord._id })

                    res.json(recordChanges);

                } else {

                    var changedRecords = _.map(await this.companyService.find({ crm: access.crm._id.toString(), _vdate: { $gt: range.from, $lt: range.to } }), (item) => {
                        return item._id;
                    });

                    var deletedRecords = _.map(await this.dbService.entityCollection.find({ "model.crm": access.crm._id.toString(), type: 0, date: { $gt: range.from, $lt: range.to } }), (item) => {
                        return item.entityId;
                    });

                    res.json({ changed: changedRecords , deleted : deletedRecords });

                }
            }
        ]
    }

    public list: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {



                var model = await this.companyService.findByCrmId(
                    access.crm._id,
                    req.body.skip,
                    req.body.limit);

                res.json(model);

            }
        ]
    }

    public count: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {


                var model = await this.companyService.count(access.crm._id);

                res.json(model);

            }
        ]
    }


    public insert: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {

                var model: CompanyModel = new CompanyModel(req.body);

                try {
                    await CompanyModel.validate(model);
                } catch (e) {
                    return next(new ServerError(400, e.message || e));
                }

                try {
                    model = await this.companyService.insert(model);
                } catch (e) {
                    return next(new ServerError(500, e.message || e));
                }

                res.json(model);

            }
        ]
    }


    public update: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {

                var model: CompanyModel = new CompanyModel(req.body);


                try {
                    await CompanyModel.validate(model);
                } catch (e) {
                    return next(new ServerError(400, e.message || e));
                }

                try {
                    await this.companyService.update(model);
                } catch (e) {
                    return next(new ServerError(500, e.message || e));
                }

                res.json(model);

            }
        ]
    }


    public delete: ServerEndpointInterface = {
        method: 'post',
        actions: [
            CrmService.checkUserAccess,
            async (req, res, next, done, access: CrmCheckAccessResultInterface) => {

                var _id = req.body._id;

                if (!_id)
                    return next(new ServerError(400, '_id is missing'));

                var company = await this.companyService.findById(_id);
                if (!company)
                    return next(new ServerError(400, 'company not found'));

                try {
                    await this.companyService.delete(_id, req.user._id);
                } catch (e) {
                    return next(new ServerError(500, e.message || e));
                }

                res.json(company);

            }
        ]
    }





}