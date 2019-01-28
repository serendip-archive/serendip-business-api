"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serendip_1 = require("serendip");
const BusinessService_1 = require("../services/BusinessService");
const models_1 = require("../models");
const _ = require("underscore");
class BusinessController {
    constructor() {
        this.list = {
            method: "get",
            actions: [
                async (req, res, next, done) => {
                    var model = await this.businessService.findBusinessesByUserId(req.user._id.toString());
                    for (let i = 0; i < model.length; i++) {
                        let business = model[i];
                        for (let mi = 0; mi < business.members.length; mi++) {
                            let member = business.members[mi];
                            let queryUser;
                            if (!member.userId && member.mobile) {
                                queryUser = await this.authService.findUserByMobile(member.mobile, member.mobileCountryCode);
                                if (queryUser) {
                                    member.userId = queryUser._id.toString();
                                    await this.businessService.update(business);
                                }
                            }
                            if (member.userId && !queryUser)
                                queryUser = await this.authService.findUserById(member.userId);
                            if (!member.mobile && queryUser) {
                                member.mobile = queryUser.mobile;
                                member.mobileCountryCode = queryUser.mobileCountryCode;
                            }
                            member.profile = await this.userProfileService.findProfileByUserId(member.userId);
                            business.members[mi] = member;
                        }
                        model[i] = business;
                    }
                    res.json(model);
                }
            ]
        };
        this.grid = {
            method: "post",
            actions: [
                BusinessService_1.BusinessService.checkUserAccess,
                async (req, res, next, done, access) => {
                    var query = await this.entityService.collection
                        .aggregate([])
                        .match({
                        _business: access.business._id.toString(),
                        _cuser: access.member.userId.toString(),
                        "data.section": req.body.section
                    })
                        .sort({
                        _cdate: -1
                    })
                        .limit(1)
                        .toArray();
                    if (query[0]) {
                        res.json(query[0].data);
                    }
                    else
                        res.json(null);
                }
            ]
        };
        this.saveBusiness = {
            method: "post",
            actions: [
                async (req, res, next, done) => {
                    var model = req.body;
                    model.owner = req.user._id.toString();
                    if (!model.members)
                        model.members = [];
                    if (_.where(model.members, { userId: model.owner }).length == 0)
                        model.members.push({
                            mails: [],
                            userId: model.owner,
                            groups: [],
                            scope: []
                        });
                    try {
                        await models_1.BusinessModel.validate(model);
                    }
                    catch (e) {
                        return next(new serendip_1.ServerError(400, e.message));
                    }
                    try {
                        if (model._id)
                            await this.businessService.update(model);
                        else
                            model = await this.businessService.insert(model);
                    }
                    catch (e) {
                        return next(new serendip_1.ServerError(500, e.message));
                    }
                    res.json(model);
                }
            ]
        };
        this.deleteMember = {
            method: "post",
            actions: [
                BusinessService_1.BusinessService.checkUserAccess,
                async (req, res, next, done, model) => {
                    var userId = req.body.userId;
                    if (!userId)
                        return next(new serendip_1.ServerError(400, "userId field missing"));
                    model.business.members = _.reject(model.business.members, item => {
                        return item.userId == userId;
                    });
                    try {
                        await this.businessService.update(model.business);
                    }
                    catch (e) {
                        return next(new serendip_1.ServerError(500, e.message));
                    }
                    res.json(model.business);
                }
            ]
        };
        this.addMember = {
            method: "post",
            actions: [
                BusinessService_1.BusinessService.checkUserAccess,
                async (req, res, next, done, model) => {
                    if (!req.body.mobile || !parseInt(req.body.mobile)) {
                        return next(new serendip_1.ServerError(400, "enter mobile"));
                    }
                    let toAdd = {
                        mobile: parseInt(req.body.mobile).toString(),
                        mobileCountryCode: req.body.mobileCountryCode || "+98"
                    };
                    var user = await this.authService.findUserByMobile(toAdd.mobile, toAdd.mobileCountryCode);
                    if (user) {
                        const userBusinesses = await this.businessService.findBusinessesByUserId(user._id.toString());
                        if (userBusinesses.filter(b => b._id.toString() == model.business._id.toString()).length != 0) {
                            return next(new serendip_1.ServerError(400, "duplicate"));
                        }
                    }
                    model.business.members.push(toAdd);
                    try {
                        await this.businessService.update(model.business);
                    }
                    catch (e) {
                        return next(new serendip_1.ServerError(500, e.message));
                    }
                    res.json(model.business);
                }
            ]
        };
        this.businessService = serendip_1.Server.services["BusinessService"];
        this.entityService = serendip_1.Server.services["EntityService"];
        this.authService = serendip_1.Server.services["AuthService"];
        this.userProfileService = serendip_1.Server.services["UserProfileService"];
    }
}
exports.BusinessController = BusinessController;