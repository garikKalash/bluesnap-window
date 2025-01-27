import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {Plan} from "../models/plan.model";
import {environment} from "../../environments/environment";
import {PaymentPlan} from "../models/payment-plan.model";
import {PaymentSessionModel} from "../models/payment-session.model";
import {BsTokenModel} from "../models/bs-token.model";
import {ServerNow} from "../models/server-time.model";

@Injectable()
export class PaymentService {
  constructor(private httpClient: HttpClient) {
  }

  getPlan({ uid, planId, server_version }: { uid: string | null; planId: string; server_version: string | null }): Observable<Plan> {
    const versionPartURL = server_version ? `${server_version}-dot-` : '';
    var url = server_version ? `https://${versionPartURL}treattestenvironment.uc.r.appspot.com/rest/payments/active-plan/${planId}` : `https://treattestenvironment.uc.r.appspot.com/rest/payments/bluesnap/active-plan/${planId}`;
    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid!=null? uid:'',
        ...(server_version && { 'agent-version': '20' }),
      }),
    };
    return this.httpClient.get<Plan>(url, httpOptions);
  }

  getPlanDetails( planId: string, uid: string, server_version: string | null ): Observable<PaymentPlan> {
    const versionPartURL = server_version ? `${server_version}-dot-` : '';
    var url = server_version ? `https://${versionPartURL}treattestenvironment.uc.r.appspot.com/rest/payments/active-plan/${planId}` : `https://treattestenvironment.uc.r.appspot.com/rest/payments/bluesnap/active-plan/${planId}`;

    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid,
        ...(server_version && { 'agent-version': '20' }),
      })
    };
    return this.httpClient.get<PaymentPlan>(url, httpOptions);
  }

  getPaymentMetadata( uid: string,  server_version: string | null): Observable<PaymentSessionModel> {
    const versionPartURL = server_version ? `${server_version}-dot-` : '';
    var url = server_version ? `https://${versionPartURL}treattestenvironment.uc.r.appspot.com/rest/payments/session` : `https://treattestenvironment.uc.r.appspot.com/rest/payments/session`;
    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid,
        ...(server_version && { 'agent-version': '20' }),
      })
    };
    return this.httpClient.get<PaymentSessionModel>(url, httpOptions);
  }

  getServerTime( server_version: string | null): Observable<ServerNow> {
    const versionPartURL = server_version ? `${server_version}-dot-` : '';
    var url = server_version ? `https://${versionPartURL}treattestenvironment.uc.r.appspot.com/server-time` : `https://treattestenvironment.uc.r.appspot.com/server-time`;
    const httpOptions = {
      headers: new HttpHeaders({
        ...(server_version && { 'agent-version': '20' }),
      })
    };
    return this.httpClient.get<ServerNow>(url,httpOptions);
  }
}
