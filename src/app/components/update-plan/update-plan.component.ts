import { Component, OnInit } from '@angular/core';
import {PaymentService} from "../../service/payment.service";
import {PaymentPlan} from "../../models/payment-plan.model";

@Component({
  selector: 'app-update-plan',
  templateUrl: './update-plan.component.html',
  styleUrls: ['./update-plan.component.css']
})
export class UpdatePlanComponent implements OnInit {

  plan_id = new URLSearchParams(window.location.search).get('planId')
  uid = new URLSearchParams(window.location.search).get('uid')
  server_version = new URLSearchParams(window.location.search).get('server-version')

  planDetail: PaymentPlan | undefined;
  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    if(this.plan_id && this.uid){
      this.paymentService.getPlanDetails(this.plan_id, this.uid, this.server_version)
        .subscribe(res=>{
          this.planDetail = res
        });
    }
  }

}
