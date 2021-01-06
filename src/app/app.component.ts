import { Component, ElementRef, HostListener } from '@angular/core';
import { trigger, transition, animate, style } from '@angular/animations';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';

declare const TagCanvas: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('.5s', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('.5s', style({ opacity: 0 })),
      ])
    ])
  ]
})
export class AppComponent {
  tags: any[] = []; // 3d球体总数
  peoples: any[] = []; // 总抽奖人数
  winPeople: any[] = []; // 所有获奖人员
  currenWin = { // 当前获奖名单
    type: '',
    value: []
  }
  times = 1; // 第几轮抽奖
  showGoBtn = false;
  showNextBtn = true;
  showRsBtn = false;
  showOverBtn = false;
  isShowCurrentRs = false; // 当前中奖结果
  isShowRs = false; // 抽奖结果
  isVisible = false; // 新增一轮弹框
  validateForm!: FormGroup;
  audio;
  audioPlaying = false;
  audioBg = 'assets/music/bg.mp3';
  audioStart = 'assets/music/start.mp3';
  audioPlaye = 'assets/music/playing.mp3';
  audioEnd = 'assets/music/finish.mp3';

  constructor(private el: ElementRef,
    private message: NzMessageService,
    private fb: FormBuilder,
    private modal: NzModalService
  ) {
    if (window.localStorage.getItem('peoples')) {
      this.genCanvasData(900);
      // this.tags = JSON.parse(window.localStorage.getItem('tags') as string);
      this.peoples = JSON.parse(window.localStorage.getItem('peoples') as string);
      this.winPeople = JSON.parse(window.localStorage.getItem('winPeople') as string);
      this.currenWin = JSON.parse(window.localStorage.getItem('currenWin') as string);
      this.times = JSON.parse(window.localStorage.getItem('times') as string);
      this.showGoBtn = JSON.parse(window.localStorage.getItem('showGoBtn') as string);
      this.showNextBtn = JSON.parse(window.localStorage.getItem('showNextBtn') as string);
      this.showRsBtn = JSON.parse(window.localStorage.getItem('showRsBtn') as string);
      this.showOverBtn = JSON.parse(window.localStorage.getItem('showOverBtn') as string);
    } else {
      this.genCanvasData(900);
      this.genAllDatas(900);
      this.genWinPeople();
    }
  }

