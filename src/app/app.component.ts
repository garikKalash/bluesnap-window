import {Component, OnInit} from '@angular/core';
import {PaymentService} from "./service/payment.service";
import {AngularFireAnalytics} from "@angular/fire/compat/analytics";
import {UserService} from "./service/user.service";

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
  isAnonymous = false;
  enteredEmail: string = '';
  plan_id = new URLSearchParams(window.location.search).get('plan_id');
  paypal_plan_id = new URLSearchParams(window.location.search).get('paypal_plan_id');
  frequency = new URLSearchParams(window.location.search).get('frequency');
  price = new URLSearchParams(window.location.search).get('price');
  version = new URLSearchParams(window.location.search).get('version');
  paymentAB = new URLSearchParams(window.location.search).get('store_type');
  trial = new URLSearchParams(window.location.search).get('trial');

  update = new URLSearchParams(window.location.search).get('update')
  subscriptionId = new URLSearchParams(window.location.search).get('subId')
  errorDetails = new URLSearchParams(window.location.search).get('error')

  rolls = new URLSearchParams(window.location.search).get('rolls_count');
  bonusDetails = '1-time gift: 90 rolls';

  detailString: string | undefined;
  total: number | undefined;
  period: string | undefined;
  gifts: string | undefined;
  showEmailHint: boolean = false;
  showGPay: boolean  = false;

  expireTimeInSec: number = 0.0;
  expireDetails: string = '0m';
  now: Date | undefined = new Date();
  timer: any;
  expired: boolean = false;

  customDetails = (this.price !== null && this.frequency !== null) && (this.price !== '' && this.frequency !== '');

  constructor(private paymentService: PaymentService,
              private userService: UserService,
              private analytics: AngularFireAnalytics) {
    if(this.trial){
      if(this.trial.toLowerCase() === 'false') this.trial = null;
    }

    if(this.rolls === null || this.rolls === undefined || this.rolls === ''){
      this.rolls = null;
    } else {
      this.bonusDetails = '1-time gift: '+this.rolls+' rolls';
    }
    if(this.paymentAB !== null && this.paymentAB !== undefined) {
      this.showGPay = this.paymentAB === 'GPAY';
    }
  }

  startTimer(): void {
    this.timer = setInterval(() => {
      if (this.expireTimeInSec > 0) {
        this.expireTimeInSec--;
        this.expireDetails = Math.floor(this.expireTimeInSec / 60) + 'm ' + this.expireTimeInSec % 60 + 's'
      } else {
        if(document.querySelector("#payment-success") == null) {
          this.expired = true;
        }
        clearInterval(this.timer);
      }
    }, 1000); // Update every second
  }

  ngOnInit() {
    if(this.errorDetails){
      this.errorDetails = decodeURIComponent(this.errorDetails);
    }
    if (this.uid) {
      this.paymentService.getServerTime().subscribe(d=>{
        // @ts-ignore
        this.paymentService.getPaymentMetadata(this.uid).subscribe(b => {
          // @ts-ignore
          this.expireTimeInSec = Math.floor(new Date(b.expiresAt).getTime() - new Date(d.now).getTime()) / 1000
          if(this.expireTimeInSec <= 0) {
            if(document.querySelector("#payment-success") == null) {
              this.expired = true;
            }
          }
          this.startTimer()
        }, error => {
          if(document.querySelector("#payment-success") == null) {
            this.expired = true;
          }
        });
      })
      this.analytics.logEvent('payment_page_landing', {"uid": this.uid, "plan": this.plan, "plan_id": this.plan_id});
      this.userService.getUser(this.uid).subscribe(u=>{
        // @ts-ignore
        this.isAnonymous = u.anon;
      });

    }
    if(this.plan_id){
      console.log('ng plan ' + this.plan_id)
      let planId = '';
      if(this.plan == 'FREE_DELIVERY') {
        planId = 'FREE_DELIVERY' +  (this.price != null
          ? '_' + this.price.replace('.', '') : '');
        console.log('ng plan ' + this.plan)
      } else if(this.plan != null && this.plan.includes('SHARED')){
        planId = this.plan + '_0' +  (this.price != null
          ? '_' + this.price.replace('.', '') : '');
      } else {
        planId = this.plan
          + (this.trial ? '_TRIAL' : '') + '_'
          + (this.animalIds != null ? this.animalIds.split(',').length : 0) + (this.price != null
            ? '_' + this.price.replace('.', '') : '');
      }
      this.paymentService.getPlan({uid: this.uid, planId: planId})
        .subscribe(res=>{
        let monthId = res.planPeriodsWithPlanIds['MONTHLY'];
        let quartId = res.planPeriodsWithPlanIds['QUARTERLY'];
        let ev6monthId = res.planPeriodsWithPlanIds['EVERY_6_MONTHS'];
        let annuallyId = res.planPeriodsWithPlanIds['ANNUALLY'];
        let weeklyId = res.planPeriodsWithPlanIds['WEEKLY'];
        let animalCount  = this.animalIds == null ? 0 :this.animalIds.split(',').length;
        let multiplyPart;
        if(weeklyId != null && weeklyId == this.plan_id) {
          if(this.customDetails) {
            if(this.frequency == 'day') {
              multiplyPart = '7 days'
            } else if(this.frequency == 'week') {
              multiplyPart = '4 weeks'
            }  else {
              multiplyPart = '1 week'
            }
          } else {
            multiplyPart = '1 week'
          }
          this.period = 'Weekly';
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$1.49") + " X " + multiplyPart + ""
            this.total = this.price != null && this.price != '' ? +this.price : 1.49 ;
          } else if(this.plan == 'MEAL_1'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total = (this.price != null && this.price != '' ? +this.price : 2.79) * animalCount;
          } else {
            this.detailString = (this.customDetails ? "$" + this.price  : "$4.99") + " X " + multiplyPart
            this.total = (this.price != null && this.price != '' ? +this.price : 4.99) * animalCount;
          }
        } else if(monthId != null && monthId == this.plan_id){
          if(this.customDetails) {
            if(this.frequency == 'day') {
              multiplyPart = '31 days'
            } else if(this.frequency == 'week') {
              multiplyPart = '4 weeks'
            } else if (this.frequency == 'month') {
              multiplyPart = '1 month'
            } else {
              multiplyPart = '4 weeks'
            }
          } else {
            multiplyPart = '4 weeks'
          }
          this.period = 'Monthly';
          let totalMultiplier = 4;
          if(this.frequency){
            if(this.frequency == 'weekly') totalMultiplier = 4
            if(this.frequency == 'month') totalMultiplier = 1
          }
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$1.49") + " X " + multiplyPart + ""
            this.total = (this.price !== null && this.price !== '' ? +this.price : 1.49) * totalMultiplier;
          } else if(this.plan == 'MEAL_1'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier * animalCount;
          } else if(this.plan == 'MEAL_1_SHARED'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
          } else if(this.plan == 'MEAL_3_SHARED'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
          } else if(this.plan == 'MEAL_6_SHARED'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
          } else if(this.plan == 'MEAL_9_SHARED'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
          } else if(this.plan == 'MEAL_12_SHARED'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
          } else {
            this.detailString = (this.customDetails ? "$" + this.price  : "$4.99") + " X " + multiplyPart
            this.total = (this.price !== null && this.price !== '' ? +this.price  :  4.99) * totalMultiplier  * animalCount;
          }
        } else if(quartId != null && quartId == this.plan_id) {
          this.bonusDetails = '1-time gift: 90 rolls';
          if(this.customDetails) {
            if(this.frequency == 'day') {
              multiplyPart = '93 days'
            } else if(this.frequency == 'week') {
              multiplyPart = '13 weeks'
            } else if (this.frequency == 'month') {
              multiplyPart = '3 months'
            } else {
              multiplyPart = '13 weeks'
            }
          } else {
            multiplyPart = '13 weeks'
          }
          this.period = 'Quarterly';
          let totalMultiplier = 13;
          if(this.frequency){
            if(this.frequency == 'weekly') totalMultiplier = 13
            if(this.frequency == 'month') totalMultiplier = 3
          }
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$1.49")+" X " + multiplyPart + ""
            this.total = (this.price !== null && this.price !== '' ? +this.price  : 1.49) * totalMultiplier;
            this.gifts = (animalCount * 5) + ' meals';
          } else if(this.plan == 'MEAL_1'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  ((this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ) * animalCount;
            this.gifts = (animalCount * 5) + ' meals';
          } else {
            this.detailString = (this.customDetails ? "$" + this.price  : "$4.99")+" X " + multiplyPart
            this.total =  ((this.price !== null && this.price !== '' ? +this.price : 4.99) * totalMultiplier) * animalCount;
            this.gifts = (animalCount * 10) + ' meals';
          }
        } else if(ev6monthId != null && ev6monthId == this.plan_id) {
          if(this.customDetails) {
            if(this.frequency == 'day') {
              multiplyPart = '183 days'
            } else if(this.frequency == 'week') {
              multiplyPart = '26 weeks'
            } else if (this.frequency == 'month') {
              multiplyPart = '6 months'
            } else {
              multiplyPart = '26 weeks'
            }
          } else {
            multiplyPart = '26 weeks'
          }
          this.period = 'Every 26 weeks';
          let totalMultiplier = 26;
          if(this.frequency){
            if(this.frequency == 'weekly') totalMultiplier = 26
            if(this.frequency == 'month') totalMultiplier = 6
          }
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$1.49") + " X " + multiplyPart + ""
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 1.49) * totalMultiplier;
            this.gifts = '10 meals';
          } else if(this.plan == 'MEAL_1'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
            this.total =  ((this.price !== null && this.price !== '' ? +this.price :2.79) * totalMultiplier) * animalCount;
            this.gifts = (10* animalCount) + ' meals';
          } else {
            this.detailString = (this.customDetails ? "$" + this.price  : "$4.99")+" X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 4.99) * totalMultiplier * animalCount;
            this.gifts = animalCount + ' Toy/s';
          }
        } else if(annuallyId != null && annuallyId == this.plan_id) {
          this.bonusDetails = '1-time gift: 500 rolls';
          this.period = 'Yearly';
          let totalMultiplier = 52;
          if(this.frequency){
            if(this.frequency == 'weekly') totalMultiplier = 52
            if(this.frequency == 'month') totalMultiplier = 12
          }
          if(this.customDetails) {
            if(this.frequency == 'day') {
              multiplyPart = '365 days'
            } else if(this.frequency == 'week') {
              multiplyPart = '52 weeks'
            } else if (this.frequency == 'month') {
              multiplyPart = '12 months'
            } else {
              multiplyPart = '52 weeks'
            }
          } else {
            multiplyPart = '52 weeks'
          }
          if(this.plan == 'FREE_DELIVERY'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$1.49")+" X " + multiplyPart + ""
            this.total =  (this.price !== null && this.price !== '' ? +this.price : 1.49) * totalMultiplier;
            this.gifts = animalCount + ' Toy/s'
          } else if(this.plan == 'MEAL_1'){
            this.detailString = (this.customDetails ? "$" + this.price  : "$2.79")+" X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price  : 2.79) * totalMultiplier * animalCount;
            this.gifts = animalCount + ' Toy/s + ' + animalCount * 5 + ' meals ';
          } else {
            this.detailString = (this.customDetails ? "$" + this.price  : "$4.99")+" X " + multiplyPart
            this.total =  (this.price !== null && this.price !== '' ? +this.price  : 4.99) * totalMultiplier * animalCount;
            this.gifts = animalCount + ' Toy/s + ' + animalCount * 10 + ' meals ';
          }
        }
        if(this.total) {
          this.total = +this.total.toFixed(2)
        } else if(this.price != null){
          let planId = '';
          if(this.plan == 'FREE_DELIVERY') {
            planId = 'FREE_DELIVERY' +  '_' + this.price.replace('.', '');
          } else if(this.plan != null && this.plan.includes('SHARED')){
            planId = this.plan + '_0' +  '_' + this.price.replace('.', '');
          } else {
            planId = this.plan + (this.trial ? '_TRIAL' : '') + '_'
              + (this.animalIds != null ? this.animalIds.split(',').length : 0)
              +  '_' + this.price.replace('.', '');
          }

          this.paymentService.getPlan({uid: this.uid, planId: planId })
            .subscribe(res=>{
              let monthId = res.planPeriodsWithPlanIds['MONTHLY'];
              let quartId = res.planPeriodsWithPlanIds['QUARTERLY'];
              let ev6monthId = res.planPeriodsWithPlanIds['EVERY_6_MONTHS'];
              let annuallyId = res.planPeriodsWithPlanIds['ANNUALLY'];
              let weeklyId = res.planPeriodsWithPlanIds['WEEKLY'];
              let animalCount  = this.animalIds == null ? 0 :this.animalIds.split(',').length;
              let multiplyPart;
              if(weeklyId != null && weeklyId == this.plan_id) {
                if(this.customDetails) {
                  if(this.frequency == 'day') {
                    multiplyPart = '7 days'
                  } else if(this.frequency == 'week') {
                    multiplyPart = '4 weeks'
                  }  else {
                    multiplyPart = '1 week'
                  }
                } else {
                  multiplyPart = '1 week'
                }
                this.period = 'Weekly';
                if(this.plan == 'FREE_DELIVERY'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$1.49") + " X " + multiplyPart + ""
                  this.total = this.price != null && this.price != '' ? +this.price : 1.49 ;
                } else if(this.plan == 'MEAL_1'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total = (this.price != null && this.price != '' ? +this.price : 2.79) * animalCount;
                } else {
                  this.detailString = (this.customDetails ? "$" + this.price  : "$4.99") + " X " + multiplyPart
                  this.total = (this.price != null && this.price != '' ? +this.price : 4.99) * animalCount;
                }
              } else if(monthId != null && monthId == this.plan_id){
                if(this.customDetails) {
                  if(this.frequency == 'day') {
                    multiplyPart = '31 days'
                  } else if(this.frequency == 'week') {
                    multiplyPart = '4 weeks'
                  } else if (this.frequency == 'month') {
                    multiplyPart = '1 month'
                  } else {
                    multiplyPart = '4 weeks'
                  }
                } else {
                  multiplyPart = '4 weeks'
                }
                this.period = 'Monthly';
                let totalMultiplier = 4;
                if(this.frequency){
                  if(this.frequency == 'weekly') totalMultiplier = 4
                  if(this.frequency == 'month') totalMultiplier = 1
                }
                if(this.plan == 'FREE_DELIVERY'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$1.49") + " X " + multiplyPart + ""
                  this.total = (this.price !== null && this.price !== '' ? +this.price : 1.49) * totalMultiplier;
                } else if(this.plan == 'MEAL_1'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier * animalCount;
                } else if(this.plan == 'MEAL_1_SHARED'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
                } else if(this.plan == 'MEAL_3_SHARED'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
                } else if(this.plan == 'MEAL_6_SHARED'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
                } else if(this.plan == 'MEAL_9_SHARED'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
                } else if(this.plan == 'MEAL_12_SHARED'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ;
                } else {
                  this.detailString = (this.customDetails ? "$" + this.price  : "$4.99") + " X " + multiplyPart
                  this.total = (this.price !== null && this.price !== '' ? +this.price  :  4.99) * totalMultiplier  * animalCount;
                }
              } else if(quartId != null && quartId == this.plan_id) {
                if(this.customDetails) {
                  if(this.frequency == 'day') {
                    multiplyPart = '93 days'
                  } else if(this.frequency == 'week') {
                    multiplyPart = '13 weeks'
                  } else if (this.frequency == 'month') {
                    multiplyPart = '3 months'
                  } else {
                    multiplyPart = '13 weeks'
                  }
                } else {
                  multiplyPart = '13 weeks'
                }
                this.period = 'Quarterly';
                let totalMultiplier = 13;
                if(this.frequency){
                  if(this.frequency == 'weekly') totalMultiplier = 13
                  if(this.frequency == 'month') totalMultiplier = 3
                }
                if(this.plan == 'FREE_DELIVERY'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$1.49")+" X " + multiplyPart + ""
                  this.total = (this.price !== null && this.price !== '' ? +this.price  : 1.49) * totalMultiplier;
                  this.gifts = (animalCount * 5) + ' meals';
                } else if(this.plan == 'MEAL_1'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  ((this.price !== null && this.price !== '' ? +this.price : 2.79) * totalMultiplier ) * animalCount;
                  this.gifts = (animalCount * 5) + ' meals';
                } else {
                  this.detailString = (this.customDetails ? "$" + this.price  : "$4.99")+" X " + multiplyPart
                  this.total =  ((this.price !== null && this.price !== '' ? +this.price : 4.99) * totalMultiplier) * animalCount;
                  this.gifts = (animalCount * 10) + ' meals';
                }
              } else if(ev6monthId != null && ev6monthId == this.plan_id) {
                if(this.customDetails) {
                  if(this.frequency == 'day') {
                    multiplyPart = '183 days'
                  } else if(this.frequency == 'week') {
                    multiplyPart = '26 weeks'
                  } else if (this.frequency == 'month') {
                    multiplyPart = '6 months'
                  } else {
                    multiplyPart = '26 weeks'
                  }
                } else {
                  multiplyPart = '26 weeks'
                }
                this.period = 'Every 26 weeks';
                let totalMultiplier = 26;
                if(this.frequency){
                  if(this.frequency == 'weekly') totalMultiplier = 26
                  if(this.frequency == 'month') totalMultiplier = 6
                }
                if(this.plan == 'FREE_DELIVERY'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$1.49") + " X " + multiplyPart + ""
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 1.49) * totalMultiplier;
                  this.gifts = '10 meals';
                } else if(this.plan == 'MEAL_1'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79") + " X " + multiplyPart
                  this.total =  ((this.price !== null && this.price !== '' ? +this.price :2.79) * totalMultiplier) * animalCount;
                  this.gifts = (10* animalCount) + ' meals';
                } else {
                  this.detailString = (this.customDetails ? "$" + this.price  : "$4.99")+" X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 4.99) * totalMultiplier * animalCount;
                  this.gifts = animalCount + ' Toy/s';
                }
              } else if(annuallyId != null && annuallyId == this.plan_id) {
                this.period = 'Yearly';
                let totalMultiplier = 52;
                if(this.frequency){
                  if(this.frequency == 'weekly') totalMultiplier = 52
                  if(this.frequency == 'month') totalMultiplier = 12
                }
                if(this.customDetails) {
                  if(this.frequency == 'day') {
                    multiplyPart = '365 days'
                  } else if(this.frequency == 'week') {
                    multiplyPart = '52 weeks'
                  } else if (this.frequency == 'month') {
                    multiplyPart = '12 months'
                  } else {
                    multiplyPart = '52 weeks'
                  }
                } else {
                  multiplyPart = '52 weeks'
                }
                if(this.plan == 'FREE_DELIVERY'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$1.49")+" X " + multiplyPart + ""
                  this.total =  (this.price !== null && this.price !== '' ? +this.price : 1.49) * totalMultiplier;
                  this.gifts = animalCount + ' Toy/s'
                } else if(this.plan == 'MEAL_1'){
                  this.detailString = (this.customDetails ? "$" + this.price  : "$2.79")+" X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price  : 2.79) * totalMultiplier * animalCount;
                  this.gifts = animalCount + ' Toy/s + ' + animalCount * 5 + ' meals ';
                } else {
                  this.detailString = (this.customDetails ? "$" + this.price  : "$4.99")+" X " + multiplyPart
                  this.total =  (this.price !== null && this.price !== '' ? +this.price  : 4.99) * totalMultiplier * animalCount;
                  this.gifts = animalCount + ' Toy/s + ' + animalCount * 10 + ' meals ';
                }
              }
              if(this.total) {
                this.total = +this.total.toFixed(2)
              }});
        }

      });
    }
  }

  clickOnCard(){
    this.analytics.logEvent('enter_card_number', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
  }

  clickOnCVV(){
    this.analytics.logEvent('enter_cvv', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
  }

  clickOnExpDate(){
    this.analytics.logEvent('enter_exp_date', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
  }

  clickOnSubscribe() {
    this.analytics.logEvent('click_on_subscribe', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});

  }

  validBluesnap() {
    this.analytics.logEvent('valid_card_by_bluesnap', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
  }

  successPaypal() {
    this.analytics.logEvent('success_paypal', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
    if(this.enteredEmail !== ''){
      // @ts-ignore
      this.userService.putEmail(this.uid, this.enteredEmail).subscribe(res=>{});
    }
  }

  inValidBluesnap() {
    const errEl = document.getElementById('error-content');
    if(errEl  != null) {
      const errorMessage = errEl.textContent
      this.analytics.logEvent('error_from_bluesnap', {"message":errorMessage, "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});

    } else {
      this.analytics.logEvent('error_from_bluesnap', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
    }
  }

  clickOnSubscribeSuccess() {
    console.log('subscribing')
    //const duration = (new Date().getTime() - this.start_time.getTime())/1000;
    this.analytics.logEvent('success_on_subscribe', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
    if(this.enteredEmail !== ''){
      // @ts-ignore
      this.userService.putEmail(this.uid, this.enteredEmail).subscribe(res=>{});
    }
  }

  clickOnPaypalButton() {
    this.analytics.logEvent('click_on_paypal', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
  }

  clickOnSubscribeError() {
    const errEl = document.getElementById('error-content');
    //const duration = (new Date().getTime() - this.start_time.getTime())/1000;
    if(errEl  != null) {
      const errorMessage = errEl.textContent
      this.analytics.logEvent('error_on_subscribe', {"message":errorMessage,"uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
    } else {
      this.analytics.logEvent('error_on_subscribe', { "uid":this.uid, "plan": this.plan, "plan_id": this.plan_id});
    }
  }
}
