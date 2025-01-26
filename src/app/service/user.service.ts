import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {Plan} from "../models/plan.model";
import {User} from "../models/user.model";

@Injectable()
export class UserService {
  constructor(private httpClient: HttpClient) {
  }

  getUser( uid: string ,server_version: string | null ): Observable<User> {
    const versionPartURL = server_version ? `${server_version}-dot-` : '';
    var url = server_version ? `https://${versionPartURL}treattestenvironment.uc.r.appspot.com/rest/users/is-anonymous` : `https://treattestenvironment.uc.r.appspot.com/rest/users/is-anonymous`;

    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid,
        ...(server_version && { 'agent-version': '20' }),
      })
    };
    return this.httpClient.get<User>(url, httpOptions);
  }

  putEmail( uid: string, email: string, server_version: string ): Observable<any> {
    const versionPartURL = server_version ? `${server_version}-dot-` : '';
    var url = server_version ? `https://${versionPartURL}treattestenvironment.uc.r.appspot.com/rest/users/set-email/${email}` : `https://treattestenvironment.uc.r.appspot.com/rest/users/set-email/${email}`;

    const httpOptions = {
      headers: new HttpHeaders({
        uid: uid,
        ...(server_version && { 'agent-version': '20' }),
      })
    };
    return this.httpClient.put<any>(url, {}, httpOptions);
  }
}
