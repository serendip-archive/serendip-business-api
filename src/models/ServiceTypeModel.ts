import { CrmModelInterface } from '../interfaces';

export class ServiceTypeModel implements CrmModelInterface {


    _id?: string;
    crm: string;
    validate(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    price: number;

    priceCurrency: string;


}