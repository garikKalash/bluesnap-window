import {Component, OnInit} from '@angular/core';
import {PaymentService} from "./service/payment.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'bluesnap-payment';
  // @ts-ignore
  plan = new URLSearchParams(window.location.search).get('plan');
  animalIds = new URLSearchParams(window.location.search).get('animal_ids');
  uid = new URLSearchParams(window.location.search).get('uid');
  plan_id = new URLSearchParams(window.location.search).get('plan_id');

  detailString: string | undefined;
  total: number | undefined;
  period: string | undefined;

  constructor(private paymentService: PaymentService) {
  }

  ngOnInit() {
    this.paymentService.getPlan({uid: this.uid, planId: this.plan + '_' + (this.animalIds != null ? this.animalIds.split(',').length : 0)})
      .subscribe(res=>{
        let monthId = res.planPeriodsWithPlanIds['MONTHLY'];
        let quartId = res.planPeriodsWithPlanIds['QUARTERLY'];
        let ev6monthId = res.planPeriodsWithPlanIds['EVERY_6_MONTHS'];
        let annuallyId = res.planPeriodsWithPlanIds['ANNUALLY'];
        let animalCount  = this.animalIds == null ? 0 :this.animalIds.split(',').length;
        if(monthId != null && monthId == this.plan_id){
          this.period = 'Monthly';
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = "Free delivery X 4 weeks X All animals"
            this.total = 5.99;
          } else if(this.plan == 'MEAL_1'){
            this.detailString = "1 Meal X 4 weeks X " + animalCount + " animals"
            this.total = 11.99 * animalCount;
          } else {
            this.detailString = "3 Meal X 4 weeks X " + animalCount + " animals"
            this.total = 19.99 * animalCount;
          }
        } else if(quartId != null && quartId == this.plan_id) {
          this.period = 'Quarterly';
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = "Free delivery X 12 weeks X All animals"
            this.total = 5.99 * 3;
          } else if(this.plan == 'MEAL_1'){
            this.detailString = "1 Meal X 12 weeks X " + animalCount + " animals"
            this.total = 11.99 * 3 * animalCount;
          } else {
            this.detailString = "3 Meal X 12 weeks X " + animalCount + " animals"
            this.total = 19.99 * 3 * animalCount;
          }
        } else if(ev6monthId != null && ev6monthId == this.plan_id) {
          this.period = 'Every 6 months';
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = "Free delivery X 26 weeks X All animals"
            this.total = 5.99 * 6;
          } else if(this.plan == 'MEAL_1'){
            this.detailString = "1 Meal X 26 weeks X " + animalCount + " animals"
            this.total = 11.99 * 6 * animalCount;
          } else {
            this.detailString = "3 Meal X 26 weeks X " + animalCount + " animals"
            this.total = 19.99 * 6 * animalCount;
          }
        } else if(annuallyId != null && annuallyId == this.plan_id) {
          this.period = 'Yearly';
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = "Free delivery X 52 weeks X All animals"
            this.total = 5.99 * 12;
          } else if(this.plan == 'MEAL_1'){
            this.detailString = "1 Meal X 52 weeks X " + animalCount + " animals"
            this.total = 11.99 * 12 * animalCount;
          } else {
            this.detailString = "3 Meal X 52 weeks X " + animalCount + " animals"
            this.total = 19.99 * 12 * animalCount;
          }
        }

      });
  }
}