  ngAfterViewInit() {
    this.startTagCanvas();
    this.audio = this.el.nativeElement.querySelector('#audiobg');
    this.audio.load();
  }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      name: [null, [Validators.required]],
      num: [null, [Validators.required]]
    });
  }

  genAllDatas(total = 100) {
    for (let i = 1; i < total; i++) {
      this.peoples.push(i);
    }
  }

  genCanvasData(total = 100) {
    for (let i = 1; i < total; i++) {
      this.tags.push({ text: i + '' });
    }
    // window.localStorage.setItem('tags', JSON.stringify(this.tags));
  }

  genWinPeople() {
    this.winPeople = [
      {
        type: '幸运奖',
        value: [],
        times: 125
      },
      {
        type: '三等奖',
        value: [],
        times: 55
      },
      {
        type: '二等奖',
        value: [],
        times: 25
      },
      {
        type: '一等奖',
        value: [],
        times: 15
      },
      {
        type: '特等奖',
        value: [],
        times: 5
      }
    ]
  }

  randomNum(min = 1, max = 900) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  speed() {
    return [0.1 * Math.random() + 0.01, -(0.1 * Math.random() + 0.01)];
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = document.body.offsetWidth;
    canvas.height = document.body.offsetHeight;
    canvas.id = 'rootcanvas';
    this.el.nativeElement.querySelector('#main').appendChild(canvas);
  }

  startTagCanvas() {
    this.createCanvas();
    TagCanvas.Start('rootcanvas', 'tags', {
      textColour: '#FFFF00',
      initial: this.speed(),
      reverse: true,
      textHeight: 15,
      noSelect: true,
      lock: 'xy'
    });
  }

  reportWindowSize() {
    const AppCanvas = this.el.nativeElement.querySelector('#rootcanvas');
    if (AppCanvas.parentElement) {
      AppCanvas.parentElement.removeChild(AppCanvas);
    }
    this.startTagCanvas();
  }

  setSpeedTagCanvas(speed = [5, 1]) {
    TagCanvas.SetSpeed('rootcanvas', speed);
  }

  @HostListener('window:resize', ['$event'])
  OnResize() {
    this.reportWindowSize();
  }

  @HostListener('document:keydown', ['$event'])
  Onkeydown($event: any) {
    let keyCode = $event.keyCode;
    if (this.showGoBtn && keyCode === 32) {
      this.gogogogo();
      return;
    }
    if (this.showRsBtn && keyCode === 32) {
      this.showRs();
      return;
    }
  }

  // 开始抽奖
  gogogogo() {
    this.audio.load();
    this.setSpeedTagCanvas([5, 1]);

    let value = this.getRandomArrayElements(this.peoples, this.winPeople[this.times - 1].times);
    this.currenWin.type = this.winPeople[this.times - 1].type;
    this.currenWin.value = value.sort((a: any, b: any) => { return a - b });
    this.winPeople[this.times - 1].value = value.sort((a: any, b: any) => { return a - b });

    this.showGoBtn = false;
    this.showNextBtn = false;
    this.showRsBtn = true;

    window.localStorage.setItem('currenWin', JSON.stringify(this.currenWin));
    window.localStorage.setItem('winPeople', JSON.stringify(this.winPeople));
    window.localStorage.setItem('showGoBtn', JSON.stringify(this.showGoBtn));
    window.localStorage.setItem('showNextBtn', JSON.stringify(this.showNextBtn));
    window.localStorage.setItem('showRsBtn', JSON.stringify(this.showRsBtn));
  }

  // 暂停显示结果
  showRs() {
    this.audio.load();
    this.times = this.times + 1;
    this.isShowCurrentRs = true;
    this.setSpeedTagCanvas(this.speed());
    this.showGoBtn = false;
    this.showRsBtn = false;
    if (this.times === this.winPeople.length + 1) {
      this.showOverBtn = true;
      this.showNextBtn = false;
    } else {
      this.showNextBtn = true;
    }

    window.localStorage.setItem('times', JSON.stringify(this.times));
    window.localStorage.setItem('isShowCurrentRs', JSON.stringify(this.isShowCurrentRs));
    window.localStorage.setItem('showGoBtn', JSON.stringify(this.showGoBtn));
    window.localStorage.setItem('showRsBtn', JSON.stringify(this.showRsBtn));
    window.localStorage.setItem('showOverBtn', JSON.stringify(this.showOverBtn));
    window.localStorage.setItem('showNextBtn', JSON.stringify(this.showNextBtn));
  }

  // 第几轮
  next() {
    this.audio.load();
    this.showGoBtn = true;
    this.showNextBtn = false;
    this.showRsBtn = false;

    window.localStorage.setItem('showGoBtn', JSON.stringify(this.showGoBtn));
    window.localStorage.setItem('showNextBtn', JSON.stringify(this.showNextBtn));
    window.localStorage.setItem('showRsBtn', JSON.stringify(this.showRsBtn));
  }

  finish() {
    this.message.info('抽奖已经结束了！');
  }

  // 随机从数组中取出几个元素
  getRandomArrayElements(arr: any = [], count = 1) {
    let shuffled = arr.slice(0), i = arr.length, min = i - count, temp: any, index;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
      // 删除选中的元素
      this.peoples = this.peoples.filter(item => {
        return item !== temp;
      });
      window.localStorage.setItem('peoples', JSON.stringify(this.peoples));
    }
    return shuffled.slice(min);
  }

  closeWin() {
    this.audio.load();
    this.isShowCurrentRs = false;
  }

  closeRsWin() {
    this.audio.load();
    this.isShowRs = false;
  }

  showResult() {
    this.isShowRs = true;
  }

  // 新加一轮抽奖
  showNewModal() {
    this.isVisible = true;
  }

  handleOk(): void {
    this.isVisible = false;
    this.winPeople.push({
      type: this.validateForm.controls.name.value,
      value: [],
      times: this.validateForm.controls.num.value
    });
    this.showGoBtn = true;
    this.showNextBtn = false;
    this.showRsBtn = false;
    this.showOverBtn = false;

    window.localStorage.setItem('winPeople', JSON.stringify(this.winPeople));
    window.localStorage.setItem('showGoBtn', JSON.stringify(this.showGoBtn));
    window.localStorage.setItem('showNextBtn', JSON.stringify(this.showNextBtn));
    window.localStorage.setItem('showRsBtn', JSON.stringify(this.showRsBtn));
    window.localStorage.setItem('showOverBtn', JSON.stringify(this.showOverBtn));
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  reset() {
    this.modal.confirm({
      nzTitle: '<i>提示</i>',
      nzContent: '<b>重置数据后，需要手动刷新页面！</b>',
      nzOnOk: () => {
        window.localStorage.clear();
      }
    });
  }

  audioStop() {
    this.audioPlaying = false;
    this.audio.pause();
  }

  audioPlay() {
    this.audioPlaying = true;
    this.audio.play();
  }
}
