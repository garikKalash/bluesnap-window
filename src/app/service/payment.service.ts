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

  getPlan({uid, planId}: { uid: any, planId: any }): Observable<Plan> {
    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid
      })
    };
    return this.httpClient.get<Plan>(`https://treattestenvironment.uc.r.appspot.com/rest/payments/active-plan/${planId}`, httpOptions);
  }

  getPlanDetails( planId: string, uid: string): Observable<PaymentPlan> {
    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid
      })
    };
    return this.httpClient.get<PaymentPlan>(`https://treattestenvironment.uc.r.appspot.com/rest/payments/bluesnap/active-plan/${planId}`, httpOptions);
  }

  getPaymentMetadata( uid: string): Observable<PaymentSessionModel> {
    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid
      })
    };
    return this.httpClient.get<PaymentSessionModel>(`https://treattestenvironment.uc.r.appspot.com/rest/payments/session`, httpOptions);
  }

  getServerTime(): Observable<ServerNow> {
    return this.httpClient.get<ServerNow>(`https://treattestenvironment.uc.r.appspot.com/server-time`);
  }
}
